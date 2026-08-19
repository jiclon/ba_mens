from pydantic import BaseModel
from datetime import datetime

class ProductRead(BaseModel):
    id: int
    brand: str
    name: str 
    price: int 
    in_stock: bool
    image: str | None
    old_price: int | None
    category: str | None

    model_config =  {"from_attributes": True}

class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int
    size: str | None

class OrderCreate(BaseModel):
    customer_name: str
    phone: str 
    delivery_type: str 
    address: str | None
    payment_type: str 
    items: list[OrderItemCreate]

class OrderItemRead(BaseModel): 
    id: int 
    order_id: int 
    product_id: int 
    quantity: int 
    size: str | None
    model_config = {"from_attributes": True}

class OrderRead(BaseModel): 
    id: int 
    status: str 
    created_at: datetime
    customer_name:str
    phone: str 
    delivery_type: str 
    address: str | None
    payment_type: str 
    items: list[OrderItemRead]
    model_config = {"from_attributes": True}