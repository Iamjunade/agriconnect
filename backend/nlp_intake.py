import os
import json
import re
from typing import Dict, Any, Optional
from price_engine import compute_price_advisory

CROP_SYNONYMS = {
    'Onion': ['onion', 'onions', 'kanda', 'pyaz', 'piyaz', 'कांदा', 'प्याज'],
    'Soybean': ['soybean', 'soya', 'soyabean', 'soya bean', 'सोयाबीन'],
    'Cotton': ['cotton', 'kapas', 'kapaas', 'rui', 'कपास', 'रुई'],
    'Tur Dal': ['tur', 'tuvar', 'tur dal', 'arhar', 'तूर', 'तूर डाळ', 'अरहर'],
    'Tomato': ['tomato', 'tomatoes', 'tamatar', 'टोमॅटो', 'टमाटर']
}

LOCATION_KEYWORDS = {
    'Niphad': ['niphad', 'निफाड'],
    'Lasalgaon': ['lasalgaon', 'lasalgoan', 'लासलगाव'],
    'Nashik': ['nashik', 'nasik', 'dindori', 'नाशिक', 'दिंडोरी'],
    'Pune': ['pune', 'poona', 'gultekdi', 'khed', 'baramati', 'पुणे'],
    'Latur': ['latur', 'लातूर'],
    'Akola': ['akola', 'अकोला'],
    'Nagpur': ['nagpur', 'kalamna', 'नागपूर'],
    'Jalgaon': ['jalgaon', 'जळगाव']
}

def extract_via_groq(text: str) -> Optional[Dict[str, Any]]:
    """Optional PRD-spec Groq LLM extraction (Llama 3.1 8B). Returns None if key not present or call fails."""
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        return None
    try:
        from groq import Groq
        client = Groq(api_key=api_key)
        system_prompt = (
            "You are an agricultural NLP intake parser for AgriConnect India. "
            "Extract {crop, quantity_quintals, quality_grade, location_text} as strict JSON. "
            "Available crops: Onion, Soybean, Cotton, Tur Dal, Tomato. "
            "Default unit is quintals (1 ton = 10 quintals, 100 kg = 1 quintal). "
            "If quality is not mentioned, use 'Grade A'. "
            "If any critical field (crop, quantity, location) is missing from text, set its value to null. "
            "Respond ONLY with valid JSON."
        )
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": text}
            ],
            response_format={"type": "json_object"},
            temperature=0.1
        )
        data = json.loads(completion.choices[0].message.content)
        return data
    except Exception as e:
        print(f"[Groq Intake Fallback] {e}")
        return None

def parse_farmer_message(text: str, farmer_phone: str = "+91-98230-11223", farmer_name: str = "Ramesh Patil") -> Dict[str, Any]:
    text_clean = text.lower().strip()
    
    # 1. Check for quick affirmative reply to create lot
    if text_clean in ['yes', 'yes please', 'ho', 'haa', 'ha', 'confirm', 'list', 'register', '1']:
        return {
            'parsed_intent': 'confirm_lot_creation',
            'extracted_data': None,
            'advisory': None,
            'chat_response': (
                "✅ Listing Confirmed!\n\n"
                "Your produce lot has been registered and is now visible to institutional buyers on AgriConnect. "
                "You will receive an instant WhatsApp alert when an offer is dispatched!"
            )
        }

    # 2. Try Groq LLM Extraction first if GROQ_API_KEY is available
    groq_extracted = extract_via_groq(text)
    
    if groq_extracted and groq_extracted.get('crop') and groq_extracted.get('quantity_quintals') and groq_extracted.get('location_text'):
        detected_crop = groq_extracted['crop']
        qty = float(groq_extracted['quantity_quintals'])
        detected_loc = groq_extracted['location_text']
        grade = groq_extracted.get('quality_grade') or 'Grade A'
    else:
        # 3. High-speed, zero-downtime local regex/slot extraction (PRD fallback)
        detected_crop = None
        for standard_crop, synonyms in CROP_SYNONYMS.items():
            for syn in synonyms:
                if syn in text_clean:
                    detected_crop = standard_crop
                    break
            if detected_crop:
                break
        if not detected_crop:
            detected_crop = 'Onion' # Default fallback crop for demo
                    
        qty = 20.0
        match_qty = re.search(r'(\d+(?:\.\d+)?)\s*(?:quintal|qtl|ton|kg|tonne|टन|क्विंटल|किलो)?', text_clean)
        if match_qty:
            try:
                val = float(match_qty.group(1))
                if 'ton' in text_clean or 'टन' in text_clean:
                    qty = val * 10
                elif 'kg' in text_clean or 'किलो' in text_clean:
                    qty = round(val / 100, 1)
                else:
                    qty = val
            except:
                qty = 20.0
                
        detected_loc = None
        for loc_name, keys in LOCATION_KEYWORDS.items():
            for k in keys:
                if k in text_clean:
                    detected_loc = loc_name
                    break
            if detected_loc:
                break
        if not detected_loc:
            detected_loc = 'Niphad, Nashik'
                    
        grade = 'Grade A'
        if 'grade b' in text_clean or 'b grade' in text_clean or 'medium' in text_clean:
            grade = 'Grade B'
        elif 'faq' in text_clean or 'regular' in text_clean:
            grade = 'FAQ'

    # Compute net advisory using real price engine
    advisory = compute_price_advisory(detected_crop, qty, detected_loc, grade)
    best_m = advisory['best_market']
    rec = advisory['recommendation']
    
    reply_msg = (
        f"🌾 *AgriConnect Mandi Advisory*\n\n"
        f"• Commodity: {detected_crop} ({grade})\n"
        f"• Quantity: {qty} Quintals\n"
        f"• Farm Center: {detected_loc}\n\n"
        f"🏆 *Optimal Mandi:* {best_m['market']}\n"
        f"• Gross Mandi Rate: ₹{best_m['gross_modal_price']}/qtl\n"
        f"• Estimated Freight: -₹{best_m['transport_cost_per_qtl']}/qtl ({best_m['distance_km']} km)\n"
        f"• *Net Realized Rate:* ₹{best_m['net_price_per_qtl']}/qtl\n"
        f"• *Total In-Hand Cash:* ₹{best_m['total_net_realization']:,}\n\n"
        f"📈 *Action Recommendation:* {rec['headline']}\n"
        f"{rec['reasoning']}\n\n"
        f"💡 {advisory['decision_insight']}\n\n"
        f"👉 *Reply 'YES' to list this lot directly for institutional buyers.*"
    )

    return {
        'parsed_intent': 'price_inquiry_and_lot_creation',
        'extracted_data': {
            'crop': detected_crop,
            'quantity_quintals': qty,
            'grade': grade,
            'location': detected_loc,
            'farmer_name': farmer_name,
            'farmer_phone': farmer_phone
        },
        'advisory': advisory,
        'chat_response': reply_msg
    }
