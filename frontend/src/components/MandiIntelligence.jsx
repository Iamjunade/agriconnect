import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, TrendingDown, MapPin, Truck, 
  Warehouse, Calculator, Info, ShieldCheck, ArrowRight, CheckCircle2 
} from 'lucide-react';
import { fetchMandiOverview, fetchPriceAdvisory } from '../api';

export default function MandiIntelligence() {
  const [mandiData, setMandiData] = useState([]);
  const [storageFacilities, setStorageFacilities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Calculator inputs
  const [calcCrop, setCalcCrop] = useState('Onion');
  const [calcQty, setCalcQty] = useState(25);
  const [calcLocation, setCalcLocation] = useState('Niphad, Nashik');
  const [calcGrade, setCalcGrade] = useState('Grade A');
  const [advisoryResult, setAdvisoryResult] = useState(null);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    loadOverview();
    runAdvisoryCalculation();
  }, []);

  const loadOverview = async () => {
    try {
      const data = await fetchMandiOverview();
      setMandiData(data.mandis || []);
      setStorageFacilities(data.storage_facilities || []);
    } catch (err) {
      console.error('Error fetching mandi data:', err);
    } finally {
      setLoading(false);
    }
  };

  const runAdvisoryCalculation = async () => {
    setCalculating(true);
    try {
      const res = await fetchPriceAdvisory(calcCrop, parseFloat(calcQty || 20), calcLocation, calcGrade);
      setAdvisoryResult(res);
    } catch (err) {
      console.error('Error running advisory:', err);
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-emerald-800">
        <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
          <BarChart3 className="w-4 h-4" />
          Decision Layer (Agmarknet & eNAM Unified)
        </div>
        <h2 className="text-2xl font-bold mt-1">Mandi Price Discovery & Net Realization Engine</h2>
        <p className="text-sm text-slate-300 mt-1 max-w-2xl">
          Raw prices do not equal farmer profit. AgriConnect computes the localized net price after deducting dynamic transportation freight and assesses 7-14 day moving averages to guide optimal sale timing.
        </p>
      </div>

      {/* Interactive Net Price Realization Calculator */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-600" />
              Interactive Net-Price Realization Simulator
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Change crop, volume, and location to see how transport costs flip the optimal Mandi
            </p>
          </div>
          <button
            onClick={runAdvisoryCalculation}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow transition flex items-center gap-1.5"
          >
            Compute Net Profit
          </button>
        </div>

        {/* Form Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-4">
          <div>
            <label className="text-xs font-semibold text-slate-700">Crop</label>
            <select
              value={calcCrop}
              onChange={(e) => setCalcCrop(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 mt-1 text-xs font-medium focus:ring-1 focus:ring-emerald-500"
            >
              <option value="Onion">Onion (कांदा)</option>
              <option value="Soybean">Soybean (सोयाबीन)</option>
              <option value="Cotton">Cotton (कपास)</option>
              <option value="Tur Dal">Tur Dal (तूर)</option>
              <option value="Tomato">Tomato (टोमॅटो)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700">Quantity (Quintals)</label>
            <input
              type="number"
              value={calcQty}
              onChange={(e) => setCalcQty(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 mt-1 text-xs font-medium focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700">Farmer Village / Center</label>
            <select
              value={calcLocation}
              onChange={(e) => setCalcLocation(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 mt-1 text-xs font-medium focus:ring-1 focus:ring-emerald-500"
            >
              <option value="Niphad, Nashik">Niphad, Nashik</option>
              <option value="Lasalgaon, Nashik">Lasalgaon, Nashik</option>
              <option value="Dindori, Nashik">Dindori, Nashik</option>
              <option value="Pune">Pune Region</option>
              <option value="Latur">Latur Region</option>
              <option value="Akola">Akola Region</option>
              <option value="Nagpur">Nagpur Region</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700">Quality Grade</label>
            <select
              value={calcGrade}
              onChange={(e) => setCalcGrade(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 mt-1 text-xs font-medium focus:ring-1 focus:ring-emerald-500"
            >
              <option value="Grade A">Grade A (Export / High-Solid)</option>
              <option value="Grade B">Grade B (Standard Commercial)</option>
              <option value="FAQ">FAQ (Fair Average Quality)</option>
            </select>
          </div>
        </div>

        {/* Calculation Result Callout */}
        {advisoryResult && (
          <div className="mt-6 space-y-4">
            {/* Headline Callout */}
            <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="text-xs text-emerald-800 font-bold uppercase tracking-wider">
                  Optimal Realization Recommendation
                </div>
                <div className="text-xl font-black text-emerald-950 mt-0.5 flex items-center gap-2">
                  <span>🏆 Best Mandi: {advisoryResult.best_market.market}</span>
                  <span className="text-sm font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
                    ₹{advisoryResult.best_market.net_price_per_qtl}/qtl Net
                  </span>
                </div>
                <p className="text-xs text-emerald-900 font-medium mt-1">
                  {advisoryResult.decision_insight}
                </p>
              </div>

              <div className="bg-white px-4 py-3 rounded-xl border border-emerald-300 shadow-sm shrink-0">
                <div className="text-[11px] text-slate-500 font-medium">Estimated Net In-Hand Cash</div>
                <div className="text-2xl font-black text-slate-900">
                  ₹{advisoryResult.best_market.total_net_realization.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  After ₹{advisoryResult.best_market.transport_cost_per_qtl * calcQty} total freight
                </div>
              </div>
            </div>

            {/* Sell Now vs Hold Advisory Banner */}
            <div className={`p-4 rounded-xl border flex items-start gap-3 ${
              advisoryResult.recommendation.type === 'HOLD_RECOMMENDED'
                ? 'bg-blue-50 border-blue-300 text-blue-950'
                : advisoryResult.recommendation.type === 'SELL_NOW'
                ? 'bg-amber-50 border-amber-300 text-amber-950'
                : 'bg-slate-50 border-slate-300 text-slate-900'
            }`}>
              {advisoryResult.recommendation.type === 'HOLD_RECOMMENDED' ? (
                <TrendingUp className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              ) : (
                <TrendingDown className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-bold text-sm">{advisoryResult.recommendation.headline}</div>
                <p className="text-xs text-slate-600 mt-0.5">{advisoryResult.recommendation.reasoning}</p>
              </div>
            </div>

            {/* Mandi Comparison Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-3">APMC Mandi</th>
                    <th className="p-3">Distance</th>
                    <th className="p-3">Gross Modal Rate</th>
                    <th className="p-3">Estimated Freight</th>
                    <th className="p-3 font-bold text-emerald-800">Net Realized Price</th>
                    <th className="p-3">7-Day Trend</th>
                    <th className="p-3">Rank</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {advisoryResult.all_markets.map((m, index) => (
                    <tr 
                      key={m.market}
                      className={index === 0 ? 'bg-emerald-50/70 font-semibold' : 'hover:bg-slate-50'}
                    >
                      <td className="p-3 font-bold text-slate-900 flex items-center gap-1.5">
                        {index === 0 && <span>🏆</span>}
                        {m.market} ({m.district})
                      </td>
                      <td className="p-3 text-slate-600">{m.distance_km} km</td>
                      <td className="p-3 text-slate-700">₹{m.gross_modal_price}/qtl</td>
                      <td className="p-3 text-rose-600">-₹{m.transport_cost_per_qtl}/qtl</td>
                      <td className="p-3 font-extrabold text-emerald-700 text-sm">
                        ₹{m.net_price_per_qtl}/qtl
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold ${
                          m.pct_change_7d >= 0 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {m.pct_change_7d >= 0 ? '+' : ''}{m.pct_change_7d}%
                        </span>
                      </td>
                      <td className="p-3">
                        {index === 0 ? (
                          <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                            #1 Recommended
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">#{index + 1}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Storage & Logistics Directory */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Warehouse className="w-5 h-5 text-indigo-600" />
              Verified Scientific Storage & Cold Chain Facilities (Maharashtra)
            </h3>
            <p className="text-xs text-slate-500">
              When the advisory recommends holding produce, farmers can utilize these state-supported storage facilities
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {storageFacilities.map((fac, i) => (
            <div key={i} className="bg-slate-50 rounded-xl p-4 border border-slate-200 hover:shadow transition">
              <div className="text-xs font-bold text-slate-900">{fac.name}</div>
              <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3 text-slate-400" /> {fac.location}
              </p>
              <div className="mt-3 pt-2 border-t border-slate-200/80 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Capacity:</span>
                  <span className="font-semibold text-slate-800">{fac.capacity}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Warehouse Rate:</span>
                  <span className="font-bold text-indigo-700">₹{fac.rate_per_month_qtl}/qtl/mo</span>
                </div>
                <div className="flex justify-between text-slate-600 pt-1">
                  <span>Desk Contact:</span>
                  <span className="font-mono text-[11px] text-slate-700">{fac.contact}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
