from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from dependencies import get_db
from models import Order, Product, OrderItem
from schemas import OrderCreate, OrderRead, OrderStatusUpdate
from auth_utils import get_current_user


router = APIRouter()
ALLOWED_STATUSES = ["new", "in_progress", "done", "canceled"]

@router.get("/orders", response_model=list[OrderRead])
def get_orders(db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    return db.query(Order).order_by(Order.id.desc()).all()

@router.post("/orders", response_model=OrderRead, status_code=201)
def create_order(order: OrderCreate, db: Session = Depends(get_db)):
    
    if not order.items:
        raise HTTPException(
            status_code=400,
            detail="Список пуст"
        )


    for item in order.items:
        db_product =  db.query(Product).filter(Product.id== item.product_id).first()

        if not db_product:
            raise HTTPException(
                status_code=404,
                detail="Товар не найден"
            )


        if item.quantity < 1:
            raise HTTPException(
                status_code=400,
                detail="Количество должно быть больше нуля"
            )

    db_order = Order(
    payment_type=order.payment_type,
    customer_name=order.customer_name,
    phone=order.phone,
    delivery_type=order.delivery_type,
    address=order.address,
    )
    for item in order.items:
        db_item = OrderItem(
            product_id=item.product_id,
            quantity=item.quantity,
            size=item.size
        )
        db_order.items.append(db_item)


    db.add(db_order)
    db.commit()
    db.refresh(db_order)

    return db_order

@router.patch("/orders/{order_id}", response_model=OrderRead)
def update_order_status(order_id: int,data: OrderStatusUpdate,db: Session = Depends(get_db),current_user: str = Depends(get_current_user)):
    db_order = db.query(Order).filter(Order.id == order_id).first()

    if not db_order:
        raise HTTPException(
            status_code=404,
            detail="Заказ не найден"
        )

    if data.status not in ALLOWED_STATUSES:
        raise HTTPException(
            status_code=400,
            detail="Недопустимый статус"
    )
    db_order.status = data.status
    db.commit()
    db.refresh(db_order)

    return db_order
    