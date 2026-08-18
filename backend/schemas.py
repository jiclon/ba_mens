from pydantic import BaseModel
from datetime import datetime

class ProductRead(BaseModel):
    id: int
    brand: str
    name: str 
    price: int 
    in_stock: bool
    image: str | None
    size: str | None
    old_price: int | None
    category: str | None

    model_config =  {"from_attributes": True}

class OrderCreate(BaseModel):
    product_id: int
    quantity: int
    customer_name: str
    phone: str
    delivery_type: str
    address: str | None
    model_config = {"from_attributes": True}

class OrderRead(BaseModel):
    id: int
    status: str
    created_at: datetime
    product_id: int
    quantity: int
    customer_name: str
    phone: str
    delivery_type: str
    address: str | None
    model_config = {"from_attributes": True}
