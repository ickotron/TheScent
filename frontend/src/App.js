import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  const API_URL = "http://127.0.0.1:8000"; // Centralized API base URL

  const [perfumes, setPerfumes] = useState([]);
  const [newPerfume, setNewPerfume] = useState({
    name: "",
    brand: "",
    notes: "",
  });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // Load all perfumes from backend
  const loadPerfumes = () => {
    setLoading(true);
    fetch(`${API_URL}/perfumes`)
      .then((res) => res.json())
      .then((data) => setPerfumes(data))
      .catch((err) => console.error("Error loading perfumes:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPerfumes();
  }, []);

  // Add a new perfume
  const addPerfume = (e) => {
    e.preventDefault();
    if (!newPerfume.name || !newPerfume.brand) return;

    setLoading(true);
    fetch(`${API_URL}/perfumes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newPerfume.name.trim(),
        brand: newPerfume.brand.trim(),
        notes: newPerfume.notes.trim(),
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error adding perfume.");
        return res.json();
      })
      .then(() => {
        setNewPerfume({ name: "", brand: "", notes: "" });
        loadPerfumes();
      })
      .catch((err) => console.error("Error adding perfume:", err))
      .finally(() => setLoading(false));
  };

  // Delete a perfume by ID
  const deletePerfume = (id) => {
    setLoading(true);
    fetch(`${API_URL}/perfumes/${id}`, { method: "DELETE" })
      .then(() => loadPerfumes())
      .catch((err) => console.error("Error deleting perfume:", err))
      .finally(() => setLoading(false));
  };

  // Search perfumes by name or brand
  const searchPerfumes = (e) => {
    e.preventDefault();
    if (!search.trim()) {
      loadPerfumes();
      return;
    }
    setLoading(true);
    fetch(`${API_URL}/perfumes/search?query=${encodeURIComponent(search)}`)
      .then((res) => res.json())
      .then((data) => setPerfumes(data))
      .catch((err) => console.error("Error searching perfumes:", err))
      .finally(() => setLoading(false));
  };

  return (
    <div>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-light bg-light shadow-sm">
        <div className="container">
          <a className="navbar-brand d-flex align-items-center" href="#">
            <img
              src={`${process.env.PUBLIC_URL}/thescent.png`}
              alt="The Scent Logo"
              width="50"
              height="50"
              className="me-2"
              style={{ objectFit: "contain" }}
            />
            <span
              style={{
                fontWeight: "bold",
                fontSize: "1.6rem",
                fontFamily: "Georgia, serif",
              }}
            >
              The Scent
            </span>
          </a>
        </div>
      </nav>

      <div className="container mt-4">
        {/* Search bar */}
        <form className="d-flex mb-3" onSubmit={searchPerfumes}>
          <input
            type="text"
            className="form-control me-2"
            placeholder="Search by name or brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn btn-outline-primary" type="submit">
            Search
          </button>
          <button
            className="btn btn-outline-secondary ms-2"
            type="button"
            onClick={() => {
              setSearch("");
              loadPerfumes();
            }}
          >
            Reset
          </button>
        </form>

        {/* Add perfume form */}
        <div className="card p-3 mb-4 shadow-sm" id="add">
          <h4>Add New Perfume</h4>
          <form onSubmit={addPerfume} className="row g-2">
            <div className="col-md-4">
              <input
                className="form-control"
                placeholder="Name"
                value={newPerfume.name}
                onChange={(e) =>
                  setNewPerfume({ ...newPerfume, name: e.target.value })
                }
                required
              />
            </div>
            <div className="col-md-4">
              <input
                className="form-control"
                placeholder="Brand"
                value={newPerfume.brand}
                onChange={(e) =>
                  setNewPerfume({ ...newPerfume, brand: e.target.value })
                }
                required
              />
            </div>
            <div className="col-md-4">
              <input
                className="form-control"
                placeholder="Notes"
                value={newPerfume.notes}
                onChange={(e) =>
                  setNewPerfume({ ...newPerfume, notes: e.target.value })
                }
              />
            </div>
            <div className="col-md-12 d-grid mt-2">
              <button
                className="btn btn-success"
                type="submit"
                disabled={loading}
              >
                {loading ? "Adding..." : "Add"}
              </button>
            </div>
          </form>
        </div>

        {/* Perfume list */}
        <div className="row">
          {perfumes.length === 0 && !loading && (
            <p className="text-center text-muted">No perfumes found...</p>
          )}
          {perfumes.map((p) => (
            <div key={p.id} className="col-md-4 mb-3">
              <div className="card shadow-sm h-100 border-0">
                <div className="card-body text-center">
                  <h5 className="card-title">{p.name}</h5>
                  <h6 className="card-subtitle mb-2 text-muted">{p.brand}</h6>
                  <p className="card-text">{p.notes}</p>
                  <p className="card-text text-success">
                    {p.price ? `${p.price} / 100ml` : "Price: N/A"}
                  </p>
                </div>
                <div className="card-footer bg-transparent border-0 text-end">
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => deletePerfume(p.id)}
                    disabled={loading}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div id="about" className="mt-5 text-center text-muted">
          <hr />
          <p>
            <strong>The Scent</strong> — a web application built with ❤️ for
            perfume enthusiasts.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
