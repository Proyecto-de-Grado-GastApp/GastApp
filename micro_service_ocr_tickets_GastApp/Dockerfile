FROM python:3.9-slim

WORKDIR /app

# Instala dependencias del sistema (Tesseract es usado por LayoutLMv3Processor si apply_ocr=True)
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    libgl1 \
    && rm -rf /var/lib/apt/lists/*

# Copia los requerimientos primero para aprovechar el cache de Docker
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copia el resto de la aplicación
COPY ./app /app/app

# (Opcional) Si tienes modelos pre-entrenados que quieres incluir en la imagen
# COPY ./models /app/models

# Exponer puerto y lanzar Uvicorn
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
# Nota: --reload es útil para desarrollo, considera quitarlo para producción.