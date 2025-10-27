from sqlalchemy import Column, Integer, String, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

Base = declarative_base()

class PerfumeDB(Base):
    __tablename__ = "perfumes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    brand = Column(String, nullable=False)
    notes = Column(String, nullable=True)
    price = Column(String, nullable=True)
    image = Column(String, nullable=True)



engine = create_engine("sqlite:///perfumes.db", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)

