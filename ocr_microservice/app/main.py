from fastapi import FastAPI
from app.ocr_service import controller as ocr_controller
from app.ocr_service.model_handler import load_model_and_processor # Función para cargar al inicio

app = FastAPI(title="OCR Microservice with LayoutLMv3")

@app.on_event("startup")
async def startup_event():
    # Cargar el modelo al iniciar la aplicación para que esté listo
    # Esto evita la carga en la primera petición, lo cual puede ser lento
    print("Loading OCR model and processor...")
    load_model_and_processor()
    print("Model and processor loaded.")

app.include_router(ocr_controller.router, prefix="/api/v1/ocr", tags=["OCR"])

@app.get("/")
async def read_root():
    return {"message": "OCR Microservice is running. Go to /docs for API documentation."}

if __name__ == "__main__":
    import uvicorn
    # Esta parte es solo para ejecutar directamente con `python main.py`
    # Normalmente Uvicorn se encargará de esto según el CMD del Dockerfile
    uvicorn.run(app, host="0.0.0.0", port=8000)