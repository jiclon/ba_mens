from database import SessionLocal
from models import Product

# открываем сессию — соединение с базой
session = SessionLocal()

# создаём объекты в памяти, база о них пока не знает
products = [
    Product(brand="Nike", name="Tech Tracksuit", price=24900),
    Product(brand="New Balance", name="1906R", price=24500),
    Product(brand="New Balance", name="860v2", price=24500),
    Product(brand="Tommy Hilfiger", name="Half-Zip", price=16500),
    Product(brand="Stüssy", name="Basic Tee", price=14500),
    Product(brand="Reebok", name="Club C", price=13500),
    Product(brand="Nomads", name="Sneakers", price=13500),
    Product(brand="Givenchy", name="Gentleman", price=12950),
]

# ставим в очередь на запись
session.add_all(products)

# фиксируем — вот здесь SQLAlchemy выполняет INSERT
session.commit()

# закрываем соединение
session.close()

print(f"Добавлено товаров: {len(products)}")