from database import SessionLocal
from models import User 
import bcrypt

login = "bektur"
password = "ВПИСАТЬ_ПЕРЕД_ЗАПУСКОМ"


password_bytes = password.encode()
salt = bcrypt.gensalt()
password_hash = bcrypt.hashpw(password_bytes, salt).decode()

db = SessionLocal()

db_user = User(username=login, password_hash=password_hash)

db.add(db_user)
db.commit()
db.refresh(db_user)


print(f"Пользователь {db_user.username} создан, id={db_user.id}")
db.close()