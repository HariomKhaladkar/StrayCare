# app/chatbot_logic.py

def get_chatbot_response(query: str):
    """
    This function contains the rules for the first-aid chatbot. It checks the
    user's query for keywords and returns a pre-written response.
    It does not call any external APIs.
    """
    lower_query = query.lower()

    # Rule: General Safety / How to Approach
    if 'approach' in lower_query or 'how to help' in lower_query or 'scared' in lower_query:
        return ("Safety is the #1 priority. Approach the animal slowly, speaking in a calm voice. "
                "Avoid direct eye contact. If the animal growls, shows teeth, or seems aggressive, "
                "do not approach. Keep a safe distance and report the case.")

    # Rule: Bleeding or Wounds
    elif 'bleeding' in lower_query or 'cut' in lower_query or 'wound' in lower_query:
        return ("For bleeding, apply firm, gentle pressure on the wound with a clean cloth or sterile gauze. "
                "Do not use tourniquets. If bleeding is severe or doesn't stop after 5 minutes, "
                "the animal needs to see a vet immediately.")

    # Rule: Suspected Poisoning
    elif 'poison' in lower_query or 'ate something' in lower_query or 'ingested' in lower_query:
        return ("This is an emergency. Contact a vet or animal poison control center immediately. "
                "Do NOT induce vomiting unless instructed by a professional. If you know what "
                "the animal consumed, have that information ready for the vet.")

    # Rule: Limping or Broken Bone
    elif 'broken' in lower_query or 'limp' in lower_query or 'leg' in lower_query:
        return ("Do not try to set the bone or apply a splint yourself. Keep the animal as still "
                "and calm as possible to prevent further injury. Transport them to a vet immediately, "
                "using a board or blanket as a stretcher if necessary.")
    
    # Rule: Choking
    elif 'choking' in lower_query or "can't breathe" in lower_query:
        return ("If the animal is choking, first check their mouth for any foreign objects and carefully "
                "try to remove them if it is safe to do so. If you can't, you may need to perform a modified "
                "Heimlich maneuver. This is a critical emergency that requires immediate vet attention.")

    # Rule: Vomiting
    elif 'vomiting' in lower_query or 'vomit' in lower_query:
        return ("Withhold food for a few hours, but ensure fresh water is available. If vomiting is continuous, "
                "contains blood, or is accompanied by other symptoms like lethargy, it is a sign "
                "of a serious issue. Please contact a vet.")

    # Rule: Thank you
    elif 'thank' in lower_query:
        return "You're very welcome. Please prioritize safety and professional help."

    # Fallback response if no rules match
    else:
        return ("I'm sorry, I'm not sure how to answer that. I can provide basic advice on topics like "
                "bleeding, suspected poisoning, broken bones, or how to safely approach an animal. "
                "For any emergency, please contact a vet.")