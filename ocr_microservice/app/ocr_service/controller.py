from fastapi import APIRouter, UploadFile, File, HTTPException
from app.ocr_service import processing
from typing import Dict, Any
import datetime
import re

router = APIRouter()

def extract_info_from_words(words_list: list) -> Dict[str, Any]:
    print(f"DEBUG: Entrando a extract_info_from_words. Número de palabras: {len(words_list)}")
    # Unir las palabras YA LIMPIADAS (asumiendo que vienen limpias de processing.py)
    texto_completo_ya_limpio = " ".join([item.get("word", "") for item in words_list if item.get("word") and item.get("word") != "[SEP]"])
    
    extracted_info = {
        "fecha": None,
        "total": None,
        "texto_completo_limpio": texto_completo_ya_limpio # Usar el texto ya limpio
    }
    print(f"DEBUG: Texto completo para heurísticas: '{extracted_info['texto_completo_limpio'][:200]}...'") # Muestra una parte

    # Heurística para la fecha
    date_pattern = r"\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b"
    match_fecha = re.search(date_pattern, extracted_info["texto_completo_limpio"])
    if match_fecha:
        extracted_info["fecha"] = match_fecha.group(1)
        print(f"DEBUG: Fecha encontrada con regex principal: {extracted_info['fecha']}")
    else: 
        # Intento alternativo
        potential_date_str = ""
        # Esta lógica alternativa para fecha es muy propensa a errores, la mantenemos simple por ahora.
        # Podríamos buscar palabras individuales que parezcan una fecha.
        for item in words_list:
            word = item.get("word", "")
            individual_match = re.fullmatch(date_pattern, word)
            if individual_match:
                extracted_info["fecha"] = individual_match.group(1)
                print(f"DEBUG: Fecha encontrada en palabra individual: {extracted_info['fecha']}")
                break 
    if not extracted_info["fecha"]:
        print("DEBUG: Fecha NO encontrada.")


    # Heurística para el TOTAL
    text_content_upper = extracted_info["texto_completo_limpio"].upper()
    total_candidates = []
    # Primero buscar "TOTAL" y luego el número
    for total_match_obj in list(re.finditer(r"TOTAL", text_content_upper)):
        search_area_start = total_match_obj.end()
        # Buscar un poco más adelante por si hay espacios o símbolos entre TOTAL y el número
        search_area_text = extracted_info["texto_completo_limpio"][search_area_start : search_area_start + 30] # Primeros 30 caracteres después de TOTAL
        
        price_pattern = r"([\d]+[,.]\d{2})" # Acepta coma o punto
        price_found = re.search(price_pattern, search_area_text)
        
        if price_found:
            try:
                total_value = float(price_found.group(1).replace(",","."))
                total_candidates.append(total_value)
                print(f"DEBUG: Candidato a total encontrado después de 'TOTAL': {total_value} (de '{price_found.group(1)}')")
            except ValueError:
                print(f"DEBUG: No se pudo convertir a float: {price_found.group(1)}")
                pass
    
    # Si no se encontró así, buscar cualquier número con formato de precio en las últimas líneas del ticket
    # (los totales suelen estar al final)
    if not total_candidates:
        print("DEBUG: No se encontró total después de la palabra TOTAL. Buscando precios al final del texto.")
        # Considerar las últimas N palabras o una porción del final del texto
        last_portion_text = extracted_info["texto_completo_limpio"][-100:] # Últimos 100 caracteres
        price_pattern_general = r"([\d]+[,.]\d{2})"
        general_price_matches = re.findall(price_pattern_general, last_portion_text)
        if general_price_matches:
            for price_str in general_price_matches:
                try:
                    total_candidates.append(float(price_str.replace(",",".")))
                    print(f"DEBUG: Candidato a total (búsqueda general al final): {price_str}")
                except ValueError:
                    pass


    if total_candidates:
        # A menudo el total más grande es el "gran total".
        extracted_info["total"] = f"{max(total_candidates):.2f}" # Formatear a 2 decimales
        print(f"DEBUG: Total final seleccionado: {extracted_info['total']}")
    else:
        print("DEBUG: Total NO encontrado.")
        
    return extracted_info

@router.post("/predict")
async def predict_ocr(file: UploadFile = File(...)) -> Dict[str, Any]:
    print(f"CONTROLLER.PY DICE HOLA - TIEMPO: {datetime.datetime.now()} - ¡ESTA ES LA VERSIÓN MUY PRECISA!")

    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided is not an image.")
    try:
        image_bytes = await file.read()
        
        ocr_result = processing.perform_ocr_prediction(image_bytes) # Devuelve {"words": [...]}
        
        if "error" in ocr_result:
             raise HTTPException(status_code=500, detail=ocr_result["error"])

        words_list = ocr_result.get("words", [])
        
        extracted_data = extract_info_from_words(words_list) # Usa la lista de "words"
        
        # La clave "cleaned_words_output" ahora contendrá las palabras ya limpias de processing.py
        return {"cleaned_words_output": words_list, "extracted_information": extracted_data}

    except ValueError as ve:
        print(f"ValueError during OCR prediction: {ve}")
        raise HTTPException(status_code=400, detail=str(ve))
    except RuntimeError as re:
        print(f"Runtime error during OCR prediction: {re}")
        raise HTTPException(status_code=500, detail=f"Error during OCR processing: {re}")
    except Exception as e:
        import traceback
        print(f"Unexpected error during OCR prediction: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred in controller: {type(e).__name__}")
    finally:
        await file.close()