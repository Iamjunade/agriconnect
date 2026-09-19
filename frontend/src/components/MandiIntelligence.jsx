import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, TrendingDown, MapPin, Truck, 
  Warehouse, Calculator, Info, ShieldCheck, ArrowRight, CheckCircle2, Sparkles,
  DollarSign, Activity, AlertCircle
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
      <div className="bg-gradient-to-br from-slate-900 via-teal-950/80 to-slate-950 text-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-wider">
            <BarChart3 className="w-4 h-4" />
            Decision Intelligence Layer • Maharashtra Mandis
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1.5 text-white">
            APMC Mandi Price Discovery & Net Realization
          </h2>
          <p className="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
            Raw headline rates deceive farmers. AgriConnect calculates the localized net take-home price by subtracting dynamic Haversine freight and examining 7-14 day moving averages to guide optimal sale timing.
          </p>
        </div>
      </div>

      {/* Interactive Net Price Realization Calculator */}
      <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-7 border border-slate-800 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-400" />
              Net-Price Realization Calculator
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Adjust crop, volume, and farm location to analyze how logistics freight flips optimal Mandi profitability.
            </p>
          </div>
          <button
            onClick={runAdvisoryCalculation}
            disabled={calculating}
            className="bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 active:scale-95 text-slate-950 font-black px-5 py-2.5 rounded-2xl text-xs shadow-lg shadow-emerald-500/20 transition flex items-center gap-2 shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            {calculating ? 'Analyzing...' : 'Recalculate Net Profit'}
          </button>
        </div>

        {/* Form Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-5">
          <div>
            <label className="text-xs font-bold text-slate-300">Commodity</label>
            <select
              value={calcCrop}
              onChange={(e) => setCalcCrop(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 mt-1.5 text-xs font-semibold text-white focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="Onion">Onion (कांदा)</option>
              <option value="Soybean">Soybean (सोयाबीन)</option>
              <option value="Cotton">Cotton (कपास)</option>
              <option value="Tur Dal">Tur Dal (तूर)</option>
              <option value="Tomato">Tomato (टोमॅटो)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300">Quantity (Quintals)</label>
            <input
              type="number"
              value={calcQty}
              onChange={(e) => setCalcQty(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 mt-1.5 text-xs font-semibold text-white focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300">Farm / Village Center</label>
            <select
              value={calcLocation}
              onChange={(e) => setCalcLocation(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 mt-1.5 text-xs font-semibold text-white focus:ring-2 focus:ring-emerald-500/50"
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
            <label className="text-xs font-bold text-slate-300">Quality Spec</label>
            <select
              value={calcGrade}
              onChange={(e) => setCalcGrade(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 mt-1.5 text-xs font-semibold text-white focus:ring-2 focus:ring-emerald-500/50"
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
            <div className="bg-gradient-to-br from-emerald-950/60 via-slate-900 to-teal-950/60 border border-emerald-500/40 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
              <div>
                <div className="text-[11px] text-emerald-400 font-extrabold uppercase tracking-wider">
                  Optimal Market Recommendation
                </div>
                <div className="text-xl sm:text-2xl font-black text-white mt-1 flex items-center gap-2.5 flex-wrap">
                  <span>🏆 Best Mandi: {advisoryResult.best_market.market}</span>
                  <span className="text-sm font-black bg-emerald-900/80 border border-emerald-400/50 text-emerald-300 px-3 py-0.5 rounded-full">
                    ₹{advisoryResult.best_market.net_price_per_qtl}/qtl Net
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed max-w-xl font-medium">
                  {advisoryResult.decision_insight}
                </p>
              </div>

              <div className="bg-slate-850 px-5 py-3.5 rounded-2xl border border-slate-750 shadow-inner shrink-0 text-left sm:text-right">
                <div className="text-[11px] text-slate-400 font-semibold">Estimated Net Cash Realization</div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-0.5">
                  ₹{advisoryResult.best_market.total_net_realization.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  After -₹{(advisoryResult.best_market.transport_cost_per_qtl * calcQty).toLocaleString()} total freight deduction
                </div>
              </div>
            </div>

            {/* Sell Now vs Hold Advisory Banner */}
            <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
              advisoryResult.recommendation.type === 'HOLD_RECOMMENDED'
                ? 'bg-blue-950/40 border-blue-500/30 text-blue-200'
                : advisoryResult.recommendation.type === 'SELL_NOW'
                ? 'bg-amber-950/40 border-amber-500/30 text-amber-200'
                : 'bg-slate-850 border-slate-700 text-slate-200'
            }`}>
              {advisoryResult.recommendation.type === 'HOLD_RECOMMENDED' ? (
                <TrendingUp className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              ) : (
                <TrendingDown className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-extrabold text-sm">{advisoryResult.recommendation.headline}</div>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{advisoryResult.recommendation.reasoning}</p>
              </div>
            </div>

            {/* Mandi Comparison Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-800 text-slate-300 uppercase text-[10px] font-extrabold border-b border-slate-700">
                  <tr>
                    <th className="p-3.5">APMC Mandi</th>
                    <th className="p-3.5">Distance</th>
                    <th className="p-3.5">Gross Modal Rate</th>
                    <th className="p-3.5">Transit Freight</th>
                    <th className="p-3.5 font-bold text-emerald-400">Net Realized Price</th>
                    <th className="p-3.5">7-Day Trend</th>
                    <th className="p-3.5">Rank</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-850/60">
                  {advisoryResult.all_markets.map((m, index) => (
                    <tr 
                      key={m.market}
                      className={index === 0 ? 'bg-emerald-950/30 font-semibold' : 'hover:bg-slate-800/50'}
                    >
                      <td className="p-3.5 font-bold text-white flex items-center gap-1.5">
                        {index === 0 && <span>🏆</span>}
                        {m.market} <span className="text-slate-500 font-normal">({m.district})</span>
                      </td>
                      <td className="p-3.5 text-slate-400">{m.distance_km} km</td>
                      <td className="p-3.5 text-slate-300">₹{m.gross_modal_price}/qtl</td>
                      <td className="p-3.5 text-rose-400">-₹{m.transport_cost_per_qtl}/qtl</td>
                      <td className="p-3.5 font-black text-emerald-400 text-sm">
                        ₹{m.net_price_per_qtl}/qtl
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          m.pct_change_7d >= 0 
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' 
                            : 'bg-rose-950 text-rose-300 border border-rose-500/30'
                        }`}>
                          {m.pct_change_7d >= 0 ? '+' : ''}{m.pct_change_7d}%
                        </span>
                      </td>
                      <td className="p-3.5">
                        {index === 0 ? (
                          <span className="bg-emerald-500 text-slate-950 text-[10px] px-2.5 py-1 rounded-full font-black shadow-md">
                            Optimal Route
                          </span>
                        ) : (
                          <span className="text-slate-500 font-medium text-[11px]">Rank #{index + 1}</span>
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
      <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-7 border border-slate-800 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-white text-base flex items-center gap-2">
              <Warehouse className="w-5 h-5 text-indigo-400" />
              Verified Scientific Warehouses & Cold Storages (Maharashtra)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Utilize WDRA-accredited state warehousing when the price trend indicates high holding yields.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {storageFacilities.map((fac, i) => (
            <div key={i} className="bg-slate-850/80 rounded-2xl p-4 border border-slate-800 hover:border-slate-700 transition">
              <div className="text-xs font-bold text-white">{fac.name}</div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3 text-slate-500" /> {fac.location}
              </p>
              <div className="mt-3.5 pt-2.5 border-t border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Capacity:</span>
                  <span className="font-bold text-white">{fac.capacity}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Storage Fee:</span>
                  <span className="font-black text-indigo-400">₹{fac.rate_per_month_qtl}/qtl/mo</span>
                </div>
                <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
                  <span>Helpdesk:</span>
                  <span className="font-mono text-[11px] text-slate-300 font-semibold">{fac.contact}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
