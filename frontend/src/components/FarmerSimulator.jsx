import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Mic, CheckCheck, MapPin, TrendingUp, TrendingDown, 
  Store, AlertCircle, CheckCircle2, ChevronRight, PhoneCall,
  Sparkles, RefreshCw, Layers, Volume2
} from 'lucide-react';
import { sendFarmerChat, createLot, updateTransactionStatus } from '../api';

export default function FarmerSimulator({ onLotCreated, refreshTrigger }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      time: '10:00 AM',
      text: 'Namaste Ramesh ji! 🙏 Welcome to AgriConnect.\n\nYou can query Mandi rates in Marathi, Hindi or English, ask for sell vs hold advisory, or list your harvest directly for institutional buyers.\n\nType below or select a common inquiry.',
      type: 'welcome'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeAdvisory, setActiveAdvisory] = useState(null);
  const [pendingOffers, setPendingOffers] = useState([]);
  const [lotCreatedSuccess, setLotCreatedSuccess] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, pendingOffers]);

  useEffect(() => {
    checkIncomingOffers();
  }, [refreshTrigger]);

  const checkIncomingOffers = async () => {
    try {
      const res = await sendFarmerChat('status_check', '+91-98230-11223', 'Ramesh Patil');
      if (res.pending_offers && res.pending_offers.length > 0) {
        setPendingOffers(res.pending_offers);
      }
    } catch (err) {
      console.error('Error fetching offers:', err);
    }
  };

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: text
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const res = await sendFarmerChat(text, '+91-98230-11223', 'Ramesh Patil');
      
      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: res.chat_response,
        advisory: res.advisory,
        extracted: res.extracted_data
      };

      setMessages((prev) => [...prev, botMsg]);
      if (res.advisory) {
        setActiveAdvisory(res);
      }
      if (res.pending_offers) {
        setPendingOffers(res.pending_offers);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: 'Connection timeout. Please verify that the platform service is responsive.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const simulateVoiceInput = (sampleText) => {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      handleSendMessage(sampleText);
    }, 1000);
  };

  const handleListProduce = async (extracted, advisory) => {
    setLoading(true);
    try {
      const payload = {
        farmer_name: extracted.farmer_name || 'Ramesh Patil',
        phone: extracted.farmer_phone || '+91-98230-11223',
        village: extracted.location.split(',')[0].trim(),
        district: extracted.location.includes(',') ? extracted.location.split(',')[1].trim() : 'Nashik',
        crop: extracted.crop,
        variety: 'Garwa Premium',
        quantity_quintals: extracted.quantity_quintals,
        grade: extracted.grade,
        expected_price: advisory?.best_market?.net_price_per_qtl || 2800
      };

      const res = await createLot(payload);
      setLotCreatedSuccess(res.lot);
      
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: 'bot',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: `✅ *Harvest Listed Successfully!*\n\n• Lot ID: #${res.lot.id}\n• Commodity: ${res.lot.crop} (${res.lot.grade})\n• Quantity: ${res.lot.quantity_quintals} Quintals\n• Expected Price: ₹${res.lot.expected_price}/qtl\n\nYour lot is now published to verified institutional buyers and queued for regional smallholder aggregation. Inbound purchase offers will notify you right here.`,
          isConfirmation: true
        }
      ]);

      if (onLotCreated) onLotCreated(res.lot);
    } catch (err) {
      alert('Failed to list lot: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOfferAction = async (txId, newStatus) => {
    setLoading(true);
    try {
      await updateTransactionStatus(txId, newStatus);
      setPendingOffers((prev) => prev.filter((o) => o.transaction_id !== txId));
      
      const statusText = newStatus === 'offer_accepted' 
        ? '✅ *Purchase Contract Accepted!*\nPickup transport has been dispatched by the buyer. Track journey in the Contracts Desk.' 
        : '❌ Purchase offer declined.';
        
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: 'bot',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: statusText
        }
      ]);
      if (onLotCreated) onLotCreated();
    } catch (err) {
      alert('Error updating offer: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-1 sm:p-2">
      {/* Smartphone Outer Shell */}
      <div className="w-full max-w-md bg-slate-900 rounded-[3rem] p-3.5 shadow-2xl shadow-slate-900/30 border border-slate-800 ring-1 ring-white/10">
        
        {/* Dynamic Island / Speaker */}
        <div className="relative flex justify-center items-center pb-2 pt-1">
          <div className="w-24 h-4 bg-slate-950 rounded-full flex items-center justify-center space-x-2 border border-slate-800">
            <div className="w-2.5 h-2.5 bg-slate-900 rounded-full border border-slate-800"></div>
            <div className="w-9 h-1 bg-slate-800 rounded-full"></div>
          </div>
        </div>

        {/* WhatsApp App Container */}
        <div className="bg-[#eae6df] rounded-[2.2rem] overflow-hidden flex flex-col h-[670px] shadow-inner border border-slate-300/40">
          
          {/* WhatsApp Header */}
          <div className="bg-[#005c4b] text-white px-4 py-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-emerald-800 flex items-center justify-center text-xl font-bold border-2 border-emerald-400/80 shadow-xs">
                  🌾
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#005c4b]"></div>
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-sm tracking-tight text-white">AgriConnect Assistant</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 fill-emerald-300" />
                </div>
                <p className="text-[11px] text-emerald-100/90 flex items-center gap-1.5 font-medium">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                  Official WhatsApp Channel
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1.5">
              <button 
                onClick={checkIncomingOffers} 
                title="Refresh messages"
                className="p-2 hover:bg-emerald-800/80 active:scale-95 rounded-full transition text-emerald-100"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sub-banner: Active Farmer Profile */}
          <div className="bg-amber-50/90 border-b border-amber-200/80 px-4 py-2 flex items-center justify-between text-xs text-amber-900 backdrop-blur-xs">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-900">👨‍🌾 Ramesh Patil</span>
              <span className="text-amber-400 font-bold">•</span>
              <span className="text-slate-600 font-medium">Niphad, Nashik</span>
            </div>
            <span className="text-[10px] bg-emerald-100/90 text-emerald-800 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-emerald-200">
              Verified Farmer
            </span>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-[#efeae2]/90">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs shadow-xs whitespace-pre-line leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-[#d9fdd3] text-slate-800 rounded-tr-xs'
                      : 'bg-white text-slate-800 rounded-tl-xs border border-slate-200/70'
                  }`}
                >
                  <div>{m.text}</div>

                  {/* Interactive advisory card */}
                  {m.advisory && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-2">
                      <div className="bg-emerald-50 rounded-xl p-2.5 border border-emerald-200/80 shadow-xs">
                        <div className="flex items-center justify-between text-emerald-950 font-bold text-xs">
                          <span className="flex items-center gap-1">🏆 {m.advisory.best_market.market}</span>
                          <span className="text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md font-extrabold">
                            ₹{m.advisory.best_market.net_price_per_qtl}/qtl Net
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 mt-1.5 flex justify-between font-medium">
                          <span>Transit: {m.advisory.best_market.distance_km} km</span>
                          <span className="text-rose-700 font-semibold">Freight: -₹{m.advisory.best_market.transport_cost_per_qtl}/qtl</span>
                        </div>
                      </div>

                      {/* Sell vs Hold Advisory */}
                      <div className={`p-2.5 rounded-xl text-[11px] font-medium flex items-start gap-2 border ${
                        m.advisory.recommendation.type === 'HOLD_RECOMMENDED'
                          ? 'bg-blue-50 text-blue-950 border-blue-200'
                          : m.advisory.recommendation.type === 'SELL_NOW'
                          ? 'bg-amber-50 text-amber-950 border-amber-200'
                          : 'bg-slate-50 text-slate-800 border-slate-200'
                      }`}>
                        {m.advisory.recommendation.type === 'HOLD_RECOMMENDED' ? (
                          <TrendingUp className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="font-bold">{m.advisory.recommendation.headline}</div>
                          <div className="text-[10px] text-slate-600 mt-0.5 leading-snug">{m.advisory.recommendation.reasoning}</div>
                        </div>
                      </div>

                      {/* Button to Publish Lot */}
                      <button
                        onClick={() => handleListProduce(m.extracted, m.advisory)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        Publish Lot for Institutional Buyers
                      </button>
                    </div>
                  )}

                  <div className="text-[9px] text-slate-400 text-right mt-1.5 flex items-center justify-end space-x-1">
                    <span>{m.time}</span>
                    {m.sender === 'user' && <CheckCheck className="w-3.5 h-3.5 text-blue-500 inline" />}
                  </div>
                </div>
              </div>
            ))}

            {/* Inbound Buyer Offers */}
            {pendingOffers.map((offer) => (
              <div key={offer.transaction_id} className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-400/90 rounded-2xl p-3.5 shadow-md">
                <div className="flex items-center justify-between text-xs font-bold text-amber-950">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                    DIRECT PURCHASE OFFER
                  </span>
                  <span className="bg-amber-200 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Lot #{offer.transaction_id}
                  </span>
                </div>
                <div className="text-xs text-slate-700 mt-2 space-y-1 bg-white/70 p-2.5 rounded-xl border border-amber-200/50">
                  <p><span className="text-slate-500">Buyer Entity:</span> <strong className="text-slate-900">{offer.buyer_name}</strong></p>
                  <p><span className="text-slate-500">Volume:</span> <strong className="text-slate-900">{offer.quantity} Qtl {offer.crop}</strong></p>
                  <p><span className="text-slate-500">Offered Rate:</span> <strong className="text-emerald-700 font-extrabold text-sm">₹{offer.offered_price}/qtl</strong></p>
                  <p><span className="text-slate-500">Total Settlement:</span> <strong className="text-slate-900 font-bold">₹{offer.total_amount.toLocaleString()}</strong></p>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => handleOfferAction(offer.transaction_id, 'offer_accepted')}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-2 rounded-xl text-xs transition shadow-xs"
                  >
                    Accept Contract
                  </button>
                  <button
                    onClick={() => handleOfferAction(offer.transaction_id, 'rejected')}
                    className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-1.5 px-2 rounded-xl text-xs transition"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center space-x-2 text-xs text-slate-600 bg-white/90 w-fit px-3.5 py-1.5 rounded-full shadow-xs border border-slate-200">
                <div className="w-2 h-2 bg-emerald-600 rounded-full animate-ping"></div>
                <span className="font-medium">Evaluating regional APMC Mandis...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Query Suggestion Chips */}
          <div className="bg-white px-2.5 py-2 border-t border-slate-200/80 overflow-x-auto flex space-x-2 scrollbar-none">
            <button
              onClick={() => simulateVoiceInput("I have 25 quintals of onion in Niphad Nashik grade A")}
              className="text-[11px] bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 px-3 py-1 rounded-full whitespace-nowrap border border-slate-200 transition font-medium"
            >
              🧅 25q Onion (Niphad)
            </button>
            <button
              onClick={() => simulateVoiceInput("mere paas 40 quintal soybean hai Latur me kya rate milega")}
              className="text-[11px] bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 px-3 py-1 rounded-full whitespace-nowrap border border-slate-200 transition font-medium"
            >
              🌱 40q Soybean (Latur)
            </button>
            <button
              onClick={() => simulateVoiceInput("majhyakade 35 quintal kanda ahe Lasalgaon")}
              className="text-[11px] bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 px-3 py-1 rounded-full whitespace-nowrap border border-slate-200 transition font-medium"
            >
              🇮🇳 मराठी: ३५ क्विंटल कांदा
            </button>
            <button
              onClick={() => simulateVoiceInput("30 quintal tomato in Pimpalgaon Nashik sell or wait")}
              className="text-[11px] bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 px-3 py-1 rounded-full whitespace-nowrap border border-slate-200 transition font-medium"
            >
              🍅 30q Tomato
            </button>
          </div>

          {/* WhatsApp Message Input Bar */}
          <div className="bg-[#f0f2f5] px-3 py-2.5 border-t border-slate-300 flex items-center space-x-2">
            <button
              onClick={() => simulateVoiceInput("I have 20 quintals of Onion in Niphad Nashik")}
              className={`p-2.5 rounded-full transition ${
                isRecording 
                  ? 'bg-rose-500 text-white animate-pulse' 
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
              title="Voice recording simulation"
            >
              <Mic className="w-4 h-4" />
            </button>

            <input
              type="text"
              placeholder={isRecording ? "Listening to voice in Marathi/Hindi..." : "Type in Marathi, Hindi or English..."}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1 bg-white rounded-full px-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 border border-slate-200 shadow-xs"
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim()}
              className="p-2.5 bg-[#00a884] hover:bg-[#008f6f] disabled:opacity-40 text-white rounded-full transition shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
      
      <p className="text-[11px] text-slate-400 mt-3 text-center max-w-sm font-medium">
        Multilingual Natural Language Processing with voice input support
      </p>
    </div>
  );
}
