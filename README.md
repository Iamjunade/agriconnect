# 🌾 AgriConnect (SIH26132)
**Strengthening Market Linkages & Price Discovery for Farmers**  
*Problem Statement Issued by: Government of Maharashtra | Theme: Agriculture, FoodTech & Rural Development*

---

## 🚀 Quick Start (1-Click Run)

To run the complete prototype on your machine:

1. **Double click** `start_agriconnect.bat`  
   *(This starts the FastAPI backend on port 8000 and the React/Vite frontend on port 5173, then automatically opens your browser)*

Alternatively, run manually in two terminal windows:
- **Backend**:
  ```bash
  cd backend
  python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
  ```
- **Frontend**:
  ```bash
  cd frontend
  npm run dev
  ```
- **Run Automated Test Suite**:
  ```bash
  python test_system.py
  ```

---

## 🏆 Core Features & Architectural Modules

### 1. 📱 Farmer WhatsApp & Voice Interface
- **Low-literacy Friendly**: Operates over WhatsApp text or voice note simulation without requiring an app download.
- **Multilingual NLP Intake**: Accepts input in **English, Hindi, and Marathi**.
- Extracts `crop`, `quantity`, `quality grade`, and `location` using structured slot-filling.
- Instantly returns the **Optimal Net Mandi**, **Cash-in-hand value**, and **Sell-Now vs Hold** advisory.
- Allows one-tap lot creation and direct digital offer acceptance.

### 2. 📊 Price Advisory Engine (Decision Layer vs Data Layer)
- **Net Price Formula**:
  $$\text{Net Realization} = \text{Mandi Modal Price} - (\text{Distance in km} \times \text{Freight Cost/km/quintal})$$
- Demonstrates how a distant Mandi with higher headline price yields *less* net profit than a closer APMC.
- **Sell Now vs Hold/Store Recommendation**: Uses 7-14 day moving average trends to guide farmers away from distress selling.
- Pre-seeded with authentic Maharashtra APMC data: **Lasalgaon, Nashik, Pimpalgaon, Pune, Latur, Akola, Nagpur, Jalgaon** for key regional crops (**Onion, Soybean, Cotton, Tur Dal, Tomato**).

### 3. 🧩 Dynamic Smallholder Aggregation Engine
- Solves the **Minimum Order Quantity (MOQ)** barrier for small and marginal farmers.
- Clusters individual smallholders (e.g., 15q + 20q + 15q) to meet institutional buyer demands (e.g., 50qtl MOQ).
- Computes **collective freight savings** (e.g. ₹3,750 savings by pooling into one 10-wheeler truck) and suggests a central collection depot.

### 4. 💼 Buyer & FPO Portal
- Post institutional demands with quantity, target grade, and maximum purchase price.
- Live lot explorer across regional APMC zones.
- One-click bulk contract dispatch to all participating farmers in an aggregated cluster.

### 5. 🚚 Transaction Lifecycle & Grievance Desk
- 6-stage transparent progress pipeline:
  `Offer Sent` $\rightarrow$ `Offer Accepted` $\rightarrow$ `Pickup Scheduled` $\rightarrow$ `In Transit` $\rightarrow$ `Payment Initiated` $\rightarrow$ `Settled`.
- **Dispute Flagging**: One-click grievance filing for quality mismatches or logistics delays with full audit tracking.

---

## 🎙️ 3-Minute Hackathon Demo Script (For Judges)

1. **Open Split Screen View (`⚡ Split Screen Demo`)**:
   - Show the Farmer's WhatsApp interface on the left and Buyer Desk on the right simultaneously.
2. **Farmer Intake (45s)**:
   - Click the prompt chip: *"🧅 25q Onion (Niphad)"* or use voice input.
   - Point out the **Net Price vs Gross Price** callout:
     > *"Judges, look at this: Pune Mandi shows a higher headline rate of ₹3,098/qtl, but because it is 175 km away, transport eats the profit. AgriConnect directs the farmer to Pimpalgaon APMC, putting ₹4,925 MORE net cash in the farmer's pocket!"*
   - Point out the **Hold & Store Advisory**: *"Onion prices are trending up +9.8%. Recommended to hold in nearby Niphad Agro Cold Store."*
   - Tap **"List as Active Lot for Buyers"**.
3. **Buyer Sourcing & Dynamic Aggregation (45s)**:
   - On the right, click the **Sahyadri Agro Processors** demand (50 Qtl MOQ).
   - Show the **Dynamic Aggregation Engine** pooling 3 local smallholders (Ramesh, Tukaram, Baburao) into a single 50 Qtl pool, saving ₹3,750 in freight.
   - Click **"Send Cluster Offer"**.
4. **Closing the Loop (30s)**:
   - The WhatsApp screen on the left instantly rings with the **Incoming Buyer Offer**.
   - Tap **"Accept Deal"**.
   - Switch to the **Transaction Lifecycle & Disputes** tab to show the status moving through pickup and escrow disbursement, plus demonstrate the **Dispute Flag** mechanism.

---

## 📂 Project Structure

```
Agriconnect/
├── backend/
│   ├── main.py                  # FastAPI server & REST routes
│   ├── models.py                # SQLAlchemy relational models
│   ├── database.py              # SQLite connection & session
│   ├── price_engine.py          # Net price & 7-14d SMA trend engine
│   ├── aggregation_engine.py    # Spatial smallholder clustering
│   ├── nlp_intake.py            # Multilingual slot-filling
│   ├── seed_data.py             # Maharashtra APMC dataset seeder
│   └── requirements.txt         # Backend dependencies
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Master dashboard & tab routing
│   │   ├── api.js               # REST API client
│   │   └── components/
│   │       ├── FarmerSimulator.jsx    # WhatsApp & Voice smartphone UI
│   │       ├── BuyerPortal.jsx        # Demand & aggregation matching
│   │       ├── MandiIntelligence.jsx  # Net-price comparison tool
│   │       └── TransactionTracker.jsx # 6-stage lifecycle & grievances
│   ├── package.json
│   └── vite.config.js
├── test_system.py               # 8-gate automated test suite
├── start_agriconnect.bat        # 1-click concurrent launcher
├── run_backend.bat              # Backend launcher
├── run_frontend.bat             # Frontend launcher
└── README.md
```
