import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AppContext } from '../../context/AppContext';
import { 
  Flame, ShoppingBag, Calendar, History, MapPin, 
  Truck, Bell, Settings, User, CheckCircle, 
  QrCode, AlertOctagon, Compass, Sparkles, RefreshCw
} from 'lucide-react';
import InteractiveMap from '../../components/InteractiveMap';
import AiAssistant from '../../components/AiAssistant';

const LpgDashboard = () => {
  const { 
    lpgUser, 
    loginLpgUser,
    lpgBookings, 
    lpgStatus, 
    nextLpgBookingDate, 
    bookLpgCylinder, 
    advanceLpgDeliveryStatus,
    setLpgStatus,
    setNextLpgBookingDate,
    emergencyMode,
    systemNotifications,
    stations,
    getStationDistance,
    getStationWaitTime,
    adminUser
  } = useContext(AppContext);
  
  const navigate = useNavigate();

  // Auto login citizen on mount if accessed directly (and no Admin is logged in)
  useEffect(() => {
    if (!lpgUser && !adminUser) {
      loginLpgUser('citizen@lpg.com', 'password123');
    }
  }, [lpgUser, loginLpgUser, adminUser]);

  // Tab State
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, notifications, profile, settings

  // QR Modal State
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrValue, setQrValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);

  // Booking Weight State
  const [selectedWeight, setSelectedWeight] = useState('12.5kg');
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [bookingError, setBookingError] = useState('');

  if (!lpgUser && !adminUser) return null;

  const displayUser = lpgUser || {
    fullName: 'Jane Smith (Admin View)',
    phone: '9876543211',
    email: 'citizen@lpg.com',
    address: '123 Main St, Garden City',
    pincode: '110001',
    district: 'New Delhi',
    state: 'Delhi',
    consumerNumber: 'LPG-892301-A',
    preferredDistributor: 'Super Gas Distributors - Colombo'
  };

  // Handle Cylinder Booking
  const handleBookCylinder = (e) => {
    e.preventDefault();
    setBookingError('');
    setBookingSuccess('');

    const res = bookLpgCylinder(selectedWeight, displayUser.preferredDistributor);
    if (res.success) {
      setBookingSuccess(`Cylinder booked successfully! Booking ID: ${res.bookingId}`);
      setTimeout(() => setBookingSuccess(''), 4000);
    } else {
      setBookingError(res.message);
    }
  };

  // Generate Delivery Verification QR
  const handleGenerateQR = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const activeBooking = lpgBookings.find(b => b.status !== 'Delivered') || lpgBookings[0];
      const token = `LPG-DELIV-${activeBooking?.id || 'NO-BOOKING'}-${Date.now()}`;
      setQrValue(token);
      setIsGenerating(false);
      setQrModalOpen(true);
    }, 800);
  };

  // Advance Delivery Status Mock
  const handleAdvanceDelivery = () => {
    const activeBooking = lpgBookings.find(b => b.status !== 'Delivered');
    if (!activeBooking) {
      alert("No active delivery to simulate.");
      return;
    }
    
    setIsAdvancing(true);
    setTimeout(() => {
      advanceLpgDeliveryStatus(activeBooking.id);
      setIsAdvancing(false);
    }, 600);
  };

  const handleResetCylinderEmpty = () => {
    setLpgStatus('Empty');
    setNextLpgBookingDate('');
    alert('Mock cylinder state set to Empty & 21-day lockout date cleared! You are now eligible to book a new cylinder.');
  };

  // Mock distributors list
  const distributorsList = stations
    .filter(s => s.type === 'lpg')
    .map(s => ({
      name: s.name === displayUser.preferredDistributor ? `${s.name} (Preferred)` : s.name,
      distance: getStationDistance(s),
      rating: '4.7 ★',
      stock: `${s.stock} Cylinders`,
      status: s.openNow ? 'Open' : 'Closed'
    }));

  // Selected active delivery details
  const activeBooking = lpgBookings.find(b => b.status !== 'Delivered');
  const trackingStep = activeBooking ? activeBooking.trackingStep : 4;
  const trackingId = activeBooking ? activeBooking.id : 'N/A';

  return (
    <div className="container" style={{ padding: '2rem 1.5rem', flex: 1 }}>
      {/* Emergency Mode Warning Banner */}
      {emergencyMode && (
        <div className="glass-panel" style={{ background: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.35)', padding: '1rem 1.5rem', borderRadius: '12px', color: '#f87171', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 'bold', textAlign: 'left' }}>
          <AlertOctagon size={20} style={{ color: '#ef4444', flexShrink: 0 }} />
          <span>⚠️ EMERGENCY PRIORITY LOCKOUT: domestic allocation quotas might be subject to delays or constraints.</span>
        </div>
      )}

      {/* Navigation tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem', overflowX: 'auto' }}>
        {[
          { id: 'dashboard', label: 'Dashboard', icon: <Flame size={16} /> },
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
              background: activeTab === tab.id ? 'linear-gradient(135deg, rgba(234,88,12,0.15) 0%, rgba(168,85,247,0.15) 100%)' : 'transparent',
              color: activeTab === tab.id ? '#f97316' : 'var(--text-secondary)',
              border: '1px solid',
              borderColor: activeTab === tab.id ? 'rgba(249,115,22,0.3)' : 'transparent',
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
              {/* Cylinder Booking Form / Action panel */}
              <div className="glass-panel" style={{ padding: '2rem', border: '1px solid rgba(249, 115, 22, 0.25)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ShoppingBag size={15} style={{ color: '#f97316' }} /> Cylinder Status
                    </span>
                    <h2 style={{ fontSize: '2.25rem', fontWeight: 800, marginTop: '0.25rem' }}>
                      Status: <span style={{ color: lpgStatus === 'Delivered' ? '#34d399' : lpgStatus === 'Empty' ? '#f87171' : '#f97316' }}>{lpgStatus}</span>
                    </h2>
                  </div>
                  
                  {/* Status Indicator Dot */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '6px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
                    <div 
                      className={lpgStatus === 'Booked' || lpgStatus === 'In Transit' ? 'pulse-indicator' : ''}
                      style={{ 
                        width: '12px', 
                        height: '12px', 
                        borderRadius: '50%', 
                        background: lpgStatus === 'Delivered' ? '#10b981' : lpgStatus === 'Empty' ? '#ef4444' : '#f97316' 
                      }}
                    ></div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#ffffff' }}>Active Mode</span>
                  </div>
                </div>

                {/* Form or Next Window Alert */}
                {lpgStatus === 'Delivered' || lpgStatus === 'Empty' ? (
                  <form onSubmit={handleBookCylinder} style={{ background: 'rgba(0,0,0,0.1)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                      <div>
                        <label className="form-label">Cylinder Weight</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {['12.5kg', '5kg'].map(w => (
                            <button
                              key={w}
                              type="button"
                              onClick={() => setSelectedWeight(w)}
                              className="btn"
                              style={{
                                padding: '0.4rem 1rem',
                                fontSize: '0.85rem',
                                borderRadius: '8px',
                                background: selectedWeight === w ? 'linear-gradient(135deg, #ea580c, #a855f7)' : 'rgba(255,255,255,0.05)',
                                color: '#ffffff',
                                border: '1px solid',
                                borderColor: selectedWeight === w ? 'rgba(249,115,22,0.4)' : 'transparent'
                              }}
                            >
                              {w}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Price Est.</span>
                        <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#f97316' }}>
                          {selectedWeight === '12.5kg' ? 'Rs. 3,900' : 'Rs. 1,600'}
                        </h4>
                      </div>
                    </div>

                    {bookingError && (
                      <div className="glass-panel" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', padding: '0.5rem 1rem', borderRadius: '8px', color: '#f87171', fontSize: '0.8rem', marginBottom: '1rem' }}>
                        {bookingError}
                      </div>
                    )}
                    
                    {bookingSuccess && (
                      <div className="glass-panel" style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)', padding: '0.5rem 1rem', borderRadius: '8px', color: '#34d399', fontSize: '0.8rem', marginBottom: '1rem' }}>
                        {bookingSuccess}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                      <button type="submit" className="btn btn-primary" style={{ flex: 1, background: 'linear-gradient(135deg, #ea580c, #a855f7)' }}>
                        Book Gas Cylinder Now
                      </button>
                      
                      {lpgStatus === 'Delivered' && (
                        <button type="button" onClick={handleResetCylinderEmpty} className="btn btn-secondary">
                          Empty (Mock Reset)
                        </button>
                      )}
                    </div>
                  </form>
                ) : (
                  <div style={{ background: 'rgba(249, 115, 22, 0.05)', border: '1px solid rgba(249, 115, 22, 0.15)', padding: '1.25rem', borderRadius: '12px', textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f97316' }}>Active Delivery Tracking</h4>
                      <button 
                        onClick={handleGenerateQR}
                        className="btn btn-primary"
                        style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', background: 'linear-gradient(135deg, #ea580c 0%, #a855f7 100%)', boxShadow: 'none' }}
                      >
                        <QrCode size={14} /> Open QR
                      </button>
                    </div>
                    
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                      Cylinder is currently in cycle. Tracking Booking ID: <strong>{trackingId}</strong>
                    </p>

                    {/* Progress tracking line */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', padding: '0.5rem 10px 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '1rem' }}>
                      <div style={{ position: 'absolute', top: '21px', left: '15px', right: '15px', height: '2px', background: 'rgba(255,255,255,0.1)', zIndex: 0 }}>
                        <div style={{ width: `${((trackingStep - 1) / 3) * 100}%`, height: '100%', background: '#f97316', transition: 'width 0.4s ease' }}></div>
                      </div>

                      {[
                        { step: 'Booked', val: 1 },
                        { step: 'Assigned', val: 2 },
                        { step: 'In Transit', val: 3 },
                        { step: 'Delivered', val: 4 }
                      ].map((item) => (
                        <div key={item.val} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
                          <div style={{
                            width: '24px', 
                            height: '24px', 
                            borderRadius: '50%', 
                            background: trackingStep >= item.val ? 'linear-gradient(135deg, #ea580c, #a855f7)' : '#334155',
                            border: '3px solid #0f172a',
                            fontSize: '0.6rem',
                            fontWeight: 'bold',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                          }}>
                            {item.val}
                          </div>
                          <span style={{ fontSize: '0.65rem', color: trackingStep >= item.val ? '#f97316' : 'var(--text-secondary)', marginTop: '4px', position: 'absolute', bottom: 0 }}>{item.step}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Delivery Simulator:</span>
                      <button 
                        onClick={handleAdvanceDelivery}
                        className="btn btn-secondary" 
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                        disabled={isAdvancing}
                      >
                        {isAdvancing ? 'Processing...' : 'Advance Status →'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Booking History List */}
              <div className="glass-panel" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <History size={18} style={{ color: '#f97316' }} /> Booking History
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Bookings Limit: 1 per 21d</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {lpgBookings.map((b) => (
                    <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Booking Ref: {b.id}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {b.createdAt ? new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : b.date} • {b.weight} cylinder • <span style={{ color: '#34d399', fontWeight: 'bold', fontSize: '0.65rem' }}>{b.verificationStatus || 'VALID'}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span 
                          style={{ 
                            fontSize: '0.75rem', 
                            fontWeight: 'bold', 
                            padding: '2px 8px', 
                            borderRadius: '20px',
                            background: b.status === 'Delivered' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(249, 115, 22, 0.1)',
                            color: b.status === 'Delivered' ? '#34d399' : '#f97316',
                            display: 'inline-block',
                            marginBottom: '4px'
                          }}
                        >
                          {b.status}
                        </span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Rs. {b.cost.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Safety Alert Panel */}
              <div className="glass-panel-accent" style={{ padding: '1.5rem', background: 'rgba(249, 115, 22, 0.03)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f97316', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <AlertOctagon size={18} /> Safety Advisory & Alerts
                </h3>
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '0.85rem', borderRadius: '10px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  Next Booking Opens: <strong style={{ color: '#ffffff' }}>{nextLpgBookingDate}</strong>
                </div>
                <div style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168,85,247,0.2)', padding: '0.85rem', borderRadius: '10px', fontSize: '0.8rem', color: '#c084fc' }}>
                  <strong>Safety tip:</strong> Check connection O-ring when swapping cylinders. Do not use matches to test for leaks.
                </div>
              </div>

              {/* AI Recommendations */}
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Compass size={18} style={{ color: '#f97316' }} /> Usage Diagnostics
                </h3>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <Sparkles size={18} style={{ color: '#f97316', flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Based on your historic booking intervals, your current cylinder is forecasted to deplete around <strong>August 25, 2026</strong>. Plan your next booking accordingly.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

            {/* Dedicated Full-Width Map Section at the Bottom */}
            <div className="glass-panel" style={{ padding: '2rem', width: '100%', border: '1px solid rgba(249, 115, 22, 0.25)', borderRadius: '20px', background: 'var(--glass-bg)', boxShadow: 'var(--glass-shadow)', marginTop: '2rem', textAlign: 'left' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem', color: '#ffffff' }}>
                <MapPin size={22} style={{ color: '#f97316' }} /> Live Interactive LPG Allocation Map Node
              </h3>
              <InteractiveMap type="lpg" />
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
              <User size={22} style={{ color: '#f97316' }} /> Consumer Profile
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
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Email Address</span>
                <strong style={{ fontSize: '1rem', color: '#ffffff' }}>{displayUser.email}</strong>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Consumer Book ID</span>
                <strong style={{ fontSize: '1rem', color: '#ffffff', textTransform: 'uppercase' }}>{displayUser.consumerNumber || 'Not Provided'}</strong>
              </div>
              <div style={{ gridColumn: 'span 2' }} className="full-width-profile">
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Zoning Address</span>
                <strong style={{ fontSize: '1rem', color: '#ffffff' }}>{displayUser.address}</strong>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Pincode / Postal</span>
                <strong style={{ fontSize: '1rem', color: '#ffffff' }}>{displayUser.pincode}</strong>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>District</span>
                <strong style={{ fontSize: '1rem', color: '#ffffff' }}>{displayUser.district}</strong>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>State / Province</span>
                <strong style={{ fontSize: '1rem', color: '#ffffff' }}>{displayUser.state}</strong>
              </div>
              <div style={{ gridColumn: 'span 2' }} className="full-width-profile">
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Preferred Distributor Dealer</span>
                <strong style={{ fontSize: '1rem', color: '#a855f7' }}>{displayUser.preferredDistributor}</strong>
              </div>
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
              <Bell size={22} style={{ color: '#f97316' }} /> LPG Notices & Updates
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {(systemNotifications || []).map(notif => (
                <div key={notif.id} style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: '1rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: notif.type === 'status' ? 'rgba(168, 85, 247, 0.1)' : 'rgba(249, 115, 22, 0.1)', color: notif.type === 'status' ? '#c084fc' : '#f97316', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
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
              <Settings size={22} style={{ color: '#f97316' }} /> Settings & Preferences
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.5rem' }}>LPG Alerts Settings</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {[
                    'Notify me on WhatsApp when booking window opens',
                    'SMS notification when truck enters my pincode zone',
                    'Auto-share safety inspection schedules'
                  ].map((label, idx) => (
                    <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                      <input type="checkbox" defaultChecked style={{ cursor: 'pointer' }} />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DELIVERY QR VERIFICATION MODAL */}
      <AnimatePresence>
        {qrModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(8px)', padding: '1.5rem' }}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel"
              style={{ width: '100%', maxWidth: '420px', padding: '2rem', border: '1px solid rgba(249, 115, 22, 0.3)', textAlign: 'center' }}
            >
              {lpgStatus === 'Delivered' ? (
                <div style={{ padding: '2rem 0' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 1.5rem' }}>
                    <CheckCircle size={32} />
                  </div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.5rem' }}>Delivery Completed</h3>
                  <p style={{ color: '#34d399', fontSize: '0.9rem' }}>Cylinder has been successfully signed off.</p>
                  <button onClick={() => setQrModalOpen(false)} className="btn btn-secondary" style={{ marginTop: '1.5rem', width: '100%' }}>
                    Close Window
                  </button>
                </div>
              ) : (
                <>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem', color: '#ffffff' }}>Delivery Authorization</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Show this QR to the gas delivery agent upon arrival.</p>
                  
                  {/* Glowing QR wrapper */}
                  <div style={{ display: 'inline-block', padding: '0.5rem', background: '#ffffff', borderRadius: '12px', border: '1px solid rgba(249, 115, 22, 0.3)', marginBottom: '1.5rem' }} className="pulse-indicator">
                    {/* Simulated visual QR */}
                    <div style={{ width: '150px', height: '150px', background: '#ffffff', padding: '4px', display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px' }}>
                      <div style={{ background: '#a855f7' }}></div>
                      <div style={{ background: '#0f172a' }}></div>
                      <div style={{ background: '#a855f7' }}></div>
                      <div></div>
                      <div style={{ background: '#0f172a' }}></div>
                      <div style={{ background: '#0f172a' }}></div>

                      <div></div>
                      <div style={{ background: '#a855f7' }}></div>
                      <div></div>
                      <div style={{ background: '#a855f7' }}></div>
                      <div></div>
                      <div style={{ background: '#0f172a' }}></div>

                      <div style={{ background: '#a855f7' }}></div>
                      <div></div>
                      <div style={{ background: '#0f172a' }}></div>
                      <div style={{ background: '#0f172a' }}></div>
                      <div style={{ background: '#a855f7' }}></div>
                      <div></div>

                      <div></div>
                      <div style={{ background: '#a855f7' }}></div>
                      <div style={{ background: '#0f172a' }}></div>
                      <div></div>
                      <div style={{ background: '#a855f7' }}></div>
                      <div></div>

                      <div style={{ background: '#a855f7' }}></div>
                      <div style={{ background: '#0f172a' }}></div>
                      <div style={{ background: '#a855f7' }}></div>
                      <div></div>
                      <div style={{ background: '#a855f7' }}></div>
                      <div style={{ background: '#a855f7' }}></div>

                      <div style={{ background: '#a855f7' }}></div>
                      <div></div>
                      <div></div>
                      <div style={{ background: '#0f172a' }}></div>
                      <div></div>
                      <div style={{ background: '#a855f7' }}></div>
                    </div>
                  </div>
                  
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--glass-border)', fontSize: '0.75rem', fontFamily: 'monospace', color: '#f97316', display: 'inline-block', marginBottom: '1.5rem' }}>
                    {qrValue}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="button" onClick={() => setQrModalOpen(false)} className="btn btn-secondary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem' }}>
                      Close
                    </button>
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
          .full-width-profile {
            grid-column: span 1 !important;
          }
        }
      `}</style>
      <AiAssistant />
    </div>
  );
};

export default LpgDashboard;
