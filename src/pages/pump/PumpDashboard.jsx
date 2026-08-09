import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { 
  Fuel, QrCode, ClipboardCheck, History, 
  Settings, UserCheck, Play, ArrowRight, Gauge, Users, Layers, ShieldAlert
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const PumpDashboard = () => {
  const { 
    pumpUser, 
    fuelUsers, 
    addFuelTransaction, 
    addFraudLogEntry,
    stations,
    getUserQuota,
    sendVerificationOtp,
    verifyOtpCode,
    adminUser,
    usedQrCodes
  } = useContext(AppContext);
  
  const navigate = useNavigate();

  // Auto login operator session on mount if accessed directly
  // Auto login removed for strict route protection

  const [qrInput, setQrInput] = useState('');
  const [scannedCitizen, setScannedCitizen] = useState(null);
  const [fillAmount, setFillAmount] = useState('10');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [fillError, setFillError] = useState('');
  const [fillSuccess, setFillSuccess] = useState('');

  const currentStation = stations.find(s => s.name === (pumpUser?.station || 'Ceypetco - Town Hall')) || stations[0];

  const pumpInventory = {
    petrol92: currentStation.stock,
    petrol95: Math.round(currentStation.stock * 0.45),
    dieselAuto: Math.round(currentStation.stock * 1.25)
  };

  const [dailySales, setDailySales] = useState({
    litersFilled: 890,
    revenue: 329300,
    vehiclesServed: 42
  });

  const [activeQueue, setActiveQueue] = useState([
    { id: 1, plate: 'WP-AMB-1191', type: 'Ambulance', priority: 'Emergency', status: 'Serving' },
    { id: 2, plate: 'WP-CAD-8930', type: 'Car', priority: 'Standard', status: 'Waiting' },
    { id: 3, plate: 'WP-BBA-4512', type: 'Bus', priority: 'High', status: 'Waiting' }
  ]);

  const hourlySalesData = [
    { name: '08:00', liters: 120 },
    { name: '10:00', liters: 240 },
    { name: '12:00', liters: 180 },
    { name: '14:00', liters: 310 },
    { name: '16:00', liters: 290 },
    { name: '18:00', liters: 420 },
    { name: '20:00', liters: 150 }
  ];

  const handleDequeue = (id) => {
    setActiveQueue(prev => prev.filter(item => item.id !== id));
  };

  const handleAddEmergency = () => {
    const newEmergency = {
      id: Date.now(),
      plate: 'WP-AMB-' + Math.floor(1000 + Math.random() * 9000),
      type: 'Ambulance',
      priority: 'Emergency',
      status: 'Waiting'
    };
    setActiveQueue(prev => [newEmergency, ...prev]);
    alert('🚨 EMERGENCY PRIORITIZATION: Ambulance added to front of dispensing queue!');
  };

  const isAuthorized = (pumpUser && pumpUser.role === 'pump') || (adminUser && adminUser.role === 'admin');

  if (!isAuthorized) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10 }}>
        <div className="glass-panel" style={{ maxWidth: '450px', padding: '3rem', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '16px' }}>
          <ShieldAlert size={48} style={{ color: '#ef4444', marginBottom: '1.5rem' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: '#ffffff' }}>Access Denied</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
            You must be logged in as a Fuel Station Operator or Admin to access this command console.
          </p>
          <button onClick={() => navigate('/fuel/login')} className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)', width: '100%', boxShadow: 'none' }}>
            Go to Operator Login
          </button>
        </div>
      </div>
    );
  }

  // Handle QR Scan lookup
  const handleScanLookup = async (e) => {
    e.preventDefault();
    setFillError('');
    setFillSuccess('');
    setOtpSent(false);
    setActiveDemoOtp('');

    if (!qrInput.trim()) return;

    try {
      const res = await fetch(BACKEND_URL + '/api/transactions/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        body: JSON.stringify({
          token: qrInput,
          stationName: pumpUser?.station || 'Ceypetco - Town Hall'
        })
      });

      const data = await res.json();
      
      if (!res.ok) {
        setFillError(`🚨 SECURITY INCIDENT: ${data.reason || data.message || 'Verification failed.'}`);
        setScannedCitizen(null);
        return;
      }

      // Verification succeeded!
      const matched = fuelUsers.find(u => u.email.toLowerCase() === data.userId.toLowerCase() || u.email === data.userId || u.vehicleNumber === data.vehicleNumber);
      if (matched) {
        setScannedCitizen(matched);
      } else {
        setScannedCitizen({
          email: data.userId,
          vehicleNumber: data.vehicleNumber,
          fullName: 'Registered Citizen',
          vehicleType: 'Car',
          district: 'Colombo',
          state: 'Western',
          phone: '9876543210'
        });
      }
    } catch (err) {
      console.warn('Backend verification offline, falling back to local simulation', err.message);
      const parts = qrInput.split('-');
      const licensePlate = parts[2] ? `${parts[1]}-${parts[2]}-${parts[3]}` : qrInput;
      const matched = fuelUsers.find(u => u.vehicleNumber.toLowerCase() === licensePlate.toLowerCase());
      
      if (matched) {
        setScannedCitizen(matched);
        if (qrInput.includes('DUPLICATE') || usedQrCodes.includes(qrInput)) {
          addFraudLogEntry(
            'Duplicate QR Attempt', 
            `Plate ${matched.vehicleNumber} attempted scan twice at ${pumpUser?.station || 'Ceypetco - Town Hall'}.`, 
            92
          );
          setFillError('🚨 SECURITY SYSTEM HALTED: Duplicate QR code signature detected! Logging security incident.');
          setScannedCitizen(null);
          return;
        }
      } else {
        addFraudLogEntry(
          'Fake Vehicle Signature',
          `Unregistered vehicle code "${qrInput}" attempted authentication at Ceypetco - Town Hall.`,
          78
        );
        setFillError('❌ UNKNOWN CODE: License plate signature mismatch. Access Denied.');
        setScannedCitizen(null);
      }
    }
  };

  const [activeDemoOtp, setActiveDemoOtp] = useState('');

  const handleSendOtp = () => {
    const code = sendVerificationOtp(scannedCitizen.email);
    setActiveDemoOtp(code);
    setOtpSent(true);
  };

  // Process filling transaction
  const handleDispense = (e) => {
    e.preventDefault();
    setFillError('');
    setFillSuccess('');
    
    const verification = verifyOtpCode(scannedCitizen.email, otpCode);
    if (!verification.success) {
      setFillError(verification.message);
      return;
    }

    const liters = parseFloat(fillAmount);
    const res = addFuelTransaction(liters, pumpUser?.station || 'Ceypetco - Town Hall', scannedCitizen.vehicleNumber, qrInput);
    
    if (res.success) {
      // Update operator stats
      setDailySales(prev => ({
        litersFilled: prev.litersFilled + liters,
        revenue: prev.revenue + (liters * 370),
        vehiclesServed: prev.vehiclesServed + 1
      }));

      setFillSuccess(`Dispensed ${liters} L to vehicle ${scannedCitizen.vehicleNumber} successfully!`);
      
      // Clear fields
      setTimeout(() => {
        setScannedCitizen(null);
        setQrInput('');
        setOtpSent(false);
        setOtpCode('');
        setActiveDemoOtp('');
        setFillSuccess('');
      }, 2500);
    } else {
      setFillError(res.message);
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 1.5rem', flex: 1 }}>
      {/* Operator header */}
      <div style={{ textAlign: 'left', marginBottom: '2.5rem' }}>
        <span style={{ fontSize: '0.8rem', color: '#06b6d4', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Fuel size={14} /> Station Operator Command Console
        </span>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>{pumpUser.station} Terminal</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Agent: {pumpUser.fullName}</p>
      </div>

      <div className="dashboard-grid-top" style={{ marginBottom: '2rem' }}>
        {/* Left Column: QR scanner & Customer lookup */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* QR Scan simulator */}
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'left' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <QrCode size={18} style={{ color: '#06b6d4' }} /> Scan Customer Quota QR
            </h3>

            {fillError && (
              <div className="glass-panel" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', padding: '0.75rem 1rem', borderRadius: '10px', color: '#f87171', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                {fillError}
              </div>
            )}

            {fillSuccess && (
              <div className="glass-panel" style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)', padding: '0.75rem 1rem', borderRadius: '10px', color: '#34d399', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                {fillSuccess}
              </div>
            )}

            <form onSubmit={handleScanLookup} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Enter Token (e.g. WP-CAD-8930 or WP-CAD-8930-DUPLICATE)"
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
              />
              <button type="submit" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)' }}>
                Authenticate
              </button>
            </form>

            {/* Display scanned citizen information */}
            {scannedCitizen && (
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#ffffff' }}>
                  Customer Details Lookup
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block' }}>Citizen Name</span>
                    <strong style={{ fontSize: '0.9rem' }}>{scannedCitizen.fullName}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block' }}>Vehicle Plate</span>
                    <strong style={{ fontSize: '0.9rem', textTransform: 'uppercase' }}>{scannedCitizen.vehicleNumber}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block' }}>Vehicle Type</span>
                    <strong style={{ fontSize: '0.9rem' }}>{scannedCitizen.vehicleType}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block' }}>Remaining Quota</span>
                    <strong style={{ fontSize: '0.9rem', color: '#06b6d4' }}>
                      {getUserQuota(scannedCitizen.email)} L
                    </strong>
                  </div>
                </div>

                {/* Verification & Dispensing */}
                {!otpSent ? (
                  <button onClick={handleSendOtp} className="btn btn-primary" style={{ width: '100%' }}>
                    Transmit verification OTP SMS
                  </button>
                ) : (
                  <form onSubmit={handleDispense} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div>
                        <label className="form-label">Liters to Dispense</label>
                        <input 
                          type="number" 
                          className="form-input" 
                          value={fillAmount}
                          onChange={(e) => setFillAmount(e.target.value)}
                          max={getUserQuota(scannedCitizen.email)}
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="form-label">Verification OTP</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          placeholder="Enter 6-digit code"
                        />
                      </div>
                    </div>
                    {activeDemoOtp && (
                      <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '0.6rem 0.85rem', borderRadius: '8px', fontSize: '0.75rem', border: '1px solid rgba(245, 158, 11, 0.2)', textAlign: 'left', marginTop: '0.75rem' }}>
                        🔑 <strong>DEMO OTP — SMS gateway not connected:</strong> <code style={{ fontSize: '0.9rem', color: '#ffffff', fontWeight: 'bold' }}>{activeDemoOtp}</code> (expires in 60s)
                      </div>
                    )}
                    <button type="submit" className="btn btn-primary" style={{ background: '#10b981' }}>
                      Dispense Fuel <Play size={14} />
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Daily Sales transaction history */}
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'left' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <History size={18} style={{ color: '#06b6d4' }} /> Terminal Transaction Logs (Today)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { time: '10:48 PM', vehicle: 'WP-CAD-8930', amount: '12.0 L', cost: 'Rs. 4,440' },
                { time: '10:15 PM', vehicle: 'WP-BBA-4512', amount: '25.0 L', cost: 'Rs. 9,250' },
                { time: '09:42 PM', vehicle: 'WP-KZ-9023', amount: '5.0 L', cost: 'Rs. 1,850' }
              ].map((log, i) => (
                <div key={i} style={{ padding: '0.85rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div>
                    <strong style={{ fontSize: '0.85rem' }}>Vehicle: {log.vehicle}</strong>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Time: {log.time}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#06b6d4', fontWeight: 'bold', fontSize: '0.9rem' }}>{log.amount}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{log.cost}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Inventory & Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Inventory Stock Gauges */}
          <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'left' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <Gauge size={18} style={{ color: '#06b6d4' }} /> Pump Tank Inventory
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {[
                { label: 'Petrol 92 Octane', value: pumpInventory.petrol92.toLocaleString() + ' L', percent: '62%', color: '#06b6d4' },
                { label: 'Petrol 95 Octane', value: pumpInventory.petrol95.toLocaleString() + ' L', percent: '38%', color: '#2563eb' },
                { label: 'Auto Diesel', value: pumpInventory.dieselAuto.toLocaleString() + ' L', percent: '75%', color: '#10b981' }
              ].map((res, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                    <span>{res.label}</span>
                    <strong>{res.value}</strong>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: res.percent, height: '100%', background: res.color, borderRadius: '3px' }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Terminal sales summary */}
          <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'left' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <ClipboardCheck size={18} style={{ color: '#06b6d4' }} /> Terminal Sales Summary
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Filled Today</span>
                <strong>{dailySales.litersFilled} Liters</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Gross Revenue</span>
                <strong>Rs. {dailySales.revenue.toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Vehicles Serviced</span>
                <strong>{dailySales.vehiclesServed} units</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Live Dispensing Queue (Left) & Sales Velocity Chart (Right) */}
      <div className="dashboard-grid-bottom">
        {/* Queue Management panel */}
        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} style={{ color: '#06b6d4' }} /> Live Dispensing Queue
            </h3>
            <button 
              onClick={handleAddEmergency}
              className="btn btn-secondary" 
              style={{ padding: '4px 10px', fontSize: '0.7rem', border: '1px solid #ef4444', color: '#ef4444' }}
            >
              + Alert Emergency
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {activeQueue.map((item) => (
              <div key={item.id} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                <div>
                  <strong style={{ display: 'block' }}>{item.plate} ({item.type})</strong>
                  <span style={{ fontSize: '0.7rem', color: item.priority === 'Emergency' ? '#ef4444' : item.priority === 'High' ? '#eab308' : 'var(--text-secondary)' }}>
                    Priority: {item.priority}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.7rem', color: item.status === 'Serving' ? '#10b981' : 'var(--text-secondary)' }}>
                    {item.status}
                  </span>
                  <button 
                    onClick={() => handleDequeue(item.id)}
                    className="btn" 
                    style={{ padding: '2px 6px', fontSize: '0.65rem', background: 'rgba(255,255,255,0.05)', color: '#ffffff', borderRadius: '4px' }}
                  >
                    Serve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recharts Fuel sales hourly area chart */}
        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'left' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Layers size={18} style={{ color: '#06b6d4' }} /> Sales Velocity Chart
          </h3>
          <div style={{ width: '100%', height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlySalesData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLiters" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="name" stroke="var(--text-secondary)" style={{ fontSize: '0.65rem' }} />
                <YAxis stroke="var(--text-secondary)" style={{ fontSize: '0.65rem' }} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.75rem' }} />
                <Area type="monotone" dataKey="liters" name="Liters" stroke="#06b6d4" fillOpacity={1} fill="url(#colorLiters)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PumpDashboard;
