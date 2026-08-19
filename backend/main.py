from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import products, orders

app = FastAPI(title="BA MENS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "https://ba-mens.vercel.app",
    "http://127.0.0.1:5500",
    "http://localhost:5500",],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router)
app.include_router(orders.router)