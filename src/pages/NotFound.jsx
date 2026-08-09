import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#050816', padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
      {/* Background Particles */}
      <div className="particles-bg">
        <div className="particle" style={{ width: '40vw', height: '40vw', top: '-10%', left: '-10%', background: 'radial-gradient(circle, rgba(239, 68, 68, 0.15) 0%, transparent 70%)' }}></div>
        <div className="particle" style={{ width: '40vw', height: '40vw', bottom: '-10%', right: '-10%', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)' }}></div>
      </div>

      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 100, damping: 15 }}
        className="glass-panel"
        style={{ width: '100%', maxWidth: '480px', padding: '3rem 2rem', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.25)', boxShadow: '0 8px 32px 0 rgba(239, 68, 68, 0.1)' }}
      >
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 1.5rem' }}>
          <AlertCircle size={32} />
        </div>
        
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem', background: 'linear-gradient(135deg, #ffffff 40%, #f87171 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          404
        </h1>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#ffffff', marginBottom: '1rem' }}>
          Area Restricted or Route Invalid
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2.5rem', lineHeight: '1.6' }}>
          The requested coordinate portal is currently offline or does not exist. Double check your destination route.
        </p>

        <button 
          onClick={() => navigate('/')} 
          className="btn btn-primary"
          style={{ width: '100%', background: 'linear-gradient(135deg, #3b82f6 0%, #ef4444 100%)', boxShadow: 'none' }}
        >
          <ArrowLeft size={16} /> Return to Service Selection
        </button>
      </motion.div>
    </div>
  );
};

export default NotFound;
