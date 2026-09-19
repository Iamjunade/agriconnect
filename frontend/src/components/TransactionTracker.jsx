import React, { useState, useEffect } from 'react';
import { 
  Truck, CheckCircle, Clock, AlertTriangle, ShieldCheck, 
  ArrowRight, FileText, ChevronRight, DollarSign, MessageSquare, AlertCircle, CheckCircle2
} from 'lucide-react';
import { fetchTransactions, updateTransactionStatus, fetchGrievances, createGrievance } from '../api';

const STAGES = [
  { key: 'offer_sent', label: 'Contract Issued' },
  { key: 'offer_accepted', label: 'Farmer Accepted' },
  { key: 'pickup_scheduled', label: 'Logistics Scheduled' },
  { key: 'in_transit', label: 'Produce In Transit' },
  { key: 'payment_initiated', label: 'Escrow Initiated' },
  { key: 'settled', label: 'Disbursed & Settled' }
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
      alert(`Grievance formally lodged for Contract #${selectedTx.id}. Flagged for APMC review.`);
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
      <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-800 relative overflow-hidden">
        <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          Execution Security & Trust Architecture
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1.5 text-white">
          Contract Lifecycle & Grievance Redressal
        </h2>
        <p className="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
          Immutable audit trail for farm-gate agricultural transactions. Monitor contract milestones from digital issuance to pickup coordination, escrow payment settlement, and formal dispute mediation.
        </p>
      </div>

      {/* Transaction Pipeline Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
            <Truck className="w-5 h-5 text-indigo-400" />
            Active Contracts Pipeline
          </h3>
          <span className="text-xs text-slate-400 bg-slate-800/80 border border-slate-700 px-3 py-1 rounded-full font-bold">
            {transactions.length} Total Contracts
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="bg-slate-900/80 rounded-3xl p-10 text-center text-slate-500 border border-slate-800 shadow-xl">
            No active contracts yet. Issue a direct offer from the Marketplace or Buyer Desk.
          </div>
        ) : (
          transactions.map((tx) => {
            const currentStageIdx = getStageIndex(tx.status);
            const isDisputed = tx.status === 'disputed';

            return (
              <div 
                key={tx.id}
                className={`bg-slate-900/90 rounded-3xl p-5 sm:p-6 border transition shadow-xl ${
                  isDisputed ? 'border-rose-500/40 bg-rose-950/20' : 'border-slate-800'
                }`}
              >
                {/* Transaction Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="bg-slate-800 text-slate-200 text-xs font-mono font-bold px-2.5 py-0.5 rounded-md border border-slate-700">
                        TX-#{tx.id}
                      </span>
                      <h4 className="font-extrabold text-white text-base">
                        {tx.quantity_quintals} Qtl {tx.crop}
                      </h4>
                      {isDisputed ? (
                        <span className="bg-rose-950 text-rose-300 border border-rose-500/30 text-xs px-3 py-0.5 rounded-full font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Disputed / Escrow Held
                        </span>
                      ) : (
                        <span className="bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-xs px-3 py-0.5 rounded-full font-bold capitalize">
                          {tx.status.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5 font-medium">
                      Farmer: <strong className="text-slate-200 font-bold">{tx.farmer_name}</strong> • Buyer: <strong className="text-slate-200 font-bold">{tx.buyer_name}</strong>
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <div className="text-xs text-slate-400">Contract Value</div>
                    <div className="text-xl sm:text-2xl font-black text-white">
                      ₹{tx.total_amount.toLocaleString()} 
                      <span className="text-xs font-semibold text-slate-400"> (@₹{tx.offered_price}/qtl)</span>
                    </div>
                  </div>
                </div>

                {/* Stepper Progress Bar */}
                <div className="py-4 sm:py-5">
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                    {STAGES.map((stg, i) => {
                      const isCompleted = currentStageIdx >= i && !isDisputed;
                      const isCurrent = currentStageIdx === i && !isDisputed;

                      return (
                        <div 
                          key={stg.key}
                          className={`rounded-2xl p-2.5 text-center text-xs font-medium border transition ${
                            isCompleted
                              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 font-semibold'
                              : isCurrent
                              ? 'bg-indigo-950/80 text-indigo-300 border-indigo-500 font-extrabold ring-2 ring-indigo-500/30 shadow-lg shadow-indigo-500/10'
                              : isDisputed && i === currentStageIdx
                              ? 'bg-rose-950 text-rose-300 border-rose-500 font-bold'
                              : 'bg-slate-850/60 text-slate-500 border-slate-800'
                          }`}
                        >
                          <div className="text-[10px] font-mono text-slate-500 font-semibold">Stage {i + 1}</div>
                          <div className="text-xs mt-1 truncate">{stg.label}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-slate-400 font-medium">
                    Current Milestone: <strong className="text-white capitalize font-bold">{tx.status.replace('_', ' ')}</strong>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isDisputed && currentStageIdx < STAGES.length - 1 && (
                      <button
                        onClick={() => handleAdvanceStatus(tx.id, tx.status)}
                        className="bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition flex items-center gap-1.5 border border-slate-700 shadow-md"
                      >
                        Advance to {STAGES[currentStageIdx + 1]?.label} <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {!isDisputed && (
                      <button
                        onClick={() => handleOpenDispute(tx)}
                        className="bg-rose-950/50 hover:bg-rose-900/60 active:scale-95 text-rose-300 font-bold px-3.5 py-2 rounded-xl text-xs transition border border-rose-500/30 flex items-center gap-1.5"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Log Grievance / Dispute
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
      <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-7 border border-slate-800 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-white text-base flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-400" />
              Audited Dispute Records & Redressal Desk
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Transparent dispute logging with standardized escalation to APMC mediation officers.
            </p>
          </div>
          <span className="text-xs font-bold bg-rose-950 text-rose-300 border border-rose-500/30 px-3 py-1 rounded-full">
            {grievances.length} Logged
          </span>
        </div>

        {grievances.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center font-medium">No open grievances on record.</p>
        ) : (
          <div className="divide-y divide-slate-800">
            {grievances.map((gr) => (
              <div key={gr.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-xs font-bold text-rose-300 bg-rose-950 px-2.5 py-0.5 rounded-md border border-rose-500/30 font-mono">
                      Case #{gr.id} • TX-#{gr.transaction_id}
                    </span>
                    <strong className="text-xs text-white font-bold">{gr.issue_type}</strong>
                    <span className="text-[11px] text-slate-400 font-medium">(Raised by {gr.raised_by})</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 font-medium">{gr.details}</p>
                </div>
                <div>
                  <span className="text-[10px] font-black bg-amber-950 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full uppercase tracking-wider">
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
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-800 text-white">
            <h3 className="text-lg font-extrabold text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Log Formal Grievance • TX-#{selectedTx.id}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Produce: {selectedTx.quantity_quintals} Qtl {selectedTx.crop} • Farmer: {selectedTx.farmer_name}
            </p>

            <form onSubmit={handleSubmitDispute} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="font-bold text-slate-300">Reporting Party</label>
                <select
                  value={disputeForm.raised_by}
                  onChange={(e) => setDisputeForm({ ...disputeForm, raised_by: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 mt-1 text-xs font-semibold text-white focus:ring-2 focus:ring-rose-500/50"
                >
                  <option value="Buyer">Buyer</option>
                  <option value="Farmer">Farmer</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-300">Issue Category</label>
                <select
                  value={disputeForm.issue_type}
                  onChange={(e) => setDisputeForm({ ...disputeForm, issue_type: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 mt-1 text-xs font-semibold text-white focus:ring-2 focus:ring-rose-500/50"
                >
                  <option value="Quality Mismatch at Farm Gate">Quality Mismatch at Farm Gate</option>
                  <option value="Logistics / Truck Pickup Delay">Logistics / Truck Pickup Delay</option>
                  <option value="Payment Disbursal Discrepancy">Payment Disbursal Discrepancy</option>
                  <option value="Weight / Quantity Variance">Weight / Quantity Variance</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-300">Observations / Incident Details</label>
                <textarea
                  rows={3}
                  required
                  value={disputeForm.details}
                  onChange={(e) => setDisputeForm({ ...disputeForm, details: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 mt-1 focus:ring-2 focus:ring-rose-500/50 text-xs font-medium text-white focus:outline-none"
                ></textarea>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDisputeModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-rose-600/20 text-xs"
                >
                  Submit & Hold Escrow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
