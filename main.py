from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import PerfumeDB, SessionLocal, init_db
from fastapi.middleware.cors import CORSMiddleware
import requests

# Initialize FastAPI application
app = FastAPI(title="The Scent API", version="1.2")

# Enable CORS for frontend communication (e.g., React)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic model for request validation
class Perfume(BaseModel):
    name: str
    brand: str
    notes: str | None = None
    price: str | None = None
    image: str | None = None


# Initialize the database
init_db()


# Database session dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def root():
    return {"message": "Perfume API is running successfully."}


# Retrieve all perfumes
@app.get("/perfumes")
def get_perfumes(db: Session = Depends(get_db)):
    return db.query(PerfumeDB).all()


# Add a new perfume with data fetched from Fragella API
@app.post("/perfumes")
def add_perfume(perfume: Perfume, db: Session = Depends(get_db)):
    price = "N/A"
    image_url = None

    try:
        # Fetch data from Fragella API
        url = f"https://api.fragella.com/api/v1/fragrances?search={perfume.name}"
        headers = {
            "x-api-key": "592181c634b7f639a71ef537ca2e28f5af495718a65be0ca7b31fa0937d6a884"
        }

        res = requests.get(url, headers=headers, timeout=10)
        if res.status_code == 200:
            data = res.json()

            if isinstance(data, list) and len(data) > 0:
                match = None
                # Try to find a record that matches the brand
                for item in data:
                    if perfume.brand.lower() in item.get("Brand", "").lower():
                        match = item
                        break
                if not match:
                    match = data[0]

                # Extract price and currency symbol
                raw_price = match.get("Price") or match.get("price_usd") or match.get("price_eur")
                if raw_price:
                    raw_price_str = str(raw_price).strip()

                    if "$" in raw_price_str or "USD" in raw_price_str.upper():
                        price = f"${raw_price_str.replace('$', '').replace('USD', '').strip()}"
                    elif "€" in raw_price_str or "EUR" in raw_price_str.upper():
                        price = f"€{raw_price_str.replace('€', '').replace('EUR', '').strip()}"
                    elif "£" in raw_price_str or "GBP" in raw_price_str.upper():
                        price = f"£{raw_price_str.replace('£', '').replace('GBP', '').strip()}"
                    else:
                        price = f"${raw_price_str}"  # default to USD if currency not specified

                # Extract image URL if available
                image_url = match.get("Image URL") or None
            else:
                print("No results found in Fragella API.")
        else:
            print(f"Fragella API error {res.status_code}: {res.text[:200]}")

    except Exception as e:
        print("Error fetching data from Fragella API:", e)

    # Save perfume in the local database
    new_perfume = PerfumeDB(
        name=perfume.name,
        brand=perfume.brand,
        notes=perfume.notes,
        image=image_url,
        price=price,
    )
    db.add(new_perfume)
    db.commit()
    db.refresh(new_perfume)

    return {"message": "Perfume added successfully.", "perfume": new_perfume}


# Update an existing perfume
@app.put("/perfumes/{perfume_id}")
def update_perfume(perfume_id: int, updated: Perfume, db: Session = Depends(get_db)):
    perfume = db.query(PerfumeDB).filter(PerfumeDB.id == perfume_id).first()
    if not perfume:
        raise HTTPException(status_code=404, detail="Perfume not found.")

    perfume.name = updated.name
    perfume.brand = updated.brand
    perfume.notes = updated.notes
    db.commit()
    db.refresh(perfume)
    return {"message": "Perfume updated successfully.", "perfume": perfume}


# Delete a perfume
@app.delete("/perfumes/{perfume_id}")
def delete_perfume(perfume_id: int, db: Session = Depends(get_db)):
    perfume = db.query(PerfumeDB).filter(PerfumeDB.id == perfume_id).first()
    if not perfume:
        raise HTTPException(status_code=404, detail="Perfume not found.")

    db.delete(perfume)
    db.commit()
    return {"message": "Perfume deleted successfully."}


# Search perfumes by name or brand
@app.get("/perfumes/search")
def search_perfumes(query: str = "", db: Session = Depends(get_db)):
    q = f"%{query.strip()}%"
    return (
        db.query(PerfumeDB)
        .filter((PerfumeDB.name.ilike(q)) | (PerfumeDB.brand.ilike(q)))
        .all()
    )


# Test endpoint for Fragella API
@app.get("/test_fragella")
def test_fragella():
    url = "https://api.fragella.com/api/v1/fragrances?search=Dior%20Sauvage"
    headers = {
        "x-api-key": "592181c634b7f639a71ef537ca2e28f5af495718a65be0ca7b31fa0937d6a884"
    }
    res = requests.get(url, headers=headers)
    print("Status:", res.status_code)
    print("Response preview:", res.text[:600])
    try:
        return res.json()
    except Exception:
        return {"error": "Invalid JSON", "text": res.text[:500]}
