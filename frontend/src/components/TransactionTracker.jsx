import React, { useState, useEffect } from 'react';
import { 
  Truck, CheckCircle, Clock, AlertTriangle, ShieldCheck, 
  ArrowRight, FileText, ChevronRight, DollarSign, MessageSquare, AlertCircle
} from 'lucide-react';
import { fetchTransactions, updateTransactionStatus, fetchGrievances, createGrievance } from '../api';

const STAGES = [
  { key: 'offer_sent', label: 'Offer Sent' },
  { key: 'offer_accepted', label: 'Offer Accepted' },
  { key: 'pickup_scheduled', label: 'Pickup Scheduled' },
  { key: 'in_transit', label: 'In Transit' },
  { key: 'payment_initiated', label: 'Payment Initiated' },
  { key: 'settled', label: 'Settled' }
];

export default function TransactionTracker({ refreshTrigger, onStatusChanged }) {
  const [transactions, setTransactions] = useState([]);
  const [grievances, setGrievances] = useState([]);
  const [selectedTx, setSelectedTx] = useState(null);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeForm, setDisputeForm] = useState({
    issue_type: 'Quality Mismatch at Farm Gate',
    details: 'Visual inspection shows produce moisture higher than self-declared Grade A spec.',
    raised_by: 'Buyer'
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  const loadData = async () => {
    try {
      const txData = await fetchTransactions();
      const grData = await fetchGrievances();
      setTransactions(txData);
      setGrievances(grData);
    } catch (err) {
      console.error('Error loading transactions:', err);
    }
  };

  const getStageIndex = (status) => {
    return STAGES.findIndex((s) => s.key === status);
  };

  const handleAdvanceStatus = async (txId, currentStatus) => {
    const currentIndex = getStageIndex(currentStatus);
    if (currentIndex < STAGES.length - 1) {
      const nextStatus = STAGES[currentIndex + 1].key;
      try {
        await updateTransactionStatus(txId, nextStatus);
        loadData();
        if (onStatusChanged) onStatusChanged();
      } catch (err) {
        alert('Error updating status: ' + err.message);
      }
    }
  };

  const handleOpenDispute = (tx) => {
    setSelectedTx(tx);
    setShowDisputeModal(true);
  };

  const handleSubmitDispute = async (e) => {
    e.preventDefault();
    if (!selectedTx) return;
    setSubmitting(true);
    try {
      await createGrievance({
        transaction_id: selectedTx.id,
        raised_by: disputeForm.raised_by,
        issue_type: disputeForm.issue_type,
        details: disputeForm.details
      });
      alert(`Grievance logged for Transaction #${selectedTx.id}. Status changed to Disputed.`);
      setShowDisputeModal(false);
      loadData();
      if (onStatusChanged) onStatusChanged();
    } catch (err) {
      alert('Error creating grievance: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-xl border border-slate-700">
        <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          End-to-End Execution & Transparency
        </div>
        <h2 className="text-2xl font-bold mt-1">Transaction Lifecycle & Grievance Resolution Desk</h2>
        <p className="text-sm text-slate-300 mt-1 max-w-2xl">
          Track verified farm-gate transactions from initial digital offer through pickup coordination, escrow payment tracking, and formal dispute handling.
        </p>
      </div>

      {/* Transaction Pipeline Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
            <Truck className="w-5 h-5 text-indigo-600" />
            Active Transaction Pipeline
          </h3>
          <span className="text-xs text-slate-500 bg-slate-200 px-2.5 py-1 rounded-full font-semibold">
            {transactions.length} Total Contracts
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-slate-500 border border-slate-200">
            No transactions found. Send an offer from the Buyer Portal or WhatsApp simulator.
          </div>
        ) : (
          transactions.map((tx) => {
            const currentStageIdx = getStageIndex(tx.status);
            const isDisputed = tx.status === 'disputed';

            return (
              <div 
                key={tx.id}
                className={`bg-white rounded-2xl p-5 border transition shadow-sm ${
                  isDisputed ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                }`}
              >
                {/* Transaction Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="bg-slate-900 text-white text-xs font-mono font-bold px-2 py-0.5 rounded">
                        TX-#{tx.id}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">
                        {tx.quantity_quintals} Qtl {tx.crop}
                      </h4>
                      {isDisputed ? (
                        <span className="bg-rose-100 text-rose-800 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Disputed / On Hold
                        </span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold capitalize">
                          {tx.status.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Farmer: <strong className="text-slate-800">{tx.farmer_name}</strong> • Buyer: <strong className="text-slate-800">{tx.buyer_name}</strong>
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <div className="text-xs text-slate-500">Contract Total</div>
                    <div className="text-lg font-black text-slate-900">
                      ₹{tx.total_amount.toLocaleString()} 
                      <span className="text-xs font-normal text-slate-500"> (@₹{tx.offered_price}/qtl)</span>
                    </div>
                  </div>
                </div>

                {/* Stepper Progress Bar */}
                <div className="py-4">
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                    {STAGES.map((stg, i) => {
                      const isCompleted = currentStageIdx >= i && !isDisputed;
                      const isCurrent = currentStageIdx === i && !isDisputed;

                      return (
                        <div 
                          key={stg.key}
                          className={`rounded-xl p-2 text-center text-xs font-medium border transition ${
                            isCompleted
                              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                              : isCurrent
                              ? 'bg-indigo-50 text-indigo-900 border-indigo-500 font-bold ring-2 ring-indigo-200'
                              : isDisputed && i === currentStageIdx
                              ? 'bg-rose-100 text-rose-900 border-rose-400 font-bold'
                              : 'bg-slate-50 text-slate-400 border-slate-200'
                          }`}
                        >
                          <div className="text-[10px] font-mono text-slate-500">Step {i + 1}</div>
                          <div className="text-xs mt-0.5 truncate">{stg.label}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-slate-500">
                    Status: <strong className="text-slate-800 capitalize">{tx.status.replace('_', ' ')}</strong>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isDisputed && currentStageIdx < STAGES.length - 1 && (
                      <button
                        onClick={() => handleAdvanceStatus(tx.id, tx.status)}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1"
                      >
                        Advance to {STAGES[currentStageIdx + 1]?.label} <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {!isDisputed && (
                      <button
                        onClick={() => handleOpenDispute(tx)}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold px-3 py-1.5 rounded-lg text-xs transition border border-rose-200 flex items-center gap-1"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Raise Grievance / Dispute
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Grievance & Dispute Log */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              Audited Dispute & Grievance Records
            </h3>
            <p className="text-xs text-slate-500">
              Directly fulfills SIH requirement for transparent dispute resolution between farmers and buyers
            </p>
          </div>
          <span className="text-xs font-semibold bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full">
            {grievances.length} Logged
          </span>
        </div>

        {grievances.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No active disputes logged.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {grievances.map((gr) => (
              <div key={gr.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      Case #{gr.id} • TX-#{gr.transaction_id}
                    </span>
                    <strong className="text-xs text-slate-900">{gr.issue_type}</strong>
                    <span className="text-[11px] text-slate-500">(Raised by {gr.raised_by})</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{gr.details}</p>
                </div>
                <div>
                  <span className="text-[11px] font-bold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {gr.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Raise Grievance */}
      {showDisputeModal && selectedTx && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Raise Grievance on TX-#{selectedTx.id}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Produce: {selectedTx.quantity_quintals} Qtl {selectedTx.crop} • Farmer: {selectedTx.farmer_name}
            </p>

            <form onSubmit={handleSubmitDispute} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Reporting Party</label>
                <select
                  value={disputeForm.raised_by}
                  onChange={(e) => setDisputeForm({ ...disputeForm, raised_by: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 mt-1"
                >
                  <option value="Buyer">Buyer</option>
                  <option value="Farmer">Farmer</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Issue Category</label>
                <select
                  value={disputeForm.issue_type}
                  onChange={(e) => setDisputeForm({ ...disputeForm, issue_type: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 mt-1"
                >
                  <option value="Quality Mismatch at Farm Gate">Quality Mismatch at Farm Gate</option>
                  <option value="Logistics / Truck Pickup Delay">Logistics / Truck Pickup Delay</option>
                  <option value="Payment Disbursal Discrepancy">Payment Disbursal Discrepancy</option>
                  <option value="Weight / Quantity Variance">Weight / Quantity Variance</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Specific Observations / Details</label>
                <textarea
                  rows={3}
                  required
                  value={disputeForm.details}
                  onChange={(e) => setDisputeForm({ ...disputeForm, details: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 mt-1 focus:ring-1 focus:ring-rose-500"
                ></textarea>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowDisputeModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 rounded-xl shadow"
                >
                  Confirm & Flag
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
