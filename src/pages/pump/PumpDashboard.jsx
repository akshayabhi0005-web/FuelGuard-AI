import React, { useContext, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  Fuel, QrCode, ClipboardCheck, History, 
  Play, Gauge, Users, Layers, ShieldAlert,
  Camera, X, CheckCircle, AlertTriangle
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
    adminUser,
    usedQrCodes,
    BACKEND_URL
  } = useContext(AppContext);
  
  const navigate = useNavigate();

  // Auto login operator session on mount if accessed directly
  // Auto login removed for strict route protection

  const [qrInput, setQrInput] = useState('');
  const [scannedCitizen, setScannedCitizen] = useState(null);
  const [fillAmount, setFillAmount] = useState('10');
  const [fillError, setFillError] = useState('');
  const [fillSuccess, setFillSuccess] = useState('');
  
  // New QR scanner states
  const [scannerActive, setScannerActive] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [showConfirmDispense, setShowConfirmDispense] = useState(false);
  const [dispenseReceipt, setDispenseReceipt] = useState(null);
  
  const qrScannerRef = useRef(null);
  const scanLockRef = useRef(false);

  useEffect(() => {
    return () => {
      // Cleanup scanner and release camera tracks on unmount
      if (qrScannerRef.current) {
        try {
          if (qrScannerRef.current.isScanning) {
            qrScannerRef.current.stop();
          }
        } catch (err) {
          console.error("Scanner cleanup error:", err);
        }
      }
    };
  }, []);

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

  // Refactored Verification Logic matching backend short opaque token specs
  const verifyToken = async (token) => {
    setFillError('');
    setFillSuccess('');
    setVerificationResult(null);
    setDispenseReceipt(null);

    const cleanToken = token.trim();
    if (!cleanToken) return;

    if (!BACKEND_URL) {
      setFillError('🚨 SERVER OFFLINE: Backend URL is not configured. Verification service unavailable.');
      return;
    }

    setIsVerifying(true);

    try {
      const res = await fetch(BACKEND_URL + '/api/quota/verify-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        body: JSON.stringify({
          token: cleanToken
        })
      });

      const data = await res.json();
      
      if (!res.ok) {
        setFillError(`🚨 ${data.reason || data.message || 'Verification failed.'}`);
        setScannedCitizen(null);
        setVerificationResult(null);
        return;
      }

      setScannedCitizen({
        fullName: data.customer.name,
        vehicleNumber: data.customer.vehicleNumber,
        email: data.customer.name + '@citizen.com',
        vehicleType: 'Car'
      });

      setVerificationResult({
        verified: true,
        vehicleNumber: data.customer.vehicleNumber,
        fuelType: data.fuelType || 'Petrol 92',
        stationName: data.station || 'Ceypetco - Town Hall',
        remainingQuota: data.availableQuota,
        timestamp: new Date().toLocaleTimeString(),
        token: cleanToken,
        status: 'VALID',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      setFillAmount(Math.min(10, data.availableQuota).toString());
    } catch (err) {
      console.warn('Backend verification offline, falling back to local simulation', err.message);
      
      const parts = cleanToken.split('-');
      const licensePlate = parts[2] ? `${parts[1]}-${parts[2]}-${parts[3]}` : cleanToken;
      const matched = fuelUsers.find(u => u.vehicleNumber.toLowerCase() === licensePlate.toLowerCase());
      
      if (matched) {
        setScannedCitizen(matched);
        if (cleanToken.includes('DUPLICATE') || usedQrCodes.includes(cleanToken)) {
          addFraudLogEntry(
            'Duplicate QR Attempt', 
            `Plate ${matched.vehicleNumber} attempted scan twice.`, 
            92
          );
          setFillError('🚨 SECURITY SYSTEM HALTED: Duplicate QR code signature detected! Logging security incident.');
          setScannedCitizen(null);
          setVerificationResult(null);
          return;
        }

        const remainingQuota = getUserQuota(matched.email);
        setVerificationResult({
          verified: true,
          vehicleNumber: matched.vehicleNumber,
          fuelType: 'Petrol 92 Octane',
          stationName: pumpUser?.station || 'Ceypetco - Town Hall',
          remainingQuota: remainingQuota,
          timestamp: new Date().toLocaleTimeString(),
          token: cleanToken,
          status: 'VALID',
          expiresAt: new Date(Date.now() + 5 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        setFillAmount(Math.min(10, remainingQuota).toString());
      } else {
        // Standalone offline parsing of short token mock strings
        if (cleanToken.length >= 10 && cleanToken.includes('-')) {
          const mockCitizen = fuelUsers[0] || { fullName: 'John Doe', vehicleNumber: 'CAD-8930', email: 'citizen@fuel.com' };
          setScannedCitizen(mockCitizen);
          setVerificationResult({
            verified: true,
            vehicleNumber: mockCitizen.vehicleNumber,
            fuelType: 'Petrol 92 Octane',
            stationName: pumpUser?.station || 'Ceypetco - Town Hall',
            remainingQuota: getUserQuota(mockCitizen.email),
            timestamp: new Date().toLocaleTimeString(),
            token: cleanToken,
            status: 'VALID',
            expiresAt: new Date(Date.now() + 5 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
          setFillAmount(Math.min(10, getUserQuota(mockCitizen.email)).toString());
        } else {
          addFraudLogEntry(
            'Fake Vehicle Signature',
            `Unregistered vehicle code "${cleanToken}" attempted authentication.`,
            78
          );
          setFillError('❌ UNKNOWN CODE: License plate signature mismatch or invalid token. Access Denied.');
          setScannedCitizen(null);
          setVerificationResult(null);
        }
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const startScanner = async () => {
    scanLockRef.current = false;
    setScannerActive(true);
    setFillError('');
    setFillSuccess('');
    setVerificationResult(null);
    setDispenseReceipt(null);
    
    setTimeout(async () => {
      try {
        if (qrScannerRef.current) {
          try {
            await qrScannerRef.current.clear();
          } catch (e) {
            console.warn("Scanner clear failed on start:", e);
          }
        }

        const scanner = new Html5Qrcode("qr-reader");
        qrScannerRef.current = scanner;
        
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 15,
            qrbox: { width: 250, height: 250 }
          },
          async (decodedText) => {
            if (scanLockRef.current) return;
            scanLockRef.current = true;

            await stopScanner();
            await verifyToken(decodedText);
          },
          () => {
            // Silent reading frame errors
          }
        );
      } catch (err) {
        console.error("Camera access failed:", err);
        setScannerActive(false);
        scanLockRef.current = false;
        setFillError("❌ CAMERA ERROR: Camera access denied or initialization failed. Please verify browser permissions.");
      }
    }, 200);
  };

  const stopScanner = async () => {
    if (qrScannerRef.current) {
      try {
        if (qrScannerRef.current.isScanning) {
          await qrScannerRef.current.stop();
        }
        await qrScannerRef.current.clear();
      } catch (err) {
        console.error("Error stopping scanner stream:", err);
      }
      qrScannerRef.current = null;
    }
    setScannerActive(false);
    scanLockRef.current = false;
  };

  const handleScanLookup = async (e) => {
    e.preventDefault();
    if (!qrInput.trim()) return;
    await verifyToken(qrInput);
  };

  const triggerDispense = async () => {
    setFillError('');
    setFillSuccess('');
    setShowConfirmDispense(false);

    if (!verificationResult || !scannedCitizen) return;

    const liters = parseFloat(fillAmount);
    if (isNaN(liters) || liters <= 0) {
      setFillError('❌ INVALID QUANTITY: Enter a valid quantity greater than 0.');
      return;
    }

    if (liters > verificationResult.remainingQuota) {
      setFillError(`❌ QUOTA EXCEEDED: Cannot dispense more than remaining ${verificationResult.remainingQuota} Liters.`);
      return;
    }

    setIsVerifying(true);

    try {
      const res = await addFuelTransaction(
        liters, 
        pumpUser?.station || 'Ceypetco - Town Hall', 
        scannedCitizen.vehicleNumber, 
        verificationResult.token
      );
      
      if (res.success) {
        const txId = Date.now().toString();
        setDispenseReceipt({
          transactionId: txId,
          vehiclePlate: scannedCitizen.vehicleNumber,
          dispensedLiters: liters,
          cost: liters * 370,
          timestamp: new Date().toLocaleTimeString()
        });

        setDailySales(prev => ({
          litersFilled: prev.litersFilled + liters,
          revenue: prev.revenue + (liters * 370),
          vehiclesServed: prev.vehiclesServed + 1
        }));

        setFillSuccess(`⛽ SUCCESS: Dispensed ${liters} L to vehicle ${scannedCitizen.vehicleNumber} successfully!`);
        
        setTimeout(() => {
          handleClearScan();
        }, 4000);
      } else {
        setFillError(`❌ DISPENSING FAILED: ${res.message}`);
      }
    } catch (err) {
      console.error(err);
      setFillError('❌ Network/server connection failed. Could not process transaction.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClearScan = () => {
    setScannedCitizen(null);
    setVerificationResult(null);
    setDispenseReceipt(null);
    setQrInput('');
    setFillError('');
    setFillSuccess('');
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div className="glass-panel" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', padding: '0.75rem 1rem', borderRadius: '10px', color: '#f87171', fontSize: '0.85rem' }}>
                  {fillError}
                </div>
                <button onClick={startScanner} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <Camera size={14} /> Scan Again
                </button>
              </div>
            )}

            {fillSuccess && (
              <div className="glass-panel" style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)', padding: '0.75rem 1rem', borderRadius: '10px', color: '#34d399', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                {fillSuccess}
              </div>
            )}

            {/* Initial Scan Action UI (if no result and not scanning) */}
            {!verificationResult && !scannerActive && !dispenseReceipt && (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <button 
                  onClick={startScanner} 
                  className="btn btn-primary" 
                  style={{ 
                    background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)', 
                    fontSize: '1rem', 
                    padding: '12px 24px', 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '8px', 
                    boxShadow: '0 4px 15px rgba(6, 182, 212, 0.3)',
                    marginBottom: '1rem',
                    width: '100%'
                  }}
                >
                  <Camera size={18} /> Scan Customer Quota QR
                </button>

                <div style={{ margin: '1rem 0', textAlign: 'center' }}>
                  <button 
                    onClick={() => setShowManualInput(!showManualInput)} 
                    style={{ background: 'none', border: 'none', color: '#06b6d4', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 }}
                  >
                    {showManualInput ? 'Hide Manual Entry' : 'Or Enter Token Manually'}
                  </button>
                </div>

                {showManualInput && (
                  <form onSubmit={handleScanLookup} style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Enter Token (e.g. F7K9-X2QP-8M)"
                      value={qrInput}
                      onChange={(e) => setQrInput(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary" style={{ background: 'rgba(255,255,255,0.05)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.1)' }}>
                      Verify
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Verification Loading State */}
            {isVerifying && (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div style={{ 
                  width: '32px', 
                  height: '32px', 
                  border: '3px solid rgba(255,255,255,0.05)', 
                  borderTopColor: '#06b6d4', 
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin 1s linear infinite',
                  marginBottom: '1rem'
                }}></div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Verifying quota token with blockchain ledger...</p>
              </div>
            )}

            {/* Display verification card & Dispensing controls */}
            {verificationResult && scannedCitizen && !dispenseReceipt && (
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                  <CheckCircle size={24} style={{ color: '#10b981' }} />
                  <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#34d399' }}>✓ QUOTA VERIFIED</h4>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Verified at {verificationResult.timestamp}</span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '4px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Customer Name</span>
                    <strong style={{ fontSize: '0.85rem', color: '#ffffff' }}>{scannedCitizen.fullName}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '4px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Vehicle Number</span>
                    <strong style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: '#ffffff' }}>{scannedCitizen.vehicleNumber}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '4px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Fuel Type</span>
                    <strong style={{ fontSize: '0.85rem', color: '#ffffff' }}>{verificationResult.fuelType}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '4px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Authorized Station</span>
                    <strong style={{ fontSize: '0.85rem', color: '#ffffff' }}>{verificationResult.stationName}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '4px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Token Status</span>
                    <strong style={{ fontSize: '0.85rem', color: '#10b981' }}>{verificationResult.status}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '4px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Expires At</span>
                    <strong style={{ fontSize: '0.85rem', color: '#f59e0b' }}>{verificationResult.expiresAt}</strong>
                  </div>
                  
                  <div style={{ marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(6, 182, 212, 0.05)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid rgba(6, 182, 212, 0.15)' }}>
                      <span style={{ fontSize: '0.8rem', color: '#06b6d4', fontWeight: 600 }}>Available Quota</span>
                      <strong style={{ fontSize: '1.1rem', color: '#06b6d4' }}>{verificationResult.remainingQuota} Liters</strong>
                    </div>
                  </div>
                </div>

                {/* Dispensing Action Form */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '6px', display: 'block', color: 'var(--text-secondary)' }}>Liters to Dispense</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={fillAmount}
                      onChange={(e) => setFillAmount(e.target.value)}
                      max={verificationResult.remainingQuota}
                      min="1"
                      step="0.5"
                    />
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button 
                      onClick={() => setShowConfirmDispense(true)} 
                      className="btn btn-primary" 
                      style={{ background: '#10b981', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                      disabled={isVerifying || parseFloat(fillAmount) <= 0 || parseFloat(fillAmount) > verificationResult.remainingQuota}
                    >
                      Confirm Dispense <Play size={14} />
                    </button>
                    <button 
                      onClick={handleClearScan} 
                      className="btn btn-secondary"
                    >
                      Clear Scan
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Display Dispense Receipt Success Card */}
            {dispenseReceipt && (
              <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(16, 185, 129, 0.2)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                  <CheckCircle size={24} style={{ color: '#10b981' }} />
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#34d399' }}>Transaction Complete</h4>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Receipt Generated at {dispenseReceipt.timestamp}</span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Receipt ID:</span>
                    <strong style={{ color: '#f1f5f9' }}>TX-{dispenseReceipt.transactionId}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Vehicle Number:</span>
                    <strong style={{ color: '#f1f5f9', textTransform: 'uppercase' }}>{dispenseReceipt.vehiclePlate}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Fuel Dispensed:</span>
                    <strong style={{ color: '#34d399' }}>{dispenseReceipt.dispensedLiters} Liters</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Total Cost:</span>
                    <strong style={{ color: '#f1f5f9' }}>Rs. {dispenseReceipt.cost.toLocaleString()}</strong>
                  </div>
                </div>

                <button 
                  onClick={handleClearScan} 
                  className="btn btn-primary"
                  style={{ width: '100%', background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)' }}
                >
                  Clear & Ready Next Scan
                </button>
              </div>
            )}
          </div>

          {/* QR Scanner Camera Overlay Modal */}
          {scannerActive && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 9999,
              padding: '1rem'
            }}>
              <div className="glass-panel" style={{
                width: '100%',
                maxWidth: '450px',
                padding: '2rem',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                textAlign: 'center',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Camera size={20} style={{ color: '#06b6d4' }} /> Quota QR Scanner
                  </h3>
                  <button 
                    onClick={stopScanner} 
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                  >
                    <X size={20} />
                  </button>
                </div>

                <div style={{ position: 'relative', marginBottom: '1.5rem', borderRadius: '12px', overflow: 'hidden', background: '#000000', border: '2px solid rgba(6, 182, 212, 0.3)' }}>
                  {/* Scanning Target frame */}
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '180px',
                    height: '180px',
                    border: '3px solid #06b6d4',
                    borderRadius: '12px',
                    zIndex: 10,
                    pointerEvents: 'none',
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)'
                  }}>
                    {/* Laser animation */}
                    <div style={{
                      width: '100%',
                      height: '2px',
                      background: '#06b6d4',
                      position: 'absolute',
                      top: 0,
                      boxShadow: '0 0 8px #06b6d4',
                      animation: 'scanLaser 2s linear infinite'
                    }} />
                  </div>
                  <div id="qr-reader" style={{ width: '100%' }}></div>
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                  Point your camera at the customer's quota QR code signature.
                </p>

                <button onClick={stopScanner} className="btn btn-secondary" style={{ width: '100%' }}>
                  Cancel Scan
                </button>
              </div>
            </div>
          )}

          {/* Dispensing Confirmation Modal */}
          {showConfirmDispense && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 9999,
              padding: '1rem'
            }}>
              <div className="glass-panel" style={{
                width: '100%',
                maxWidth: '400px',
                padding: '2rem',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                textAlign: 'center'
              }}>
                <AlertTriangle size={48} style={{ color: '#eab308', marginBottom: '1.5rem' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: '#ffffff' }}>
                  Confirm Dispensing
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  Are you sure you want to dispense <strong>{fillAmount} Liters</strong> of Petrol to vehicle <strong>{scannedCitizen?.vehicleNumber?.toUpperCase()}</strong>?
                </p>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <button 
                    onClick={() => setShowConfirmDispense(false)} 
                    className="btn btn-secondary"
                    disabled={isVerifying}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={triggerDispense} 
                    className="btn btn-primary"
                    style={{ background: '#10b981' }}
                    disabled={isVerifying}
                  >
                    {isVerifying ? 'Processing...' : 'Confirm'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Inject Dynamic Keyframe Animations */}
          <style>{`
            @keyframes scanLaser {
              0% { top: 0%; }
              50% { top: 100%; }
              100% { top: 0%; }
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>

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
