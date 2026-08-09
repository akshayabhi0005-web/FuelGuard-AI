import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AppContext } from '../../context/AppContext';
import { 
  Fuel, Wallet, QrCode, History, MapPin, 
  AlertOctagon, Compass, User, Bell, Settings, 
  CheckCircle, ArrowRight, ShieldAlert, Sparkles, RefreshCw
} from 'lucide-react';
import InteractiveMap from '../../components/InteractiveMap';
import AiAssistant from '../../components/AiAssistant';

const FuelDashboard = () => {
  const { 
    fuelUser, 
    loginFuelUser,
    remainingQuota, 
    fuelTransactions, 
    addFuelTransaction, 
    setRemainingQuota,
    emergencyMode,
    systemNotifications,
    normalQuotaLimit,
    emergencyQuotaLimit,
    emergencyVehicleQuotaLimit,
    stations,
    getStationDistance,
    getStationWaitTime,
    adminUser,
    generateBackendQrToken
  } = useContext(AppContext);
  
  const navigate = useNavigate();

  // Auto login citizen on mount if accessed directly (and no Admin is logged in)
  useEffect(() => {
    if (!fuelUser && !adminUser) {
      loginFuelUser('citizen@fuel.com', 'password123');
    }
  }, [fuelUser, loginFuelUser, adminUser]);

  // Tab State
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, notifications, profile, settings

  // QR Modal State
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrValue, setQrValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [fillLiters, setFillLiters] = useState('10');
  const [fillStation, setFillStation] = useState('Ceypetco - Town Hall');
  const [fillSuccess, setFillSuccess] = useState(false);
  const [fillError, setFillError] = useState('');

  // Notifications State (Mock)
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'quota', title: 'Weekly Quota Restored', desc: 'Your vehicle quota has been reset to 50.0 Liters.', date: '2026-08-03' },
    { id: 2, type: 'alert', title: 'High Demand Area Warning', desc: 'Colombo central pump stations are experiencing higher than average wait times.', date: '2026-08-04' }
  ]);

  if (!fuelUser && !adminUser) return null;

  const displayUser = fuelUser || {
    fullName: 'John Doe (Admin View)',
    phone: '9876543210',
    email: 'citizen@fuel.com',
    citizenId: '19983423423V',
    vehicleNumber: 'WP-CAD-8930',
    vehicleType: 'Car',
    district: 'Colombo',
    state: 'Western'
  };

  // Handle QR Generation
  const handleGenerateQR = async () => {
    setIsGenerating(true);
    setFillError('');
    setFillSuccess(false);
    
    try {
      const token = await generateBackendQrToken(displayUser.vehicleNumber);
      setQrValue(token);
      setIsGenerating(false);
      setQrModalOpen(true);
    } catch (err) {
      const fallbackToken = `FUEL-${displayUser.vehicleNumber}-${Date.now()}`;
      setQrValue(fallbackToken);
      setIsGenerating(false);
      setQrModalOpen(true);
    }
  };

  // Mock pump scanning the QR code
  const handleMockScan = (e) => {
    e.preventDefault();
    setFillError('');

    const liters = parseFloat(fillLiters);
    if (isNaN(liters) || liters <= 0) {
      setFillError('Please enter a valid amount.');
      return;
    }

    if (liters > remainingQuota) {
      setFillError(`Failed: Amount exceeds remaining quota (${remainingQuota} L).`);
      return;
    }

    const res = addFuelTransaction(liters, fillStation, displayUser.vehicleNumber, qrValue);
    if (res.success) {
      setFillSuccess(true);
      setTimeout(() => {
        setQrModalOpen(false);
        setFillSuccess(false);
      }, 1800);
    } else {
      setFillError(res.message);
    }
  };

  const isEmergencyVehicle = fuelUser?.vehicleType === 'Ambulance' || fuelUser?.vehicleType === 'Police' || fuelUser?.vehicleType === 'Fire';
  const maxLimit = emergencyMode 
    ? (isEmergencyVehicle ? emergencyVehicleQuotaLimit : emergencyQuotaLimit) 
    : normalQuotaLimit;

  const handleResetQuota = () => {
    setRemainingQuota(maxLimit);
    alert(`Mock weekly reset complete! Your quota has been restored to ${maxLimit} L.`);
  };

  const petrolPumps = stations
    .filter(s => s.type === 'fuel')
    .map(s => ({
      name: s.name,
      distance: getStationDistance(s),
      status: getStationWaitTime(s),
      type: s.available,
      update: 'Live Stock'
    }));

  return (
    <div className="container" style={{ padding: '2rem 1.5rem', flex: 1 }}>
      {/* Emergency Mode Warning Banner */}
      {emergencyMode && (
        <div className="glass-panel" style={{ background: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.35)', padding: '1rem 1.5rem', borderRadius: '12px', color: '#f87171', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 'bold', textAlign: 'left' }}>
          <ShieldAlert size={20} style={{ color: '#ef4444', flexShrink: 0 }} />
          <span>⚠️ EMERGENCY MODE ACTIVE: Weekly quotas reduced to {emergencyQuotaLimit} L for general consumers (and prioritized to {emergencyVehicleQuotaLimit} L for emergency services).</span>
        </div>
      )}

      {/* Navigation tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem', overflowX: 'auto' }}>
        {[
          { id: 'dashboard', label: 'Dashboard', icon: <Fuel size={16} /> },
          { id: 'profile', label: 'Profile', icon: <User size={16} /> },
          { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
          { id: 'settings', label: 'Settings', icon: <Settings size={16} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="btn"
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: '10px',
              background: activeTab === tab.id ? 'linear-gradient(135deg, rgba(37,99,235,0.15) 0%, rgba(6,182,212,0.15) 100%)' : 'transparent',
              color: activeTab === tab.id ? '#06b6d4' : 'var(--text-secondary)',
              border: '1px solid',
              borderColor: activeTab === tab.id ? 'rgba(6,182,212,0.3)' : 'transparent',
              fontSize: '0.9rem',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <AnimatePresence mode="wait">
        {activeTab === 'dashboard' && (
          <>
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '2rem' }}
              className="dashboard-grid"
            >
            {/* Left Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Quota Wallet Card */}
              <div className="glass-panel" style={{ padding: '2.5rem', border: '1px solid rgba(6,182,212,0.25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>
                    <Wallet size={16} style={{ color: '#06b6d4' }} /> Fuel Quota Wallet
                  </div>
                  <h2 style={{ fontSize: '3rem', fontWeight: 800, marginTop: '0.5rem', color: '#ffffff' }}>
                    {remainingQuota.toFixed(1)} <span style={{ fontSize: '1.5rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Liters</span>
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                    Vehicle: <strong>{displayUser.vehicleNumber}</strong> ({displayUser.vehicleType})
                  </p>
                  
                  {/* Progress bar */}
                  <div style={{ width: '250px', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', marginTop: '1rem', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, (remainingQuota / maxLimit) * 100)}%`, height: '100%', background: 'linear-gradient(90deg, #2563eb, #06b6d4)', borderRadius: '3px', transition: 'width 0.5s ease' }}></div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <button 
                    onClick={handleGenerateQR}
                    className="btn btn-primary"
                    style={{ padding: '0.85rem 1.75rem' }}
                    disabled={isGenerating || remainingQuota <= 0}
                  >
                    <QrCode size={18} /> {isGenerating ? 'Generating...' : 'Generate QR Code'}
                  </button>
                  <button 
                    onClick={handleResetQuota}
                    className="btn btn-secondary" 
                    style={{ padding: '0.5rem 1.25rem', fontSize: '0.8rem' }}
                  >
                    <RefreshCw size={12} /> Refill Quota (Mock reset)
                  </button>
                </div>
              </div>

              {/* Transactions List */}
              <div className="glass-panel" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <History size={18} style={{ color: '#06b6d4' }} /> Transaction History
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Weekly Limit: {maxLimit.toFixed(1)} L</span>
                </div>

                {fuelTransactions.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>No transactions recorded this cycle.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {fuelTransactions.map((tx) => (
                      <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{tx.station}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            {tx.createdAt ? new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : tx.date} • {tx.type} • <span style={{ color: '#34d399', fontWeight: 'bold', fontSize: '0.65rem' }}>{tx.verificationStatus || 'VALID'}</span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ color: '#06b6d4', fontWeight: 700, fontSize: '1.1rem' }}>-{tx.amount.toFixed(1)} L</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Rs. {tx.cost.toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Emergency Alerts Panel */}
              <div className="glass-panel-accent" style={{ padding: '1.5rem', background: 'rgba(6, 182, 212, 0.03)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#06b6d4', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <AlertOctagon size={18} /> Active Emergency Alerts
                </h3>
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239,68,68,0.2)', padding: '0.85rem', borderRadius: '10px', fontSize: '0.85rem', color: '#f87171', marginBottom: '0.75rem' }}>
                  <strong>Critical:</strong> Colombo Central fuel distribution delayed by 6 hours. Expect queues.
                </div>
                <div style={{ background: 'rgba(249, 115, 22, 0.1)', border: '1px solid rgba(249,115,22,0.2)', padding: '0.85rem', borderRadius: '10px', fontSize: '0.85rem', color: '#fb923c' }}>
                  <strong>Notice:</strong> Emergency service priority active in Western Province.
                </div>
              </div>

              {/* AI Recommendations */}
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Compass size={18} style={{ color: '#06b6d4' }} /> AI Recommendations
                </h3>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <Sparkles size={18} style={{ color: '#06b6d4', flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Based on local queues, refuel at <strong>LIOC - Colombo 03</strong> tomorrow between <strong>6:00 AM - 8:00 AM</strong> to save approximately 45 minutes of wait time.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

            {/* Dedicated Full-Width Map Section at the Bottom */}
            <div className="glass-panel" style={{ padding: '2rem', width: '100%', border: '1px solid rgba(6,182,212,0.25)', borderRadius: '20px', background: 'var(--glass-bg)', boxShadow: 'var(--glass-shadow)', marginTop: '2rem', textAlign: 'left' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem', color: '#ffffff' }}>
                <MapPin size={22} style={{ color: '#06b6d4' }} /> Live Interactive Fuel Allocation Map Node
              </h3>
              <InteractiveMap type="fuel" />
            </div>
          </>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="glass-panel"
            style={{ padding: '2.5rem', maxWidth: '600px', margin: '0 auto', textAlign: 'left' }}
          >
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={22} style={{ color: '#06b6d4' }} /> Citizen & Vehicle Profile
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="profile-grid">
              <div>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Full Name</span>
                <strong style={{ fontSize: '1rem', color: '#ffffff' }}>{displayUser.fullName}</strong>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Contact Phone</span>
                <strong style={{ fontSize: '1rem', color: '#ffffff' }}>{displayUser.phone}</strong>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Registered Email</span>
                <strong style={{ fontSize: '1rem', color: '#ffffff' }}>{displayUser.email}</strong>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Citizen ID / NIC</span>
                <strong style={{ fontSize: '1rem', color: '#ffffff' }}>{displayUser.citizenId || 'Not Provided'}</strong>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Vehicle Plate Number</span>
                <strong style={{ fontSize: '1rem', color: '#ffffff', textTransform: 'uppercase' }}>{displayUser.vehicleNumber}</strong>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Vehicle Class</span>
                <strong style={{ fontSize: '1rem', color: '#ffffff' }}>{displayUser.vehicleType}</strong>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>District</span>
                <strong style={{ fontSize: '1rem', color: '#ffffff' }}>{displayUser.district}</strong>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>State / Province</span>
                <strong style={{ fontSize: '1rem', color: '#ffffff' }}>{displayUser.state}</strong>
              </div>
            </div>
            
            <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(6,182,212,0.05)', borderRadius: '10px', border: '1px solid rgba(6,182,212,0.15)', fontSize: '0.85rem', color: '#e2e8f0' }}>
              <strong>Verification Status:</strong> Government DMV Database Checked & Confirmed. AI model active.
            </div>
          </motion.div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="glass-panel"
            style={{ padding: '2.5rem', maxWidth: '700px', margin: '0 auto', textAlign: 'left' }}
          >
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bell size={22} style={{ color: '#06b6d4' }} /> Notifications & System Alerts
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {(systemNotifications || []).map(notif => (
                <div key={notif.id} style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: '1rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: notif.type === 'quota' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(249, 115, 22, 0.1)', color: notif.type === 'quota' ? '#34d399' : '#fb923c', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                    <Bell size={18} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '1rem' }}>
                      <h4 style={{ fontWeight: 600, fontSize: '0.95rem', color: '#ffffff' }}>{notif.title}</h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{notif.date}</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{notif.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="glass-panel"
            style={{ padding: '2.5rem', maxWidth: '600px', margin: '0 auto', textAlign: 'left' }}
          >
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Settings size={22} style={{ color: '#06b6d4' }} /> Settings & Preferences
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.5rem' }}>Notification Preferences</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {[
                    'Receive SMS alert 12 hours before weekly reset',
                    'Notify on supply status changes in my district',
                    'Send email transaction receipts automatically'
                  ].map((label, idx) => (
                    <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                      <input type="checkbox" defaultChecked style={{ cursor: 'pointer' }} />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.5rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.5rem' }}>Account Security</h4>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={() => alert("Multi-Factor Authentication enabled.")}>
                    Enable 2FA Shield
                  </button>
                  <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={() => alert("Audit log downloaded.")}>
                    Download Sign-in Log
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR MODAL (SIMULATED PUMP TERMINAL) */}
      <AnimatePresence>
        {qrModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(8px)', padding: '1.5rem' }}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel"
              style={{ width: '100%', maxWidth: '420px', padding: '2rem', border: '1px solid rgba(6, 182, 212, 0.3)', textAlign: 'center' }}
            >
              {fillSuccess ? (
                <div style={{ padding: '2rem 0' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 1.5rem' }}>
                    <CheckCircle size={32} />
                  </div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.5rem' }}>Authorization Success</h3>
                  <p style={{ color: '#34d399', fontSize: '0.9rem' }}>{fillLiters} Liters successfully dispensed!</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.5rem' }}>Updating quota balance...</p>
                </div>
              ) : (
                <>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem', color: '#ffffff' }}>Active Quota Code</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Present this secure token to the petrol pump clerk.</p>
                  
                  {/* Glowing QR wrapper */}
                  <div style={{ display: 'inline-block', padding: '0.5rem', background: '#ffffff', borderRadius: '12px', border: '1px solid rgba(6, 182, 212, 0.3)', marginBottom: '1.5rem' }} className="pulse-indicator">
                    {/* Simulated visual QR */}
                    <div style={{ width: '150px', height: '150px', background: '#ffffff', padding: '4px', display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px' }}>
                      <div style={{ background: '#0f172a' }}></div>
                      <div style={{ background: '#0f172a' }}></div>
                      <div></div>
                      <div style={{ background: '#0f172a' }}></div>
                      <div style={{ background: '#0f172a' }}></div>
                      <div style={{ background: '#0f172a' }}></div>

                      <div style={{ background: '#0f172a' }}></div>
                      <div></div>
                      <div></div>
                      <div></div>
                      <div></div>
                      <div style={{ background: '#0f172a' }}></div>

                      <div></div>
                      <div></div>
                      <div style={{ background: '#0f172a' }}></div>
                      <div style={{ background: '#0f172a' }}></div>
                      <div></div>
                      <div></div>

                      <div style={{ background: '#0f172a' }}></div>
                      <div></div>
                      <div style={{ background: '#0f172a' }}></div>
                      <div></div>
                      <div style={{ background: '#0f172a' }}></div>
                      <div></div>

                      <div style={{ background: '#0f172a' }}></div>
                      <div></div>
                      <div></div>
                      <div></div>
                      <div style={{ background: '#0f172a' }}></div>
                      <div style={{ background: '#0f172a' }}></div>

                      <div style={{ background: '#0f172a' }}></div>
                      <div style={{ background: '#0f172a' }}></div>
                      <div></div>
                      <div style={{ background: '#0f172a' }}></div>
                      <div style={{ background: '#0f172a' }}></div>
                      <div style={{ background: '#0f172a' }}></div>
                    </div>
                  </div>
                  
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--glass-border)', fontSize: '0.75rem', fontFamily: 'monospace', color: '#06b6d4', display: 'inline-block', marginBottom: '1.5rem' }}>
                    {qrValue}
                  </div>

                  {/* Simulating scanning / pump terminal */}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#fb923c', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '1rem' }}>
                      ⚡ Simulated Pump Clerk Scanner
                    </span>
                    
                    {fillError && (
                      <div className="glass-panel" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', padding: '0.5rem', borderRadius: '8px', color: '#f87171', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
                        {fillError}
                      </div>
                    )}
                    
                    <form onSubmit={handleMockScan} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-secondary)', textAlign: 'left', marginBottom: '3px' }}>Select Station</label>
                          <select 
                            className="form-select" 
                            style={{ padding: '0.5rem', fontSize: '0.8rem', height: '36px', backgroundPosition: 'right 0.5rem center' }}
                            value={fillStation}
                            onChange={(e) => setFillStation(e.target.value)}
                          >
                            <option value="Ceypetco - Town Hall">Ceypetco - Town Hall</option>
                            <option value="LIOC - Colombo 03">LIOC - Colombo 03</option>
                            <option value="Sinopec - Borella">Sinopec - Borella</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-secondary)', textAlign: 'left', marginBottom: '3px' }}>Liters to Fill</label>
                          <input 
                            type="number" 
                            className="form-input" 
                            style={{ padding: '0.5rem', fontSize: '0.8rem', height: '36px' }}
                            value={fillLiters}
                            onChange={(e) => setFillLiters(e.target.value)}
                            max={remainingQuota}
                            min="1"
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button type="button" onClick={() => setQrModalOpen(false)} className="btn btn-secondary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem' }}>
                          Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', background: '#06b6d4' }}>
                          Simulate Dispense
                        </button>
                      </div>
                    </form>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 900px) {
          .dashboard-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 600px) {
          .profile-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      <AiAssistant />
    </div>
  );
};

export default FuelDashboard;
