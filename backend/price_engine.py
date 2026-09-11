import math
from datetime import datetime, timedelta
from typing import Dict, List, Any

MARKET_LOCATIONS = {
    'Lasalgaon': {'lat': 20.1478, 'lng': 74.2267, 'district': 'Nashik'},
    'Nashik (Dindori)': {'lat': 20.0059, 'lng': 73.7898, 'district': 'Nashik'},
    'Pimpalgaon': {'lat': 20.1706, 'lng': 73.9877, 'district': 'Nashik'},
    'Pune (Gultekdi)': {'lat': 18.5204, 'lng': 73.8567, 'district': 'Pune'},
    'Latur': {'lat': 18.4088, 'lng': 76.5604, 'district': 'Latur'},
    'Akola': {'lat': 20.7002, 'lng': 77.0082, 'district': 'Akola'},
    'Nagpur (Kalamna)': {'lat': 21.1458, 'lng': 79.0882, 'district': 'Nagpur'},
    'Jalgaon': {'lat': 21.0077, 'lng': 75.5626, 'district': 'Jalgaon'},
}

CROP_MARKET_DATA = {
    'Onion': {
        'Lasalgaon': {'base_modal': 2750, 'min': 2300, 'max': 3100, 'trend': [2500, 2520, 2560, 2600, 2640, 2680, 2710, 2750]},
        'Nashik (Dindori)': {'base_modal': 2680, 'min': 2250, 'max': 3000, 'trend': [2450, 2480, 2500, 2540, 2590, 2620, 2650, 2680]},
        'Pimpalgaon': {'base_modal': 2820, 'min': 2400, 'max': 3250, 'trend': [2550, 2580, 2620, 2680, 2720, 2760, 2800, 2820]},
        'Pune (Gultekdi)': {'base_modal': 2950, 'min': 2500, 'max': 3400, 'trend': [2700, 2720, 2780, 2820, 2860, 2900, 2920, 2950]}
    },
    'Soybean': {
        'Latur': {'base_modal': 4850, 'min': 4500, 'max': 5100, 'trend': [5050, 5000, 4980, 4950, 4920, 4890, 4870, 4850]},
        'Akola': {'base_modal': 4780, 'min': 4450, 'max': 5020, 'trend': [4980, 4940, 4910, 4880, 4840, 4820, 4800, 4780]},
        'Nagpur (Kalamna)': {'base_modal': 4900, 'min': 4600, 'max': 5150, 'trend': [5100, 5060, 5020, 4990, 4960, 4940, 4920, 4900]}
    },
    'Cotton': {
        'Nagpur (Kalamna)': {'base_modal': 7400, 'min': 6900, 'max': 7800, 'trend': [7100, 7150, 7200, 7260, 7300, 7350, 7380, 7400]},
        'Jalgaon': {'base_modal': 7250, 'min': 6800, 'max': 7650, 'trend': [7000, 7040, 7080, 7120, 7180, 7200, 7230, 7250]},
        'Akola': {'base_modal': 7320, 'min': 6850, 'max': 7700, 'trend': [7050, 7090, 7140, 7190, 7240, 7270, 7300, 7320]}
    },
    'Tur Dal': {
        'Latur': {'base_modal': 10400, 'min': 9800, 'max': 11100, 'trend': [10100, 10150, 10200, 10250, 10300, 10350, 10380, 10400]},
        'Akola': {'base_modal': 10250, 'min': 9700, 'max': 10900, 'trend': [9950, 10000, 10050, 10100, 10150, 10200, 10220, 10250]}
    },
    'Tomato': {
        'Nashik (Dindori)': {'base_modal': 1850, 'min': 1400, 'max': 2300, 'trend': [2300, 2200, 2120, 2050, 1980, 1920, 1880, 1850]},
        'Pimpalgaon': {'base_modal': 1900, 'min': 1450, 'max': 2350, 'trend': [2350, 2240, 2180, 2100, 2020, 1960, 1920, 1900]},
        'Pune (Gultekdi)': {'base_modal': 2100, 'min': 1600, 'max': 2500, 'trend': [2500, 2420, 2350, 2280, 2220, 2180, 2140, 2100]}
    }
}

STORAGE_FACILITIES = [
    {'name': 'Niphad Agro Cold Chain & Scientific Warehouse', 'location': 'Niphad, Nashik', 'capacity': '2,500 MT', 'contact': '+91-98220-41001', 'rate_per_month_qtl': 45},
    {'name': 'Lasalgaon APMC Modern Scientific Storage', 'location': 'Lasalgaon', 'capacity': '5,000 MT', 'contact': '+91-94231-89022', 'rate_per_month_qtl': 40},
    {'name': 'MahaAgro Logistics & Hub', 'location': 'Gultekdi, Pune', 'capacity': '8,000 MT', 'contact': '+91-98900-12345', 'rate_per_month_qtl': 55},
    {'name': 'Marathwada Farmers Warehouse', 'location': 'MIDC, Latur', 'capacity': '3,200 MT', 'contact': '+91-97654-32109', 'rate_per_month_qtl': 42}
]

def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 1)

def get_farmer_default_coords(location_name: str) -> tuple:
    loc = location_name.lower()
    if 'niphad' in loc or 'lasalgaon' in loc:
        return (20.0800, 74.1100)
    elif 'nashik' in loc or 'dindori' in loc:
        return (20.0100, 73.8000)
    elif 'pune' in loc or 'khed' in loc or 'baramati' in loc:
        return (18.6000, 73.9000)
    elif 'latur' in loc:
        return (18.4200, 76.5400)
    elif 'akola' in loc:
        return (20.6800, 76.9900)
    elif 'nagpur' in loc:
        return (21.1200, 79.0600)
    elif 'jalgaon' in loc:
        return (21.0200, 75.5400)
    else:
        return (20.0500, 73.9000)

def compute_price_advisory(crop: str, quantity: float, location_name: str, grade: str = 'Grade A') -> Dict[str, Any]:
    matched_crop = None
    for c in CROP_MARKET_DATA.keys():
        if c.lower() in crop.lower():
            matched_crop = c
            break
    if not matched_crop:
        matched_crop = 'Onion'
        
    farmer_lat, farmer_lng = get_farmer_default_coords(location_name)
    crop_markets = CROP_MARKET_DATA[matched_crop]
    grade_multiplier = 1.05 if 'A' in grade else (1.0 if 'B' in grade or 'FAQ' in grade else 0.92)
    
    results = []
    freight_rate_per_km_qtl = 2.40
    
    for market_name, m_info in crop_markets.items():
        m_coords = MARKET_LOCATIONS.get(market_name, {'lat': 20.0, 'lng': 74.0, 'district': 'Unknown'})
        dist_km = haversine_distance(farmer_lat, farmer_lng, m_coords['lat'], m_coords['lng'])
        if dist_km < 5:
            dist_km = 8.0
            
        gross_modal = round(m_info['base_modal'] * grade_multiplier)
        transport_cost_per_qtl = round(dist_km * freight_rate_per_km_qtl)
        net_price_per_qtl = gross_modal - transport_cost_per_qtl
        total_net_realization = round(net_price_per_qtl * quantity)
        
        trend_series = m_info['trend']
        first_price = trend_series[0]
        latest_price = trend_series[-1]
        pct_change = round(((latest_price - first_price) / first_price) * 100, 1)
        
        results.append({
            'market': market_name,
            'district': m_coords['district'],
            'distance_km': dist_km,
            'gross_modal_price': gross_modal,
            'min_price': round(m_info['min'] * grade_multiplier),
            'max_price': round(m_info['max'] * grade_multiplier),
            'transport_cost_per_qtl': transport_cost_per_qtl,
            'net_price_per_qtl': net_price_per_qtl,
            'total_net_realization': total_net_realization,
            'pct_change_7d': pct_change,
            'trend_series': trend_series
        })
        
    results.sort(key=lambda x: x['net_price_per_qtl'], reverse=True)
    best_market = results[0]
    raw_highest_market = max(results, key=lambda x: x['gross_modal_price'])
    
    avg_change = sum(r['pct_change_7d'] for r in results) / len(results)
    
    if matched_crop == 'Tomato':
        recommendation_type = 'SELL_NOW'
        headline = 'Sell immediately at nearest Mandi'
        reasoning = f'Tomato is highly perishable and regional prices fell by {abs(round(avg_change,1))}% over 7 days due to harvest supply spikes. Storing poses high decay risk.'
    elif avg_change >= 2.5:
        recommendation_type = 'HOLD_RECOMMENDED'
        headline = 'Recommended: Hold & Store for 7-10 days'
        reasoning = f'{matched_crop} prices are rising (+{round(avg_change,1)}% 7-day trend). Holding produce in verified storage can yield an extra INR 140-220/quintal.'
    elif avg_change <= -2.5:
        recommendation_type = 'SELL_NOW'
        headline = 'Recommended: Sell Now at Best Net Mandi'
        reasoning = f'{matched_crop} prices are softening (-{abs(round(avg_change,1))}% 7-day trend). Liquidate now to lock in maximum realization.'
    else:
        recommendation_type = 'NEUTRAL'
        headline = 'Market Stable: Sell at Optimal Net Mandi'
        reasoning = f'{matched_crop} prices are balanced. Focus on reducing transport overhead by choosing {best_market["market"]}.'

    if best_market['market'] != raw_highest_market['market']:
        extra_profit = (best_market['net_price_per_qtl'] - raw_highest_market['net_price_per_qtl']) * quantity
        decision_insight = f'Decision Intelligence: {raw_highest_market["market"]} shows higher headline price (INR {raw_highest_market["gross_modal_price"]}/qtl), but due to {raw_highest_market["distance_km"]}km distance, selling at {best_market["market"]} yields you INR {extra_profit:,.0f} MORE net profit in your pocket!'
    else:
        decision_insight = f'Best Choice: {best_market["market"]} gives you the highest net return and optimal travel distance ({best_market["distance_km"]} km).'

    return {
        'crop': matched_crop,
        'quantity': quantity,
        'grade': grade,
        'farmer_location': location_name,
        'best_market': best_market,
        'raw_highest_market': raw_highest_market,
        'decision_insight': decision_insight,
        'recommendation': {
            'type': recommendation_type,
            'headline': headline,
            'reasoning': reasoning,
            'nearby_storage': STORAGE_FACILITIES[:2]
        },
        'all_markets': results
    }
