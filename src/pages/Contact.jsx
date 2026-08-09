import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import Navbar from '../components/Navbar';

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setFormData({ name: '', email: '', message: '' });
      alert('Your inquiry has been logged! Our support desk will reach out within 24 hours.');
    }, 1000);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-color)', transition: 'background-color 0.4s ease' }}>
      <Navbar />
      
      {/* Background Particles */}
      <div className="particles-bg">
        <div className="particle particle-1"></div>
        <div className="particle particle-2"></div>
      </div>

      <div style={{ flex: 1, padding: '3rem 1.5rem', zIndex: 1 }}>
        <div style={{ maxWidth: '900px', width: '100%', margin: '0 auto', textAlign: 'left' }}>
          
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: '3rem', textAlign: 'center' }}
          >
            <span style={{ fontSize: '0.8rem', color: '#ea580c', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px' }}>Operational support Desk</span>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginTop: '5px', color: '#ffffff' }}>Contact FuelGuard Team</h1>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '10px auto 0' }}>Submit ticket claims or consult operators about allocation timelines.</p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2.5rem' }} className="grid-mobile">
            {/* Form */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Send Support Ticket</h3>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    required 
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Inquiry Message</label>
                  <textarea 
                    className="form-input" 
                    style={{ minHeight: '120px', resize: 'vertical' }}
                    required 
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #2563eb, #06b6d4)' }}>
                  {sent ? 'Sending Claim...' : 'Submit Inquiry Ticket'} <Send size={14} style={{ marginLeft: '4px' }} />
                </button>
              </form>
            </div>

            {/* Direct contact nodes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div className="glass-panel" style={{ padding: '2rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Direct Operational Channels</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(37,99,235,0.05)', color: '#2563eb', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <Phone size={18} />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>National Hotline Toll-Free</span>
                      <div style={{ fontWeight: 'bold' }}>1919 (Operations Control)</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(6,182,212,0.05)', color: '#06b6d4', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <Mail size={18} />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Support Mail Address</span>
                      <div style={{ fontWeight: 'bold' }}>support@fuelguard.gov</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(139,92,246,0.05)', color: '#8b5cf6', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <MapPin size={18} />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>HQ Command Center</span>
                      <div style={{ fontWeight: 'bold' }}>Ministry of Energy, Colombo 07</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Contact;
