from fastapi import FastAPI, File, UploadFile
from PIL import Image
import pytesseract
from transformers import LayoutLMv3Processor, LayoutLMv3ForTokenClassification
import io

app = FastAPI(title="OCR Receipt Parser")

# Carga de modelo y procesador
processor = LayoutLMv3Processor.from_pretrained("microsoft/layoutlmv3-base")
model = LayoutLMv3ForTokenClassification.from_pretrained("microsoft/layoutlmv3-base")

@app.post("/parse_receipt/")
async def parse_receipt(file: UploadFile = File(...)):
    # Leer imagen
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    # OCR con Tesseract (palabras + cajas)
    ocr = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
    words, boxes = [], []
    for i, text in enumerate(ocr['text']):
        if text.strip() and int(ocr['conf'][i]) > 50:
            words.append(text)
            x, y, w, h = (ocr['left'][i], ocr['top'][i], ocr['width'][i], ocr['height'][i])
            boxes.append([x, y, x + w, y + h])

    # Prepara inputs para LayoutLMv3
    encoding = processor(image, words, boxes=boxes,
                          return_tensors="pt",
                          truncation=True,
                          padding="max_length")

    # Inferencia
    outputs = model(**encoding).logits.argmax(-1).squeeze().tolist()

    # TODO: Mapear etiquetas de outputs a campos (TOTAL, FECHA, etc.)
    return {"words": words, "labels": outputs}