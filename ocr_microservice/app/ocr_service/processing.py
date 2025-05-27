from PIL import Image
from io import BytesIO
import torch
import os
import re

from .model_handler import get_model, get_processor, get_device

# Comenta esta línea si estás pasando TOKENIZERS_PARALLELISM con docker run -e
# os.environ["TOKENIZERS_PARALLELISM"] = "false"

def clean_text(text: str) -> str:
    """
    Limpia el texto de caracteres mal codificados comunes y otros artefactos.
    """
    if not isinstance(text, str): # Asegurarse de que el input es una cadena
        return ""

    replacements = {
        "Ã©": "é", "Ã¨": "è", "Ã¡": "á", "Ã­": "í", "Ã³": "ó", "Ãº": "ú", "Ã¼": "ü",
        "Ã‰": "É", "Ã€": "È", "Ã": "Á", "Ã": "Í", "Ã“": "Ó", "Ãš": "Ú", "Ãœ": "Ü",
        "Ã±": "ñ", "Ã‘": "Ñ",
        "Âº": "º", "Âª": "ª",
        "âĢĶ": "-", # Este es un caracter problemático, puede ser un guion largo o basura
        "âĤ¬": "€", # Símbolo de Euro
        # Añade más reemplazos si observas otros patrones consistentes
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    
    # Intenta eliminar secuencias extrañas que queden como "-=-" o "---"
    text = re.sub(r'-[-=]+-', '-', text) # Convierte secuencias de guiones/iguales a un solo guion
    text = re.sub(r'\s+', ' ', text).strip() # Normaliza espacios
    return text

def perform_ocr_prediction(image_bytes: bytes):
    print("DEBUG: Entrando a perform_ocr_prediction en processing.py (VERSIÓN PRECISA)")

    try:
        model = get_model()
        processor = get_processor()
        device = get_device()
    except Exception as e:
        print(f"DEBUG ERROR: al obtener modelo/procesador: {e}")
        raise RuntimeError(f"Fallo al obtener modelo/procesador: {e}")

    try:
        image = Image.open(BytesIO(image_bytes)).convert("RGB")
    except Exception as e:
        print(f"DEBUG ERROR: abriendo imagen: {e}")
        raise ValueError(f"Could not open or read image file: {e}")

    encoding = processor(
        images=image,
        return_tensors="pt",
        truncation=True,
        padding="max_length",
        return_offsets_mapping=False
    )
    print(f"DEBUG: Encoding keys from processor: {list(encoding.keys())}")

    model_inputs = {
        "pixel_values": encoding.get("pixel_values").to(device)
    }
    if "input_ids" in encoding:
        model_inputs["input_ids"] = encoding.get("input_ids").to(device)
    if "attention_mask" in encoding:
        model_inputs["attention_mask"] = encoding.get("attention_mask").to(device)
    
    print(f"DEBUG: Claves que se pasan al modelo: {list(model_inputs.keys())}")

    with torch.no_grad():
        outputs = model(**model_inputs)
        predictions = torch.argmax(outputs.logits, dim=-1)
    print("DEBUG: Inferencia completada.")

    if "input_ids" not in encoding:
        print("DEBUG ERROR: 'input_ids' no encontradas en encoding.")
        return {"error": "'input_ids' not found after processing."}

    input_ids_list = encoding["input_ids"][0].cpu().tolist()
    raw_tokens = processor.tokenizer.convert_ids_to_tokens(input_ids_list)
    raw_labels = predictions[0].cpu().tolist()

    processed_words = []
    current_word_text = ""
    current_word_labels_list = []

    for token, label in zip(raw_tokens, raw_labels):
        if token in [processor.tokenizer.cls_token, processor.tokenizer.pad_token]:
            if current_word_text:
                cleaned_word = clean_text(current_word_text) # <<-- LIMPIEZA AQUÍ
                if cleaned_word:
                    processed_words.append({
                        "word": cleaned_word,
                        "labels": current_word_labels_list,
                        "label": current_word_labels_list[0] if current_word_labels_list else -1
                    })
                current_word_text = ""
                current_word_labels_list = []
            continue

        if token == processor.tokenizer.sep_token:
            if current_word_text:
                cleaned_word = clean_text(current_word_text) # <<-- LIMPIEZA AQUÍ
                if cleaned_word:
                    processed_words.append({
                        "word": cleaned_word,
                        "labels": current_word_labels_list,
                        "label": current_word_labels_list[0] if current_word_labels_list else -1
                    })
                current_word_text = ""
                current_word_labels_list = []
            # Opcional: processed_words.append({"word": "[SEP]", "labels": [label], "label": label})
            continue

        if token.startswith("Ġ"):
            if current_word_text:
                cleaned_word = clean_text(current_word_text) # <<-- LIMPIEZA AQUÍ
                if cleaned_word:
                    processed_words.append({
                        "word": cleaned_word,
                        "labels": current_word_labels_list,
                        "label": current_word_labels_list[0] if current_word_labels_list else -1
                    })
            current_word_text = token[1:]
            current_word_labels_list = [label]
        else:
            current_word_text += token
            current_word_labels_list.append(label)
    
    if current_word_text:
        cleaned_word = clean_text(current_word_text) # <<-- LIMPIEZA AQUÍ
        if cleaned_word:
            processed_words.append({
                "word": cleaned_word,
                "labels": current_word_labels_list,
                "label": current_word_labels_list[0] if current_word_labels_list else -1
            })
            
    print("DEBUG: Palabras procesadas y limpiadas construidas.")
    return {"words": processed_words} # Devolvemos la clave "words"