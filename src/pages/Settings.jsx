import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, Sun, Moon, Bell, Globe, Map, ShieldAlert, Sparkles } from 'lucide-react';
import Navbar from '../components/Navbar';

const Settings = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => localStorage.getItem('fuelguard_theme') || 'dark');
  const [language, setLanguage] = useState('English');
  const [notifs, setNotifs] = useState({ sms: true, email: true, push: false });
  const [mapZoom, setMapZoom] = useState('13');
  const [mapStyle, setMapStyle] = useState('Standard');
  const [accessibility, setAccessibility] = useState(false);

  useEffect(() => {
    if (accessibility) {
      document.body.style.fontSize = '1.05rem';
      document.body.style.fontWeight = '500';
    } else {
      document.body.style.fontSize = '';
      document.body.style.fontWeight = '';
    }
  }, [accessibility]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('fuelguard_theme', theme);
  }, [theme]);

  const handleResetData = () => {
    if (window.confirm('WARNING: This will clear all local transaction caches, user profiles and custom bookings. Do you want to proceed?')) {
      localStorage.clear();
      alert('Local storage registry wiped. Reloading application...');
      window.location.href = '/';
    }
  };

  const handleSaveSettings = () => {
    alert('Preferences secured and synchronized with device configuration!');
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
        <div style={{ maxWidth: '800px', width: '100%', margin: '0 auto', textAlign: 'left' }}>
          
          <div style={{ marginBottom: '2.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#06b6d4', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <SettingsIcon size={14} /> Control Centre Preferences
            </span>
            <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>System Settings</h1>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '2rem' }} className="grid-mobile">
            {/* Left Column: Preferences */}
            <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Theme Settings */}
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1rem' }}>
                  {theme === 'dark' ? <Moon size={16} style={{ color: '#06b6d4' }} /> : <Sun size={16} style={{ color: '#ea580c' }} />} Display Theme
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <button 
                    onClick={() => setTheme('dark')} 
                    className="btn btn-secondary" 
                    style={{ background: theme === 'dark' ? 'rgba(6,182,212,0.15)' : 'transparent', border: theme === 'dark' ? '1px solid #06b6d4' : '1px solid rgba(255,255,255,0.08)', color: theme === 'dark' ? '#06b6d4' : 'var(--text-secondary)' }}
                  >
                    Dark Theme Mode
                  </button>
                  <button 
                    onClick={() => setTheme('light')} 
                    className="btn btn-secondary" 
                    style={{ background: theme === 'light' ? 'rgba(6,182,212,0.15)' : 'transparent', border: theme === 'light' ? '1px solid #06b6d4' : '1px solid rgba(255,255,255,0.08)', color: theme === 'light' ? '#06b6d4' : 'var(--text-secondary)' }}
                  >
                    Light Theme Mode
                  </button>
                </div>
              </div>

              {/* Language Selection */}
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1rem' }}>
                  <Globe size={16} style={{ color: '#8b5cf6' }} /> Language Localization
                </h3>
                <select 
                  className="form-select" 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option value="English">English (United Kingdom)</option>
                  <option value="Sinhala">Sinhala (Sri Lanka)</option>
                  <option value="Tamil">Tamil (Sri Lanka)</option>
                </select>
              </div>

              {/* Accessibility Settings */}
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1rem' }}>
                  <Sparkles size={16} style={{ color: '#eab308' }} /> Accessibility Mode
                </h3>
                <label style={{ display: 'flex', gap: '0.75rem', cursor: 'pointer', alignItems: 'center' }}>
                  <input 
                    type="checkbox" 
                    checked={accessibility}
                    onChange={(e) => setAccessibility(e.target.checked)}
                  />
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block' }}>High Contrast & Larger Text</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Increase text sizing and readability contrast index.</span>
                  </div>
                </label>
              </div>

              {/* Map Preferences */}
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1rem' }}>
                  <Map size={16} style={{ color: '#06b6d4' }} /> Leaflet Map Options
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label className="form-label">Default Zoom Level</label>
                    <select className="form-select" value={mapZoom} onChange={(e) => setMapZoom(e.target.value)}>
                      <option value="11">11 (Wide District View)</option>
                      <option value="13">13 (Default City View)</option>
                      <option value="15">15 (Detailed Street View)</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Map Tile Imagery</label>
                    <select className="form-select" value={mapStyle} onChange={(e) => setMapStyle(e.target.value)}>
                      <option value="Standard">OpenStreetMap Classic</option>
                      <option value="Hot">OpenStreetMap Humanity (High Contrast)</option>
                    </select>
                  </div>
                </div>
              </div>

              <button onClick={handleSaveSettings} className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #2563eb, #06b6d4)', marginTop: '0.5rem' }}>
                Apply Display Preferences
              </button>

            </div>

            {/* Right Column: Alerts & Toggles */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Notification Toggles */}
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1.25rem' }}>
                  <Bell size={16} style={{ color: '#06b6d4' }} /> Notifications alerts
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {[
                    { key: 'sms', label: 'SMS Quota Alerts', desc: 'SMS text delivered on successful fill handoffs.' },
                    { key: 'email', label: 'Email Cylinder Tracking', desc: 'Distributor bowser dispatch reports via inbox.' },
                    { key: 'push', label: 'Emergency Alerts', desc: 'Critical alert banners on crisis quotas halving.' }
                  ].map(notif => (
                    <label key={notif.key} style={{ display: 'flex', gap: '0.75rem', cursor: 'pointer', alignItems: 'flex-start' }}>
                      <input 
                        type="checkbox" 
                        style={{ marginTop: '3px' }} 
                        checked={notifs[notif.key]}
                        onChange={(e) => setNotifs(prev => ({ ...prev, [notif.key]: e.target.checked }))}
                      />
                      <div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block' }}>{notif.label}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{notif.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Wiping storage database */}
              <div className="glass-panel" style={{ padding: '1.5rem', border: '1px solid rgba(239,68,68,0.2)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.75rem', color: '#ef4444' }}>
                  <ShieldAlert size={16} /> Danger Zone
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '1.25rem' }}>
                  Wiping device database caches will restore the system to default citizen credentials (`citizen@fuel.com` / `password123`) and reset allocations.
                </p>
                <button 
                  onClick={handleResetData}
                  className="btn btn-secondary" 
                  style={{ width: '100%', border: '1px solid #ef4444', color: '#f87171' }}
                >
                  Clear Device Registry
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default Settings;
