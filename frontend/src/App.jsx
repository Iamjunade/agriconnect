import React, { useState, useEffect } from 'react';
import { 
  Smartphone, Building2, BarChart3, ShieldCheck, RefreshCw, 
  Layers, CheckCircle2, SplitSquareVertical, ExternalLink, Sparkles,
  TrendingUp, Activity, CheckCircle, ChevronRight, HelpCircle, ArrowUpRight,
  Globe2, Shield, HeartHandshake, Leaf
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
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white relative overflow-x-hidden">
      
      {/* Background ambient lighting effects */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[350px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none -z-10"></div>
      <div className="fixed bottom-10 right-10 w-[500px] h-[400px] bg-indigo-500/10 rounded-full blur-[160px] pointer-events-none -z-10"></div>
      <div className="fixed top-1/2 right-1/4 w-[400px] h-[300px] bg-teal-500/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>

      {/* Top Banner Notice: Govt of Maharashtra Initiative */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900/90 to-emerald-950/80 border-b border-emerald-500/20 px-4 py-1.5 text-center text-[11px] font-medium text-emerald-300/90 flex items-center justify-center gap-2">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>Govt. of Maharashtra Agricultural Marketing Initiative</span>
        <span className="text-slate-600 hidden sm:inline">•</span>
        <span className="text-slate-400 hidden sm:inline">Unified APMC Mandi Linkages, Real-Time Haversine Freight & Dynamic Smallholder Pooling</span>
      </div>

      {/* Modern Header Navigation */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Brand Logo & Tagline */}
            <div className="flex items-center space-x-3.5">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-teal-500 rounded-2xl blur opacity-40 group-hover:opacity-75 transition duration-300"></div>
                <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-slate-950 p-[1px] shadow-lg">
                  <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center text-2xl font-black">
                    🌾
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="font-extrabold text-white text-2xl tracking-tight leading-none flex items-center">
                    Agri<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200">Connect</span>
                  </h1>
                  <span className="inline-flex items-center gap-1.5 bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-inner">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    ACTIVE DEPLOYMENT
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block font-medium mt-1">
                  Intelligent Price Discovery & Dynamic Smallholder Aggregation Desk
                </p>
              </div>
            </div>

            {/* Live Metrics Header Hub */}
            {stats && (
              <div className="hidden xl:flex items-center space-x-3 text-xs">
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-2 flex items-center gap-3 shadow-inner">
                  <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Available Produce</div>
                    <div className="text-white font-extrabold text-sm">{stats.total_volume_available_qtl} <span className="text-xs text-slate-400 font-normal">Qtl</span></div>
                  </div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-2 flex items-center gap-3 shadow-inner">
                  <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Buyer Demands</div>
                    <div className="text-indigo-300 font-extrabold text-sm">{stats.active_demands} <span className="text-xs text-slate-400 font-normal">Active</span></div>
                  </div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-2 flex items-center gap-3 shadow-inner">
                  <div className="w-2 h-2 rounded-full bg-teal-400"></div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Disbursed Contracts</div>
                    <div className="text-teal-300 font-extrabold text-sm">{stats.total_transactions} <span className="text-xs text-slate-400 font-normal">Deals</span></div>
                  </div>
                </div>
              </div>
            )}

            {/* Live Sync Action Button */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSyncData}
                disabled={refreshing}
                className="group relative inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-200 bg-slate-900 hover:bg-slate-850 active:scale-95 border border-slate-800 hover:border-emerald-500/50 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-emerald-500/10"
                title="Sync database and APMC Mandi updates"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${refreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                <span>{refreshing ? 'Refreshing...' : 'Live Sync'}</span>
              </button>
            </div>
          </div>

          {/* Navigation Bar Tabs */}
          <div className="flex space-x-1.5 sm:space-x-2 overflow-x-auto border-t border-slate-800/80 py-2.5 scrollbar-none">
            <button
              onClick={() => setActiveTab('split')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 whitespace-nowrap ${
                activeTab === 'split'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
              }`}
            >
              <SplitSquareVertical className="w-4 h-4" />
              Unified Marketplace & Chat
            </button>

            <button
              onClick={() => setActiveTab('farmer')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 whitespace-nowrap ${
                activeTab === 'farmer'
                  ? 'bg-slate-800 text-white shadow-lg border border-slate-700'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
              }`}
            >
              <Smartphone className="w-4 h-4 text-emerald-400" />
              Farmer WhatsApp & Voice Bot
            </button>

            <button
              onClick={() => setActiveTab('buyer')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 whitespace-nowrap ${
                activeTab === 'buyer'
                  ? 'bg-slate-800 text-white shadow-lg border border-slate-700'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4 text-indigo-400" />
              Buyer Sourcing & Pooling
            </button>

            <button
              onClick={() => setActiveTab('intelligence')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 whitespace-nowrap ${
                activeTab === 'intelligence'
                  ? 'bg-slate-800 text-white shadow-lg border border-slate-700'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-teal-400" />
              APMC Net-Price Discovery
            </button>

            <button
              onClick={() => setActiveTab('transactions')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 whitespace-nowrap ${
                activeTab === 'transactions'
                  ? 'bg-slate-800 text-white shadow-lg border border-slate-700'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Contract Pipeline & Disputes
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* TAB 1: SPLIT SCREEN INTERACTIVE DESK */}
        {activeTab === 'split' && (
          <div className="space-y-6">
            
            {/* Sub-hero notification banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950/60 via-slate-900/90 to-indigo-950/60 border border-emerald-500/20 p-4 sm:p-5 shadow-2xl backdrop-blur-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/30 shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-white font-extrabold text-sm sm:text-base tracking-tight">
                      End-to-End Market Linkage Architecture
                    </h2>
                    <p className="text-slate-400 text-xs font-normal mt-0.5">
                      Interact with the multilingual WhatsApp assistant on the left, or dispatch binding contracts directly from the Institutional Buyer Desk on the right.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                  <span className="font-mono text-[11px] bg-emerald-950/90 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-xl font-bold shadow-inner">
                    ⚡ Live Bi-Directional
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Panel: WhatsApp Smartphone Simulator (5 cols) */}
              <div className="lg:col-span-5">
                <div className="sticky top-28">
                  <FarmerSimulator 
                    onLotCreated={handleTriggerRefresh} 
                    refreshTrigger={refreshTrigger} 
                  />
                </div>
              </div>

              {/* Right Panel: Institutional Buyer Desk (7 cols) */}
              <div className="lg:col-span-7">
                <BuyerPortal 
                  refreshTrigger={refreshTrigger} 
                  onOfferCreated={handleTriggerRefresh} 
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FARMER WHATSAPP BOT FULL SCREEN */}
        {activeTab === 'farmer' && (
          <div className="max-w-xl mx-auto py-4">
            <FarmerSimulator 
              onLotCreated={handleTriggerRefresh} 
              refreshTrigger={refreshTrigger} 
            />
          </div>
        )}

        {/* TAB 3: BUYER SOURCING PORTAL */}
        {activeTab === 'buyer' && (
          <BuyerPortal 
            refreshTrigger={refreshTrigger} 
            onOfferCreated={handleTriggerRefresh} 
          />
        )}

        {/* TAB 4: APMC MANDI INTELLIGENCE */}
        {activeTab === 'intelligence' && (
          <MandiIntelligence />
        )}

        {/* TAB 5: TRANSACTION PIPELINE & DISPUTES */}
        {activeTab === 'transactions' && (
          <TransactionTracker 
            refreshTrigger={refreshTrigger} 
            onStatusChanged={handleTriggerRefresh} 
          />
        )}

      </main>

      {/* Global Modern Footer */}
      <footer className="mt-16 border-t border-slate-800/80 bg-slate-950/70 backdrop-blur-md py-8 px-4 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-xl bg-emerald-600 flex items-center justify-center text-sm">
              🌾
            </div>
            <div>
              <div className="text-white font-extrabold text-sm">AgriConnect Maharashtra</div>
              <div className="text-[11px] text-slate-500">Strengthening Market Linkages, Price Discovery & Smallholder Aggregation</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-[11px] text-slate-400 font-medium">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Shield className="w-3.5 h-3.5" /> e-NAM Unified
            </span>
            <span className="flex items-center gap-1.5 text-teal-400">
              <Globe2 className="w-3.5 h-3.5" /> 8 Maharashtra Mandis
            </span>
            <span className="flex items-center gap-1.5 text-indigo-400">
              <HeartHandshake className="w-3.5 h-3.5" /> Direct Farm Gate Sourcing
            </span>
          </div>

          <div className="text-[11px] text-slate-500 text-center md:text-right">
            Deployed on Vercel Edge • FastAPI & React
          </div>
        </div>
      </footer>
    </div>
  );
}
