from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
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
    old_price: Mapped[int | None] = mapped_column()
    category: Mapped[str | None] = mapped_column(String(40))

class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    customer_name: Mapped[str] = mapped_column(String(80)) 
    phone: Mapped[str] = mapped_column(String(20))
    delivery_type: Mapped[str] = mapped_column(String(20))
    address: Mapped[str | None] = mapped_column(String(80))
    status: Mapped[str] = mapped_column(String(20),default="new")
    created_at: Mapped[datetime] = mapped_column(default=datetime.now)
    payment_type: Mapped[str] = mapped_column(String(20))
    items: Mapped[list["OrderItem"]] = relationship(back_populates="order")

class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"))
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
    quantity: Mapped[int] = mapped_column()
    size: Mapped[str | None] = mapped_column(String(50))
    order: Mapped["Order"] = relationship(back_populates="items")


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)  
    username: Mapped[str] = mapped_column(String(40), unique=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(default=datetime.now)
    