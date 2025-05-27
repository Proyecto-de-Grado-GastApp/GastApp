from fastapi import APIRouter, UploadFile, File
from PIL import Image
from io import BytesIO
from transformers import LayoutLMv3Processor, LayoutLMv3ForTokenClassification
import torch

router = APIRouter()

# Cargar modelo y processor (puedes mover esto a otro archivo si quieres cachearlo mejor)
processor = LayoutLMv3Processor.from_pretrained("microsoft/layoutlmv3-base", apply_ocr=True)
model = LayoutLMv3ForTokenClassification.from_pretrained("microsoft/layoutlmv3-base")

@router.post("/predict")
async def predict(file: UploadFile = File(...)):
    image = Image.open(BytesIO(await file.read())).convert("RGB")
    encoding = processor(images=image, return_tensors="pt")

    with torch.no_grad():
        outputs = model(**encoding)
        predictions = torch.argmax(outputs.logits, dim=-1)

    tokens = processor.tokenizer.convert_ids_to_tokens(encoding.input_ids[0])
    labels = predictions[0].tolist()

    result = [{"token": t, "label": l} for t, l in zip(tokens, labels)]
    return {"tokens": result}