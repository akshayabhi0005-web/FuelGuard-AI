import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Fuel, Flame, ArrowRight, Sun, Moon, Sparkles } from 'lucide-react';

const ServiceSelection = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => localStorage.getItem('fuelguard_theme') || 'dark');

  // Synchronize theme state with DOM
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('fuelguard_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100, damping: 15 },
    },
  };

  const isDark = theme === 'dark';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-color)', transition: 'background-color 0.4s ease', padding: '2rem 0', position: 'relative' }}>
      
      {/* Sibling Background Particles - pointer-events: none & z-index: -1 */}
      <div className="particles-bg">
        <div className="particle particle-1"></div>
        <div className="particle particle-2"></div>
        <div className="particle particle-3"></div>
      </div>

      {/* Main Container */}
      <motion.div 
        className="container"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ zIndex: 1, textAlign: 'center', width: '100%' }}
      >
        {/* Theme Toggle Button */}
        <div style={{ position: 'absolute', top: '2rem', right: '2rem', zIndex: 10 }}>
          <button 
            onClick={toggleTheme}
            className="btn btn-secondary"
            style={{ 
              borderRadius: '50%', 
              width: '45px', 
              height: '45px', 
              padding: 0, 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              cursor: 'pointer'
            }}
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        {/* Title & Subtitle */}
        <motion.div variants={itemVariants} style={{ marginBottom: '3.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', background: 'linear-gradient(90deg, #2563eb, #8b5cf6)', padding: '6px 16px', borderRadius: '30px', marginBottom: '1.25rem', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#ffffff' }}>FuelGuard AI Portal</span>
          </div>
          <h1 
            style={{ 
              fontSize: 'clamp(2.5rem, 6vw, 4rem)', 
              fontWeight: 800, 
              marginBottom: '1rem',
              background: 'linear-gradient(135deg, #ffffff 30%, #94a3b8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: isDark ? 'transparent' : '#0f172a',
              letterSpacing: '-0.03em'
            }}
          >
            FuelGuard AI
          </h1>
          <p 
            style={{ 
              fontSize: 'clamp(1rem, 2.5vw, 1.25rem)', 
              fontWeight: 500,
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-heading)',
              maxWidth: '600px',
              margin: '0 auto 1.5rem'
            }}
          >
            AI-Powered Smart Fuel & LPG Management Platform
          </p>
          <div 
            style={{ 
              fontSize: '0.9rem', 
              color: 'var(--text-secondary)', 
              textTransform: 'uppercase', 
              letterSpacing: '2px', 
              fontWeight: 600 
            }}
          >
            Select the service you want to access
          </div>
        </motion.div>

        {/* Cards Row */}
        <div 
          className="grid-2" 
          style={{ 
            maxWidth: '900px', 
            margin: '0 auto',
            perspective: '1000px'
          }}
        >
          {/* Card 1: Fuel Services */}
          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="glass-panel"
            style={{ 
              cursor: 'pointer',
              padding: '2.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'center',
              height: '350px',
              textAlign: 'center'
            }}
            onClick={() => navigate('/fuel')}
          >
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div 
                style={{ 
                  width: '70px', 
                  height: '70px', 
                  borderRadius: '16px', 
                  background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1), rgba(6, 182, 212, 0.1))',
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  color: '#06b6d4',
                  marginBottom: '1.5rem',
                  border: '1px solid rgba(6, 182, 212, 0.2)'
                }}
              >
                <Fuel size={32} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                ⛽ Fuel Services
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '300px' }}>
                Smart fuel allocation, emergency quotas, AI demand prediction, and petrol pump management.
              </p>
            </div>
            
            <button 
              className="btn btn-primary" 
              style={{ 
                width: '100%',
                background: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)',
                boxShadow: '0 4px 15px rgba(6, 182, 212, 0.2)',
                cursor: 'pointer'
              }}
              onClick={(e) => {
                e.stopPropagation();
                navigate('/fuel');
              }}
            >
              Continue to Fuel <ArrowRight size={16} />
            </button>
          </motion.div>

          {/* Card 2: LPG Services */}
          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="glass-panel"
            style={{ 
              cursor: 'pointer',
              padding: '2.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'center',
              height: '350px',
              textAlign: 'center'
            }}
            onClick={() => navigate('/lpg')}
          >
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div 
                style={{ 
                  width: '70px', 
                  height: '70px', 
                  borderRadius: '16px', 
                  background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.1), rgba(139, 92, 246, 0.1))',
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  color: '#f97316',
                  marginBottom: '1.5rem',
                  border: '1px solid rgba(249, 115, 22, 0.2)'
                }}
              >
                <Flame size={32} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                🔥 LPG Services
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '300px' }}>
                Smart LPG booking, distributor management, cylinder allocation, and AI monitoring.
              </p>
            </div>
            
            <button 
              className="btn btn-primary"
              style={{ 
                width: '100%',
                background: 'linear-gradient(135deg, #ea580c 0%, #8b5cf6 100%)',
                boxShadow: '0 4px 15px rgba(249, 115, 22, 0.2)',
                cursor: 'pointer'
              }}
              onClick={(e) => {
                e.stopPropagation();
                navigate('/lpg');
              }}
            >
              Continue to LPG <ArrowRight size={16} />
            </button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default ServiceSelection;
