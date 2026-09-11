import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class Farmer(Base):
    __tablename__ = 'farmers'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False, unique=True)
    village = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False)
    pincode = Column(String(10), nullable=False)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)

class Lot(Base):
    __tablename__ = 'lots'
    
    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey('farmers.id'), nullable=True)
    farmer_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    village = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False)
    crop = Column(String(50), nullable=False)
    variety = Column(String(50), default='Standard')
    quantity_quintals = Column(Float, nullable=False)
    grade = Column(String(20), default='Grade A')
    expected_price = Column(Float, nullable=True)
    status = Column(String(30), default='available') # available, pooled, under_offer, sold
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class BuyerDemand(Base):
    __tablename__ = 'buyer_demands'
    
    id = Column(Integer, primary_key=True, index=True)
    buyer_name = Column(String(100), nullable=False)
    organization = Column(String(150), nullable=False)
    contact = Column(String(50), nullable=False)
    crop = Column(String(50), nullable=False)
    min_quantity = Column(Float, nullable=False)
    target_grade = Column(String(20), default='Grade A')
    max_price = Column(Float, nullable=False)
    delivery_location = Column(String(100), nullable=False)
    status = Column(String(30), default='active')
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class AggregationPool(Base):
    __tablename__ = 'aggregation_pools'
    
    id = Column(Integer, primary_key=True, index=True)
    demand_id = Column(Integer, ForeignKey('buyer_demands.id'), nullable=True)
    crop = Column(String(50), nullable=False)
    target_quantity = Column(Float, nullable=False)
    total_pooled_quantity = Column(Float, nullable=False)
    lot_ids_json = Column(Text, nullable=False) # JSON list of lot IDs
    status = Column(String(30), default='forming') # forming, matched, offered, completed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Transaction(Base):
    __tablename__ = 'transactions'
    
    id = Column(Integer, primary_key=True, index=True)
    lot_id = Column(Integer, ForeignKey('lots.id'), nullable=True)
    pool_id = Column(Integer, ForeignKey('aggregation_pools.id'), nullable=True)
    buyer_name = Column(String(100), nullable=False)
    farmer_name = Column(String(100), nullable=False)
    crop = Column(String(50), nullable=False)
    quantity_quintals = Column(Float, nullable=False)
    offered_price = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False)
    # Lifecycle status:
    # offer_sent -> offer_accepted -> pickup_scheduled -> in_transit -> payment_initiated -> settled (or disputed)
    status = Column(String(40), default='offer_sent')
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class Grievance(Base):
    __tablename__ = 'grievances'
    
    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey('transactions.id'), nullable=False)
    raised_by = Column(String(50), nullable=False) # Farmer / Buyer
    issue_type = Column(String(100), nullable=False) # Quality Mismatch, Delayed Payment, Logistics Issue
    details = Column(Text, nullable=False)
    status = Column(String(30), default='open') # open, investigating, resolved
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class MandiPrice(Base):
    __tablename__ = 'mandi_prices'
    
    id = Column(Integer, primary_key=True, index=True)
    market = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False)
    crop = Column(String(50), nullable=False)
    variety = Column(String(50), default='Regular')
    grade = Column(String(20), default='FAQ')
    modal_price = Column(Float, nullable=False)
    min_price = Column(Float, nullable=False)
    max_price = Column(Float, nullable=False)
    arrival_date = Column(String(20), nullable=False)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
