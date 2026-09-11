import json
from typing import List, Dict, Any

def find_aggregation_clusters(demand: Dict[str, Any], lots: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    target_crop = demand['crop'].lower()
    min_qty = demand['min_quantity']
    target_grade = demand.get('target_grade', 'Grade A')
    max_price = demand.get('max_price', 999999)
    
    # Filter candidate lots: matching crop, available status, price within buyer budget
    candidates = []
    for lot in lots:
        if lot['status'] == 'available' and target_crop in lot['crop'].lower():
            # Check price compatibility if expected_price provided
            if not lot.get('expected_price') or lot['expected_price'] <= max_price * 1.15: # allow 15% negotiation margin
                candidates.append(lot)
                
    if not candidates:
        return []
        
    # Group candidates by district / geographic proximity
    by_region = {}
    for c in candidates:
        region = c.get('district', 'Nashik')
        if region not in by_region:
            by_region[region] = []
        by_region[region].append(c)
        
    clusters = []
    for region, reg_lots in by_region.items():
        total_avail = sum(l['quantity_quintals'] for l in reg_lots)
        if total_avail >= min_qty:
            # We can form one or more pools
            accumulated = 0
            pooled_lots = []
            for l in reg_lots:
                pooled_lots.append(l)
                accumulated += l['quantity_quintals']
                if accumulated >= min_qty:
                    break
                    
            # Calculate collective economics
            num_farmers = len(pooled_lots)
            farmer_names = [l['farmer_name'] for l in pooled_lots]
            lot_ids = [l['id'] for l in pooled_lots]
            
            # Transport savings: individual small vehicles vs 1 pooled 10-wheeler truck
            # Saves approx ?65-95 per quintal in aggregation
            estimated_pooled_freight_savings = round(accumulated * 75)
            
            clusters.append({
                'region': region,
                'crop': demand['crop'],
                'target_demand_id': demand['id'],
                'target_quantity': min_qty,
                'total_pooled_quantity': round(accumulated, 1),
                'participating_farmers_count': num_farmers,
                'participating_farmers': farmer_names,
                'lot_ids': lot_ids,
                'lots': pooled_lots,
                'suggested_hub': f'{region} Central Aggregation Yard',
                'collective_freight_savings_inr': estimated_pooled_freight_savings,
                'status': 'ready_to_contract',
                'pitch_tag': 'FPO / Ad-Hoc Cluster'
            })
            
    return clusters
