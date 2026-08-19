from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from database import Base

class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True)
    brand: Mapped[str] = mapped_column(String(80))
    name: Mapped[str] = mapped_column(String(120))
    price: Mapped[int] = mapped_column()
    in_stock: Mapped[bool] = mapped_column(default=True)
    image: Mapped[str | None] = mapped_column(String(200))
    size: Mapped[str | None] = mapped_column(String(50))
    old_price: Mapped[int | None] = mapped_column()
    category: Mapped[str | None] = mapped_column(String(40))

class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    customer_name: Mapped[str] = mapped_column(String(80)) 
    phone: Mapped[str] = mapped_column(String(20))
    quantity: Mapped[int] = mapped_column()
    delivery_type: Mapped[str] = mapped_column(String(20))
    address: Mapped[str | None] = mapped_column(String(80))
    status: Mapped[str] = mapped_column(String(20),default="new")
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
    created_at: Mapped[datetime] = mapped_column(default=datetime.now)



