import sys
import requests
import json
import time

# Ensure Windows terminal handles UTF-8 cleanly
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:8000/api"

def run_tests():
    print("=" * 60)
    print("AgriConnect Automated End-to-End System Verification")
    print("=" * 60)

    # 1. Health check
    try:
        r = requests.get(f"{BASE_URL}/health", timeout=3)
        assert r.status_code == 200, f"Health check failed: {r.status_code}"
        print("[PASS] Health check OK:", r.json())
    except Exception as e:
        print("[FAIL] Backend server not reachable at", BASE_URL, ":", e)
        return False

    # 2. Stats
    r = requests.get(f"{BASE_URL}/stats")
    assert r.status_code == 200
    stats = r.json()
    print(f"[PASS] System Stats: {stats['total_lots']} lots, {stats['active_demands']} demands, {stats['total_transactions']} transactions")

    # 3. Price Advisory Engine
    r = requests.get(f"{BASE_URL}/prices/advisory?crop=Onion&quantity=25&location=Niphad,%20Nashik&grade=Grade%20A")
    assert r.status_code == 200
    advisory = r.json()
    best_m = advisory['best_market']
    gross_m = advisory['raw_highest_market']
    print(f"[PASS] Price Advisory: Best Net Mandi = {best_m['market']} (Rs {best_m['net_price_per_qtl']}/qtl net)")
    print(f"       Gross Highest Mandi = {gross_m['market']} (Rs {gross_m['gross_modal_price']}/qtl raw)")
    print(f"       Insight: {advisory['decision_insight'][:90]}...")
    print(f"       Recommendation: {advisory['recommendation']['headline']}")

    # 4. Multilingual NLP Intake
    chat_payload = {
        "message": "I have 20 quintals of Onion in Niphad Nashik Grade A",
        "phone": "+91-98230-11223",
        "name": "Ramesh Patil"
    }
    r = requests.post(f"{BASE_URL}/farmer/chat", json=chat_payload)
    assert r.status_code == 200
    chat_res = r.json()
    assert chat_res['extracted_data']['crop'] == "Onion"
    assert chat_res['extracted_data']['quantity_quintals'] == 20.0
    print("[PASS] NLP Parser extracted:", chat_res['extracted_data'])

    # 5. Dynamic Aggregation Engine
    demands = requests.get(f"{BASE_URL}/demands").json()
    assert len(demands) > 0
    demand_id = demands[0]['id']
    r = requests.get(f"{BASE_URL}/demands/{demand_id}/clusters")
    assert r.status_code == 200
    cluster_res = r.json()
    clusters = cluster_res.get('clusters', [])
    print(f"[PASS] Dynamic Aggregation for Demand #{demand_id} ({demands[0]['crop']}): {len(clusters)} cluster(s) found")
    if clusters:
        c = clusters[0]
        print(f"       Cluster pooled {c['total_pooled_quantity']} Qtl from {c['participating_farmers_count']} farmers! Savings: Rs {c['collective_freight_savings_inr']}")

    # 6. Offer Creation & WhatsApp Notification Loop
    lots = requests.get(f"{BASE_URL}/lots?status=available").json()
    assert len(lots) > 0
    target_lot = lots[0]
    offer_payload = {
        "buyer_name": "Sahyadri Agro Processors Ltd",
        "lot_id": target_lot['id'],
        "farmer_name": target_lot['farmer_name'],
        "crop": target_lot['crop'],
        "quantity_quintals": target_lot['quantity_quintals'],
        "offered_price": 2850.0
    }
    r = requests.post(f"{BASE_URL}/offers", json=offer_payload)
    assert r.status_code == 200
    new_tx = r.json()['transaction']
    print(f"[PASS] Digital Offer Created: TX-#{new_tx['id']} for Lot #{target_lot['id']} at Rs {new_tx['offered_price']}/qtl")

    # 7. Farmer Acceptance & Lifecycle Progress
    r = requests.patch(f"{BASE_URL}/transactions/{new_tx['id']}/status", json={"status": "offer_accepted"})
    assert r.status_code == 200
    print(f"[PASS] Farmer Accepted Offer! Transaction moved to: {r.json()['transaction']['status']}")

    # 8. Grievance Logging
    gr_payload = {
        "transaction_id": new_tx['id'],
        "raised_by": "Buyer",
        "issue_type": "Logistics Route Optimization",
        "details": "Requested pickup rescheduled to 11 AM due to highway rain advisory."
    }
    r = requests.post(f"{BASE_URL}/grievances", json=gr_payload)
    assert r.status_code == 200
    print(f"[PASS] Grievance Registered: Case #{r.json()['grievance']['id']} (Status: {r.json()['grievance']['status']})")

    print("=" * 60)
    print("ALL 8 VERIFICATION GATES PASSED SUCCESSFULLY!")
    print("=" * 60)
    return True

if __name__ == "__main__":
    run_tests()
