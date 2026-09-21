import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Mic, CheckCheck, MapPin, TrendingUp, TrendingDown, 
  Store, AlertCircle, CheckCircle2, ChevronRight, PhoneCall,
  Sparkles, RefreshCw, Layers, Volume2, Camera, User, Phone, Check,
  Image as ImageIcon, HelpCircle, ArrowRight
} from 'lucide-react';
import { sendFarmerChat, createLot, updateTransactionStatus } from '../api';

const FARMER_PROFILES = [
  { id: 'ramesh', name: 'Ramesh Patil', phone: '+91-98230-11223', location: 'Niphad, Nashik', crop: 'Onion' },
  { id: 'tukaram', name: 'Tukaram Shinde', phone: '+91-94222-33445', location: 'Lasalgaon, Nashik', crop: 'Onion' },
  { id: 'dnyaneshwar', name: 'Dnyaneshwar Pawar', phone: '+91-97640-77889', location: 'Ausa, Latur', crop: 'Soybean' }
];

export default function FarmerSimulator({ onLotCreated, refreshTrigger }) {
  const [selectedFarmer, setSelectedFarmer] = useState(FARMER_PROFILES[0]);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      time: '10:00 AM',
      text: 'Namaste Ramesh ji! 🙏 Welcome to AgriConnect.\n\nYou can query Mandi rates in Marathi, Hindi or English, ask for sell vs hold advisory, or list your harvest directly for institutional buyers.\n\nType below or select a quick query.',
      type: 'welcome'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeAdvisory, setActiveAdvisory] = useState(null);
  const [pendingOffers, setPendingOffers] = useState([]);
  const [lotCreatedSuccess, setLotCreatedSuccess] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showPhotoGrading, setShowPhotoGrading] = useState(false);
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false);
  const [photoGradingResult, setPhotoGradingResult] = useState(null);
  const [selectedLang, setSelectedLang] = useState('mr'); // 'mr' | 'hi' | 'en'

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, pendingOffers, photoGradingResult]);

  useEffect(() => {
    checkIncomingOffers();
  }, [refreshTrigger, selectedFarmer]);

  const checkIncomingOffers = async () => {
    try {
      const res = await sendFarmerChat('status_check', selectedFarmer.phone, selectedFarmer.name, selectedLang);
      if (res.pending_offers && res.pending_offers.length > 0) {
        setPendingOffers(res.pending_offers);
      } else {
        setPendingOffers([]);
      }
    } catch (err) {
      console.error('Error fetching offers:', err);
    }
  };

  // Web Speech API for Marathi / Hindi TTS Audio Playback
  const speakText = (textToSpeak, lang = selectedLang) => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis not supported in this browser.');
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = textToSpeak.replace(/[*#•_]/g, '').replace(/₹/g, 'रुपये ');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.95;
    
    // Select Hindi/Marathi voice if available
    const voices = window.speechSynthesis.getVoices();
    let regionalVoice = null;
    if (lang === 'mr') {
      regionalVoice = voices.find(v => v.lang === 'mr-IN' || v.lang.includes('mr')) 
                   || voices.find(v => v.lang === 'hi-IN' || v.lang.includes('hi'))
                   || voices.find(v => v.lang.includes('en-IN'));
    } else if (lang === 'hi') {
      regionalVoice = voices.find(v => v.lang === 'hi-IN' || v.lang.includes('hi'))
                   || voices.find(v => v.lang.includes('en-IN'));
    } else {
      regionalVoice = voices.find(v => v.lang.includes('en-IN') || v.lang.includes('en-US'));
    }
    if (regionalVoice) {
      utterance.voice = regionalVoice;
    }
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  };

  const handleLanguageChange = (newLang) => {
    setSelectedLang(newLang);
    const langNames = { mr: 'मराठी', hi: 'हिंदी', en: 'English' };
    setMessages(prev => [
      ...prev,
      {
        id: Date.now(),
        sender: 'bot',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: newLang === 'mr' 
          ? "🌐 भाषा बदलून 'मराठी' केली आहे. आता आपण मराठीत प्रश्न विचारू शकता किंवा खालील पर्याय निवडू शकता!"
          : newLang === 'hi'
          ? "🌐 भाषा बदल कर 'हिंदी' कर दी गई है। अब आप हिंदी में पूछ सकते हैं या नीचे दिए विकल्प चुन सकते हैं!"
          : "🌐 Language switched to English. You can now chat or select queries in English!",
        type: 'lang_switch'
      }
    ]);
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
      const res = await sendFarmerChat(text, selectedFarmer.phone, selectedFarmer.name, selectedLang);
      
      // If server auto-detected a language, sync selectedLang
      if (res.language && res.language !== selectedLang) {
        setSelectedLang(res.language);
      }

      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: res.chat_response,
        advisory: res.advisory,
        extracted: res.extracted_data,
        language: res.language || selectedLang
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
          text: selectedLang === 'mr'
            ? 'सर्व्हरशी संपर्क होऊ शकला नाही. कृपया प्लॅटफॉर्म सेवा सुरू असल्याची खात्री करा.'
            : selectedLang === 'hi'
            ? 'सर्वर से संपर्क नहीं हो सका। कृपया सुनिश्चित करें कि सेवा चालू है।'
            : 'Connection timeout. Please verify that the platform service is responsive.'
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
    }, 1100);
  };

  const handlePhotoGradingSim = (sampleGrade = 'Grade A') => {
    setAnalyzingPhoto(true);
    setShowPhotoGrading(false);
    setTimeout(() => {
      setAnalyzingPhoto(false);
      const isGradeA = sampleGrade === 'Grade A';
      const resultObj = {
        crop: selectedFarmer.crop,
        grade: isGradeA ? 'Grade A (Export / High-Solid)' : 'Grade B (Standard Market)',
        confidence: isGradeA ? '96.4%' : '91.2%',
        defect_rate: isGradeA ? '< 2.5% (Export Spec)' : '6.8% (Minor blemishes)',
        moisture: isGradeA ? '12.4% (Optimal)' : '14.8% (Moderate)',
        premium_markup: isGradeA ? '+₹120/qtl over modal' : 'Standard modal rate'
      };
      setPhotoGradingResult(resultObj);

      const botMsg = {
        id: Date.now(),
        sender: 'bot',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `📸 *AI Visual Quality Assessment Complete!*\n\n• Crop: ${resultObj.crop}\n• Assessed Quality: *${resultObj.grade}*\n• AI Confidence: ${resultObj.confidence}\n• Moisture Level: ${resultObj.moisture}\n• Surface Defects: ${resultObj.defect_rate}\n\n🏆 *Pricing Advantage:* ${resultObj.premium_markup}\n\nYour quality grade has been attached to your profile. Institutional buyers pay higher bids for verified Grade A lots!`,
        isGrading: true
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 1600);
  };

  const handleListProduce = async (extracted, advisory) => {
    setLoading(true);
    try {
      const payload = {
        farmer_name: extracted?.farmer_name || selectedFarmer.name,
        phone: extracted?.farmer_phone || selectedFarmer.phone,
        village: extracted?.location?.split(',')[0]?.trim() || selectedFarmer.location.split(',')[0],
        district: extracted?.location?.includes(',') ? extracted.location.split(',')[1].trim() : 'Nashik',
        crop: extracted?.crop || selectedFarmer.crop,
        variety: 'Garwa Premium',
        quantity_quintals: extracted?.quantity_quintals || 25.0,
        grade: extracted?.grade || (photoGradingResult?.grade?.includes('Grade A') ? 'Grade A' : 'Grade B'),
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
        ? '✅ *Purchase Contract Accepted!*\nPickup transport has been dispatched by the buyer. Digital escrow lock activated.' 
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
      <div className="w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 rounded-[3.2rem] p-4 shadow-2xl shadow-emerald-500/10 border-2 border-slate-800 ring-1 ring-white/10 relative">
        
        {/* Dynamic Island / Speaker Pill */}
        <div className="relative flex justify-center items-center pb-2.5 pt-0.5">
          <div className="w-28 h-4 bg-black rounded-full flex items-center justify-between px-3 border border-slate-800 shadow-inner">
            <div className="w-2 h-2 bg-slate-900 rounded-full border border-slate-800"></div>
            <div className="w-10 h-1 bg-slate-850 rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-emerald-500/80 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* WhatsApp App Container */}
        <div className="bg-[#0b141a] rounded-[2.4rem] overflow-hidden flex flex-col h-[680px] shadow-2xl border border-slate-800">
          
          {/* WhatsApp Brand Header */}
          <div className="bg-[#1f2c34] text-white px-4 py-3 flex items-center justify-between border-b border-slate-800/80 shadow-md">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-emerald-700/80 flex items-center justify-center text-xl font-bold border-2 border-emerald-400/80 shadow-md">
                  🌾
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#1f2c34]"></div>
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-extrabold text-sm tracking-tight text-white">AgriConnect</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                </div>
                <p className="text-[11px] text-emerald-400/90 flex items-center gap-1.5 font-medium">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                  Official WhatsApp Assistant
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              <button 
                onClick={() => setShowPhotoGrading(true)}
                title="AI Photo Quality Grading"
                className="p-2 hover:bg-slate-800 active:scale-95 rounded-full transition text-emerald-400"
              >
                <Camera className="w-4 h-4" />
              </button>
              <button 
                onClick={checkIncomingOffers} 
                title="Refresh messages & offers"
                className="p-2 hover:bg-slate-800 active:scale-95 rounded-full transition text-slate-300"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sub-banner: Active Farmer Switcher */}
          <div className="bg-[#182229] border-b border-slate-800/80 px-3.5 py-2 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white flex items-center gap-1">
                👨‍🌾 {selectedFarmer.name}
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400 text-[11px]">{selectedFarmer.location}</span>
            </div>
            
            {/* Quick Profile Dropdown */}
            <select
              value={selectedFarmer.id}
              onChange={(e) => {
                const found = FARMER_PROFILES.find(p => p.id === e.target.value);
                if (found) setSelectedFarmer(found);
              }}
              className="bg-slate-800 text-[10px] text-emerald-300 border border-slate-700 rounded-lg px-2 py-0.5 focus:outline-none"
            >
              {FARMER_PROFILES.map(p => (
                <option key={p.id} value={p.id}>{p.name.split(' ')[0]} ({p.crop})</option>
              ))}
            </select>
          </div>

          {/* Sub-banner: Multilingual Language Selector (मराठी | हिंदी | English) */}
          <div className="bg-[#111b21] border-b border-slate-800/90 px-3 py-1.5 flex items-center justify-between text-xs">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              🌐 भाषा / Language:
            </span>
            <div className="flex items-center space-x-1 bg-slate-900/90 p-0.5 rounded-lg border border-slate-800">
              <button
                onClick={() => handleLanguageChange('mr')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                  selectedLang === 'mr'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                मराठी
              </button>
              <button
                onClick={() => handleLanguageChange('hi')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                  selectedLang === 'hi'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                हिंदी
              </button>
              <button
                onClick={() => handleLanguageChange('en')}
                className={`px-2 py-1 rounded-md text-[11px] font-bold transition ${
                  selectedLang === 'en'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Chat Messages Body with WhatsApp Dark Theme */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-[#0b141a] bg-[radial-gradient(#1f2c34_1px,transparent_1px)] [background-size:16px_16px]">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs shadow-md whitespace-pre-line leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-[#005c4b] text-white rounded-tr-xs'
                      : 'bg-[#202c33] text-slate-100 rounded-tl-xs border border-slate-800'
                  }`}
                >
                  <div>{m.text}</div>

                  {/* Audio Playback button for accessibility */}
                  {m.sender === 'bot' && (
                    <div className="mt-2 pt-1.5 border-t border-slate-700/60 flex items-center justify-between">
                      <button
                        onClick={() => speakText(m.text, m.language || selectedLang)}
                        className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        {isSpeaking 
                          ? 'Playing Voice...' 
                          : (m.language === 'mr' || selectedLang === 'mr')
                          ? 'ऐका (मराठी आवाज)' 
                          : (m.language === 'hi' || selectedLang === 'hi')
                          ? 'सुनें (हिंदी आवाज)'
                          : 'Listen in Voice'}
                      </button>
                    </div>
                  )}

                  {/* Interactive advisory card */}
                  {m.advisory && (
                    <div className="mt-2.5 pt-2 border-t border-slate-700/60 space-y-2 text-left">
                      <div className="bg-[#111b21] rounded-xl p-2.5 border border-emerald-500/30">
                        <div className="flex items-center justify-between text-white font-bold text-xs">
                          <span className="flex items-center gap-1 text-emerald-400">🏆 {m.advisory.best_market.market}</span>
                          <span className="text-emerald-300 bg-emerald-950 border border-emerald-500/30 px-2 py-0.5 rounded-md font-extrabold">
                            ₹{m.advisory.best_market.net_price_per_qtl}/qtl Net
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1.5 flex justify-between font-medium">
                          <span>Transit: {m.advisory.best_market.distance_km} km</span>
                          <span className="text-rose-400 font-semibold">Freight: -₹{m.advisory.best_market.transport_cost_per_qtl}/qtl</span>
                        </div>
                      </div>

                      {/* Sell vs Hold Advisory */}
                      <div className={`p-2.5 rounded-xl text-[11px] font-medium flex items-start gap-2 border ${
                        m.advisory.recommendation.type === 'HOLD_RECOMMENDED'
                          ? 'bg-blue-950/40 text-blue-200 border-blue-500/40'
                          : m.advisory.recommendation.type === 'SELL_NOW'
                          ? 'bg-amber-950/40 text-amber-200 border-amber-500/40'
                          : 'bg-slate-800 text-slate-200 border-slate-700'
                      }`}>
                        {m.advisory.recommendation.type === 'HOLD_RECOMMENDED' ? (
                          <TrendingUp className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="font-bold">{m.advisory.recommendation.headline}</div>
                          <div className="text-[10px] text-slate-300 mt-0.5 leading-snug">{m.advisory.recommendation.reasoning}</div>
                        </div>
                      </div>

                      {/* Button to Publish Lot */}
                      <button
                        onClick={() => handleListProduce(m.extracted, m.advisory)}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-slate-950 font-black py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 transition"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        Publish Lot for Institutional Buyers
                      </button>
                    </div>
                  )}

                  <div className="text-[9px] text-slate-400 text-right mt-1.5 flex items-center justify-end space-x-1">
                    <span>{m.time}</span>
                    {m.sender === 'user' && <CheckCheck className="w-3.5 h-3.5 text-cyan-400 inline" />}
                  </div>
                </div>
              </div>
            ))}

            {/* Inbound Buyer Offers with Alert Glow */}
            {pendingOffers.map((offer) => (
              <div key={offer.transaction_id} className="bg-gradient-to-br from-amber-950/90 via-slate-900 to-amber-950/90 border-2 border-amber-400/90 rounded-2xl p-3.5 shadow-2xl">
                <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                    DIRECT PURCHASE OFFER
                  </span>
                  <span className="bg-amber-900/80 text-amber-200 border border-amber-400/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Lot #{offer.transaction_id}
                  </span>
                </div>
                <div className="text-xs text-slate-300 mt-2 space-y-1 bg-[#111b21] p-2.5 rounded-xl border border-amber-400/20">
                  <p><span className="text-slate-400">Buyer Entity:</span> <strong className="text-white">{offer.buyer_name}</strong></p>
                  <p><span className="text-slate-400">Volume:</span> <strong className="text-white">{offer.quantity} Qtl {offer.crop}</strong></p>
                  <p><span className="text-slate-400">Offered Rate:</span> <strong className="text-emerald-400 font-extrabold text-sm">₹{offer.offered_price}/qtl</strong></p>
                  <p><span className="text-slate-400">Total Settlement:</span> <strong className="text-white font-bold">₹{offer.total_amount.toLocaleString()}</strong></p>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => handleOfferAction(offer.transaction_id, 'offer_accepted')}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2 px-2 rounded-xl text-xs transition shadow-md shadow-emerald-500/20"
                  >
                    Accept Contract
                  </button>
                  <button
                    onClick={() => handleOfferAction(offer.transaction_id, 'rejected')}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 px-2 rounded-xl text-xs transition border border-slate-700"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}

            {analyzingPhoto && (
              <div className="flex items-center space-x-2 text-xs text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 w-fit px-3.5 py-2 rounded-2xl shadow-lg">
                <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping"></div>
                <span className="font-bold">Analyzing surface grading & moisture...</span>
              </div>
            )}

            {loading && (
              <div className="flex items-center space-x-2 text-xs text-slate-300 bg-[#202c33] w-fit px-3.5 py-1.5 rounded-full shadow-md border border-slate-800">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></div>
                <span className="font-medium">Evaluating regional APMC Mandis...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Query Suggestion Chips */}
          <div className="bg-[#182229] px-2.5 py-2 border-t border-slate-800 overflow-x-auto flex space-x-2 scrollbar-none">
            {selectedLang === 'mr' ? (
              <>
                <button
                  onClick={() => simulateVoiceInput("माझ्याकडे २५ क्विंटल कांदा आहे निफाडमध्ये")}
                  className="text-[11px] bg-slate-800 hover:bg-slate-700 active:scale-95 text-emerald-300 px-3 py-1.5 rounded-full whitespace-nowrap border border-slate-700 transition font-medium"
                >
                  🧅 २५ क्विंटल कांदा (निफाड)
                </button>
                <button
                  onClick={() => simulateVoiceInput("लातूरमध्ये ४० क्विंटल सोयाबीनला काय भाव मिळेल?")}
                  className="text-[11px] bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 px-3 py-1.5 rounded-full whitespace-nowrap border border-slate-700 transition font-medium"
                >
                  🌱 ४० क्विंटल सोयाबीन (लातूर)
                </button>
                <button
                  onClick={() => simulateVoiceInput("३० क्विंटल टोमॅटो आता विकावा की थांबावा?")}
                  className="text-[11px] bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 px-3 py-1.5 rounded-full whitespace-nowrap border border-slate-700 transition font-medium"
                >
                  🍅 ३० क्विंटल टोमॅटो (विका की थांबा)
                </button>
                <button
                  onClick={() => simulateVoiceInput("माझ्याकडे ३० क्विंटल कापूस आहे अकोला")}
                  className="text-[11px] bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 px-3 py-1.5 rounded-full whitespace-nowrap border border-slate-700 transition font-medium"
                >
                  🚜 ३० क्विंटल कापूस (अकोला)
                </button>
              </>
            ) : selectedLang === 'hi' ? (
              <>
                <button
                  onClick={() => simulateVoiceInput("मेरे पास 25 क्विंटल प्याज है निफाड नासिक में क्या भाव मिलेगा")}
                  className="text-[11px] bg-slate-800 hover:bg-slate-700 active:scale-95 text-emerald-300 px-3 py-1.5 rounded-full whitespace-nowrap border border-slate-700 transition font-medium"
                >
                  🧅 25 क्विंटल प्याज (निफाड)
                </button>
                <button
                  onClick={() => simulateVoiceInput("लातूर में 40 क्विंटल सोयाबीन का क्या भाव मिलेगा?")}
                  className="text-[11px] bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 px-3 py-1.5 rounded-full whitespace-nowrap border border-slate-700 transition font-medium"
                >
                  🌱 40 क्विंटल सोयाबीन (लातूर)
                </button>
                <button
                  onClick={() => simulateVoiceInput("30 क्विंटल टमाटर अभी बेचें या रोकें?")}
                  className="text-[11px] bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 px-3 py-1.5 rounded-full whitespace-nowrap border border-slate-700 transition font-medium"
                >
                  🍅 30 क्विंटल टमाटर (बेचें या रोकें)
                </button>
                <button
                  onClick={() => simulateVoiceInput("मेरे पास 30 क्विंटल कपास है अकोला में")}
                  className="text-[11px] bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 px-3 py-1.5 rounded-full whitespace-nowrap border border-slate-700 transition font-medium"
                >
                  🚜 30 क्विंटल कपास (अकोला)
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => simulateVoiceInput("I have 25 quintals of onion in Niphad Nashik grade A")}
                  className="text-[11px] bg-slate-800 hover:bg-slate-700 active:scale-95 text-emerald-300 px-3 py-1.5 rounded-full whitespace-nowrap border border-slate-700 transition font-medium"
                >
                  🧅 25q Onion (Niphad)
                </button>
                <button
                  onClick={() => simulateVoiceInput("40 quintal soybean in Latur what is best rate")}
                  className="text-[11px] bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 px-3 py-1.5 rounded-full whitespace-nowrap border border-slate-700 transition font-medium"
                >
                  🌱 40q Soybean (Latur)
                </button>
                <button
                  onClick={() => simulateVoiceInput("30 quintal tomato in Pimpalgaon Nashik sell or wait")}
                  className="text-[11px] bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 px-3 py-1.5 rounded-full whitespace-nowrap border border-slate-700 transition font-medium"
                >
                  🍅 30q Tomato (Sell or Hold)
                </button>
                <button
                  onClick={() => simulateVoiceInput("30 quintal cotton in Akola")}
                  className="text-[11px] bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 px-3 py-1.5 rounded-full whitespace-nowrap border border-slate-700 transition font-medium"
                >
                  🚜 30q Cotton (Akola)
                </button>
              </>
            )}
          </div>

          {/* WhatsApp Message Input Bar */}
          <div className="bg-[#202c33] px-3 py-2.5 border-t border-slate-800 flex items-center space-x-2">
            <button
              onClick={() => setShowPhotoGrading(true)}
              className="p-2 rounded-full text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition"
              title="Camera quality grading"
            >
              <Camera className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                const sample = selectedLang === 'mr' 
                  ? "माझ्याकडे २५ क्विंटल कांदा आहे निफाड नाशिक"
                  : selectedLang === 'hi'
                  ? "मेरे पास 25 क्विंटल प्याज है निफाड नासिक"
                  : "I have 20 quintals of Onion in Niphad Nashik";
                simulateVoiceInput(sample);
              }}
              className={`p-2 rounded-full transition ${
                isRecording 
                  ? 'bg-rose-500 text-white animate-pulse' 
                  : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800'
              }`}
              title="Voice recording simulation"
            >
              <Mic className="w-4 h-4" />
            </button>

            <input
              type="text"
              placeholder={
                isRecording 
                  ? (selectedLang === 'mr' ? "मराठीत आवाज ऐकत आहे..." : selectedLang === 'hi' ? "हिंदी में आवाज सुन रहे हैं..." : "Listening to voice in Marathi/Hindi...") 
                  : (selectedLang === 'mr' ? "मराठीत विचारा किंवा बोला... (उदा. २५ क्विंटल कांदा)" : selectedLang === 'hi' ? "हिंदी में पूछें या बोलें... (उदा. 25 क्विंटल प्याज)" : "Type in Marathi, Hindi or English...")
              }
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1 bg-[#2a3942] rounded-full px-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 border border-slate-700"
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim()}
              className="p-2.5 bg-[#00a884] hover:bg-[#008f6f] disabled:opacity-40 text-white rounded-full transition shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      {/* Modal: AI Photo Quality Grading Simulator */}
      {showPhotoGrading && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-800 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="font-extrabold text-sm flex items-center gap-2 text-emerald-400">
                <Camera className="w-4 h-4" /> AI Photo Quality Grading
              </h4>
              <button 
                onClick={() => setShowPhotoGrading(false)}
                className="text-slate-500 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 mt-3 leading-relaxed">
              Simulate taking a live photo of farm harvest. Computer vision algorithms assess color uniformity, size distribution, surface moisture, and blemish percentage.
            </p>

            <div className="my-4 p-4 rounded-2xl bg-slate-850 border border-slate-800 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center mx-auto text-2xl mb-2">
                📸
              </div>
              <div className="text-xs font-bold text-white">Select Test Harvest Sample:</div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handlePhotoGradingSim('Grade A')}
                className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-slate-950 font-black py-2.5 rounded-xl text-xs transition flex items-center justify-between px-4 shadow-lg shadow-emerald-600/20"
              >
                <span>Upload Export Batch (Grade A)</span>
                <span className="text-[10px] bg-slate-950/20 px-2 py-0.5 rounded font-bold">+15% Price</span>
              </button>

              <button
                onClick={() => handlePhotoGradingSim('Grade B')}
                className="w-full bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-200 font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-between px-4 border border-slate-700"
              >
                <span>Upload Standard Batch (Grade B)</span>
                <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-slate-400">Modal Rate</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      <p className="text-[11px] text-slate-400 mt-3 text-center max-w-sm font-medium">
        Multilingual Voice, AI Photo Grading & WhatsApp Direct Contract Execution
      </p>
    </div>
  );
}
