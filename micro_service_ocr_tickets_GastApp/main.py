from fastapi import FastAPI
from ocr_controller import router as ocr_router
from app import ocr_controller

app = FastAPI()

app.include_router(ocr_router)
app.include_router(ocr_controller.router)