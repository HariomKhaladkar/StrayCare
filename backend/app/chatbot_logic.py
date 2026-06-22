# app/chatbot_logic.py

import os
import requests

# Groq API endpoint (OpenAI-compatible)
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.3-70b-versatile"  # Fast, capable, generous free tier

# System prompt constraining the AI to StrayCare's domain
SYSTEM_PROMPT = """You are the StrayCare AI Assistant — a compassionate, knowledgeable helper for people who care about stray and injured animals in India.

Your primary areas of expertise:
1. **Animal First Aid** – Bleeding wounds, fractures, poisoning, choking, burns, eye injuries, shock, dehydration, heat stroke, and other emergencies for dogs, cats, and other stray animals.
2. **Safe Rescue Guidance** – How to safely approach, contain, and transport an injured or frightened stray animal without harming it or yourself.
3. **StrayCare App Help** – How to report a stray case, track its status, submit an adoption request, donate to NGOs, find nearby verified NGOs, use the AI Pet Matchmaker, and other app features.
4. **General Animal Welfare** – Vaccination schedules, nutrition basics, post-surgery care, and spay/neuter advice.

Tone & style:
- Warm, calm, and reassuring — users are often panicking about an injured animal.
- Provide clear, step-by-step instructions when giving first aid advice.
- Always recommend contacting a vet for serious emergencies; never substitute professional care.
- Use **bold** for key action steps and keep responses concise but complete.
- If a question is completely unrelated to animals, animal welfare, or the StrayCare app, politely decline and redirect.

Language: Respond in the same language the user writes in (English or Hindi are most common).
"""


def get_chatbot_response(query: str, history: list = []) -> str:
    """
    Sends the user query to Groq's API (Llama 3.3 70B) with a StrayCare system prompt.
    Supports multi-turn conversation via the `history` list.
    Falls back gracefully if the API key is missing or the call fails.
    """
    _key = os.getenv("GROQ_API_KEY", "").strip()
    api_key = _key if _key else "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"

    if not api_key:
        return (
            "⚠️ The AI assistant is not configured yet. "
            "Please ask the administrator to set `GROQ_API_KEY` in the backend `.env` file. "
            "Get a free key at https://console.groq.com/keys — no credit card required. "
            "For urgent animal emergencies, please contact a local vet directly."
        )

    try:
        # Build the messages array: system prompt + history + current query
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]

        for msg in history:
            role = msg.get("role", "user")
            text = msg.get("text", "")
            if role in ("user", "model") and text:
                # Groq uses "assistant" not "model"
                messages.append({
                    "role": "assistant" if role == "model" else "user",
                    "content": text
                })

        messages.append({"role": "user", "content": query})

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": GROQ_MODEL,
            "messages": messages,
            "max_tokens": 1024,
            "temperature": 0.7,
        }

        response = requests.post(GROQ_API_URL, headers=headers, json=payload, timeout=30)

        if response.status_code == 429:
            return (
                "⚠️ The AI assistant is temporarily rate-limited. "
                "Please wait a moment and try again."
            )
        if response.status_code == 401:
            return (
                "⚠️ Invalid API key. Please check the `GROQ_API_KEY` in the backend `.env` file."
            )

        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]

    except requests.exceptions.Timeout:
        return (
            "I'm sorry, the AI response timed out. Please try again. "
            "For animal emergencies, contact a local vet immediately."
        )
    except Exception as e:
        print(f"Groq API error: {type(e).__name__}: {e}")
        return (
            "I'm sorry, I'm having trouble connecting to the AI service right now. "
            "For animal emergencies, please contact a local vet immediately. "
            "You can also use the StrayCare app to report a case and find nearby NGOs."
        )