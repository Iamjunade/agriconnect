import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, TrendingDown, MapPin, Truck, 
  Warehouse, Calculator, Info, ShieldCheck, ArrowRight, CheckCircle2, Sparkles
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
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-emerald-800/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <BarChart3 className="w-4 h-4" />
            Decision Intelligence Layer • Maharashtra Mandis
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1.5">
            APMC Mandi Price Discovery & Net Realization
          </h2>
          <p className="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed font-normal">
            Gross headline rates mislead farmers. AgriConnect computes the localized net price after deducting dynamic transportation freight and evaluates 7-14 day moving averages to guide optimal sale timing.
          </p>
        </div>
      </div>

      {/* Interactive Net Price Realization Calculator */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-600" />
              Net-Price Realization Calculator
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Adjust crop, volume, and farm location to analyze how logistics freight flips optimal Mandi profitability.
            </p>
          </div>
          <button
            onClick={runAdvisoryCalculation}
            disabled={calculating}
            className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-xs transition flex items-center gap-2 shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            {calculating ? 'Analyzing...' : 'Recalculate Net Profit'}
          </button>
        </div>

        {/* Form Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-5">
          <div>
            <label className="text-xs font-bold text-slate-700">Commodity</label>
            <select
              value={calcCrop}
              onChange={(e) => setCalcCrop(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-2.5 mt-1.5 text-xs font-semibold focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="Onion">Onion (कांदा)</option>
              <option value="Soybean">Soybean (सोयाबीन)</option>
              <option value="Cotton">Cotton (कपास)</option>
              <option value="Tur Dal">Tur Dal (तूर)</option>
              <option value="Tomato">Tomato (टोमॅटो)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">Quantity (Quintals)</label>
            <input
              type="number"
              value={calcQty}
              onChange={(e) => setCalcQty(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-2.5 mt-1.5 text-xs font-semibold focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">Farm / Village Center</label>
            <select
              value={calcLocation}
              onChange={(e) => setCalcLocation(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-2.5 mt-1.5 text-xs font-semibold focus:ring-2 focus:ring-emerald-500/50"
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
            <label className="text-xs font-bold text-slate-700">Quality Spec</label>
            <select
              value={calcGrade}
              onChange={(e) => setCalcGrade(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-2.5 mt-1.5 text-xs font-semibold focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="Grade A">Grade A (Export / Premium)</option>
              <option value="Grade B">Grade B (Standard Market)</option>
              <option value="FAQ">FAQ (Fair Average Quality)</option>
            </select>
          </div>
        </div>

        {/* Calculation Result Callout */}
        {advisoryResult && (
          <div className="mt-6 space-y-4">
            {/* Headline Callout */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300/80 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="text-[11px] text-emerald-800 font-bold uppercase tracking-wider">
                  Optimal Market Recommendation
                </div>
                <div className="text-xl sm:text-2xl font-black text-emerald-950 mt-1 flex items-center gap-2.5 flex-wrap">
                  <span>🏆 Best Mandi: {advisoryResult.best_market.market}</span>
                  <span className="text-sm font-black bg-emerald-200/90 text-emerald-900 px-3 py-0.5 rounded-full">
                    ₹{advisoryResult.best_market.net_price_per_qtl}/qtl Net
                  </span>
                </div>
                <p className="text-xs text-emerald-900/90 font-medium mt-1.5 leading-relaxed max-w-xl">
                  {advisoryResult.decision_insight}
                </p>
              </div>

              <div className="bg-white px-5 py-3.5 rounded-2xl border border-emerald-200 shadow-xs shrink-0">
                <div className="text-[11px] text-slate-500 font-semibold">Estimated Take-Home Realization</div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5">
                  ₹{advisoryResult.best_market.total_net_realization.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500 mt-1 font-medium">
                  After -₹{(advisoryResult.best_market.transport_cost_per_qtl * calcQty).toLocaleString()} total freight deduction
                </div>
              </div>
            </div>

            {/* Sell Now vs Hold Advisory Banner */}
            <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
              advisoryResult.recommendation.type === 'HOLD_RECOMMENDED'
                ? 'bg-blue-50/80 border-blue-200 text-blue-950'
                : advisoryResult.recommendation.type === 'SELL_NOW'
                ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                : 'bg-slate-50 border-slate-200 text-slate-900'
            }`}>
              {advisoryResult.recommendation.type === 'HOLD_RECOMMENDED' ? (
                <TrendingUp className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              ) : (
                <TrendingDown className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-extrabold text-sm">{advisoryResult.recommendation.headline}</div>
                <p className="text-xs text-slate-600 mt-0.5 font-medium leading-relaxed">{advisoryResult.recommendation.reasoning}</p>
              </div>
            </div>

            {/* Mandi Comparison Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 uppercase text-[10px] font-extrabold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">APMC Mandi</th>
                    <th className="p-3.5">Distance</th>
                    <th className="p-3.5">Gross Modal Rate</th>
                    <th className="p-3.5">Transit Freight</th>
                    <th className="p-3.5 font-bold text-emerald-800">Net Realized Price</th>
                    <th className="p-3.5">7-Day Trend</th>
                    <th className="p-3.5">Recommendation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {advisoryResult.all_markets.map((m, index) => (
                    <tr 
                      key={m.market}
                      className={index === 0 ? 'bg-emerald-50/50 font-semibold' : 'hover:bg-slate-50/80'}
                    >
                      <td className="p-3.5 font-bold text-slate-900 flex items-center gap-1.5">
                        {index === 0 && <span>🏆</span>}
                        {m.market} <span className="text-slate-500 font-normal">({m.district})</span>
                      </td>
                      <td className="p-3.5 text-slate-600 font-medium">{m.distance_km} km</td>
                      <td className="p-3.5 text-slate-700 font-semibold">₹{m.gross_modal_price}/qtl</td>
                      <td className="p-3.5 text-rose-600 font-medium">-₹{m.transport_cost_per_qtl}/qtl</td>
                      <td className="p-3.5 font-black text-emerald-700 text-sm">
                        ₹{m.net_price_per_qtl}/qtl
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          m.pct_change_7d >= 0 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {m.pct_change_7d >= 0 ? '+' : ''}{m.pct_change_7d}%
                        </span>
                      </td>
                      <td className="p-3.5">
                        {index === 0 ? (
                          <span className="bg-emerald-600 text-white text-[10px] px-2.5 py-1 rounded-full font-bold shadow-xs">
                            Optimal Route
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium text-[11px]">Rank #{index + 1}</span>
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
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <Warehouse className="w-5 h-5 text-indigo-600" />
              Verified Scientific Warehouses & Cold Storages (Maharashtra)
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Utilize WDRA-accredited state warehousing when the price trend indicates high holding yields.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {storageFacilities.map((fac, i) => (
            <div key={i} className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 hover:shadow-xs hover:border-slate-300 transition">
              <div className="text-xs font-bold text-slate-900">{fac.name}</div>
              <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1 font-medium">
                <MapPin className="w-3 h-3 text-slate-400" /> {fac.location}
              </p>
              <div className="mt-3.5 pt-2.5 border-t border-slate-200/60 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Capacity:</span>
                  <span className="font-bold text-slate-900">{fac.capacity}</span>
                </div>
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Storage Fee:</span>
                  <span className="font-black text-indigo-700">₹{fac.rate_per_month_qtl}/qtl/mo</span>
                </div>
                <div className="flex justify-between text-slate-600 font-medium pt-1 border-t border-slate-100">
                  <span>Helpdesk:</span>
                  <span className="font-mono text-[11px] text-slate-700 font-semibold">{fac.contact}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
