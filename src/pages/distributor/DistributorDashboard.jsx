import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { 
  Flame, Users, Truck, Layers, MapPin, 
  Settings, History, Play, CheckCircle, Navigation, ShieldAlert
} from 'lucide-react';
import InteractiveMap from '../../components/InteractiveMap';

const DistributorDashboard = () => {
  const { 
    distributorUser, 
    lpgBookings, 
    lpgUsers, 
    advanceLpgDeliveryStatus,
    loginLpgUser,
    stations,
    adminUser,
    sendVerificationOtp,
    verifyOtpCode
  } = useContext(AppContext);
  
  const navigate = useNavigate();

  // Auto login removed for strict route protection

  const [searchConsumer, setSearchConsumer] = useState('');
  const [scannedConsumer, setScannedConsumer] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [deliveryError, setDeliveryError] = useState('');
  const [deliverySuccess, setDeliverySuccess] = useState('');

  const currentDistributor = stations.find(s => s.name === (distributorUser?.company || 'Super Gas Distributors')) || stations[4];

  const cylinderStock = {
    stock12: currentDistributor.stock,
    stock5: Math.round(currentDistributor.stock * 0.45),
    refillsDispatched: 18
  };

  const isAuthorized = (distributorUser && distributorUser.role === 'distributor') || (adminUser && adminUser.role === 'admin');

  if (!isAuthorized) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10 }}>
        <div className="glass-panel" style={{ maxWidth: '450px', padding: '3rem', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '16px' }}>
          <ShieldAlert size={48} style={{ color: '#ef4444', marginBottom: '1.5rem' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: '#ffffff' }}>Access Denied</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
            You must be logged in as an LPG Distributor Agent or Admin to access this command terminal.
          </p>
          <button onClick={() => navigate('/lpg/login')} className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #ea580c 0%, #a855f7 100%)', width: '100%', boxShadow: 'none' }}>
            Go to Distributor Login
          </button>
        </div>
      </div>
    );
  }

  // Handle consumer manual lookup
  const handleConsumerLookup = (e) => {
    e.preventDefault();
    setScannedConsumer(null);
    setDeliveryError('');

    if (!searchConsumer.trim()) return;

    const matched = lpgUsers.find(
      u => u.consumerNumber.toLowerCase() === searchConsumer.toLowerCase() ||
           u.fullName.toLowerCase().includes(searchConsumer.toLowerCase())
    );

    if (matched) {
      setScannedConsumer(matched);
    } else {
      setDeliveryError('❌ CONSUMER NOT FOUND: Unregistered blue book signature.');
    }
  };

  const [activeDemoOtp, setActiveDemoOtp] = useState('');

  // Perform tracking steps simulation
  const handleStepAdvance = (booking, nextStep) => {
    setSelectedBooking(booking);
    setDeliveryError('');
    setDeliverySuccess('');

    if (nextStep === 4) {
      // Trigger dynamic OTP generation and display
      const code = sendVerificationOtp(booking.userId);
      setActiveDemoOtp(code);
      setOtpSent(true);
    } else {
      // Just advance tracking status
      advanceLpgDeliveryStatus(booking.id);
      
      // Inventory and reserves are updated globally at booking time
      
      setDeliverySuccess(`Booking ${booking.id} status successfully advanced!`);
      setTimeout(() => setDeliverySuccess(''), 2000);
    }
  };

  // Confirm final handoff with mock OTP
  const handleConfirmHandoff = (e) => {
    e.preventDefault();
    setDeliveryError('');

    const verification = verifyOtpCode(selectedBooking.userId, otpCode);
    if (!verification.success) {
      setDeliveryError(verification.message);
      return;
    }

    advanceLpgDeliveryStatus(selectedBooking.id);
    setDeliverySuccess(`Refill delivery successfully signed off for Booking ID: ${selectedBooking.id}!`);
    
    setTimeout(() => {
      setOtpSent(false);
      setOtpCode('');
      setActiveDemoOtp('');
      setSelectedBooking(null);
      setDeliverySuccess('');
    }, 2500);
  };

  return (
    <div className="container" style={{ padding: '2rem 1.5rem', flex: 1 }}>
      {/* Operator header */}
      <div style={{ textAlign: 'left', marginBottom: '2.5rem' }}>
        <span style={{ fontSize: '0.8rem', color: '#f97316', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Flame size={14} /> Distributor Command Terminal
        </span>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>{distributorUser.company}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Agent: {distributorUser.fullName}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }} className="dashboard-grid">
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Active Booking queue */}
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'left' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={18} style={{ color: '#f97316' }} /> Active Booking Queue
            </h3>

            {deliverySuccess && (
              <div className="glass-panel" style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)', padding: '0.75rem 1rem', borderRadius: '10px', color: '#34d399', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                {deliverySuccess}
              </div>
            )}

            {deliveryError && (
              <div className="glass-panel" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', padding: '0.75rem 1rem', borderRadius: '10px', color: '#f87171', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                {deliveryError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {lpgBookings.map((booking) => (
                <div key={booking.id} style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <strong style={{ fontSize: '0.95rem' }}>Ref ID: {booking.id}</strong>
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '20px', background: 'rgba(249, 115, 22, 0.1)', color: '#f97316' }}>{booking.status}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Registered Date: {booking.date} • Cylinder: {booking.weight}
                    </div>
                  </div>

                  {/* Booking controller actions */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {booking.trackingStep === 1 && (
                      <button onClick={() => handleStepAdvance(booking, 2)} className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', background: 'linear-gradient(135deg, #ea580c, #a855f7)' }}>
                        Confirm Booking
                      </button>
                    )}
                    {booking.trackingStep === 2 && (
                      <button onClick={() => handleStepAdvance(booking, 3)} className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', background: '#8b5cf6' }}>
                        Assign Delivery Truck
                      </button>
                    )}
                    {booking.trackingStep === 3 && (
                      <button onClick={() => handleStepAdvance(booking, 4)} className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', background: '#10b981' }}>
                        Enter Delivery OTP
                      </button>
                    )}
                    {booking.trackingStep === 4 && (
                      <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        ✓ Delivered
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery assignment maps */}
          <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'left' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Truck size={18} style={{ color: '#f97316' }} /> Delivery Truck Tracking Router
            </h3>
            <InteractiveMap type="lpg" />
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* OTP Verification Modal-like form */}
          {otpSent && (
            <div className="glass-panel-accent" style={{ padding: '1.5rem', background: 'rgba(168,85,247,0.03)', textAlign: 'left' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f97316', marginBottom: '1rem' }}>
                🔑 Delivery Handoff Verification
              </h3>
              <form onSubmit={handleConfirmHandoff}>
                <div className="form-group">
                  <label className="form-label">Verify Booking OTP Code</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Enter Customer OTP"
                    required
                  />
                </div>
                {activeDemoOtp && (
                  <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '0.6rem 0.85rem', borderRadius: '8px', fontSize: '0.75rem', border: '1px solid rgba(245, 158, 11, 0.2)', textAlign: 'left', marginTop: '0.5rem', marginBottom: '1rem' }}>
                    🔑 <strong>DEMO OTP — SMS gateway not connected:</strong> <code style={{ fontSize: '0.9rem', color: '#ffffff', fontWeight: 'bold' }}>{activeDemoOtp}</code> (expires in 60s)
                  </div>
                )}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" onClick={() => setOtpSent(false)} className="btn btn-secondary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem' }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', background: '#10b981' }}>
                    Complete Handoff
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Customer Lookup */}
          <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'left' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <Users size={18} style={{ color: '#f97316' }} /> Consumer Verification Lookup
            </h3>
            <form onSubmit={handleConsumerLookup} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Consumer Name or Blue Book ID"
                value={searchConsumer}
                onChange={(e) => setSearchConsumer(e.target.value)}
              />
              <button type="submit" className="btn btn-secondary">Search</button>
            </form>

            {scannedConsumer && (
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Verified Consumer Card</span>
                <strong style={{ display: 'block', fontSize: '0.95rem', color: '#ffffff', marginTop: '3px' }}>{scannedConsumer.fullName}</strong>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Distributor Book ID: <strong style={{ color: '#f97316' }}>{scannedConsumer.consumerNumber}</strong>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Pincode Zone: {scannedConsumer.pincode}
                </div>
              </div>
            )}
          </div>

          {/* Cylinder Inventory gauges */}
          <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'left' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <Layers size={18} style={{ color: '#f97316' }} /> Distributor Stock Inventory
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                  <span>12.5kg Domestic Cylinder</span>
                  <strong>{cylinderStock.stock12} Units</strong>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${(cylinderStock.stock12 / 200) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #ea580c, #a855f7)', borderRadius: '3px' }}></div>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                  <span>5kg Camping Cylinder</span>
                  <strong>{cylinderStock.stock5} Units</strong>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${(cylinderStock.stock5 / 100) * 100}%`, height: '100%', background: '#a855f7', borderRadius: '3px' }}></div>
                </div>
              </div>
              <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Refills Dispatched (Today)</span>
                <strong>{cylinderStock.refillsDispatched} units</strong>
              </div>
            </div>
          </div>

          {/* Driver Registry */}
          <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'left' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <Truck size={18} style={{ color: '#f97316' }} /> Delivery Driver Registry
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { name: 'K. Perera', vehicle: 'WP-LH-8923', status: 'Dispatched (Colombo 07)' },
                { name: 'P. De Silva', vehicle: 'WP-LH-1049', status: 'Standby at Depot' },
                { name: 'A. Samarakoon', vehicle: 'WP-LH-4482', status: 'Off Duty' }
              ].map((driver, idx) => (
                <div key={idx} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ display: 'block' }}>{driver.name}</strong>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Truck: {driver.vehicle}</span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: driver.status.includes('Dispatched') ? '#f97316' : driver.status.includes('Standby') ? '#10b981' : 'var(--text-secondary)', fontWeight: 'bold' }}>{driver.status}</span>
                </div>
              ))}
            </div>
            
            <button 
              onClick={() => alert('Inventory Stock Report generated for download: distributor_stock_report_2026.pdf')}
              className="btn btn-secondary" 
              style={{ width: '100%', border: '1px solid #f97316', color: '#f97316', marginTop: '1.25rem', padding: '0.5rem' }}
            >
              Export Inventory Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DistributorDashboard;
