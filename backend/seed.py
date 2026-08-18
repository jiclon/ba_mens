from database import SessionLocal
from models import Product

# открываем сессию — соединение с базой
session = SessionLocal()

# создаём объекты в памяти, база о них пока не знает
products = [
    Product(brand="Nike", name="Tech Tracksuit", price=24900, image="images/p-nike.jpg", category="clothing"),
    Product(brand="New Balance", name="1906R", price=24500, image="images/p-nb-black.jpg", category="shoes"),
    Product(brand="New Balance", name="860v2", price=24500, image="images/p-nb-green.jpg", category="shoes"),
    Product(brand="Tommy Hilfiger", name="Half-Zip", price=16500, image="images/p-tommy.jpg", category="clothing"),
    Product(brand="Stüssy", name="Basic Tee", price=14500, image="images/p-stussy.jpg", category="clothing"),
    Product(brand="Reebok", name="Club C", price=13500, image="images/p-reebok.jpg", category="shoes"),
    Product(brand="Nomads", name="Sneakers", price=13500, image="images/p-nomads.jpg", category="shoes"),
    Product(brand="Givenchy", name="Gentleman", price=12950, image="images/p-givenchy.jpg", category="perfume"),
]

# ставим в очередь на запись
session.add_all(products)

# фиксируем — вот здесь SQLAlchemy выполняет INSERT
session.commit()

# закрываем соединение
session.close()

print(f"Добавлено товаров: {len(products)}")