import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv(override=True)
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

models = ['gemini-pro', 'gemini-1.0-pro', 'gemini-1.5-flash-latest']

for m_name in models:
    print(f"\\nTesting {m_name}...")
    try:
        model = genai.GenerativeModel(m_name)
        response = model.generate_content("Say hi")
        print(f"SUCCESS with {m_name}! Response: {response.text.strip()}")
        break
    except Exception as e:
        print(f"FAILED {m_name}: {e}")
