from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from dependencies import get_db
from models import Product
from schemas import ProductRead

router = APIRouter()

@router.get("/products", response_model=list[ProductRead])
def get_product(db: Session = Depends(get_db)):
    return db.query(Product).all()

@router.get("/products/{id}", response_model=ProductRead)
def get_id_product(id: int,db: Session = Depends(get_db)):
    db_product = db.query(Product).filter(Product.id == id).first()

    if not db_product:
        raise HTTPException(
            status_code=404, 
            detail="Товар не найден"
        )

    return db_product