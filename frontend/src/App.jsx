import React, { useState, useEffect } from 'react';
import { 
  Smartphone, Building2, BarChart3, ShieldCheck, RefreshCw, 
  Layers, CheckCircle2, SplitSquareVertical, ExternalLink, Sparkles 
} from 'lucide-react';
import FarmerSimulator from './components/FarmerSimulator';
import BuyerPortal from './components/BuyerPortal';
import MandiIntelligence from './components/MandiIntelligence';
import TransactionTracker from './components/TransactionTracker';
import { fetchStats, resetDemoState } from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState('split'); // default to split mode for judges
  const [stats, setStats] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    loadStats();
  }, [refreshTrigger]);

  const loadStats = async () => {
    try {
      const data = await fetchStats();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleTriggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleResetData = async () => {
    if (!window.confirm('Reset demo state back to default Maharashtra APMC dataset?')) return;
    setResetting(true);
    try {
      await resetDemoState();
      handleTriggerRefresh();
      alert('AgriConnect demo data reloaded.');
    } catch (err) {
      alert('Error resetting demo: ' + err.message);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Header Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo & Title */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-2xl shadow-md">
                🌾
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-extrabold text-slate-900 text-lg tracking-tight">AgriConnect</h1>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    SIH26132
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 hidden sm:block">
                  Govt. of Maharashtra • Market Linkages, Price Discovery & Aggregation
                </p>
              </div>
            </div>

            {/* Quick KPI summary badges */}
            {stats && (
              <div className="hidden xl:flex items-center space-x-4 text-xs">
                <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 flex items-center gap-2">
                  <span className="text-slate-500">Available Produce:</span>
                  <strong className="text-slate-900 font-bold">{stats.total_volume_available_qtl} Qtl</strong>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 flex items-center gap-2">
                  <span className="text-slate-500">Active Demands:</span>
                  <strong className="text-indigo-600 font-bold">{stats.active_demands}</strong>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 flex items-center gap-2">
                  <span className="text-slate-500">Contracts:</span>
                  <strong className="text-emerald-700 font-bold">{stats.total_transactions}</strong>
                </div>
              </div>
            )}

            {/* Reset Button */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleResetData}
                disabled={resetting}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-3 py-1.5 rounded-lg border border-slate-300 transition flex items-center gap-1.5"
                title="Reset database to initial demo state"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Reset Demo</span>
              </button>
            </div>
          </div>

          {/* Navigation Bar Tabs */}
          <div className="flex space-x-1 sm:space-x-2 overflow-x-auto border-t border-slate-100 py-1.5 scrollbar-none">
            <button
              onClick={() => setActiveTab('split')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'split'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <SplitSquareVertical className="w-4 h-4" />
              ⚡ Split Screen Demo (Judge View)
            </button>

            <button
              onClick={() => setActiveTab('farmer')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'farmer'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Smartphone className="w-4 h-4 text-emerald-400" />
              Farmer WhatsApp / Voice
            </button>

            <button
              onClick={() => setActiveTab('buyer')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'buyer'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Building2 className="w-4 h-4 text-indigo-400" />
              Buyer Demand & Aggregation
            </button>

            <button
              onClick={() => setActiveTab('intelligence')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'intelligence'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              Mandi Net-Price Discovery
            </button>

            <button
              onClick={() => setActiveTab('transactions')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'transactions'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              Transaction Lifecycle & Disputes
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* TAB 1: SPLIT SCREEN DEMO (Perfect for judges: Farmer phone on left, Buyer dashboard on right!) */}
        {activeTab === 'split' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between text-xs text-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>
                  <strong>Hackathon Live Mode:</strong> Send an offer from the <strong>Buyer Desk on the right</strong> or create a lot in the <strong>Farmer WhatsApp on the left</strong> to watch the closed loop in real time!
                </span>
              </div>
              <span className="font-mono bg-white px-2 py-0.5 rounded border border-emerald-300 font-bold text-emerald-800">
                LIVE DUAL STREAM
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Farmer Phone (5 cols) */}
              <div className="lg:col-span-5">
                <div className="sticky top-28">
                  <FarmerSimulator 
                    onLotCreated={handleTriggerRefresh} 
                    refreshTrigger={refreshTrigger} 
                  />
                </div>
              </div>

              {/* Right Column: Buyer Portal (7 cols) */}
              <div className="lg:col-span-7">
                <BuyerPortal 
                  refreshTrigger={refreshTrigger} 
                  onOfferCreated={handleTriggerRefresh} 
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FARMER WHATSAPP BOT FULL VIEW */}
        {activeTab === 'farmer' && (
          <div className="max-w-xl mx-auto">
            <FarmerSimulator 
              onLotCreated={handleTriggerRefresh} 
              refreshTrigger={refreshTrigger} 
            />
          </div>
        )}

        {/* TAB 3: BUYER DEMANDS & AGGREGATION FULL VIEW */}
        {activeTab === 'buyer' && (
          <BuyerPortal 
            refreshTrigger={refreshTrigger} 
            onOfferCreated={handleTriggerRefresh} 
          />
        )}

        {/* TAB 4: MANDI INTELLIGENCE */}
        {activeTab === 'intelligence' && (
          <MandiIntelligence />
        )}

        {/* TAB 5: TRANSACTIONS & DISPUTES */}
        {activeTab === 'transactions' && (
          <TransactionTracker 
            refreshTrigger={refreshTrigger} 
            onStatusChanged={handleTriggerRefresh} 
          />
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 text-center text-xs text-slate-500">
        <p>AgriConnect • SIH26132 Prototype • Government of Maharashtra Agricultural Sourcing Architecture</p>
      </footer>
    </div>
  );
}
