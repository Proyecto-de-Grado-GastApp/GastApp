FROM python:3.9-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    libgl1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY ./app /app/app

# --- COMANDOS DE DEPURACIÓN EN DOCKERFILE ---
RUN echo "CONTENIDO DE /app/app DESPUÉS DE COPIAR:" && ls -R /app/app
RUN echo "CONTENIDO DE controller.py COPIADO:" && cat /app/app/ocr_service/controller.py
RUN echo "CONTENIDO DE processing.py COPIADO:" && cat /app/app/ocr_service/processing.py
# --- FIN DE COMANDOS DE DEPURACIÓN ---

# (Opcional pero recomendado para producción si TOKENIZERS_PARALLELISM no funciona con os.environ)
ENV TOKENIZERS_PARALLELISM=false 

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]