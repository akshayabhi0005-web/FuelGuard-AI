import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Fuel, Flame, ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';

const Register = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-color)', transition: 'background-color 0.4s ease' }}>
      <Navbar />
      
      {/* Sibling Background Particles */}
      <div className="particles-bg">
        <div className="particle particle-1"></div>
        <div className="particle particle-2"></div>
      </div>

      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem 1.5rem', zIndex: 1 }}>
        <div style={{ maxWidth: '800px', width: '100%', textAlign: 'center' }}>
          
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ marginBottom: '3rem' }}
          >
            <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, marginBottom: '0.75rem', background: 'linear-gradient(135deg, #ffffff 40%, #94a3b8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Create Citizen Account
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '500px', margin: '0 auto' }}>
              Register into the automated national resource distribution grid.
            </p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }} className="grid-mobile">
            {/* Card 1 */}
            <motion.div
              whileHover={{ y: -6, scale: 1.01 }}
              onClick={() => navigate('/fuel/register')}
              className="glass-panel"
              style={{ cursor: 'pointer', padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}
            >
              <div style={{ width: '60px', height: '60px', borderRadius: '14px', background: 'rgba(3, 169, 244, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#06b6d4' }}>
                <Fuel size={28} />
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700 }}>Fuel Allocation Wallet</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Sign up with vehicle chassis books & identity cards to obtain weekly smart fuel quotas.</p>
              <button className="btn btn-primary" style={{ width: '100%', background: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)' }}>
                Vehicle Registration <ArrowRight size={14} />
              </button>
            </motion.div>

            {/* Card 2 */}
            <motion.div
              whileHover={{ y: -6, scale: 1.01 }}
              onClick={() => navigate('/lpg/register')}
              className="glass-panel"
              style={{ cursor: 'pointer', padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}
            >
              <div style={{ width: '60px', height: '60px', borderRadius: '14px', background: 'rgba(249, 115, 22, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#f97316' }}>
                <Flame size={28} />
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700 }}>LPG Consumer Refills</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Sign up with utility invoices & blue book numbers to secure domestic gas allocation timelines.</p>
              <button className="btn btn-primary" style={{ width: '100%', background: 'linear-gradient(135deg, #ea580c 0%, #8b5cf6 100%)' }}>
                Consumer Registration <ArrowRight size={14} />
              </button>
            </motion.div>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Already registered? Go to <Link to="/login" style={{ color: '#06b6d4', textDecoration: 'underline' }}>Login Gateway</Link>
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Register;
