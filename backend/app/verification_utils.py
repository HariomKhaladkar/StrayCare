import logging
import os
import io

try:
    import google.generativeai as genai
    from PIL import Image
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False

logger = logging.getLogger(__name__)

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if HAS_GENAI and GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)

def is_animal_image(image_bytes: bytes) -> bool:
    """
    Checks if the provided image contains an animal using Google Gemini.
    Strictly returns False if it cannot verify the image as an animal.
    This replaces the previous HuggingFace model with a much smarter,
    more reliable Generative AI vision model.
    """
    if not HAS_GENAI:
        logger.error("google-generativeai or pillow is not installed. Cannot verify image.")
        return False
        
    if not GOOGLE_API_KEY:
        logger.error("GOOGLE_API_KEY is not set. Cannot verify image.")
        return False
        
    try:
        # Load image into memory for PIL
        image = Image.open(io.BytesIO(image_bytes))
        
        # Use gemini-1.5-flash as it is fast and supports vision reasoning
        model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = "Does this image clearly contain a real animal (like a cat, dog, cow, bird, rodent, rabbit, etc.)? Answer with only the exact word 'Yes' or 'No'."
        
        response = model.generate_content([prompt, image])
        answer = response.text.strip().lower()
        
        # Gemini answers 'yes' or 'no'
        if 'yes' in answer:
            logger.info("Animal verified by Gemini.")
            return True
        else:
            logger.warning(f"No animal detected by Gemini. Response was: {answer}")
            return False
            
    except Exception as e:
        logger.error(f"Gemini image verification failed with error: {e}")
        return False
