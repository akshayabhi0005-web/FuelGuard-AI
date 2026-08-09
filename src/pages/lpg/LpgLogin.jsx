import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppContext } from '../../context/AppContext';
import { Flame, ShieldAlert, LogIn } from 'lucide-react';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style={{ marginRight: '6px' }}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
  </svg>
);

const LpgLogin = () => {
  const { loginLpgUser } = useContext(AppContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState('citizen@lpg.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await loginLpgUser(email, password);
    setLoading(false);
    if (res.success) {
      if (res.role === 'admin') {
        navigate('/admin');
      } else if (res.role === 'distributor') {
        navigate('/distributor');
      } else {
        navigate('/lpg/dashboard');
      }
    } else {
      setError(res.message);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const res = await loginLpgUser('citizen@lpg.com', 'password123');
    setLoading(false);
    if (res.success) {
      navigate('/lpg/dashboard');
    } else {
      setError(res.message);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '3rem 1.5rem' }}>
      <motion.div 
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -30, opacity: 0 }}
        className="glass-panel"
        style={{ width: '100%', maxWidth: '450px', padding: '2.5rem', border: '1px solid rgba(249, 115, 22, 0.25)', boxShadow: '0 8px 32px 0 rgba(249, 115, 22, 0.1)' }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'linear-gradient(135deg, #ea580c 0%, #a855f7 100%)', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', color: '#ffffff', marginBottom: '1rem' }}>
            <Flame size={24} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ffffff' }}>LPG Portal Login</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Verify credentials to access smart cylinder bookings.
          </p>
        </div>

        {/* Error alert */}
        {error && (
          <div className="glass-panel" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', padding: '0.75rem 1rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: '#f87171', fontSize: '0.85rem' }}>
            <ShieldAlert size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input 
              type="email" 
              className="form-input" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="citizen@lpg.com"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label className="form-label" style={{ margin: 0 }}>Password</label>
              <a href="#forgot" style={{ fontSize: '0.75rem', color: '#f97316', textDecoration: 'none', fontWeight: 500 }} onClick={(e) => { e.preventDefault(); alert("Verification email sent to " + email); }}>
                Forgot Password?
              </a>
            </div>
            <input 
              type="password" 
              className="form-input" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '0.85rem', marginTop: '1.5rem', background: 'linear-gradient(135deg, #ea580c 0%, #a855f7 100%)', boxShadow: '0 4px 15px rgba(249, 115, 22, 0.2)' }}
            disabled={loading}
          >
            {loading ? (
              <span className="skeleton" style={{ width: '60px', height: '18px', display: 'block', margin: '0 auto' }}></span>
            ) : (
              <>
                Sign In <LogIn size={16} />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0', gap: '0.75rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }}></div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }}></div>
        </div>

        {/* Google Login */}
        <button 
          onClick={handleGoogleLogin} 
          className="btn btn-secondary" 
          style={{ width: '100%', padding: '0.85rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}
          disabled={loading}
        >
          <GoogleIcon /> Continue with Google
        </button>

        {/* Demo Credentials Helper */}
        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', backdropFilter: 'blur(8px)' }}>
          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600, textAlign: 'left' }}>Demo Quick-Fill Accounts:</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => { setEmail('admin@fuelguard.gov'); setPassword('admin123'); }}
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', textAlign: 'left', display: 'flex', justifyContent: 'space-between', border: '1px solid rgba(249, 115, 22, 0.15)', background: 'rgba(249, 115, 22, 0.05)', color: '#ffffff' }}
            >
              <span>👑 Gov Admin</span>
              <span style={{ opacity: 0.6 }}>admin@fuelguard.gov</span>
            </button>
            <button
              type="button"
              onClick={() => { setEmail('distributor@supergas.com'); setPassword('distributor123'); }}
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', textAlign: 'left', display: 'flex', justifyContent: 'space-between', border: '1px solid rgba(249, 115, 22, 0.15)', background: 'rgba(249, 115, 22, 0.05)', color: '#ffffff' }}
            >
              <span>🚚 LPG Distributor</span>
              <span style={{ opacity: 0.6 }}>distributor@supergas.com</span>
            </button>
            <button
              type="button"
              onClick={() => { setEmail('citizen@lpg.com'); setPassword('password123'); }}
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', textAlign: 'left', display: 'flex', justifyContent: 'space-between', border: '1px solid rgba(249, 115, 22, 0.15)', background: 'rgba(249, 115, 22, 0.05)', color: '#ffffff' }}
            >
              <span>👤 LPG Citizen</span>
              <span style={{ opacity: 0.6 }}>citizen@lpg.com</span>
            </button>
          </div>
        </div>

        {/* Register link */}
        <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2rem' }}>
          Don't have an account?{' '}
          <Link to="/lpg/register" style={{ color: '#f97316', textDecoration: 'none', fontWeight: 600 }}>
            Register Consumer Account
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default LpgLogin;
