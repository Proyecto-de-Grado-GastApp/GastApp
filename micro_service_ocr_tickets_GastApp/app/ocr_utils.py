import pytesseract
from transformers import LayoutLMv3Processor, LayoutLMv3ForTokenClassification
from PIL import Image
import io
import torch

# Cargar modelo y procesador una sola vez
processor = LayoutLMv3Processor.from_pretrained("microsoft/layoutlmv3-base", apply_ocr=True)
model = LayoutLMv3ForTokenClassification.from_pretrained("microsoft/layoutlmv3-base")
model.eval()

def extract_data_from_image(image_bytes):
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    # Procesamiento inicial
    inputs = processor(image, return_tensors="pt")
    with torch.no_grad():
        outputs = model(**inputs)

    logits = outputs.logits
    predicted_ids = logits.argmax(-1).squeeze().tolist()
    tokens = processor.tokenizer.convert_ids_to_tokens(inputs.input_ids.squeeze().tolist())

    # Aquí puedes empezar a analizar tokens, agrupar por entidades, buscar palabras clave
    result = {
        "tokens": [t for t in tokens if t not in processor.tokenizer.all_special_tokens],
        "labels": [str(pred_id) for pred_id in predicted_ids],
    }

    # 👇 Aquí puedes añadir lógica para extraer total, fecha, etc., desde los tokens
    return result
