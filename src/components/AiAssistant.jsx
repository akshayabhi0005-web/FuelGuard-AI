import React, { useState, useContext, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppContext } from '../context/AppContext';
import { Bot, Send, X, MessageSquare, Sparkles, SendHorizontal } from 'lucide-react';

const AiAssistant = () => {
  const { 
    remainingQuota, 
    lpgStatus, 
    nextLpgBookingDate, 
    emergencyMode, 
    stations, 
    inventoryReserves,
    getPredictedDemand,
    getStationDistance,
    getStationWaitTime
  } = useContext(AppContext);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hi! I am FuelGuard AI Assistant. How can I help you today? Ask me about fuel quotas, nearest petrol pumps, LPG bookings, or emergency mode status.', time: '10:00 PM' }
  ]);
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = {
      sender: 'user',
      text: inputText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    const query = inputText.toLowerCase();
    setInputText('');

    // Generate intelligent AI response mock reflecting the active AppContext states!
    setTimeout(() => {
      let botResponse = '';

      const ceypetco = stations.find(s => s.name.includes('Ceypetco')) || stations[0];
      const lioc = stations.find(s => s.name.includes('LIOC')) || stations[1];
      const supergas = stations.find(s => s.name.includes('Super Gas')) || stations[4];

      if (query.includes('quota') || query.includes('allowance') || query.includes('liters')) {
        botResponse = `Your remaining weekly fuel quota wallet is currently **${remainingQuota.toFixed(1)} Liters**. ${
          emergencyMode 
            ? '⚠️ Note: National Emergency Mode is active, reducing standard allocations.' 
            : 'Standard quota limits will renew this Sunday.'
        }`;
      } else if (query.includes('pump') || query.includes('petrol') || query.includes('fuel station')) {
        botResponse = `Nearby Stations Status:\n- **${ceypetco.name}** (${getStationDistance(ceypetco)}): wait time **${getStationWaitTime(ceypetco)}**, Stock: **${ceypetco.stock} L** (${ceypetco.status}).\n- **${lioc.name}** (${getStationDistance(lioc)}): wait time **${getStationWaitTime(lioc)}**, Stock: **${lioc.stock} L** (${lioc.status}).`;
      } else if (query.includes('lpg') || query.includes('distributor') || query.includes('cylinder') || query.includes('gas')) {
        botResponse = `Your cylinder booking status is **${lpgStatus}**. Preferred distributor **${supergas.name}** has **${supergas.stock}** domestic cylinders in inventory. ${
          lpgStatus === 'Delivered' 
            ? `Your next eligible booking window opens on **${nextLpgBookingDate}**.` 
            : `Your cylinder delivery is in the **${lpgStatus}** phase.`
        }`;
      } else if (query.includes('emergency') || query.includes('crisis')) {
        botResponse = emergencyMode 
          ? `⚠️ **CRITICAL ENERGY EMERGENCY IS ACTIVE**: Public quotas are reduced. National reserves are locked for ambulance, police, public transit, and emergency fire units.` 
          : `System state is **Normal**. Emergency responder priority rules are inactive. Admin can configure quotas from the Command console.`;
      } else if (query.includes('demand') || query.includes('forecast') || query.includes('shortage')) {
        const totalAvail = inventoryReserves.petrol92 + inventoryReserves.petrol95 + inventoryReserves.dieselAuto;
        const predDemand = getPredictedDemand();
        const gap = predDemand - totalAvail;
        const shortageRatio = predDemand > 0 ? gap / predDemand : 0;
        const risk = shortageRatio > 0.25 ? 'CRITICAL' : shortageRatio > 0.1 ? 'HIGH RISK' : 'LOW RISK';
        botResponse = `AI Forecast Analysis:\n- Predicted weekly demand: **${predDemand.toLocaleString()} L**\n- Available reserves: **${(totalAvail/1000000).toFixed(2)}M L**\n- Computed Gap: **${(gap/1000000).toFixed(2)}M L**\n- Risk Classification: **${risk}**.`;
      } else if (query.includes('book') || query.includes('booking help')) {
        botResponse = `To book an LPG cylinder, go to the **LPG Dashboard** and click **Book Gas Cylinder Now**. Note that domestic accounts are restricted to one cylinder booking every 21 days. Your booking opens on **${nextLpgBookingDate}**.`;
      } else if (query.includes('how it works') || query.includes('faq')) {
        botResponse = `FuelGuard AI is an automated resource manager. We verify citizen identity cards & vehicle chassis logs, allocate quotas computed by our machine learning demand forecasting model, and authorize fills via dynamic single-use QR codes.`;
      } else {
        botResponse = `I understand you are asking about "${userMsg.text}". Let me run a diagnostic. As your FuelGuard AI guide, I can verify that your vehicle quota is **${remainingQuota.toFixed(1)} L** and the nearest station is **${ceypetco.name}** (${getStationDistance(ceypetco)}). Is there a specific detail I can help you with?`;
      }

      const botMsg = {
        sender: 'bot',
        text: botResponse,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    }, 600);
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1000 }}>
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="btn btn-primary"
          style={{ 
            width: '60px', 
            height: '60px', 
            borderRadius: '50%', 
            padding: 0, 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            boxShadow: '0 8px 32px rgba(6, 182, 212, 0.4)',
            background: 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)'
          }}
        >
          {isOpen ? <X size={24} /> : <Bot size={24} />}
        </motion.button>
      </div>

      {/* Chat Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="glass-panel"
            style={{ 
              position: 'fixed', 
              bottom: '6.5rem', 
              right: '2rem', 
              width: '380px', 
              height: '500px', 
              maxHeight: 'calc(100vh - 10rem)',
              maxWidth: 'calc(100vw - 4rem)',
              zIndex: 1000, 
              display: 'flex', 
              flexDirection: 'column', 
              border: '1px solid rgba(6, 182, 212, 0.3)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.5)'
            }}
          >
            {/* Chat Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', borderBottom: '1px solid var(--glass-border)', background: 'linear-gradient(90deg, rgba(6,182,212,0.1), rgba(139,92,246,0.1))' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={16} style={{ color: '#06b6d4' }} />
                <div>
                  <strong style={{ fontSize: '0.95rem', color: '#ffffff', display: 'block', textAlign: 'left' }}>FuelGuard AI</strong>
                  <span style={{ fontSize: '0.7rem', color: '#34d399', display: 'block', textAlign: 'left' }}>● Online Support Agent</span>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {/* Chat Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {messages.map((msg, i) => (
                <div 
                  key={i} 
                  style={{ 
                    alignSelf: msg.sender === 'bot' ? 'flex-start' : 'flex-end',
                    maxWidth: '80%',
                    textAlign: 'left'
                  }}
                >
                  <div 
                    style={{ 
                      padding: '0.75rem 1rem', 
                      borderRadius: msg.sender === 'bot' ? '12px 12px 12px 0' : '12px 12px 0 12px',
                      background: msg.sender === 'bot' ? 'rgba(255,255,255,0.03)' : 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)',
                      border: msg.sender === 'bot' ? '1px solid var(--glass-border)' : 'none',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                      lineHeight: '1.5'
                    }}
                  >
                    {/* Render basic markdown bold styling */}
                    {msg.text.split('**').map((part, index) => 
                      index % 2 === 1 ? <strong key={index} style={{ color: '#06b6d4' }}>{part}</strong> : part
                    )}
                  </div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '2px', display: 'block', textAlign: msg.sender === 'bot' ? 'left' : 'right' }}>
                    {msg.time}
                  </span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <form 
              onSubmit={handleSendMessage} 
              style={{ padding: '1rem', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.1)' }}
            >
              <input 
                type="text" 
                className="form-input" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask about quota, nearest pump..."
                style={{ fontSize: '0.85rem', padding: '0.6rem 1rem' }}
              />
              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ padding: '0.6rem', borderRadius: '12px', width: '38px', height: '38px', flexShrink: 0 }}
              >
                <SendHorizontal size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AiAssistant;
