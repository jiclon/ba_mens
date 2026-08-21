import os
import jwt
import bcrypt
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from dependencies import get_db
from models import User
from schemas import LoginRequest, TokenResponse
from datetime import datetime, timedelta, timezone


router = APIRouter()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
TOKEN_EXPIRE_MINUTES = 60

@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == data.username).first()

    if not db_user:
        raise HTTPException(
            status_code=401,
            detail="Неверный логин или пароль"
        )

    if not bcrypt.checkpw(data.password.encode(), db_user.password_hash.encode()):
        raise HTTPException(
            status_code=401,
            detail="Неверный логин или пароль"
        )

    expire = datetime.now(timezone.utc) + timedelta(minutes=TOKEN_EXPIRE_MINUTES)
    payload = {"sub": db_user.username, "exp": expire}
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return {"access_token": token, "token_type": "bearer"}
