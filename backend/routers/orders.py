from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from dependencies import get_db
from models import Order, Product
from schemas import OrderCreate, OrderRead

router = APIRouter()

@router.get("/orders", response_model=list[OrderRead])
def get_order(db: Session = Depends(get_db)):
    return db.query(Order).order_by(Order.id.desc()).all()

@router.post("/orders", response_model=OrderRead, status_code=201)
def create_order(order: OrderCreate, db: Session = Depends(get_db)):
    db_product = db.query(Product).filter(Product.id == order.product_id).first()
    if not db_product:
        raise HTTPException(
            status_code=404,
            detail="Товар не найден"
        )

    if order.quantity < 1:
        raise HTTPException(
            status_code=400,
            detail="Количество должно быть больше нуля"
        )


    db_order = Order(
    product_id=order.product_id,
    quantity=order.quantity,
    customer_name=order.customer_name,
    phone=order.phone,
    delivery_type=order.delivery_type,
    address=order.address,
    )

    db.add(db_order)
    db.commit()
    db.refresh(db_order)

    return db_order
