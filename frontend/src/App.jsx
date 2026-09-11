import React, { useState, useEffect } from 'react';
import { 
  Smartphone, Building2, BarChart3, ShieldCheck, RefreshCw, 
  Layers, CheckCircle2, SplitSquareVertical, ExternalLink, Sparkles,
  TrendingUp, Activity, CheckCircle, ChevronRight, HelpCircle
} from 'lucide-react';
import FarmerSimulator from './components/FarmerSimulator';
import BuyerPortal from './components/BuyerPortal';
import MandiIntelligence from './components/MandiIntelligence';
import TransactionTracker from './components/TransactionTracker';
import { fetchStats, resetDemoState } from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState('split');
  const [stats, setStats] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

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

  const handleSyncData = async () => {
    setRefreshing(true);
    try {
      await resetDemoState();
      handleTriggerRefresh();
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setTimeout(() => setRefreshing(false), 600);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col text-slate-900 selection:bg-emerald-500 selection:text-white">
      {/* Top Header Navigation */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 backdrop-blur-md bg-white/95 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo & Title */}
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center text-xl shadow-md shadow-emerald-500/20 text-white font-black">
                🌾
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="font-extrabold text-slate-950 text-xl tracking-tight leading-none">
                    Agri<span className="text-emerald-600">Connect</span>
                  </h1>
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-200/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live Platform
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 hidden sm:block font-medium mt-0.5">
                  Maharashtra Agricultural Sourcing, Price Discovery & Smallholder Aggregation
                </p>
              </div>
            </div>

            {/* Quick KPI summary badges */}
            {stats && (
              <div className="hidden lg:flex items-center space-x-3 text-xs">
                <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl px-3.5 py-1.5 flex items-center gap-2 shadow-xs">
                  <span className="text-slate-500 font-medium">Available Lots:</span>
                  <strong className="text-slate-900 font-bold">{stats.total_volume_available_qtl} Qtl</strong>
                </div>
                <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl px-3.5 py-1.5 flex items-center gap-2 shadow-xs">
                  <span className="text-slate-500 font-medium">Buyer Demands:</span>
                  <strong className="text-indigo-600 font-bold">{stats.active_demands} active</strong>
                </div>
                <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl px-3.5 py-1.5 flex items-center gap-2 shadow-xs">
                  <span className="text-slate-500 font-medium">Executed Deals:</span>
                  <strong className="text-emerald-700 font-bold">{stats.total_transactions}</strong>
                </div>
              </div>
            )}

            {/* Live Data Sync Button */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSyncData}
                disabled={refreshing}
                className="text-xs bg-white hover:bg-slate-50 text-slate-700 font-semibold px-3 py-1.5 rounded-xl border border-slate-200 transition shadow-xs flex items-center gap-1.5 active:scale-95"
                title="Sync live platform data"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
                <span className="hidden sm:inline">Sync Data</span>
              </button>
            </div>
          </div>

          {/* Navigation Bar Tabs */}
          <div className="flex space-x-1 sm:space-x-2 overflow-x-auto border-t border-slate-100 py-2 scrollbar-none">
            <button
              onClick={() => setActiveTab('split')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'split'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <SplitSquareVertical className="w-4 h-4" />
              Interactive Marketplace & Bot
            </button>

            <button
              onClick={() => setActiveTab('farmer')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'farmer'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-4 h-4 text-emerald-500" />
              Farmer WhatsApp & Voice Intake
            </button>

            <button
              onClick={() => setActiveTab('buyer')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'buyer'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4 text-indigo-400" />
              Buyer Sourcing & Aggregation
            </button>

            <button
              onClick={() => setActiveTab('intelligence')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'intelligence'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              APMC Mandi Price Discovery
            </button>

            <button
              onClick={() => setActiveTab('transactions')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'transactions'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              Contracts & Dispute Resolution
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* TAB 1: SPLIT VIEW */}
        {activeTab === 'split' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-800 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-950 text-sm block">Unified Sourcing & Discovery Loop</span>
                  <span className="text-slate-600">
                    Interact with the multilingual WhatsApp assistant on the left, or dispatch contracts directly from the Institutional Buyer Desk on the right.
                  </span>
                </div>
              </div>
              <span className="self-start sm:self-center font-mono text-[11px] bg-white px-3 py-1 rounded-lg border border-emerald-200 font-bold text-emerald-800 shrink-0 shadow-xs">
                Real-Time Synchronized
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
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
          <div className="max-w-xl mx-auto py-2">
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
      <footer className="bg-white border-t border-slate-200/80 py-6 px-4 text-center text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900">AgriConnect</span>
            <span>•</span>
            <span>Agricultural Sourcing & Market Discovery Infrastructure</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Unified with Maharashtra APMC Mandis & e-NAM Framework
          </div>
        </div>
      </footer>
    </div>
  );
}
