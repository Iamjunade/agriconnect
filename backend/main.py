import json
import datetime
from typing import Optional, List
from fastapi import FastAPI, Depends, HTTPException, Query, Request, Form
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db, init_db
from models import Farmer, Lot, BuyerDemand, AggregationPool, Transaction, Grievance
from price_engine import compute_price_advisory, CROP_MARKET_DATA, MARKET_LOCATIONS, STORAGE_FACILITIES
from aggregation_engine import find_aggregation_clusters
from nlp_intake import parse_farmer_message
from seed_data import seed_database

# Initialize DB and seed
init_db()
seed_database()

app = FastAPI(
    title="AgriConnect API (SIH26132)",
    description="Market Linkages, Price Discovery & Transaction Engine for Farmers",
    version="1.0.0"
)

# Enable CORS for frontend development and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Schemas
class FarmerChatRequest(BaseModel):
    message: str
    phone: Optional[str] = "+91-98230-11223"
    name: Optional[str] = "Ramesh Patil"
    language: Optional[str] = "mr" # "mr" (Marathi), "hi" (Hindi), "en" (English)

class CreateLotRequest(BaseModel):
    farmer_name: str
    phone: str
    village: str
    district: str
    crop: str
    variety: Optional[str] = "Standard"
    quantity_quintals: float
    grade: Optional[str] = "Grade A"
    expected_price: Optional[float] = None

class CreateDemandRequest(BaseModel):
    buyer_name: str
    organization: str
    contact: str
    crop: str
    min_quantity: float
    target_grade: Optional[str] = "Grade A"
    max_price: float
    delivery_location: str

class CreateOfferRequest(BaseModel):
    buyer_name: str
    lot_id: Optional[int] = None
    pool_id: Optional[int] = None
    farmer_name: str
    crop: str
    quantity_quintals: float
    offered_price: float

class StatusUpdateRequest(BaseModel):
    status: str

class CreateGrievanceRequest(BaseModel):
    transaction_id: int
    raised_by: str
    issue_type: str
    details: str

# API Routes
@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "AgriConnect Backend", "timestamp": datetime.datetime.utcnow()}

@app.get("/api/stats")
def get_stats(db: Session = Depends(get_db)):
    total_lots = db.query(Lot).count()
    active_demands = db.query(BuyerDemand).filter(BuyerDemand.status == "active").count()
    total_transactions = db.query(Transaction).count()
    open_grievances = db.query(Grievance).filter(Grievance.status != "resolved").count()
    
    total_volume_available = sum(l.quantity_quintals for l in db.query(Lot).filter(Lot.status == "available").all())
    
    return {
        "total_lots": total_lots,
        "active_demands": active_demands,
        "total_transactions": total_transactions,
        "open_grievances": open_grievances,
        "total_volume_available_qtl": round(total_volume_available, 1)
    }

@app.get("/api/prices/advisory")
def get_price_advisory(
    crop: str = "Onion",
    quantity: float = 20.0,
    location: str = "Niphad, Nashik",
    grade: str = "Grade A"
):
    return compute_price_advisory(crop, quantity, location, grade)

@app.get("/api/prices/mandi-overview")
def get_mandi_overview():
    summary = []
    for crop_name, markets in CROP_MARKET_DATA.items():
        for m_name, data in markets.items():
            loc = MARKET_LOCATIONS.get(m_name, {})
            trend = data["trend"]
            pct = round(((trend[-1] - trend[0]) / trend[0]) * 100, 1)
            summary.append({
                "crop": crop_name,
                "market": m_name,
                "district": loc.get("district", "Maharashtra"),
                "modal_price": data["base_modal"],
                "min_price": data["min"],
                "max_price": data["max"],
                "trend_7d_pct": pct,
                "trend_series": trend
            })
    return {"mandis": summary, "storage_facilities": STORAGE_FACILITIES}

@app.post("/api/farmer/chat")
def handle_farmer_chat(req: FarmerChatRequest, db: Session = Depends(get_db)):
    result = parse_farmer_message(req.message, req.phone, req.name, req.language)
    
    # Check if there are active offers for this farmer
    active_offers = db.query(Transaction).filter(
        Transaction.farmer_name == req.name,
        Transaction.status.in_(["offer_sent", "pickup_scheduled", "in_transit"])
    ).all()
    
    offers_payload = []
    for o in active_offers:
        offers_payload.append({
            "transaction_id": o.id,
            "buyer_name": o.buyer_name,
            "crop": o.crop,
            "quantity": o.quantity_quintals,
            "offered_price": o.offered_price,
            "total_amount": o.total_amount,
            "status": o.status
        })
        
    return {
        **result,
        "pending_offers": offers_payload
    }

@app.get("/api/lots")
def get_lots(status: Optional[str] = None, crop: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(Lot)
    if status:
        q = q.filter(Lot.status == status)
    if crop:
        q = q.filter(Lot.crop.ilike(f"%{crop}%"))
    lots = q.order_by(Lot.created_at.desc()).all()
    return lots

@app.post("/api/lots")
def create_lot(req: CreateLotRequest, db: Session = Depends(get_db)):
    new_lot = Lot(
        farmer_name=req.farmer_name,
        phone=req.phone,
        village=req.village,
        district=req.district,
        crop=req.crop,
        variety=req.variety or "Standard",
        quantity_quintals=req.quantity_quintals,
        grade=req.grade or "Grade A",
        expected_price=req.expected_price,
        status="available"
    )
    db.add(new_lot)
    db.commit()
    db.refresh(new_lot)
    return {"message": "Lot listed successfully", "lot": new_lot}

@app.get("/api/demands")
def get_demands(db: Session = Depends(get_db)):
    demands = db.query(BuyerDemand).order_by(BuyerDemand.created_at.desc()).all()
    return demands

@app.post("/api/demands")
def create_demand(req: CreateDemandRequest, db: Session = Depends(get_db)):
    new_demand = BuyerDemand(
        buyer_name=req.buyer_name,
        organization=req.organization,
        contact=req.contact,
        crop=req.crop,
        min_quantity=req.min_quantity,
        target_grade=req.target_grade or "Grade A",
        max_price=req.max_price,
        delivery_location=req.delivery_location,
        status="active"
    )
    db.add(new_demand)
    db.commit()
    db.refresh(new_demand)
    return {"message": "Buyer demand registered", "demand": new_demand}

@app.get("/api/demands/{demand_id}/clusters")
def get_demand_clusters(demand_id: int, db: Session = Depends(get_db)):
    demand = db.query(BuyerDemand).filter(BuyerDemand.id == demand_id).first()
    if not demand:
        raise HTTPException(status_code=404, detail="Demand not found")
        
    lots = db.query(Lot).all()
    lots_dicts = [
        {
            "id": l.id,
            "farmer_name": l.farmer_name,
            "phone": l.phone,
            "village": l.village,
            "district": l.district,
            "crop": l.crop,
            "variety": l.variety,
            "quantity_quintals": l.quantity_quintals,
            "grade": l.grade,
            "expected_price": l.expected_price,
            "status": l.status
        } for l in lots
    ]
    
    clusters = find_aggregation_clusters(
        {"id": demand.id, "crop": demand.crop, "min_quantity": demand.min_quantity, "target_grade": demand.target_grade, "max_price": demand.max_price},
        lots_dicts
    )
    return {"demand": demand, "clusters": clusters}

@app.post("/api/offers")
def create_offer(req: CreateOfferRequest, db: Session = Depends(get_db)):
    total_val = round(req.quantity_quintals * req.offered_price)
    
    tx = Transaction(
        lot_id=req.lot_id,
        pool_id=req.pool_id,
        buyer_name=req.buyer_name,
        farmer_name=req.farmer_name,
        crop=req.crop,
        quantity_quintals=req.quantity_quintals,
        offered_price=req.offered_price,
        total_amount=total_val,
        status="offer_sent"
    )
    db.add(tx)
    
    # Update lot status if single lot
    if req.lot_id:
        lot = db.query(Lot).filter(Lot.id == req.lot_id).first()
        if lot:
            lot.status = "under_offer"
            
    db.commit()
    db.refresh(tx)
    return {"message": "Offer dispatched to farmer via WhatsApp", "transaction": tx}

@app.get("/api/transactions")
def get_transactions(db: Session = Depends(get_db)):
    txs = db.query(Transaction).order_by(Transaction.created_at.desc()).all()
    return txs

@app.patch("/api/transactions/{tx_id}/status")
def update_transaction_status(tx_id: int, req: StatusUpdateRequest, db: Session = Depends(get_db)):
    tx = db.query(Transaction).filter(Transaction.id == tx_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    tx.status = req.status
    
    # If accepted or settled, update associated lot
    if tx.lot_id:
        lot = db.query(Lot).filter(Lot.id == tx.lot_id).first()
        if lot:
            if req.status == "offer_accepted":
                lot.status = "under_offer"
            elif req.status == "settled":
                lot.status = "sold"
            elif req.status == "rejected":
                lot.status = "available"
                
    db.commit()
    db.refresh(tx)
    return {"message": f"Transaction moved to {req.status}", "transaction": tx}

@app.get("/api/grievances")
def get_grievances(db: Session = Depends(get_db)):
    return db.query(Grievance).order_by(Grievance.created_at.desc()).all()

@app.post("/api/grievances")
def create_grievance(req: CreateGrievanceRequest, db: Session = Depends(get_db)):
    tx = db.query(Transaction).filter(Transaction.id == req.transaction_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    gr = Grievance(
        transaction_id=req.transaction_id,
        raised_by=req.raised_by,
        issue_type=req.issue_type,
        details=req.details,
        status="open"
    )
    tx.status = "disputed"
    db.add(gr)
    db.commit()
    db.refresh(gr)
    return {"message": "Grievance logged. Transaction flagged for review.", "grievance": gr}

@app.post("/api/reset")
def reset_system():
    # Helper to re-seed demo data on demand
    init_db()
    seed_database()
    return {"message": "AgriConnect demo state re-seeded successfully"}

@app.post("/api/whatsapp-webhook")
async def whatsapp_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Twilio WhatsApp Sandbox Webhook according to PRD spec.
    Accepts incoming messages from real phones, triggers NLP + Price Engine,
    and returns valid TwiML MessagingResponse.
    """
    try:
        form_data = await request.form()
        incoming_msg = form_data.get('Body', '').strip()
        from_phone = form_data.get('From', '').replace('whatsapp:', '').strip()
        sender_profile = form_data.get('ProfileName', 'Farmer')
    except Exception:
        incoming_msg = ""
        from_phone = "+91-98230-11223"
        sender_profile = "Ramesh Patil"

    if not incoming_msg:
        try:
            body = await request.json()
            incoming_msg = body.get('message', '')
            from_phone = body.get('phone', '+91-98230-11223')
            sender_profile = body.get('name', 'Farmer')
        except Exception:
            pass

    # Process message through NLP and advisory engine
    nlp_result = parse_farmer_message(incoming_msg, from_phone, sender_profile)
    reply_text = nlp_result.get('chat_response', 'Welcome to AgriConnect!')

    # If farmer replied affirmatively, auto-list the pending lot if extracted
    extracted = nlp_result.get('extracted_data')
    if nlp_result.get('parsed_intent') == 'confirm_lot_creation':
        # Find or create a default available lot
        new_lot = Lot(
            farmer_name=sender_profile,
            phone=from_phone,
            village="Niphad",
            district="Nashik",
            crop="Onion",
            variety="Garwa",
            quantity_quintals=20.0,
            grade="Grade A",
            expected_price=2800.0,
            status="available"
        )
        db.add(new_lot)
        db.commit()

    # Format as TwiML XML if from Twilio
    twiml_response = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>{reply_text}</Message>
</Response>"""

    return Response(content=twiml_response, media_type="application/xml")

