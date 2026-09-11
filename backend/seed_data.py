import datetime
from database import SessionLocal, init_db
from models import Farmer, Lot, BuyerDemand, AggregationPool, Transaction, Grievance, MandiPrice

def seed_database():
    init_db()
    db = SessionLocal()
    
    # Check if already seeded
    if db.query(Farmer).first():
        print("Database already seeded.")
        db.close()
        return

    print("Seeding initial AgriConnect data...")

    # 1. Farmers
    farmers = [
        Farmer(name="Ramesh Patil", phone="+91-98230-11223", village="Niphad", district="Nashik", pincode="422303", lat=20.08, lng=74.11),
        Farmer(name="Tukaram Shinde", phone="+91-94222-33445", village="Lasalgaon", district="Nashik", pincode="422306", lat=20.14, lng=74.22),
        Farmer(name="Baburao Jadhav", phone="+91-98601-55667", village="Dindori", district="Nashik", pincode="422202", lat=20.01, lng=73.80),
        Farmer(name="Dnyaneshwar Pawar", phone="+91-97640-77889", village="Ausa", district="Latur", pincode="413520", lat=18.42, lng=76.54),
        Farmer(name="Santosh Deshmukh", phone="+91-95521-99001", village="Murtizapur", district="Akola", pincode="444107", lat=20.68, lng=76.99),
        Farmer(name="Vilas Gawande", phone="+91-98902-12345", village="Umred", district="Nagpur", pincode="441203", lat=21.12, lng=79.06),
        Farmer(name="Suresh More", phone="+91-94211-45678", village="Pimpalgaon", district="Nashik", pincode="422209", lat=20.17, lng=73.98)
    ]
    db.add_all(farmers)
    db.commit()

    # 2. Lots
    lots = [
        Lot(
            farmer_id=1, farmer_name="Ramesh Patil", phone="+91-98230-11223",
            village="Niphad", district="Nashik", crop="Onion", variety="Garwa / Red",
            quantity_quintals=15.0, grade="Grade A", expected_price=2800.0, status="available"
        ),
        Lot(
            farmer_id=2, farmer_name="Tukaram Shinde", phone="+91-94222-33445",
            village="Lasalgaon", district="Nashik", crop="Onion", variety="Garwa / Red",
            quantity_quintals=20.0, grade="Grade A", expected_price=2750.0, status="available"
        ),
        Lot(
            farmer_id=3, farmer_name="Baburao Jadhav", phone="+91-98601-55667",
            village="Dindori", district="Nashik", crop="Onion", variety="Garwa / Red",
            quantity_quintals=15.0, grade="Grade A", expected_price=2820.0, status="available"
        ),
        Lot(
            farmer_id=4, farmer_name="Dnyaneshwar Pawar", phone="+91-97640-77889",
            village="Ausa", district="Latur", crop="Soybean", variety="JS-335 Yellow",
            quantity_quintals=40.0, grade="Grade A", expected_price=4900.0, status="available"
        ),
        Lot(
            farmer_id=5, farmer_name="Santosh Deshmukh", phone="+91-95521-99001",
            village="Murtizapur", district="Akola", crop="Cotton", variety="Bt Cotton (Long Staple)",
            quantity_quintals=25.0, grade="Grade A", expected_price=7400.0, status="available"
        ),
        Lot(
            farmer_id=7, farmer_name="Suresh More", phone="+91-94211-45678",
            village="Pimpalgaon", district="Nashik", crop="Tomato", variety="Vaishnavi Hybrid",
            quantity_quintals=30.0, grade="Grade A", expected_price=1900.0, status="available"
        )
    ]
    db.add_all(lots)
    db.commit()

    # 3. Buyer Demands
    demands = [
        BuyerDemand(
            buyer_name="Anand Kulkarni",
            organization="Sahyadri Agro Processors Pvt Ltd",
            contact="+91-98224-88990",
            crop="Onion",
            min_quantity=50.0,
            target_grade="Grade A",
            max_price=2850.0,
            delivery_location="Nashik Food Processing Park",
            status="active"
        ),
        BuyerDemand(
            buyer_name="Vikram Joshi",
            organization="Marathwada Solvex Oil Mills",
            contact="+91-94227-11223",
            crop="Soybean",
            min_quantity=75.0,
            target_grade="Grade A",
            max_price=4950.0,
            delivery_location="Latur MIDC Agro Complex",
            status="active"
        ),
        BuyerDemand(
            buyer_name="Prashant Deshpande",
            organization="Vidarbha Spinning Mills Ltd",
            contact="+91-98901-44556",
            crop="Cotton",
            min_quantity=50.0,
            target_grade="Grade A",
            max_price=7450.0,
            delivery_location="Nagpur Textile Cluster",
            status="active"
        )
    ]
    db.add_all(demands)
    db.commit()

    # 4. Sample Completed/Ongoing Transaction for demo
    tx1 = Transaction(
        lot_id=4,
        buyer_name="Marathwada Solvex Oil Mills",
        farmer_name="Dnyaneshwar Pawar",
        crop="Soybean",
        quantity_quintals=40.0,
        offered_price=4920.0,
        total_amount=196800.0,
        status="pickup_scheduled"
    )
    db.add(tx1)
    db.commit()

    # 5. Sample Grievance for Dispute Resolution tab
    gr1 = Grievance(
        transaction_id=tx1.id,
        raised_by="Farmer",
        issue_type="Logistics Delay",
        details="Truck pickup scheduled for 10:00 AM delayed by 4 hours. Produce ready at farm gate.",
        status="investigating"
    )
    db.add(gr1)
    db.commit()

    print("Database seeding completed successfully.")
    db.close()

if __name__ == "__main__":
    seed_database()
