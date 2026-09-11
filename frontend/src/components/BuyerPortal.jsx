import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, Layers, TrendingUp, Plus, ArrowRight, 
  MapPin, CheckCircle, Clock, ShieldCheck, Truck, Send, Sparkles, Filter, CheckCircle2
} from 'lucide-react';
import { fetchLots, fetchDemands, createDemand, fetchDemandClusters, createOffer } from '../api';

export default function BuyerPortal({ refreshTrigger, onOfferCreated }) {
  const [lots, setLots] = useState([]);
  const [demands, setDemands] = useState([]);
  const [selectedDemand, setSelectedDemand] = useState(null);
  const [clusterData, setClusterData] = useState(null);
  const [loadingClusters, setLoadingClusters] = useState(false);
  const [showNewDemandModal, setShowNewDemandModal] = useState(false);
  const [offerModalLot, setOfferModalLot] = useState(null);
  const [offerPrice, setOfferPrice] = useState('');
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [filterCrop, setFilterCrop] = useState('All');

  // Form state for new demand
  const [demandForm, setDemandForm] = useState({
    buyer_name: 'Anand Kulkarni',
    organization: 'Sahyadri Agro Processors Ltd',
    contact: '+91-98224-88990',
    crop: 'Onion',
    min_quantity: 50,
    target_grade: 'Grade A',
    max_price: 2850,
    delivery_location: 'Nashik Agro Processing Zone'
  });

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  const loadData = async () => {
    try {
      const lotsData = await fetchLots();
      const demandsData = await fetchDemands();
      setLots(lotsData);
      setDemands(demandsData);
      if (demandsData.length > 0 && !selectedDemand) {
        handleSelectDemand(demandsData[0]);
      }
    } catch (err) {
      console.error('Error loading buyer data:', err);
    }
  };

  const handleSelectDemand = async (demand) => {
    setSelectedDemand(demand);
    setLoadingClusters(true);
    try {
      const data = await fetchDemandClusters(demand.id);
      setClusterData(data);
    } catch (err) {
      console.error('Error matching clusters:', err);
    } finally {
      setLoadingClusters(false);
    }
  };

  const handleCreateDemandSubmit = async (e) => {
    e.preventDefault();
    try {
      await createDemand({
        ...demandForm,
        min_quantity: parseFloat(demandForm.min_quantity),
        max_price: parseFloat(demandForm.max_price)
      });
      setShowNewDemandModal(false);
      loadData();
    } catch (err) {
      alert('Error creating demand: ' + err.message);
    }
  };

  const handleOpenOfferModal = (lot) => {
    setOfferModalLot(lot);
    setOfferPrice(lot.expected_price || 2800);
  };

  const handleSubmitOffer = async () => {
    if (!offerPrice || !offerModalLot) return;
    setSubmittingOffer(true);
    try {
      await createOffer({
        buyer_name: demandForm.organization || 'Sahyadri Agro Processors Ltd',
        lot_id: offerModalLot.id,
        farmer_name: offerModalLot.farmer_name,
        crop: offerModalLot.crop,
        quantity_quintals: offerModalLot.quantity_quintals,
        offered_price: parseFloat(offerPrice)
      });
      alert(`Offer of ₹${offerPrice}/qtl dispatched to ${offerModalLot.farmer_name} via WhatsApp!`);
      setOfferModalLot(null);
      loadData();
      if (onOfferCreated) onOfferCreated();
    } catch (err) {
      alert('Failed to send offer: ' + err.message);
    } finally {
      setSubmittingOffer(false);
    }
  };

  const handleSendClusterOffer = async (cluster) => {
    setSubmittingOffer(true);
    try {
      for (const lot of cluster.lots) {
        await createOffer({
          buyer_name: selectedDemand.organization,
          lot_id: lot.id,
          farmer_name: lot.farmer_name,
          crop: lot.crop,
          quantity_quintals: lot.quantity_quintals,
          offered_price: selectedDemand.max_price
        });
      }
      alert(`Aggregated purchase contracts dispatched to ${cluster.participating_farmers_count} smallholders simultaneously!`);
      loadData();
      if (onOfferCreated) onOfferCreated();
    } catch (err) {
      alert('Failed to dispatch cluster offer: ' + err.message);
    } finally {
      setSubmittingOffer(false);
    }
  };

  const filteredLots = lots.filter((l) => {
    if (filterCrop === 'All') return true;
    return l.crop.toLowerCase().includes(filterCrop.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Top Banner: Institutional Sourcing Overview */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-800/80 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <Building2 className="w-4 h-4" />
              Institutional Procurement & Smallholder Aggregation
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1.5">
              Direct Sourcing & Dynamic Pooling Engine
            </h2>
            <p className="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed font-normal">
              Eliminate supply chain friction. Publish bulk procurement requirements and automatically aggregate neighboring smallholders into contract-ready, quality-graded pools with pooled freight savings.
            </p>
          </div>
          <button
            onClick={() => setShowNewDemandModal(true)}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold px-5 py-3 rounded-2xl text-sm transition shadow-lg shadow-emerald-500/20 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Post Sourcing Requirement
          </button>
        </div>
      </div>

      {/* Grid: Demands & Dynamic Aggregation Matcher */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Active Demands List (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              Published Institutional Requirements
            </h3>
            <span className="text-xs text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full font-bold">
              {demands.length} Active
            </span>
          </div>

          <div className="space-y-3">
            {demands.map((d) => (
              <div
                key={d.id}
                onClick={() => handleSelectDemand(d)}
                className={`cursor-pointer rounded-2xl p-4 sm:p-5 transition border text-left ${
                  selectedDemand?.id === d.id
                    ? 'bg-indigo-50/70 border-indigo-500 shadow-md ring-1 ring-indigo-500/40'
                    : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100/80 px-2.5 py-0.5 rounded-md">
                      {d.crop}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm mt-2">{d.organization}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> {d.delivery_location}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-slate-900 leading-tight">
                      {d.min_quantity} <span className="text-xs font-semibold text-slate-500">Qtl MOQ</span>
                    </div>
                    <div className="text-xs text-emerald-700 font-bold mt-1">
                      Max: ₹{d.max_price}/qtl
                    </div>
                  </div>
                </div>

                <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium">
                  <span className="bg-slate-100/80 px-2 py-0.5 rounded text-[11px] text-slate-700">
                    Grade Spec: {d.target_grade}
                  </span>
                  <span className="text-indigo-600 font-bold flex items-center gap-1">
                    View Pooled Cluster <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Dynamic Aggregation Result Card (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Dynamic Spatial Aggregation Pool
            </h3>
            {selectedDemand && (
              <span className="text-xs text-indigo-800 bg-indigo-100/80 border border-indigo-200 px-3 py-1 rounded-full font-bold">
                Target: {selectedDemand.min_quantity} Qtl {selectedDemand.crop}
              </span>
            )}
          </div>

          {loadingClusters ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs font-semibold text-slate-600">Running spatial clustering across regional smallholders...</p>
            </div>
          ) : clusterData?.clusters && clusterData.clusters.length > 0 ? (
            <div className="space-y-4">
              {clusterData.clusters.map((cluster, idx) => (
                <div 
                  key={idx}
                  className="bg-white border-2 border-indigo-200/90 rounded-3xl p-5 sm:p-6 shadow-sm relative overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h4 className="font-extrabold text-slate-900 text-base">
                          {cluster.region} Aggregated Sourcing Pool
                        </h4>
                        <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
                          MOQ Met ({cluster.total_pooled_quantity} / {cluster.target_quantity} Qtl)
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1.5 flex items-center gap-1.5 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                        Collection Hub: <strong className="text-slate-900 font-bold">{cluster.suggested_hub}</strong>
                      </p>
                    </div>

                    <div className="bg-indigo-50/80 border border-indigo-200/70 p-3 rounded-2xl text-left sm:text-right">
                      <div className="text-[11px] text-indigo-900 font-semibold">Shared Freight Optimization</div>
                      <div className="text-xl font-black text-indigo-700">
                        ₹{cluster.collective_freight_savings_inr.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Clustered Farmers Breakdown */}
                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <div className="text-xs font-bold text-slate-800 mb-2.5 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-indigo-600" />
                      {cluster.participating_farmers_count} Smallholders Pooled in this Contract:
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {cluster.lots.map((lot) => (
                        <div key={lot.id} className="bg-slate-50/90 rounded-xl p-3 border border-slate-200/80 text-xs">
                          <div className="font-bold text-slate-900">{lot.farmer_name}</div>
                          <div className="text-slate-500 text-[11px] font-medium">{lot.village}</div>
                          <div className="flex justify-between items-center mt-2 pt-1.5 border-t border-slate-200/60">
                            <span className="font-black text-emerald-700">{lot.quantity_quintals} Qtl</span>
                            <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[10px] font-semibold text-slate-700">{lot.grade}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action: Dispatch Aggregated Bulk Offer */}
                  <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-xs text-slate-500 font-medium">
                      Direct contract dispatched to all {cluster.participating_farmers_count} farmers simultaneously.
                    </span>
                    <button
                      onClick={() => handleSendClusterOffer(cluster)}
                      disabled={submittingOffer}
                      className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition flex items-center justify-center gap-2 shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Issue Bulk Contract (@₹{selectedDemand.max_price}/qtl)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-10 text-center border border-dashed border-slate-300 text-slate-500">
              <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-800">No active cluster matches this demand MOQ yet.</p>
              <p className="text-xs text-slate-500 mt-1">
                Select another institutional demand or list lots in the WhatsApp assistant to observe automated spatial grouping.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Active Lots Marketplace Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-slate-900 text-lg tracking-tight">Verified Farmer Lots Marketplace</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Individual farmer harvest declarations registered via WhatsApp & Voice</p>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
            {['All', 'Onion', 'Soybean', 'Cotton', 'Tomato'].map((crop) => (
              <button
                key={crop}
                onClick={() => setFilterCrop(crop)}
                className={`text-xs px-3 py-1.5 rounded-xl font-bold transition ${
                  filterCrop === crop
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {crop}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLots.map((lot) => (
            <div 
              key={lot.id} 
              className={`rounded-2xl p-4 sm:p-5 border transition ${
                lot.status === 'under_offer'
                  ? 'bg-amber-50/50 border-amber-300'
                  : lot.status === 'sold'
                  ? 'bg-slate-100 border-slate-300 opacity-60'
                  : 'bg-white border-slate-200 hover:shadow-md hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                    Lot #{lot.id}
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm mt-1.5">{lot.farmer_name}</h4>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                    <MapPin className="w-3 h-3 text-slate-400" /> {lot.village}, {lot.district}
                  </p>
                </div>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                  lot.grade === 'Grade A' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {lot.grade}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 my-3.5 p-3 bg-slate-50 rounded-xl text-xs">
                <div>
                  <span className="text-slate-500 font-medium">Commodity:</span>
                  <div className="font-bold text-slate-900">{lot.crop}</div>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Volume:</span>
                  <div className="font-bold text-slate-900">{lot.quantity_quintals} Quintals</div>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Farmer Asking:</span>
                  <div className="font-bold text-emerald-700">₹{lot.expected_price || 2800}/qtl</div>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Status:</span>
                  <div className="font-bold capitalize text-slate-700">{lot.status.replace('_', ' ')}</div>
                </div>
              </div>

              {lot.status === 'available' ? (
                <button
                  onClick={() => handleOpenOfferModal(lot)}
                  className="w-full bg-slate-900 hover:bg-slate-800 active:scale-98 text-white font-bold py-2 px-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  Make Direct Digital Offer
                </button>
              ) : lot.status === 'under_offer' ? (
                <div className="text-center py-2 text-xs font-bold text-amber-800 bg-amber-100/80 rounded-xl border border-amber-200">
                  ⏳ Contract Sent • Awaiting Farmer
                </div>
              ) : (
                <div className="text-center py-2 text-xs font-semibold text-slate-500 bg-slate-200/80 rounded-xl">
                  Contract Settled
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Make Direct Offer */}
      {offerModalLot && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100">
            <h3 className="text-lg font-extrabold text-slate-900">Issue Purchase Contract to Farmer</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Farmer <strong>{offerModalLot.farmer_name}</strong> will receive your formal offer on WhatsApp with instant contract acceptance buttons.
            </p>

            <div className="bg-slate-50 rounded-2xl p-4 my-4 text-xs space-y-1.5 border border-slate-200/60">
              <div className="flex justify-between">
                <span className="text-slate-500">Lot:</span>
                <span className="font-bold text-slate-900">{offerModalLot.crop} ({offerModalLot.grade})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Quantity:</span>
                <span className="font-bold text-slate-900">{offerModalLot.quantity_quintals} Quintals</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Asking Rate:</span>
                <span className="font-bold text-emerald-700">₹{offerModalLot.expected_price}/qtl</span>
              </div>
            </div>

            <div className="space-y-1.5 mb-5">
              <label className="text-xs font-bold text-slate-800">Your Offered Price (₹ per Quintal)</label>
              <input
                type="number"
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
              />
              <div className="text-[11px] text-slate-500 mt-1 font-medium">
                Total Contract Settlement: <strong>₹{(parseFloat(offerPrice || 0) * offerModalLot.quantity_quintals).toLocaleString()}</strong>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setOfferModalLot(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitOffer}
                disabled={submittingOffer}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-98 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-xs flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Dispatch Offer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Post New Sourcing Demand */}
      {showNewDemandModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-100">
            <h3 className="text-lg font-extrabold text-slate-900">Publish Sourcing Requirement</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Broadcast an institutional procurement requirement for smallholders and FPOs.
            </p>

            <form onSubmit={handleCreateDemandSubmit} className="space-y-3.5 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Procurement Officer</label>
                  <input
                    type="text"
                    required
                    value={demandForm.buyer_name}
                    onChange={(e) => setDemandForm({ ...demandForm, buyer_name: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 mt-1 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Enterprise / Organization</label>
                  <input
                    type="text"
                    required
                    value={demandForm.organization}
                    onChange={(e) => setDemandForm({ ...demandForm, organization: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 mt-1 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Commodity</label>
                  <select
                    value={demandForm.crop}
                    onChange={(e) => setDemandForm({ ...demandForm, crop: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 mt-1 focus:ring-2 focus:ring-indigo-500/50 text-xs font-semibold"
                  >
                    <option value="Onion">Onion</option>
                    <option value="Soybean">Soybean</option>
                    <option value="Cotton">Cotton</option>
                    <option value="Tur Dal">Tur Dal</option>
                    <option value="Tomato">Tomato</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700">Target MOQ (Qtl)</label>
                  <input
                    type="number"
                    required
                    value={demandForm.min_quantity}
                    onChange={(e) => setDemandForm({ ...demandForm, min_quantity: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 mt-1 focus:ring-2 focus:ring-indigo-500/50 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Max Budget (₹/qtl)</label>
                  <input
                    type="number"
                    required
                    value={demandForm.max_price}
                    onChange={(e) => setDemandForm({ ...demandForm, max_price: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 mt-1 focus:ring-2 focus:ring-indigo-500/50 text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Delivery Processing Hub</label>
                <input
                  type="text"
                  required
                  value={demandForm.delivery_location}
                  onChange={(e) => setDemandForm({ ...demandForm, delivery_location: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 mt-1 focus:ring-2 focus:ring-indigo-500/50 text-xs font-semibold"
                />
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewDemandModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold py-2.5 rounded-xl shadow-xs"
                >
                  Publish Requirement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
