from pydantic import BaseModel
from typing import List

class TokenPrediction(BaseModel):
    token: str
    label: int # O str si tienes nombres de etiquetas

class OCRResponse(BaseModel):
    tokens: List[TokenPrediction]