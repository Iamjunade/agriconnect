import os
import json
import re
from typing import Dict, Any, Optional
from price_engine import compute_price_advisory

DEVANAGARI_DIGITS = str.maketrans('०१२३४५६७८९', '0123456789')

CROP_SYNONYMS = {
    'Onion': ['onion', 'onions', 'kanda', 'pyaz', 'piyaz', 'कांदा', 'प्याज', 'कांदे'],
    'Soybean': ['soybean', 'soya', 'soyabean', 'soya bean', 'सोयाबीन', 'सोयाबिन'],
    'Cotton': ['cotton', 'kapas', 'kapaas', 'rui', 'कपास', 'रुई', 'कापूस', 'kapus'],
    'Tur Dal': ['tur', 'tuvar', 'tur dal', 'arhar', 'तूर', 'तूर डाळ', 'तूरडाळ', 'अरहर', 'तुवर', 'तुरी'],
    'Tomato': ['tomato', 'tomatoes', 'tamatar', 'टोमॅटो', 'टमाटर']
}

LOCATION_KEYWORDS = {
    'Niphad': ['niphad', 'निफाड', 'निफाडला', 'निफाडमध्ये'],
    'Lasalgaon': ['lasalgaon', 'lasalgoan', 'लासलगाव', 'लासलगावात', 'लासलगांव'],
    'Nashik': ['nashik', 'nasik', 'dindori', 'नाशिक', 'दिंडोरी'],
    'Pune': ['pune', 'poona', 'gultekdi', 'khed', 'baramati', 'पुणे', 'पुण्यात'],
    'Latur': ['latur', 'लातूर', 'लातूरमध्ये'],
    'Akola': ['akola', 'अकोला', 'अकोल्यात'],
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

def detect_language(text: str, fallback_lang: str = "mr") -> str:
    """Intelligently detects whether input is Marathi, Hindi, or English based on grammatical markers."""
    t = text.lower()
    
    # Grammatical & dialectal markers (exclude shared geographical location names)
    marathi_markers = [
        'आहे', 'नाहीत', 'नाही', 'कांदा', 'कांदे', 'माझ्याकडे', 'पाहिजे', 'कापूस', 'मिळेल',
        'विका', 'थांबा', 'होय', 'सल्ला', 'पुण्यात', 'निफाडला', 'लासलगावात', 'विकायचे',
        'majhyakade', 'mazyakade', 'ahe', 'kanda', 'kapus', 'bhav kay', 'kay rate',
        'vikaycha'
    ]
    hindi_markers = [
        'है', 'हूँ', 'हैं', 'प्याज', 'कपास', 'मेरे', 'पास', 'कितना', 'मिलेगा', 'बेचूं',
        'बेचना', 'बेचे', 'दाम', 'अरहर', 'सलाह', 'चाहिए', 'रुपये', 'भाव क्या', 'क्या भाव',
        'mere paas', 'mera pass', 'kya bhav', 'bhav kya', 'bechna', 'pyaz', 'daam', 'milega',
        'kitna', 'kya rate'
    ]
    
    # Score each language
    score_mr = sum(1 for m in marathi_markers if m in t)
    score_hi = sum(1 for m in hindi_markers if m in t)
    
    if score_mr > score_hi:
        return 'mr'
    elif score_hi > score_mr:
        return 'hi'
        
    if fallback_lang in ('mr', 'hi', 'en'):
        return fallback_lang
    return 'mr'

def _get_crop_label(crop: str, lang: str) -> str:
    """Return localized crop name."""
    labels = {
        'Onion':    {'en': 'Onion',   'hi': 'प्याज',    'mr': 'कांदा'},
        'Soybean':  {'en': 'Soybean', 'hi': 'सोयाबीन',  'mr': 'सोयाबीन'},
        'Cotton':   {'en': 'Cotton',  'hi': 'कपास',     'mr': 'कापूस'},
        'Tur Dal':  {'en': 'Tur Dal', 'hi': 'अरहर दाल', 'mr': 'तूर डाळ'},
        'Tomato':   {'en': 'Tomato',  'hi': 'टमाटर',    'mr': 'टोमॅटो'},
    }
    return labels.get(crop, {}).get(lang, crop)


def _build_confirm_reply(lang: str) -> str:
    """Lot-confirmed reply in the selected language."""
    if lang == 'hi':
        return (
            "✅ लिस्टिंग पुष्टि हो गई!\n\n"
            "आपकी उपज लॉट AgriConnect पर पंजीकृत हो गई है और अब संस्थागत खरीदारों को दिखाई दे रही है। "
            "जब कोई खरीदार ऑफर भेजेगा तो आपको तुरंत WhatsApp अलर्ट मिलेगा!"
        )
    elif lang == 'mr':
        return (
            "✅ लिस्टिंग पुष्टी झाली!\n\n"
            "तुमची उत्पादन लॉट AgriConnect वर नोंदणी झाली आहे आणि आता संस्थात्मक खरेदीदारांना दिसत आहे. "
            "खरेदीदाराकडून ऑफर आल्यावर तुम्हाला लगेच WhatsApp अलर्ट मिळेल!"
        )
    else:
        return (
            "✅ Listing Confirmed!\n\n"
            "Your produce lot has been registered and is now visible to institutional buyers on AgriConnect. "
            "You will receive an instant WhatsApp alert when an offer is dispatched!"
        )


def _build_advisory_reply(crop: str, grade: str, qty: float, loc: str,
                           best_m: dict, raw_highest: dict, rec: dict, lang: str) -> str:
    """Build the mandi advisory chat response in the selected language."""
    crop_label = _get_crop_label(crop, lang)

    if lang == 'hi':
        if rec['type'] == 'HOLD_RECOMMENDED':
            sell_hold_title = "अनुशंसा: 7-10 दिन रोकें और भंडारित करें"
            sell_hold_body = f"{crop_label} के दाम बढ़ रहे हैं। प्रमाणित वेयरहाउस में माल रोककर रखने से ₹140-220/क्विंटल अधिक मुनाफा मिल सकता है।"
        elif rec['type'] == 'SELL_NOW':
            sell_hold_title = "अनुशंसा: तुरंत सर्वोत्तम मंडी में बेचें"
            sell_hold_body = f"{crop_label} के दाम गिर रहे हैं या फसल शीघ्र खराब होने वाली है। अधिक नकद सुरक्षित करने के लिए अभी बेचें।"
        else:
            sell_hold_title = "बाजार स्थिर: नजदीकी सर्वोत्तम मंडी में बेचें"
            sell_hold_body = f"{crop_label} का बाजार स्थिर है। परिवहन खर्च बचाकर {best_m['market']} में बेचना सर्वोत्तम है।"

        if best_m['market'] != raw_highest['market']:
            extra_profit = (best_m['net_price_per_qtl'] - raw_highest['net_price_per_qtl']) * qty
            insight_text = f"💡 निर्णय विश्लेषण: {raw_highest['market']} में थोक भाव अधिक दिख सकता है, लेकिन {raw_highest['distance_km']} किमी दूरी और भाड़े के कारण {best_m['market']} में बेचने पर आपको कुल ₹{extra_profit:,.0f} ज्यादा शुद्ध मुनाफा मिलेगा!"
        else:
            insight_text = f"💡 निर्णय विश्लेषण: {best_m['market']} मंडी आपको सबसे ज्यादा शुद्ध आय और न्यूनतम दूरी ({best_m['distance_km']} किमी) प्रदान करती है।"

        return (
            f"🌾 *AgriConnect मंडी सलाह*\n\n"
            f"• फसल: {crop_label} ({grade})\n"
            f"• मात्रा: {qty} क्विंटल\n"
            f"• खेत केंद्र: {loc}\n\n"
            f"🏆 *सर्वश्रेष्ठ मंडी:* {best_m['market']}\n"
            f"• मंडी दर: ₹{best_m['gross_modal_price']}/क्विंटल\n"
            f"• अनुमानित भाड़ा: -₹{best_m['transport_cost_per_qtl']}/क्विंटल ({best_m['distance_km']} कि.मी.)\n"
            f"• *शुद्ध प्राप्ति दर:* ₹{best_m['net_price_per_qtl']}/क्विंटल\n"
            f"• *कुल हाथ-में-नकद:* ₹{best_m['total_net_realization']:,}\n\n"
            f"📈 *{sell_hold_title}*\n"
            f"{sell_hold_body}\n\n"
            f"{insight_text}\n\n"
            f"👉 *इस लॉट को संस्थागत खरीदारों के लिए सीधे सूचीबद्ध करने हेतु 'YES' या 'हां' लिखकर भेजें।*"
        )
    elif lang == 'mr':
        if rec['type'] == 'HOLD_RECOMMENDED':
            sell_hold_title = "शिफारस: ७-१० दिवस थांबा आणि साठवून ठेवा"
            sell_hold_body = f"{crop_label}चे भाव वाढत आहेत. मान्यताप्राप्त गोदामात माल ठेवल्यास ₹१४०-२२०/क्विंटल अतिरिक्त नफा मिळू शकतो."
        elif rec['type'] == 'SELL_NOW':
            sell_hold_title = "शिफारस: त्वरित सर्वोत्तम मंडीत विका"
            sell_hold_body = f"{crop_label}चे भाव घसरत आहेत किंवा माल लवकर खराब होणारा आहे. सर्वाधिक निव्वळ नफा मिळवण्यासाठी आत्ताच विका."
        else:
            sell_hold_title = "बाजार स्थिर: सर्वोत्तम निव्वळ नफा देणाऱ्या मंडीत विका"
            sell_hold_body = f"{crop_label}चे भाव स्थिर आहेत. वाहतूक खर्च वाचवून {best_m['market']} मंडीत विकणे सर्वात फायदेशीर ठरेल."

        if best_m['market'] != raw_highest['market']:
            extra_profit = (best_m['net_price_per_qtl'] - raw_highest['net_price_per_qtl']) * qty
            insight_text = f"💡 निर्णय विश्लेषण: {raw_highest['market']} मध्ये वरवर भाव जास्त दिसतो, पण {raw_highest['distance_km']} किमी अंतर आणि वाहतूक खर्चामुळे {best_m['market']} मध्ये विकल्यास तुमच्या हातात ₹{extra_profit:,.0f} जास्त निव्वळ नफा राहील!"
        else:
            insight_text = f"💡 निर्णय विश्लेषण: {best_m['market']} मंडी तुम्हाला सर्वाधिक निव्वळ परतावा आणि अनुकूल अंतर ({best_m['distance_km']} किमी) देते."

        return (
            f"🌾 *AgriConnect मंडी सल्ला*\n\n"
            f"• पीक: {crop_label} ({grade})\n"
            f"• प्रमाण: {qty} क्विंटल\n"
            f"• शेत केंद्र: {loc}\n\n"
            f"🏆 *सर्वोत्तम मंडी:* {best_m['market']}\n"
            f"• मंडी दर: ₹{best_m['gross_modal_price']}/क्विंटल\n"
            f"• अंदाजित वाहतूक खर्च: -₹{best_m['transport_cost_per_qtl']}/क्विंटल ({best_m['distance_km']} कि.मी.)\n"
            f"• *निव्वळ प्राप्ती दर:* ₹{best_m['net_price_per_qtl']}/क्विंटल\n"
            f"• *एकूण हाती येणारी रक्कम:* ₹{best_m['total_net_realization']:,}\n\n"
            f"📈 *{sell_hold_title}*\n"
            f"{sell_hold_body}\n\n"
            f"{insight_text}\n\n"
            f"👉 *हे लॉट संस्थात्मक खरेदीदारांसाठी थेट नोंदवण्यासाठी 'YES' किंवा 'हो' लिहून पाठवा.*"
        )
    else:
        return (
            f"🌾 *AgriConnect Mandi Advisory*\n\n"
            f"• Commodity: {crop} ({grade})\n"
            f"• Quantity: {qty} Quintals\n"
            f"• Farm Center: {loc}\n\n"
            f"🏆 *Optimal Mandi:* {best_m['market']}\n"
            f"• Gross Mandi Rate: ₹{best_m['gross_modal_price']}/qtl\n"
            f"• Estimated Freight: -₹{best_m['transport_cost_per_qtl']}/qtl ({best_m['distance_km']} km)\n"
            f"• *Net Realized Rate:* ₹{best_m['net_price_per_qtl']}/qtl\n"
            f"• *Total In-Hand Cash:* ₹{best_m['total_net_realization']:,}\n\n"
            f"📈 *Action Recommendation:* {rec['headline']}\n"
            f"{rec['reasoning']}\n\n"
            f"💡 {best_m.get('decision_insight', '')}\n\n"
            f"👉 *Reply 'YES' to list this lot directly for institutional buyers.*"
        )


def parse_farmer_message(text: str, farmer_phone: str = "+91-98230-11223",
                          farmer_name: str = "Ramesh Patil", language: str = "mr") -> Dict[str, Any]:
    # Normalize Devanagari numerals (०-९ -> 0-9)
    text_normalized = text.translate(DEVANAGARI_DIGITS)
    text_clean = text_normalized.lower().strip()
    
    # Auto-detect language from command or respect fallback
    lang = detect_language(text, language)

    # 1. Check for quick affirmative reply to create lot
    if text_clean in ['yes', 'yes please', 'ho', 'haa', 'ha', 'confirm', 'list', 'register', '1',
                       'हो', 'हां', 'होय', 'हा', 'पुष्टी', 'नोंदवा', 'बेचो', 'विका']:
        return {
            'parsed_intent': 'confirm_lot_creation',
            'extracted_data': None,
            'advisory': None,
            'language': lang,
            'chat_response': _build_confirm_reply(lang)
        }

    # 2. Try Groq LLM Extraction first if GROQ_API_KEY is available
    groq_extracted = extract_via_groq(text_normalized)
    
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
    raw_highest = advisory.get('raw_highest_market', best_m)
    rec = advisory['recommendation']
    
    reply_msg = _build_advisory_reply(
        detected_crop, grade, qty, detected_loc, best_m, raw_highest, rec, lang
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
        'language': lang,
        'advisory': advisory,
        'chat_response': reply_msg
    }
