import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, Layers, TrendingUp, Plus, ArrowRight, 
  MapPin, CheckCircle, Clock, ShieldCheck, Truck, Send, Sparkles, Filter
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
      // Dispatches offer on the first lot or aggregated cluster
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
      alert(`🎉 Aggregated Contract Dispatched! Direct offers sent to ${cluster.participating_farmers_count} smallholders simultaneously!`);
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
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
              <Building2 className="w-4 h-4" />
              Institutional Sourcing & FPO Desk
            </div>
            <h2 className="text-2xl font-bold mt-1">Smart Demand & Dynamic Aggregation Engine</h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Solve the smallholder fragmentation problem. Post institutional volume demands and automatically cluster neighboring smallholders into aggregated, contract-ready lots with shared logistics savings.
            </p>
          </div>
          <button
            onClick={() => setShowNewDemandModal(true)}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-sm transition shadow-lg shrink-0"
          >
            <Plus className="w-4 h-4" />
            Post Sourcing Demand
          </button>
        </div>
      </div>

      {/* Grid: Demands & Dynamic Aggregation Matcher */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Active Demands List (4 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              Active Buyer Demands
            </h3>
            <span className="text-xs text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full font-medium">
              {demands.length} Active
            </span>
          </div>

          <div className="space-y-3">
            {demands.map((d) => (
              <div
                key={d.id}
                onClick={() => handleSelectDemand(d)}
                className={`cursor-pointer rounded-xl p-4 transition border ${
                  selectedDemand?.id === d.id
                    ? 'bg-indigo-50/70 border-indigo-500 shadow-md ring-1 ring-indigo-500'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                      {d.crop}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm mt-1.5">{d.organization}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" /> {d.delivery_location}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-extrabold text-slate-900">
                      {d.min_quantity} <span className="text-xs font-medium text-slate-500">Qtl MOQ</span>
                    </div>
                    <div className="text-xs text-emerald-700 font-semibold mt-0.5">
                      Target: ₹{d.max_price}/qtl
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200/70 flex items-center justify-between text-xs text-slate-600">
                  <span className="bg-slate-100 px-2 py-0.5 rounded font-mono text-[11px]">
                    Quality: {d.target_grade}
                  </span>
                  <span className="text-indigo-600 font-semibold flex items-center gap-1">
                    Smart Cluster Match <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Dynamic Aggregation Result Card (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Dynamic Aggregation Engine: Clustering Smallholders
            </h3>
            {selectedDemand && (
              <span className="text-xs text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full font-semibold">
                Target: {selectedDemand.min_quantity} Qtl {selectedDemand.crop}
              </span>
            )}
          </div>

          {loadingClusters ? (
            <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-sm">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm font-medium text-slate-600">Running spatial clustering algorithm across regional lots...</p>
            </div>
          ) : clusterData?.clusters && clusterData.clusters.length > 0 ? (
            <div className="space-y-4">
              {clusterData.clusters.map((cluster, idx) => (
                <div 
                  key={idx}
                  className="bg-gradient-to-br from-white to-indigo-50/40 border-2 border-indigo-300 rounded-2xl p-5 shadow-md relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                    {cluster.pitch_tag}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-base">
                          {cluster.region} Smallholder Cluster
                        </h4>
                        <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full font-bold">
                          MOQ Fulfilled ({cluster.total_pooled_quantity} / {cluster.target_quantity} Qtl)
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                        Collection Depot: <strong>{cluster.suggested_hub}</strong>
                      </p>
                    </div>

                    <div className="text-left sm:text-right bg-indigo-100/60 p-2.5 rounded-xl border border-indigo-200">
                      <div className="text-xs text-indigo-900 font-medium">Collective Logistics Savings</div>
                      <div className="text-lg font-black text-indigo-700">
                        ₹{cluster.collective_freight_savings_inr.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Clustered Farmers Breakdown */}
                  <div className="mt-4 pt-3 border-t border-slate-200">
                    <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-indigo-600" />
                      {cluster.participating_farmers_count} Smallholders Pooled in this Contract:
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {cluster.lots.map((lot) => (
                        <div key={lot.id} className="bg-white rounded-lg p-2.5 border border-slate-200 shadow-sm text-xs">
                          <div className="font-bold text-slate-900">{lot.farmer_name}</div>
                          <div className="text-slate-500 text-[11px]">{lot.village}</div>
                          <div className="flex justify-between items-center mt-1.5 pt-1 border-t border-slate-100">
                            <span className="font-extrabold text-emerald-700">{lot.quantity_quintals} Qtl</span>
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">{lot.grade}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action: Dispatch Aggregated Bulk Offer */}
                  <div className="mt-4 pt-3 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      Dispatches standardized contract to all {cluster.participating_farmers_count} farmers on WhatsApp.
                    </span>
                    <button
                      onClick={() => handleSendClusterOffer(cluster)}
                      disabled={submittingOffer}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl shadow transition flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Send Cluster Offer (@₹{selectedDemand.max_price}/qtl)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-8 text-center border border-dashed border-slate-300 text-slate-500">
              <Layers className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No active cluster matches this demand MOQ yet.</p>
              <p className="text-xs text-slate-500 mt-1">
                Select another demand or wait for smallholder lots to register via WhatsApp.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Active Lots Marketplace Section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Active Lots Marketplace</h3>
            <p className="text-xs text-slate-500">Individual farmer lots listed via WhatsApp and Voice intake</p>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            {['All', 'Onion', 'Soybean', 'Cotton', 'Tomato'].map((crop) => (
              <button
                key={crop}
                onClick={() => setFilterCrop(crop)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                  filterCrop === crop
                    ? 'bg-slate-900 text-white'
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
              className={`rounded-xl p-4 border transition ${
                lot.status === 'under_offer'
                  ? 'bg-amber-50/50 border-amber-300'
                  : lot.status === 'sold'
                  ? 'bg-slate-100 border-slate-300 opacity-60'
                  : 'bg-white border-slate-200 hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    Lot #{lot.id}
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm mt-1">{lot.farmer_name}</h4>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" /> {lot.village}, {lot.district}
                  </p>
                </div>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  lot.grade === 'Grade A' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {lot.grade}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 my-3 p-2 bg-slate-50 rounded-lg text-xs">
                <div>
                  <span className="text-slate-500">Crop:</span>
                  <div className="font-bold text-slate-800">{lot.crop}</div>
                </div>
                <div>
                  <span className="text-slate-500">Quantity:</span>
                  <div className="font-bold text-slate-800">{lot.quantity_quintals} Quintals</div>
                </div>
                <div>
                  <span className="text-slate-500">Expected:</span>
                  <div className="font-bold text-emerald-700">₹{lot.expected_price || 2800}/qtl</div>
                </div>
                <div>
                  <span className="text-slate-500">Status:</span>
                  <div className="font-semibold capitalize text-slate-700">{lot.status.replace('_', ' ')}</div>
                </div>
              </div>

              {lot.status === 'available' ? (
                <button
                  onClick={() => handleOpenOfferModal(lot)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-1.5 px-3 rounded-lg text-xs transition flex items-center justify-center gap-1.5 shadow"
                >
                  <Send className="w-3.5 h-3.5" />
                  Make Direct Digital Offer
                </button>
              ) : lot.status === 'under_offer' ? (
                <div className="text-center py-1 text-xs font-semibold text-amber-700 bg-amber-100 rounded-lg">
                  ⏳ Offer Dispatched (Awaiting Farmer)
                </div>
              ) : (
                <div className="text-center py-1 text-xs font-semibold text-slate-500 bg-slate-200 rounded-lg">
                  Contract Settled
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Make Direct Offer */}
      {offerModalLot && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Make Digital Offer to Farmer</h3>
            <p className="text-xs text-slate-500 mt-1">
              Farmer <strong>{offerModalLot.farmer_name}</strong> will receive your offer instantly on WhatsApp with one-tap accept/decline buttons.
            </p>

            <div className="bg-slate-50 rounded-xl p-3.5 my-4 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Lot Crop:</span>
                <span className="font-bold">{offerModalLot.crop} ({offerModalLot.grade})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Quantity:</span>
                <span className="font-bold">{offerModalLot.quantity_quintals} Quintals</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Farmer Asking Rate:</span>
                <span className="font-bold text-emerald-700">₹{offerModalLot.expected_price}/qtl</span>
              </div>
            </div>

            <div className="space-y-1 mb-4">
              <label className="text-xs font-bold text-slate-700">Your Offered Price (₹ per Quintal)</label>
              <input
                type="number"
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <div className="text-[11px] text-slate-500 mt-1">
                Total Deal Payout: <strong>₹{(parseFloat(offerPrice || 0) * offerModalLot.quantity_quintals).toLocaleString()}</strong>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setOfferModalLot(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-xl text-xs transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitOffer}
                disabled={submittingOffer}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-2 rounded-xl text-xs transition shadow flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Dispatch to WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Post New Sourcing Demand */}
      {showNewDemandModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Post Sourcing Demand</h3>
            <p className="text-xs text-slate-500 mt-1">
              Create an institutional requirement for smallholders and FPOs.
            </p>

            <form onSubmit={handleCreateDemandSubmit} className="space-y-3 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Buyer Name</label>
                  <input
                    type="text"
                    required
                    value={demandForm.buyer_name}
                    onChange={(e) => setDemandForm({ ...demandForm, buyer_name: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 mt-1 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Organization</label>
                  <input
                    type="text"
                    required
                    value={demandForm.organization}
                    onChange={(e) => setDemandForm({ ...demandForm, organization: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 mt-1 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Crop</label>
                  <select
                    value={demandForm.crop}
                    onChange={(e) => setDemandForm({ ...demandForm, crop: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 mt-1"
                  >
                    <option value="Onion">Onion</option>
                    <option value="Soybean">Soybean</option>
                    <option value="Cotton">Cotton</option>
                    <option value="Tur Dal">Tur Dal</option>
                    <option value="Tomato">Tomato</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Min MOQ (Qtl)</label>
                  <input
                    type="number"
                    required
                    value={demandForm.min_quantity}
                    onChange={(e) => setDemandForm({ ...demandForm, min_quantity: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 mt-1"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Max Price (₹/qtl)</label>
                  <input
                    type="number"
                    required
                    value={demandForm.max_price}
                    onChange={(e) => setDemandForm({ ...demandForm, max_price: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Delivery Hub / Location</label>
                <input
                  type="text"
                  required
                  value={demandForm.delivery_location}
                  onChange={(e) => setDemandForm({ ...demandForm, delivery_location: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 mt-1"
                />
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewDemandModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl shadow"
                >
                  Publish Demand
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
