from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
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
    