import React from 'react';
import { motion } from 'framer-motion';
import { Info, Cpu, Landmark, ShieldCheck } from 'lucide-react';
import Navbar from '../components/Navbar';

const About = () => {
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
            <span style={{ fontSize: '0.8rem', color: '#06b6d4', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px' }}>Operations Blueprint</span>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginTop: '5px', color: '#ffffff' }}>About FuelGuard AI</h1>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '10px auto 0' }}>An AI-driven national energy distribution and crisis mitigation ecosystem.</p>
          </motion.div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="glass-panel" style={{ padding: '2.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Info style={{ color: '#06b6d4' }} /> Platform Mission
              </h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', fontSize: '0.95rem' }}>
                FuelGuard AI was engineered by the National Operations Command center to address supply bottlenecks and optimize distribution channels during national resource deficits. Our intelligent engines govern and forecast demand in real-time, matching refinery inventory dispatch with registered consumer allocations to eliminate stockpiling, duplicate transactions, and black-market queues.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }} className="grid-mobile">
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <Cpu size={24} style={{ color: '#06b6d4', marginBottom: '1rem' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Predictive Models</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Automated weekly forecasting computes allocation weights on weather metrics, registration nodes, and bowser dispatches.</p>
              </div>

              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <Landmark size={24} style={{ color: '#8b5cf6', marginBottom: '1rem' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Equitable Access</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>State quotas protect domestic accounts while granting priority responder locks for ambulances and public transits.</p>
              </div>

              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <ShieldCheck size={24} style={{ color: '#10b981', marginBottom: '1rem' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Fraud Mitigation</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Plate scanning, duplicate signature detection, and chassis hashes are analyzed at terminal nodes instantly.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default About;
