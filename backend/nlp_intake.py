import re
from typing import Dict, Any
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

def parse_farmer_message(text: str, farmer_phone: str = "+91-98230-11223", farmer_name: str = "Ramesh Patil") -> Dict[str, Any]:
    text_clean = text.lower()
    
    # Extract crop
    detected_crop = 'Onion'
    for standard_crop, synonyms in CROP_SYNONYMS.items():
        for syn in synonyms:
            if syn in text_clean:
                detected_crop = standard_crop
                break
                
    # Extract quantity
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
            
    # Extract location
    detected_loc = 'Niphad, Nashik'
    for loc_name, keys in LOCATION_KEYWORDS.items():
        for k in keys:
            if k in text_clean:
                detected_loc = loc_name
                break
                
    # Grade detection
    grade = 'Grade A'
    if 'grade b' in text_clean or 'b grade' in text_clean or 'medium' in text_clean:
        grade = 'Grade B'
    elif 'faq' in text_clean or 'regular' in text_clean:
        grade = 'FAQ'

    advisory = compute_price_advisory(detected_crop, qty, detected_loc, grade)
    best_m = advisory['best_market']
    rec = advisory['recommendation']
    
    reply_msg = (
        f"[AgriConnect Mandi Advisory]\n\n"
        f"Crop: {detected_crop} ({grade})\n"
        f"Quantity: {qty} Quintals\n"
        f"Farmer Location: {detected_loc}\n\n"
        f"Best Realization Mandi: {best_m['market']}\n"
        f"Net Price: Rs {best_m['net_price_per_qtl']}/qtl (after Rs {best_m['transport_cost_per_qtl']} freight)\n"
        f"Total In-Hand Value: Rs {best_m['total_net_realization']:,}\n\n"
        f"Action: {rec['headline']}\n"
        f"{advisory['decision_insight']}\n\n"
        f"Reply 'YES' to list this lot for verified institutional buyers."
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
