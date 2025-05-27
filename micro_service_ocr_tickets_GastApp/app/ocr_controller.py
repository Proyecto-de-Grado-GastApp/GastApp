from fastapi import APIRouter, UploadFile, File
from typing import Dict
from app.ocr_utils import extract_data_from_image

router = APIRouter()

@router.post("/ocr", summary="Extrae información de un ticket mediante OCR")
async def ocr_endpoint(file: UploadFile = File(...)) -> Dict:
    contents = await file.read()

    result = extract_data_from_image(contents)

    return result
