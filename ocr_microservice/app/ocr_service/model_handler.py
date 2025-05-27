from transformers import LayoutLMv3Processor, LayoutLMv3ForTokenClassification
import torch

# Variables globales para almacenar el modelo y el procesador cacheados
# Esto asegura que solo se carguen una vez.
model = None
processor = None
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

def load_model_and_processor(model_path="microsoft/layoutlmv3-base"):
    """
    Carga el modelo LayoutLMv3 y el procesador.
    Si ya están cargados, no hace nada.
    """
    global model, processor
    if model is None or processor is None:
        try:
            print(f"Loading processor from: {model_path}")
            processor = LayoutLMv3Processor.from_pretrained(model_path, apply_ocr=True)
            print(f"Loading model from: {model_path}")
            model = LayoutLMv3ForTokenClassification.from_pretrained(model_path)
            model.to(device) # Mover el modelo a GPU si está disponible
            model.eval() # Poner el modelo en modo evaluación
            print("Model and processor loaded successfully.")
        except Exception as e:
            print(f"Error loading model/processor: {e}")
            # Aquí podrías lanzar una excepción o manejar el error de forma más robusta
            raise

def get_model():
    if model is None:
        # Intenta cargar si aún no se ha hecho (aunque startup debería manejarlo)
        print("Model was not loaded, attempting to load now...")
        load_model_and_processor()
    if model is None: # Comprueba de nuevo después de intentar cargar
        raise RuntimeError("Model has not been loaded and failed to load on demand.")
    return model

def get_processor():
    if processor is None:
        # Intenta cargar si aún no se ha hecho
        print("Processor was not loaded, attempting to load now...")
        load_model_and_processor()
    if processor is None: # Comprueba de nuevo después de intentar cargar
        raise RuntimeError("Processor has not been loaded and failed to load on demand.")
    return processor

def get_device():
    return device