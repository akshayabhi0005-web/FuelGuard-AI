import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { 
  Flame, Fuel, Sun, Moon, User, Menu, X, 
  HelpCircle, Mail, LogOut, Info, ArrowLeft, ShieldAlert, Settings, AlertOctagon
} from 'lucide-react';

const Navbar = () => {
  const { 
    fuelUser, 
    lpgUser, 
    adminUser, 
    pumpUser, 
    distributorUser, 
    logoutFuelUser, 
    logoutLpgUser,
    emergencyMode
  } = useContext(AppContext);
  
  const navigate = useNavigate();
  const location = useLocation();

  const [theme, setTheme] = useState(() => localStorage.getItem('fuelguard_theme') || 'dark');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowRoleMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const isFuelPath = location.pathname.startsWith('/fuel');
  const isLpgPath = location.pathname.startsWith('/lpg');
  
  const activeUser = adminUser || pumpUser || distributorUser || (isLpgPath ? lpgUser : isFuelPath ? fuelUser : (fuelUser || lpgUser));
  
  const handleLogout = () => {
    setMobileMenuOpen(false);
    logoutFuelUser();
    logoutLpgUser();
    navigate('/');
  };

  const handleProfileClick = () => {
    setMobileMenuOpen(false);
    if (adminUser) navigate('/admin');
    else if (pumpUser) navigate('/pump');
    else if (distributorUser) navigate('/distributor');
    else navigate('/profile');
  };

  const navThemeClass = isLpgPath ? 'theme-lpg' : 'theme-fuel';

  return (
    <div className={navThemeClass}>
      {emergencyMode && (
        <div style={{
          background: 'linear-gradient(90deg, #dc2626 0%, #ef4444 50%, #dc2626 100%)',
          color: '#ffffff',
          textAlign: 'center',
          padding: '8px 1rem',
          fontSize: '0.8rem',
          fontWeight: 700,
          letterSpacing: '1px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 20px rgba(220, 38, 38, 0.4)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          zIndex: 102,
          position: 'relative',
          textTransform: 'uppercase'
        }}>
          <AlertOctagon size={16} />
          <span>CRITICAL SYSTEM ADVISORY: Emergency Mode Active. Quotas Adjusted.</span>
        </div>
      )}
      <header 
        className="glass-panel" 
        style={{ 
          borderRadius: 0, 
          borderTop: 'none', 
          borderLeft: 'none', 
          borderRight: 'none', 
          position: 'sticky', 
          top: 0, 
          zIndex: 100, 
          background: 'var(--navbar-bg)',
          backdropFilter: 'blur(12px)',
          transition: 'background-color 0.4s ease, border-color 0.4s ease'
        }}
      >
        <div className="container" style={{ height: '70px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none', color: 'var(--text-primary)' }}>
            <div style={{ 
              width: '38px', 
              height: '38px', 
              borderRadius: '8px', 
              background: isLpgPath 
                ? 'linear-gradient(135deg, #ea580c 0%, #a855f7 100%)' 
                : 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              color: '#ffffff',
              transition: 'all 0.4s ease'
            }}>
              {isLpgPath ? <Flame size={18} /> : <Fuel size={18} />}
            </div>
            <span style={{ fontWeight: 850, fontSize: '1.25rem', fontFamily: 'var(--font-heading)' }}>
              FuelGuard<span style={{ color: isLpgPath ? '#f97316' : '#06b6d4' }}> AI</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '1.4rem' }} className="desktop-nav">
            <Link to="/" style={{ color: location.pathname === '/' ? 'var(--accent-primary, #06b6d4)' : 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>
              Home
            </Link>
            <Link to="/fuel" style={{ color: isFuelPath && location.pathname === '/fuel' ? 'var(--accent-primary, #06b6d4)' : 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>
              Fuel
            </Link>
            <Link to="/lpg" style={{ color: isLpgPath && location.pathname === '/lpg' ? 'var(--accent-primary, #ea580c)' : 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>
              LPG
            </Link>

             {['/admin', '/pump', '/distributor'].includes(location.pathname) && (
              <Link 
                to="/" 
                style={{ 
                  color: '#ef4444', 
                  textDecoration: 'none', 
                  fontSize: '0.85rem', 
                  fontWeight: 700, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(239, 68, 68, 0.2)'
                }}
              >
                ← Back to Main App
              </Link>
            )}

            {/* Operator Shortcuts Dropdown for easier testing */}
            {activeUser && (
              <div style={{ position: 'relative' }} ref={dropdownRef}>
                <button 
                  onClick={() => setShowRoleMenu(!showRoleMenu)}
                  className="btn btn-secondary" 
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Settings size={14} /> Control Centers
                </button>
                {showRoleMenu && (
                  <div className="glass-panel" style={{ position: 'absolute', top: '45px', right: 0, width: '220px', padding: '0.5rem', background: 'var(--navbar-bg)', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '0.25rem', boxShadow: 'var(--glass-shadow)', zIndex: 101 }}>
                    <Link to="/admin" onClick={() => setShowRoleMenu(false)} style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.85rem', padding: '0.5rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px', textAlign: 'left' }} className="dropdown-item">
                      Government Admin
                    </Link>
                    <Link to="/pump" onClick={() => setShowRoleMenu(false)} style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.85rem', padding: '0.5rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px', textAlign: 'left' }} className="dropdown-item">
                      Petrol Pump
                    </Link>
                    <Link to="/distributor" onClick={() => setShowRoleMenu(false)} style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.85rem', padding: '0.5rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px', textAlign: 'left' }} className="dropdown-item">
                      LPG Distributor
                    </Link>
                  </div>
                )}
              </div>
            )}

            <button 
              onClick={() => setShowAboutModal(true)} 
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600, fontFamily: 'inherit' }}
            >
              About
            </button>
            <button 
              onClick={() => setShowContactModal(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600, fontFamily: 'inherit' }}
            >
              Contact
            </button>

            {/* Theme Toggle Button */}
            <button 
              onClick={toggleTheme}
              className="btn btn-secondary"
              style={{ padding: '0.4rem', borderRadius: '50%', width: '36px', height: '36px' }}
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Dynamic Session Buttons */}
            {activeUser ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button 
                  onClick={handleProfileClick} 
                  className="btn btn-secondary" 
                  style={{ display: 'flex', gap: '0.4rem', padding: '0.45rem 1rem', fontSize: '0.85rem', borderRadius: '10px' }}
                >
                  <User size={14} style={{ color: isLpgPath ? '#f97316' : '#06b6d4' }} /> {adminUser ? 'Admin' : pumpUser ? 'Pump Operator' : distributorUser ? 'Distributor' : 'Profile'}
                </button>
                <button 
                  onClick={handleLogout} 
                  className="btn btn-secondary" 
                  style={{ padding: '0.45rem 1rem', fontSize: '0.85rem', borderRadius: '10px' }}
                >
                  <LogOut size={14} /> Logout
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={() => navigate(isLpgPath ? '/lpg/login' : '/fuel/login')} 
                  className="btn btn-secondary" 
                  style={{ padding: '0.45rem 1rem', fontSize: '0.85rem', borderRadius: '10px' }}
                >
                  Login
                </button>
                <button 
                  onClick={() => navigate(isLpgPath ? '/lpg/register' : '/fuel/register')} 
                  className="btn btn-primary" 
                  style={{ 
                    padding: '0.45rem 1.25rem', 
                    fontSize: '0.85rem', 
                    borderRadius: '10px',
                    background: isLpgPath 
                      ? 'linear-gradient(135deg, #ea580c 0%, #a855f7 100%)' 
                      : 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)',
                    boxShadow: 'none'
                  }}
                >
                  Register
                </button>
              </div>
            )}
          </nav>

          {/* Mobile Navigation Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} className="mobile-nav-controls">
            <button 
              onClick={toggleTheme}
              className="btn btn-secondary"
              style={{ padding: '0.4rem', borderRadius: '50%', width: '36px', height: '36px' }}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div 
          className="glass-panel" 
          style={{ 
            position: 'absolute', 
            top: '71px', 
            left: 0, 
            right: 0, 
            zIndex: 99, 
            borderRadius: 0, 
            background: 'var(--navbar-bg)', 
            backdropFilter: 'blur(16px)',
            padding: '1.5rem',
            borderLeft: 'none',
            borderRight: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            textAlign: 'left'
          }}
        >
          <Link to="/" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 600 }}>Home</Link>
          <Link to="/fuel" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 600 }}>Fuel Services</Link>
          <Link to="/lpg" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 600 }}>LPG Services</Link>
          
          {activeUser && (
            <>
              <div style={{ height: '1px', background: 'var(--glass-border)' }}></div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Operator Command Portals</span>
              <Link to="/admin" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 600 }}>Government Admin</Link>
              <Link to="/pump" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 600 }}>Petrol Pump</Link>
              <Link to="/distributor" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 600 }}>LPG Distributor</Link>
            </>
          )}
          {['/admin', '/pump', '/distributor'].includes(location.pathname) && (
            <Link 
              to="/" 
              onClick={() => setMobileMenuOpen(false)} 
              style={{ 
                color: '#ef4444', 
                textDecoration: 'none', 
                fontWeight: 700,
                display: 'inline-block',
                background: 'rgba(239, 68, 68, 0.1)',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                textAlign: 'center'
              }}
            >
              ← Back to Main App
            </Link>
          )}
          <div style={{ height: '1px', background: 'var(--glass-border)' }}></div>
          <Link to="/fuel/dashboard" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 600 }}>Fuel Dashboard</Link>
          <Link to="/lpg/dashboard" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 600 }}>LPG Dashboard</Link>
          <div style={{ height: '1px', background: 'var(--glass-border)' }}></div>

          <button 
            onClick={() => { setMobileMenuOpen(false); setShowAboutModal(true); }} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 600, textAlign: 'left', fontFamily: 'inherit' }}
          >
            About FuelGuard
          </button>
          <button 
            onClick={() => { setMobileMenuOpen(false); setShowContactModal(true); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 600, textAlign: 'left', fontFamily: 'inherit' }}
          >
            Contact Support
          </button>

          <div style={{ height: '1px', background: 'var(--glass-border)' }}></div>

          {activeUser ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <button onClick={handleProfileClick} className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                  Profile
                </button>
                <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button onClick={() => { setMobileMenuOpen(false); navigate(isLpgPath ? '/lpg/login' : '/fuel/login'); }} className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                Login
              </button>
              <button 
                onClick={() => { setMobileMenuOpen(false); navigate(isLpgPath ? '/lpg/register' : '/fuel/register'); }} 
                className="btn btn-primary" 
                style={{ 
                  padding: '0.5rem',
                  background: isLpgPath 
                    ? 'linear-gradient(135deg, #ea580c 0%, #a855f7 100%)' 
                    : 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)',
                  boxShadow: 'none'
                }}
              >
                Register
              </button>
            </div>
          )}
        </div>
      )}

      {/* About Modal */}
      {showAboutModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(2, 6, 23, 0.75)', backdropFilter: 'blur(8px)', padding: '1rem' }}>
          <div className="glass-panel" style={{ padding: '2rem', maxWidth: '500px', width: '100%', border: '1px solid var(--glass-border)' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Info style={{ color: isLpgPath ? '#f97316' : '#06b6d4' }} /> About FuelGuard AI
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
              FuelGuard AI is a state-of-the-art smart allocation platform built to manage and optimize energy resources during national supply challenges.
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              Leveraging advanced machine learning models, the portal computes equitable allocation indices for domestic fuel and LPG cylinders while ensuring priority access for emergency networks.
            </p>
            <button onClick={() => setShowAboutModal(false)} className="btn btn-primary" style={{ width: '100%', background: isLpgPath ? 'linear-gradient(135deg, #ea580c, #a855f7)' : 'linear-gradient(135deg, #2563eb, #06b6d4)' }}>
              Understood
            </button>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {showContactModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(2, 6, 23, 0.75)', backdropFilter: 'blur(8px)', padding: '1rem' }}>
          <div className="glass-panel" style={{ padding: '2rem', maxWidth: '500px', width: '100%', border: '1px solid var(--glass-border)' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Mail style={{ color: isLpgPath ? '#f97316' : '#06b6d4' }} /> Contact Support Desk
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              Have questions or facing registration issues? Reach out directly to our energy operations team.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>National Hotline:</span>
                <strong>1919 (Toll Free)</strong>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Operations Mail:</span>
                <strong>support@fuelguard.gov</strong>
              </div>
            </div>
            <button onClick={() => setShowContactModal(false)} className="btn btn-primary" style={{ width: '100%', background: isLpgPath ? 'linear-gradient(135deg, #ea580c, #a855f7)' : 'linear-gradient(135deg, #2563eb, #06b6d4)' }}>
              Close Support Desk
            </button>
          </div>
        </div>
      )}

      {/* Responsive styles */}
      <style>{`
        @media (min-width: 851px) {
          .mobile-nav-controls { display: none !important; }
        }
        @media (max-width: 850px) {
          .desktop-nav { display: none !important; }
        }
        .dropdown-item:hover {
          background: rgba(255,255,255,0.05);
        }
      `}</style>
    </div>
  );
};

export default Navbar;
