import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Mic, CheckCheck, MapPin, TrendingUp, TrendingDown, 
  Store, AlertCircle, CheckCircle2, ChevronRight, PhoneCall,
  Sparkles, RefreshCw, Layers
} from 'lucide-react';
import { sendFarmerChat, createLot, updateTransactionStatus } from '../api';

export default function FarmerSimulator({ onLotCreated, refreshTrigger }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      time: '10:00 AM',
      text: 'Namaste Ramesh ji! 🙏 Welcome to AgriConnect.\n\nYou can ask in Hindi, Marathi or English about Mandi prices, sell-now recommendations, or list your produce.\n\nTry sending a message or tap a quick query below.',
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

  // Check for incoming offers periodically or when refreshTrigger changes
  useEffect(() => {
    checkIncomingOffers();
  }, [refreshTrigger]);

  const checkIncomingOffers = async () => {
    try {
      // Fetch latest farmer status
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
          text: 'Server connection error. Please ensure backend is running.'
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
    }, 1200);
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
          text: `🎉 *Lot Created Successfully!*\n\n• Lot ID: #${res.lot.id}\n• Crop: ${res.lot.crop} (${res.lot.grade})\n• Quantity: ${res.lot.quantity_quintals} Qtl\n• Listed Price: ₹${res.lot.expected_price}/qtl\n\nYour lot is now visible to institutional buyers and available for smart aggregation! You will receive notification here when an offer arrives.`,
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
        ? '✅ *Offer Accepted!*\nPickup truck has been scheduled by the buyer. Digital tracking initiated.' 
        : '❌ Offer was declined.';
        
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
    <div className="flex flex-col items-center justify-center p-2 sm:p-4">
      {/* Smartphone Outer Shell */}
      <div className="w-full max-w-md bg-slate-900 rounded-[2.5rem] p-3 shadow-2xl border-4 border-slate-700">
        {/* Phone Notch & Speaker */}
        <div className="relative flex justify-center items-center py-1">
          <div className="w-24 h-4 bg-slate-800 rounded-full flex items-center justify-center space-x-2">
            <div className="w-2.5 h-2.5 bg-slate-700 rounded-full"></div>
            <div className="w-10 h-1 bg-slate-700 rounded-full"></div>
          </div>
        </div>

        {/* WhatsApp App Container */}
        <div className="bg-[#efeae2] rounded-[2rem] overflow-hidden flex flex-col h-[650px] shadow-inner border border-slate-300">
          
          {/* WhatsApp Header */}
          <div className="bg-[#075e54] text-white px-4 py-3 flex items-center justify-between shadow">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-emerald-700 flex items-center justify-center text-xl font-bold border-2 border-emerald-400">
                  🌾
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border border-white"></div>
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-semibold text-sm">AgriConnect Bot</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 fill-emerald-300" />
                </div>
                <p className="text-[11px] text-emerald-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-pulse"></span>
                  AI Mandi Advisory & Lots
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={checkIncomingOffers} 
                title="Check incoming offers"
                className="p-1.5 hover:bg-emerald-800 rounded-full transition"
              >
                <RefreshCw className="w-4 h-4 text-emerald-200" />
              </button>
              <div className="bg-emerald-800/80 px-2 py-0.5 rounded text-[11px] text-emerald-100 font-mono">
                SIH26132
              </div>
            </div>
          </div>

          {/* Sub-banner: Active Farmer Profile */}
          <div className="bg-amber-50 border-b border-amber-200 px-3 py-1.5 flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center space-x-1.5">
              <span className="font-medium">👨‍🌾 Ramesh Patil</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600">Niphad, Nashik</span>
            </div>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-semibold">
              Low-Literacy Voice Ready
            </span>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-[#efeae2]/90">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-xl px-3.5 py-2.5 text-xs shadow-sm whitespace-pre-line ${
                    m.sender === 'user'
                      ? 'bg-[#d9fdd3] text-slate-800 rounded-tr-none'
                      : 'bg-white text-slate-800 rounded-tl-none border border-slate-200'
                  }`}
                >
                  <div>{m.text}</div>

                  {/* If Bot returned an interactive advisory card */}
                  {m.advisory && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-2">
                      <div className="bg-emerald-50 rounded-lg p-2 border border-emerald-200">
                        <div className="flex items-center justify-between text-emerald-900 font-bold text-xs">
                          <span>🏆 {m.advisory.best_market.market}</span>
                          <span className="text-emerald-700">₹{m.advisory.best_market.net_price_per_qtl}/qtl Net</span>
                        </div>
                        <div className="text-[10px] text-slate-600 mt-1 flex justify-between">
                          <span>Dist: {m.advisory.best_market.distance_km} km</span>
                          <span>Freight: -₹{m.advisory.best_market.transport_cost_per_qtl}/qtl</span>
                        </div>
                      </div>

                      {/* Sell vs Hold Badge */}
                      <div className={`p-2 rounded-lg text-[11px] font-medium flex items-start gap-1.5 ${
                        m.advisory.recommendation.type === 'HOLD_RECOMMENDED'
                          ? 'bg-blue-50 text-blue-900 border border-blue-200'
                          : m.advisory.recommendation.type === 'SELL_NOW'
                          ? 'bg-amber-50 text-amber-900 border border-amber-200'
                          : 'bg-slate-50 text-slate-800 border border-slate-200'
                      }`}>
                        {m.advisory.recommendation.type === 'HOLD_RECOMMENDED' ? (
                          <TrendingUp className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="font-bold">{m.advisory.recommendation.headline}</div>
                          <div className="text-[10px] text-slate-600 mt-0.5">{m.advisory.recommendation.reasoning}</div>
                        </div>
                      </div>

                      {/* Interactive Button to Create Lot */}
                      <button
                        onClick={() => handleListProduce(m.extracted, m.advisory)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-1.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow transition"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        List as Active Lot for Buyers
                      </button>
                    </div>
                  )}

                  <div className="text-[9px] text-slate-400 text-right mt-1 flex items-center justify-end space-x-1">
                    <span>{m.time}</span>
                    {m.sender === 'user' && <CheckCheck className="w-3.5 h-3.5 text-blue-500 inline" />}
                  </div>
                </div>
              </div>
            ))}

            {/* Pending Inbound Buyer Offers (Real-time alert inside WhatsApp) */}
            {pendingOffers.map((offer) => (
              <div key={offer.transaction_id} className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-400 rounded-xl p-3 shadow-md animate-pulse">
                <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                  <span className="flex items-center gap-1">
                    🔔 INCOMING BUYER OFFER!
                  </span>
                  <span className="bg-amber-200 text-amber-800 text-[10px] px-1.5 py-0.5 rounded">
                    Lot #{offer.transaction_id}
                  </span>
                </div>
                <div className="text-xs text-slate-700 mt-1 space-y-0.5">
                  <p><span className="font-medium">Buyer:</span> {offer.buyer_name}</p>
                  <p><span className="font-medium">Crop:</span> {offer.quantity} Qtl {offer.crop}</p>
                  <p><span className="font-medium">Offered Rate:</span> <strong className="text-emerald-700 font-bold">₹{offer.offered_price}/qtl</strong></p>
                  <p><span className="font-medium">Total Deal Value:</span> <strong className="text-slate-900">₹{offer.total_amount.toLocaleString()}</strong></p>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => handleOfferAction(offer.transaction_id, 'offer_accepted')}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1 px-2 rounded text-xs transition"
                  >
                    Accept Deal
                  </button>
                  <button
                    onClick={() => handleOfferAction(offer.transaction_id, 'rejected')}
                    className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-1 px-2 rounded text-xs transition"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center space-x-1.5 text-xs text-slate-500 bg-white/80 w-fit px-3 py-1.5 rounded-full shadow-sm">
                <div className="w-2 h-2 bg-emerald-600 rounded-full animate-ping"></div>
                <span>Analyzing Mandis & Freight...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Query Suggestion Chips */}
          <div className="bg-white/95 px-2 py-1.5 border-t border-slate-200 overflow-x-auto flex space-x-1.5 scrollbar-none">
            <button
              onClick={() => simulateVoiceInput("I have 25 quintals of onion in Niphad Nashik grade A")}
              className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full whitespace-nowrap border border-slate-300 transition"
            >
              🧅 25q Onion (Niphad)
            </button>
            <button
              onClick={() => simulateVoiceInput("mere paas 40 quintal soybean hai Latur me kya rate milega")}
              className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full whitespace-nowrap border border-slate-300 transition"
            >
              🌱 40q Soybean (Latur)
            </button>
            <button
              onClick={() => simulateVoiceInput("30 quintal tomato in Pimpalgaon Nashik sell or wait")}
              className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full whitespace-nowrap border border-slate-300 transition"
            >
              🍅 30q Tomato (Perishable)
            </button>
            <button
              onClick={() => simulateVoiceInput("majhyakade 35 quintal kanda ahe Lasalgaon")}
              className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full whitespace-nowrap border border-slate-300 transition"
            >
              🇮🇳 मराठी: ३५ क्विंटल कांदा
            </button>
          </div>

          {/* WhatsApp Message Input Bar */}
          <div className="bg-[#f0f2f5] px-3 py-2 border-t border-slate-300 flex items-center space-x-2">
            <button
              onClick={() => simulateVoiceInput("I have 20 quintals of Onion in Niphad Nashik")}
              className={`p-2 rounded-full transition ${
                isRecording 
                  ? 'bg-rose-500 text-white animate-pulse' 
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
              title="Click to simulate voice message"
            >
              <Mic className="w-5 h-5" />
            </button>

            <input
              type="text"
              placeholder={isRecording ? "Listening to Marathi/Hindi voice note..." : "Type message in English/Hindi/Marathi..."}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1 bg-white rounded-full px-4 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 border border-slate-200 shadow-sm"
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim()}
              className="p-2 bg-[#00a884] hover:bg-[#008f6f] disabled:opacity-40 text-white rounded-full transition shadow"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
      
      <p className="text-[11px] text-slate-500 mt-2 text-center max-w-sm">
        💡 <strong>Judge Note:</strong> Simulates farmer voice/WhatsApp interaction without requiring external WhatsApp Business API credentials during hackathon evaluation.
      </p>
    </div>
  );
}
