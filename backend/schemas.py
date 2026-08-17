from pydantic import BaseModel

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