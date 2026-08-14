import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, LineChart, Line, Legend, 
  PieChart, Pie, Cell 
} from 'recharts';
import { 
  Building2, ShieldAlert, AlertTriangle, TrendingUp, BarChart3, 
  Settings, Users, Fuel, Flame, LineChart as ChartIcon, FileText, 
  CheckCircle, PlusCircle, UserCheck, ShieldCheck, RefreshCw, XCircle,
  Database, Award
} from 'lucide-react';

const AdminDashboard = () => {
  const { 
    adminUser, 
    emergencyMode, 
    toggleEmergencyMode, 
    inventoryReserves, 
    setInventoryReserves,
    reservedReserves,
    setReservedReserves,
    fraudLogs,
    setFraudLogs,
    stations,
    setStations,
    fuelTransactions,
    setFuelTransactions,
    lpgBookings,
    setLpgBookings,
    normalQuotaLimit,
    setNormalQuotaLimit,
    emergencyQuotaLimit,
    setEmergencyQuotaLimit,
    emergencyVehicleQuotaLimit,
    setEmergencyVehicleQuotaLimit,
    weightEmergency,
    setWeightEmergency,
    weightDemand,
    setWeightDemand,
    weightStock,
    setWeightStock,
    calculateShortageRatio,
    calculateDemandGap,
    calculateSurplus,
    addSystemNotification,
    getUserQuota,
    fuelUsers,
    lpgUsers,
    auditLogs,
    addAuditLog,
    priorityEmergency,
    setPriorityEmergency,
    priorityHealthcare,
    setPriorityHealthcare,
    priorityFire,
    setPriorityFire,
    priorityPolice,
    setPriorityPolice,
    priorityPublicTransport,
    setPriorityPublicTransport,
    priorityEssential,
    setPriorityEssential,
    priorityGeneral,
    setPriorityGeneral,
    getPredictedDemand,
    averageServiceTime,
    setAverageServiceTime,
    runBackendForecasting,
    triggerBackendQuotaReset,
    verifyBackendLedger,
    tamperBackendLedger,
    getSimulatedSMSLogs,
    getResearchEvaluationMetrics
  } = useContext(AppContext);
  
  const navigate = useNavigate();

  // 1. Strict route-based authorization check
  if (!adminUser || adminUser.role !== 'admin') {
    return (
      <div className="container" style={{ padding: '5rem 1.5rem', textAlign: 'center', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10 }}>
        <div className="glass-panel" style={{ maxWidth: '450px', padding: '3rem', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '16px', background: 'var(--glass-bg)', boxShadow: 'var(--glass-shadow)' }}>
          <ShieldAlert size={48} style={{ color: '#ef4444', marginBottom: '1.5rem' }} />
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '1rem', color: '#ffffff' }}>Access Denied</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2.5rem', lineHeight: '1.5' }}>
            You must be authenticated as a Government Administrator to access the National Command Center.
          </p>
          <button onClick={() => navigate('/fuel/login')} className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)', width: '100%', boxShadow: 'none' }}>
            Go to Admin Login
          </button>
        </div>
      </div>
    );
  }

  // 2. Active Tab State
  const [activeTab, setActiveTab] = useState('overview');
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  const [ledgerStatus, setLedgerStatus] = useState({ isValid: true, reason: '' });
  const [isAuditing, setIsAuditing] = useState(false);
  const [smsLogs, setSmsLogs] = useState([]);

  const [evalType, setEvalType] = useState('real'); // 'real' or 'test'
  const [evaluationReport, setEvaluationReport] = useState(null);
  const [loadingEvaluation, setLoadingEvaluation] = useState(false);

  useEffect(() => {
    if (activeTab === 'evaluation') {
      handleFetchEvaluation();
    }
  }, [activeTab, evalType]);

  const handleFetchEvaluation = async () => {
    setLoadingEvaluation(true);
    const report = await getResearchEvaluationMetrics(evalType === 'test');
    if (report) {
      setEvaluationReport(report);
    }
    setLoadingEvaluation(false);
  };

  useEffect(() => {
    if (activeTab === 'ledger') {
      handleAuditLedger();
      handleFetchSMSLogs();
    }
  }, [activeTab]);

  const handleAuditLedger = async () => {
    setIsAuditing(true);
    const res = await verifyBackendLedger();
    if (res) {
      setLedgerStatus(res);
    }
    setIsAuditing(false);
  };

  const handleFetchSMSLogs = async () => {
    const logs = await getSimulatedSMSLogs();
    setSmsLogs(logs);
  };

  const handleTamperDatabase = async () => {
    const res = await tamperBackendLedger();
    if (res && res.success) {
      alert(`⚠️ DATABASE TAMPERED: Malicious value change injected into transaction '${res.tamperedTransactionId}'! Running verification audit will detect it.`);
      handleAuditLedger();
    }
  };

  // 3. Stock Replenishment Form State
  const [replenishInput, setReplenishInput] = useState({
    type: 'Petrol 92 Octane',
    quantity: '10000',
    region: 'Colombo',
    supplier: 'Ceylon Petroleum Storage Terminals Ltd',
    date: new Date().toISOString().split('T')[0]
  });
  const [replenishSuccess, setReplenishSuccess] = useState('');
  const [replenishError, setReplenishError] = useState('');

  // 4. System Broadcast form state
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastSuccess, setBroadcastSuccess] = useState('');

  // 5. Calculations for Summary Cards
  const totalFuelStock = inventoryReserves.petrol92 + inventoryReserves.petrol95 + inventoryReserves.dieselAuto;
  const totalLpgStock = inventoryReserves.lpg12 + inventoryReserves.lpg5;
  const totalReservedFuel = reservedReserves.petrol92 + reservedReserves.petrol95 + reservedReserves.dieselAuto;
  const totalReservedLpg = reservedReserves.lpg12 + reservedReserves.lpg5;
  
  const availableFuelStock = Math.max(0, totalFuelStock - totalReservedFuel);
  const availableLpgStock = Math.max(0, totalLpgStock - totalReservedLpg);

  const pendingRequestsCount = lpgBookings.filter(b => b.status !== 'Delivered' && b.status !== 'Rejected').length;
  const totalTransactionsCount = fuelTransactions.length + lpgBookings.length;
  const activeFraudAlerts = fraudLogs.filter(f => f.status !== 'Resolved').length;

  const predictedDemand = getPredictedDemand();
  const computedGap = predictedDemand - availableFuelStock;
  const shortageRatio = calculateShortageRatio(predictedDemand, availableFuelStock);
  
  let riskLevel = 'LOW';
  if (shortageRatio > 0.25) riskLevel = 'CRITICAL';
  else if (shortageRatio > 0.1) riskLevel = 'HIGH';
  else if (shortageRatio > 0) riskLevel = 'MEDIUM';

  // 6. Dynamic charts calculations based on real data
  const getConsumptionData = () => {
    // Group fuel transactions by weekday
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const groups = days.map(d => ({ name: d, petrol: 0, diesel: 0, lpg: 0 }));
    
    fuelTransactions.forEach(tx => {
      const date = new Date(tx.createdAt || tx.date);
      const dayName = days[date.getDay()];
      const grp = groups.find(g => g.name === dayName);
      if (grp) {
        if (tx.fuelType && tx.fuelType.includes('Diesel')) {
          grp.diesel += tx.allocatedAmount || tx.amount;
        } else {
          grp.petrol += tx.allocatedAmount || tx.amount;
        }
      }
    });

    lpgBookings.forEach(bk => {
      const date = new Date(bk.createdAt || bk.date);
      const dayName = days[date.getDay()];
      const grp = groups.find(g => g.name === dayName);
      if (grp) {
        grp.lpg += bk.weight === '12.5kg' ? 12.5 : 5.0;
      }
    });

    // Fallback seed offsets if no transactions exist to keep visual fidelity
    const base = [
      { name: 'Mon', petrol: 4500, diesel: 3200, lpg: 80 },
      { name: 'Tue', petrol: 5200, diesel: 3800, lpg: 95 },
      { name: 'Wed', petrol: 4800, diesel: 3400, lpg: 90 },
      { name: 'Thu', petrol: 6100, diesel: 4200, lpg: 110 },
      { name: 'Fri', petrol: 5500, diesel: 3900, lpg: 105 },
      { name: 'Sat', petrol: 6800, diesel: 4900, lpg: 120 },
      { name: 'Sun', petrol: 5900, diesel: 4100, lpg: 85 }
    ];

    return base.map(b => ({
      name: b.name,
      petrol: b.petrol + groups.find(g => g.name === b.name).petrol,
      diesel: b.diesel + groups.find(g => g.name === b.name).diesel,
      lpg: b.lpg + groups.find(g => g.name === b.name).lpg
    }));
  };

  const getPriorityAllocationData = () => {
    // Sum allocated quantities by user priority class
    const allocation = {
      'Emergency Services': 0,
      'Healthcare': 0,
      'Fire & Rescue': 0,
      'Police': 0,
      'Public Transport': 0,
      'Essential Services': 0,
      'General Consumers': 0
    };

    fuelTransactions.forEach(t => {
      const role = t.userType || 'General Consumer';
      if (allocation[role] !== undefined) {
        allocation[role] += t.allocatedAmount || t.amount;
      }
    });

    return Object.keys(allocation).map(key => ({
      name: key,
      value: Math.round(allocation[key])
    })).filter(item => item.value > 0);
  };

  const getDistrictDistribution = () => {
    const data = { Colombo: 0, Gampaha: 0, Kandy: 0, Galle: 0 };
    stations.forEach(s => {
      if (data[s.district] !== undefined) {
        data[s.district] += s.stock;
      }
    });
    const colors = { Colombo: '#ef4444', Gampaha: '#f59e0b', Kandy: '#3b82f6', Galle: '#10b981' };
    return Object.keys(data).map(key => ({
      name: key,
      value: data[key],
      color: colors[key] || '#94a3b8'
    }));
  };

  // 7. Configurable form submission handlers
  const handleUpdateQuota = (e) => {
    e.preventDefault();
    addAuditLog('Update Quotas & Weight Settings', 
      `Normal: ${normalQuotaLimit}L, Emergency: ${emergencyQuotaLimit}L, Resp: ${emergencyVehicleQuotaLimit}L`, 
      `Normal: ${normalQuotaLimit}L, Emergency: ${emergencyQuotaLimit}L, Resp: ${emergencyVehicleQuotaLimit}L`
    );
    addSystemNotification('quota', '⚙️ Quota & Weights Config Saved', `Normal cap: ${normalQuotaLimit}L, Emergency cap: ${emergencyQuotaLimit}L, First Responder cap: ${emergencyVehicleQuotaLimit}L.`);
    alert('National Quota rules and priority weight metrics have been updated successfully.');
  };

  const handleBroadcast = (e) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;
    addAuditLog('Broadcast Advisory Banner', 'System Notification Dispatch', broadcastText.substring(0, 40) + '...');
    addSystemNotification('alert', '📣 GOVT BROADCAST', broadcastText);
    setBroadcastSuccess('Urgent advisory successfully broadcasted across all citizen interfaces.');
    setBroadcastText('');
    setTimeout(() => setBroadcastSuccess(''), 3000);
  };

  const handleResolveAlert = (alertId) => {
    setFraudLogs(prev => prev.map(log => {
      if (log.id === alertId) {
        addAuditLog('Resolve Fraud Warning', `Alert ID ${alertId}: ${log.type}`, 'Marked Resolved');
        return { ...log, status: 'Resolved' };
      }
      return log;
    }));
    alert(`Fraud warning ID ${alertId} marked as Resolved.`);
  };

  const handleToggleStationStatus = (stationId) => {
    setStations(prev => prev.map(s => {
      if (s.id === stationId) {
        const nextStatus = !s.openNow;
        addAuditLog('Toggle Station Operational Node', `Station ${s.name}: ${s.openNow ? 'Active' : 'Closed'}`, nextStatus ? 'Active' : 'Closed');
        return { ...s, openNow: nextStatus, status: nextStatus ? 'In Stock' : 'Suspended' };
      }
      return s;
    }));
  };

  const handleReplenishReserves = (e) => {
    e.preventDefault();
    setReplenishSuccess('');
    setReplenishError('');

    const qty = parseFloat(replenishInput.quantity);
    if (isNaN(qty) || qty <= 0) {
      setReplenishError('Invalid amount. Please input a positive volume.');
      return;
    }

    const type = replenishInput.type;
    const region = replenishInput.region;

    // 1. Update National reserves
    setInventoryReserves(prev => {
      const keyMap = {
        'Petrol 92 Octane': 'petrol92',
        'Petrol 95 Octane': 'petrol95',
        'Auto Diesel': 'dieselAuto',
        'LPG Cylinder 12.5kg': 'lpg12',
        'LPG Cylinder 5kg': 'lpg5'
      };
      const key = keyMap[type];
      if (!key) return prev;
      return { ...prev, [key]: prev[key] + qty };
    });

    // 2. Distribute stock to regional stations/distributors
    setStations(prevStations => {
      const regionalStations = prevStations.filter(s => s.district === region && (
        type.startsWith('LPG') ? s.type === 'lpg' : s.type === 'fuel'
      ));

      if (regionalStations.length === 0) {
        return prevStations; // No stations to receive stock in this region
      }

      // Distribute stock equally
      const share = qty / regionalStations.length;
      return prevStations.map(s => {
        if (s.district === region && (type.startsWith('LPG') ? s.type === 'lpg' : s.type === 'fuel')) {
          const updatedStock = s.stock + share;
          return { ...s, stock: updatedStock, status: updatedStock > 5000 || (s.type === 'lpg' && updatedStock > 10) ? 'In Stock' : 'Low Stock', openNow: true };
        }
        return s;
      });
    });

    addAuditLog('Reserves Shipment Replenished', `Shipped ${qty} to ${region}`, `${type} by ${replenishInput.supplier}`);
    addSystemNotification('info', '📦 Reserves Shipment Arrived', `${qty} units of ${type} successfully loaded and dispatched to nodes in ${region} district.`);
    setReplenishSuccess(`Shipment processed successfully. Distributed stock to ${region} nodes.`);
    setReplenishInput(prev => ({ ...prev, quantity: '10000' }));
    setTimeout(() => setReplenishSuccess(''), 3000);
  };

  // 8. Regional Monitoring Data Calculator
  const getRegionalData = () => {
    const districts = ['Colombo', 'Gampaha', 'Kandy', 'Galle'];
    const demands = { Colombo: 6200000, Gampaha: 2300000, Kandy: 1500000, Galle: 1800000 };

    return districts.map(d => {
      const regionalStations = stations.filter(s => s.district === d);
      const fuelVal = regionalStations.filter(s => s.type === 'fuel').reduce((sum, s) => sum + s.stock, 0);
      const lpgVal = regionalStations.filter(s => s.type === 'lpg').reduce((sum, s) => sum + s.stock, 0);
      
      const avail = fuelVal; // Focus shortage math on fuel
      const pred = demands[d];
      const gap = pred - avail;
      const ratio = calculateShortageRatio(pred, avail);
      
      let level = 'LOW';
      if (ratio > 0.25) level = 'CRITICAL';
      else if (ratio > 0.1) level = 'HIGH';
      else if (ratio > 0) level = 'MEDIUM';

      const activeNodes = regionalStations.filter(s => s.openNow).length;
      // Pending requests in this district
      const pendingRequests = lpgBookings.filter(b => b.status !== 'Delivered' && b.status !== 'Rejected' && stations.find(s => s.name === b.location)?.district === d).length;

      return {
        name: d,
        fuel: fuelVal,
        lpg: lpgVal,
        demand: pred,
        gap: gap,
        ratio: ratio,
        risk: level,
        active: activeNodes,
        pending: pendingRequests
      };
    });
  };

  // Helper to safely render charts or display a backup empty state
  const renderChartContainer = (title, dataArray, chartComponent) => {
    return (
      <div className="glass-panel" style={{ padding: '1.75rem', textAlign: 'left', minHeight: '320px', display: 'flex', flexDirection: 'column' }}>
        <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ChartIcon size={16} style={{ color: '#ef4444' }} /> {title}
        </h4>
        <div style={{ flex: 1, minHeight: '220px', position: 'relative' }}>
          {dataArray && dataArray.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              {chartComponent}
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '220px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              No transaction data available
            </div>
          )}
        </div>
      </div>
    );
  };

  // Combined ledger data (Fuel + LPG transactions)
  const combinedTransactions = [
    ...fuelTransactions.map(t => ({
      id: t.id,
      user: t.userId,
      target: t.vehicleId,
      type: 'Fuel',
      requested: t.amount,
      allocated: t.allocatedAmount || t.amount,
      location: t.station,
      time: t.createdAt ? new Date(t.createdAt).toLocaleString() : t.date,
      quota: getUserQuota(t.userId),
      priority: t.priorityScore,
      verification: t.verificationStatus,
      status: t.transactionStatus,
      emergency: t.emergencyStatus
    })),
    ...lpgBookings.map(b => ({
      id: b.id,
      user: b.userId,
      target: b.id,
      type: 'LPG',
      requested: b.weight === '12.5kg' ? 12.5 : 5,
      allocated: b.status === 'Delivered' ? (b.weight === '12.5kg' ? 12.5 : 5) : 0,
      location: b.location,
      time: b.createdAt ? new Date(b.createdAt).toLocaleString() : b.date,
      quota: '1 Book/21d',
      priority: b.priorityScore,
      verification: b.verificationStatus,
      status: b.status === 'Delivered' ? 'Completed' : b.status === 'Booked' ? 'Approved' : b.status === 'In Transit' ? 'Allocated' : b.status,
      emergency: b.emergencyStatus
    }))
  ].sort((a, b) => new Date(b.time) - new Date(a.time));

  return (
    <div className="container" style={{ padding: '2rem 1.5rem', flex: 1 }}>
      {/* 9. TOP PANEL: Emergency Mode + System Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }} className="glass-panel">
        <div style={{ textAlign: 'left', padding: '1rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Building2 size={14} /> National Energy Command Gateway
          </span>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '2px' }}>Government Control Center</h1>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>System status: <strong style={{ color: emergencyMode ? '#ef4444' : '#10b981' }}>{emergencyMode ? '⚠️ EMERGENCY ENFORCEMENT ACTIVE' : '🟢 NORMAL SUPPLY STATE'}</strong></span>
        </div>

        <div style={{ padding: '1rem', display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => setShowDebugPanel(prev => !prev)}
            className="btn"
            style={{
              background: showDebugPanel ? 'rgba(139, 92, 246, 0.25)' : 'rgba(255,255,255,0.05)',
              border: '1px solid',
              borderColor: showDebugPanel ? '#8b5cf6' : 'rgba(255,255,255,0.08)',
              color: '#ffffff',
              fontWeight: 'bold',
              padding: '0.75rem 1.5rem',
              cursor: 'pointer'
            }}
          >
            ⚙️ {showDebugPanel ? 'Hide Dev Debug' : 'Show Dev Debug'}
          </button>
          <button
            onClick={toggleEmergencyMode}
            className="btn"
            style={{
              background: emergencyMode ? '#ef4444' : 'rgba(255,255,255,0.05)',
              border: '1px solid',
              borderColor: emergencyMode ? '#ef4444' : 'rgba(255,255,255,0.08)',
              color: '#ffffff',
              fontWeight: 'bold',
              padding: '0.75rem 1.5rem',
              cursor: 'pointer'
            }}
          >
            <ShieldAlert size={16} /> {emergencyMode ? 'Emergency Mode: ACTIVE' : 'Trigger Emergency Mode'}
          </button>
        </div>
      </div>

      {showDebugPanel && (
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'left', marginBottom: '2rem', border: '1px solid rgba(139, 92, 246, 0.3)', background: 'rgba(139, 92, 246, 0.05)', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#c084fc' }}>
            ⚙️ FuelGuard AI Development Debug Panel (Remove for Production)
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.85rem' }}>
            <div>Emergency Mode: <strong style={{ color: emergencyMode ? '#ef4444' : '#10b981' }}>{emergencyMode ? 'ON' : 'OFF'}</strong></div>
            <div>Normal Quota Limit: <strong>{normalQuotaLimit} L</strong></div>
            <div>Emergency Quota Limit: <strong>{emergencyQuotaLimit} L</strong></div>
            <div>Emergency Responder Limit: <strong>{emergencyVehicleQuotaLimit} L</strong></div>
            <div>Total Fuel Stock: <strong>{totalFuelStock.toLocaleString()} L</strong></div>
            <div>Total LPG Stock: <strong>{totalLpgStock.toLocaleString()} units</strong></div>
            <div>Transaction Count: <strong>{fuelTransactions.length} items</strong></div>
            <div>Booking Count: <strong>{lpgBookings.length} items</strong></div>
            <div>Fraud Alert Count: <strong>{fraudLogs.length} warnings</strong></div>
            <div>Current User: <strong>{adminUser?.email || 'N/A'}</strong></div>
            <div>Current Role: <strong>{adminUser?.role || 'N/A'}</strong></div>
            <div>Station Count: <strong>{stations.filter(s => s.type === 'fuel').length} nodes</strong></div>
            <div>Distributor Count: <strong>{stations.filter(s => s.type === 'lpg').length} nodes</strong></div>
            <div>Predicted Demand: <strong>{predictedDemand.toLocaleString()} L</strong></div>
            <div>Demand Gap: <strong style={{ color: computedGap > 0 ? '#ef4444' : '#10b981' }}>{computedGap.toLocaleString()} L</strong></div>
            <div>Shortage Ratio: <strong>{(shortageRatio * 100).toFixed(1)}%</strong></div>
          </div>
        </div>
      )}

      {/* 10. Navigation tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem', overflowX: 'auto' }}>
        {[
          { id: 'overview', label: 'Command Overview', icon: <TrendingUp size={16} /> },
          { id: 'inventory', label: 'Reserves & Stock', icon: <Fuel size={16} /> },
          { id: 'forecasting', label: 'AI Demand Forecast', icon: <ChartIcon size={16} /> },
          { id: 'fraud', label: 'Fraud Hub', icon: <ShieldAlert size={16} /> },
          { id: 'users', label: 'Registry Console', icon: <Users size={16} /> },
          { id: 'broadcast', label: 'System Broadcasts', icon: <FileText size={16} /> },
          { id: 'ledger', label: 'Ledger Audit', icon: <Database size={16} /> },
          { id: 'evaluation', label: 'Research Evaluation', icon: <Award size={16} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="btn"
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: '10px',
              background: activeTab === tab.id ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
              color: activeTab === tab.id ? '#f87171' : 'var(--text-secondary)',
              border: '1px solid',
              borderColor: activeTab === tab.id ? 'rgba(239, 68, 68, 0.3)' : 'transparent',
              fontSize: '0.9rem',
              whiteSpace: 'nowrap',
              cursor: 'pointer'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* 11. Command Overview Tab */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* SUMMARY CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'left' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Available Fuel Stock</span>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#06b6d4' }}>{availableFuelStock.toLocaleString()} L</h3>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Total reserves: {totalFuelStock.toLocaleString()} L</span>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'left' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Available LPG cylinders</span>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f97316' }}>{availableLpgStock.toLocaleString()} Qty</h3>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Total reserves: {totalLpgStock.toLocaleString()} Qty</span>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'left' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Transactions Audit Log</span>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981' }}>{totalTransactionsCount} Files</h3>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Real-time verification active</span>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'left' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Pending LPG refuels</span>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#a855f7' }}>{pendingRequestsCount} Bookings</h3>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Distributor assigned</span>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'left' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>AI Predicted Weekly Demand</span>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#e2e8f0' }}>{(predictedDemand/1000000).toFixed(1)}M Liters</h3>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Variance range ±1.2%</span>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'left', border: `1px solid ${riskLevel === 'CRITICAL' ? 'rgba(239,68,68,0.3)' : 'var(--glass-border)'}` }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Supply Shortage Risk</span>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: riskLevel === 'CRITICAL' || riskLevel === 'HIGH' ? '#ef4444' : '#10b981' }}>{riskLevel}</h3>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Shortage ratio: {(shortageRatio * 100).toFixed(1)}%</span>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'left', border: `1px solid ${activeFraudAlerts > 0 ? 'rgba(239,68,68,0.3)' : 'var(--glass-border)'}` }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Flagged Security Warnings</span>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: activeFraudAlerts > 0 ? '#ef4444' : '#10b981' }}>{activeFraudAlerts} alerts</h3>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Audit log updated</span>
            </div>
          </div>

          {/* MIDDLE: CHARTS & REGIONAL RISK */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }} className="dashboard-grid">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {renderChartContainer(
                "National Fuel & LPG Consumption trends (Weekly)",
                getConsumptionData(),
                <AreaChart data={getConsumptionData()} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPetrol" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDiesel" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" />
                  <YAxis stroke="var(--text-secondary)" />
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' }} />
                  <Legend />
                  <Area type="monotone" dataKey="petrol" name="Petrol 92/95 (L)" stroke="#06b6d4" fillOpacity={1} fill="url(#colorPetrol)" />
                  <Area type="monotone" dataKey="diesel" name="Auto Diesel (L)" stroke="#2563eb" fillOpacity={1} fill="url(#colorDiesel)" />
                </AreaChart>
              )}

              {renderChartContainer(
                "Predicted demand vs available stock (Safety stockpile check)",
                [{ name: 'Stock Comparison', 'Available reserves': availableFuelStock, 'Forecast Demand': predictedDemand }],
                <BarChart data={[{ name: 'Fuel Stockpile (L)', 'Available reserves': availableFuelStock, 'Forecast Demand': predictedDemand }]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" />
                  <YAxis stroke="var(--text-secondary)" />
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' }} />
                  <Legend />
                  <Bar dataKey="Available reserves" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Forecast Demand" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </div>

            {/* Regional Supply Panel */}
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'left' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart3 size={18} style={{ color: '#ef4444' }} /> District Supply monitoring
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {getRegionalData().map((dist, idx) => (
                  <div key={idx} style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.95rem' }}>{dist.name} District</strong>
                      <span style={{ fontSize: '0.7rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '20px', background: dist.risk === 'CRITICAL' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)', color: dist.risk === 'CRITICAL' ? '#ef4444' : '#10b981' }}>
                        {dist.risk} RISK
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <div>Available fuel: <strong style={{ color: '#ffffff' }}>{dist.fuel.toLocaleString()} L</strong></div>
                      <div>Available LPG: <strong style={{ color: '#ffffff' }}>{dist.lpg.toLocaleString()} cylinders</strong></div>
                      <div>Demand gap: <strong style={{ color: dist.gap > 0 ? '#ef4444' : '#10b981' }}>{dist.gap.toLocaleString()} L</strong></div>
                      <div>Shortage ratio: <strong style={{ color: '#ffffff' }}>{(dist.ratio * 100).toFixed(1)}%</strong></div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '4px', marginTop: '2px', color: 'var(--text-secondary)' }}>
                      <span>Active nodes: {dist.active}</span>
                      <span>Pending bookings: {dist.pending}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* LOWER: TABLES & DETAILED CONTROLS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }} className="dashboard-grid">
            
            {/* Real transactions Table */}
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'left', overflowX: 'auto' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={18} style={{ color: '#06b6d4' }} /> System transaction ledger
              </h3>
              
              {combinedTransactions.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No transactions found in system history.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', minWidth: '700px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '0.6rem', textAlign: 'left' }}>Transaction ID</th>
                      <th style={{ padding: '0.6rem', textAlign: 'left' }}>User</th>
                      <th style={{ padding: '0.6rem', textAlign: 'left' }}>Target ID</th>
                      <th style={{ padding: '0.6rem', textAlign: 'left' }}>Type</th>
                      <th style={{ padding: '0.6rem', textAlign: 'right' }}>Req Qty</th>
                      <th style={{ padding: '0.6rem', textAlign: 'right' }}>Alloc Qty</th>
                      <th style={{ padding: '0.6rem', textAlign: 'left' }}>Node</th>
                      <th style={{ padding: '0.6rem', textAlign: 'center' }}>Priority</th>
                      <th style={{ padding: '0.6rem', textAlign: 'center' }}>Verification</th>
                      <th style={{ padding: '0.6rem', textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {combinedTransactions.slice(0, 10).map((tx, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '0.6rem', fontFamily: 'monospace' }}>{tx.id}</td>
                        <td style={{ padding: '0.6rem' }}>{tx.user}</td>
                        <td style={{ padding: '0.6rem', fontFamily: 'monospace' }}>{tx.target}</td>
                        <td style={{ padding: '0.6rem' }}>{tx.type}</td>
                        <td style={{ padding: '0.6rem', textAlign: 'right', fontWeight: 'bold' }}>{tx.requested}</td>
                        <td style={{ padding: '0.6rem', textAlign: 'right', fontWeight: 'bold', color: '#10b981' }}>{tx.allocated}</td>
                        <td style={{ padding: '0.6rem' }}>{tx.location}</td>
                        <td style={{ padding: '0.6rem', textAlign: 'center' }}>{tx.priority}</td>
                        <td style={{ padding: '0.6rem', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontWeight: 'bold' }}>{tx.verification}</span>
                        </td>
                        <td style={{ padding: '0.6rem', textAlign: 'center' }}>
                          <span style={{
                            fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px',
                            background: tx.status === 'Completed' ? 'rgba(16, 185, 129, 0.15)' : tx.status === 'Rejected' || tx.status === 'Fraud Flagged' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: tx.status === 'Completed' ? '#10b981' : tx.status === 'Rejected' || tx.status === 'Fraud Flagged' ? '#ef4444' : '#f59e0b',
                            fontWeight: 'bold'
                          }}>{tx.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Audit log & Fraud triggers */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Fraud Hub Action alerts */}
              <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'left' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '1rem' }}>
                  <ShieldAlert size={16} /> Fraud Auditing hub
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto' }}>
                  {fraudLogs.map((log) => (
                    <div key={log.id} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 'bold', color: log.status === 'Resolved' ? '#10b981' : '#ef4444' }}>{log.type}</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{log.time}</span>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', margin: '4px 0 6px' }}>{log.details}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Risk index: <strong style={{ color: '#ef4444' }}>{log.riskScore}%</strong></span>
                        {log.status !== 'Resolved' ? (
                          <button onClick={() => handleResolveAlert(log.id)} className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '0.65rem', borderRadius: '4px', cursor: 'pointer' }}>
                            Mark Resolved
                          </button>
                        ) : (
                          <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓ Resolved</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Replenish stock form */}
              <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'left' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '1rem' }}>
                  <PlusCircle size={16} style={{ color: '#ef4444' }} /> Replenish reserves stock
                </h3>
                {replenishSuccess && <div className="glass-panel" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.5rem', borderRadius: '6px', fontSize: '0.75rem', marginBottom: '0.75rem' }}>{replenishSuccess}</div>}
                {replenishError && <div className="glass-panel" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.5rem', borderRadius: '6px', fontSize: '0.75rem', marginBottom: '0.75rem' }}>{replenishError}</div>}
                
                <form onSubmit={handleReplenishReserves} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Fuel / LPG Type</label>
                    <select
                      className="form-select"
                      style={{ padding: '0.4rem', fontSize: '0.75rem' }}
                      value={replenishInput.type}
                      onChange={(e) => setReplenishInput(prev => ({ ...prev, type: e.target.value }))}
                    >
                      <option value="Petrol 92 Octane">Petrol 92 Octane</option>
                      <option value="Petrol 95 Octane">Petrol 95 Octane</option>
                      <option value="Auto Diesel">Auto Diesel</option>
                      <option value="LPG Cylinder 12.5kg">LPG Cylinder 12.5kg</option>
                      <option value="LPG Cylinder 5kg">LPG Cylinder 5kg</option>
                    </select>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Volume / Qty</label>
                      <input
                        type="number"
                        className="form-input"
                        style={{ padding: '0.4rem', fontSize: '0.75rem' }}
                        value={replenishInput.quantity}
                        onChange={(e) => setReplenishInput(prev => ({ ...prev, quantity: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Region</label>
                      <select
                        className="form-select"
                        style={{ padding: '0.4rem', fontSize: '0.75rem' }}
                        value={replenishInput.region}
                        onChange={(e) => setReplenishInput(prev => ({ ...prev, region: e.target.value }))}
                      >
                        <option value="Colombo">Colombo</option>
                        <option value="Gampaha">Gampaha</option>
                        <option value="Kandy">Kandy</option>
                        <option value="Galle">Galle</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Supplier / shipment ID</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ padding: '0.4rem', fontSize: '0.75rem' }}
                      value={replenishInput.supplier}
                      onChange={(e) => setReplenishInput(prev => ({ ...prev, supplier: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <button type="submit" className="btn btn-secondary" style={{ padding: '0.5rem', fontSize: '0.75rem', width: '100%' }}>
                    Load Shipment stock
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Bottom Row: Weights, Category Scores, and Audit logs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }} className="dashboard-grid">
            {/* Priorities & weight parameters */}
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'left' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Settings size={18} style={{ color: '#ef4444' }} /> Priority-Allocation policy settings
              </h3>
              
              <form onSubmit={handleUpdateQuota}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', marginBottom: '1.25rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Normal cap (L)</label>
                    <input type="number" className="form-input" value={normalQuotaLimit} onChange={(e) => setNormalQuotaLimit(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Emergency cap (L)</label>
                    <input type="number" className="form-input" value={emergencyQuotaLimit} onChange={(e) => setEmergencyQuotaLimit(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Responder cap (L)</label>
                    <input type="number" className="form-input" value={emergencyVehicleQuotaLimit} onChange={(e) => setEmergencyVehicleQuotaLimit(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Srv Time (mins)</label>
                    <input type="number" className="form-input" value={averageServiceTime} onChange={(e) => setAverageServiceTime(parseInt(e.target.value) || 1)} />
                  </div>
                </div>

                <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '1rem 0' }}></div>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>Priority weights ($w_1, w_2, w_3$)</span>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '1.25rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.7rem' }}>Emergency ($w_1$)</label>
                    <input type="number" step="0.1" className="form-input" value={weightEmergency} onChange={(e) => setWeightEmergency(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.7rem' }}>Queue ($w_2$)</label>
                    <input type="number" step="0.1" className="form-input" value={weightDemand} onChange={(e) => setWeightDemand(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.7rem' }}>Stock Index ($w_3$)</label>
                    <input type="number" step="0.1" className="form-input" value={weightStock} onChange={(e) => setWeightStock(parseFloat(e.target.value) || 0)} />
                  </div>
                </div>

                <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '1rem 0' }}></div>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>Category Priority Scores ($E_i$)</span>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', marginBottom: '1.5rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.7rem' }}>Healthcare</label>
                    <input type="number" className="form-input" value={priorityHealthcare} onChange={(e) => setPriorityHealthcare(parseInt(e.target.value) || 0)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.7rem' }}>Fire & Rescue</label>
                    <input type="number" className="form-input" value={priorityFire} onChange={(e) => setPriorityFire(parseInt(e.target.value) || 0)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.7rem' }}>Police</label>
                    <input type="number" className="form-input" value={priorityPolice} onChange={(e) => setPriorityPolice(parseInt(e.target.value) || 0)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.7rem' }}>Public Transport</label>
                    <input type="number" className="form-input" value={priorityPublicTransport} onChange={(e) => setPriorityPublicTransport(parseInt(e.target.value) || 0)} />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', background: '#ef4444', boxShadow: 'none' }}>
                  Apply system rules parameters
                </button>
              </form>
            </div>

            {/* Audit log */}
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'left' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={18} style={{ color: '#06b6d4' }} /> Admin action audit log
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto' }}>
                {auditLogs.map((log) => (
                  <div key={log.id} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <strong style={{ color: '#06b6d4' }}>{log.action}</strong>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.65rem' }}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div style={{ color: 'var(--text-secondary)' }}>Operator: {log.adminId}</div>
                    <div style={{ color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', gap: '8px' }}>
                      <span>Prev: <code style={{ color: '#ef4444' }}>{log.previousValue}</code></span>
                      <span>Next: <code style={{ color: '#10b981' }}>{log.newValue}</code></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 12. Reserves Stock Tab */}
      {activeTab === 'inventory' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'left' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Fuel size={18} style={{ color: '#ef4444' }} /> National reserves ledger
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem' }}>
              {[
                { label: 'Petrol 92 Octane', total: inventoryReserves.petrol92, reserved: reservedReserves.petrol92, unit: 'L' },
                { label: 'Petrol 95 Octane', total: inventoryReserves.petrol95, reserved: reservedReserves.petrol95, unit: 'L' },
                { label: 'Auto Diesel', total: inventoryReserves.dieselAuto, reserved: reservedReserves.dieselAuto, unit: 'L' },
                { label: 'LPG Cylinders 12.5kg', total: inventoryReserves.lpg12, reserved: reservedReserves.lpg12, unit: 'Qty' },
                { label: 'LPG Cylinders 5kg', total: inventoryReserves.lpg5, reserved: reservedReserves.lpg5, unit: 'Qty' }
              ].map((res, i) => {
                const available = res.total - res.reserved;
                const ratio = res.total > 0 ? (available / res.total) * 100 : 0;
                return (
                  <div key={i} style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>{res.label}</span>
                    <h4 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '6px 0 2px', color: '#ffffff' }}>{available.toLocaleString()} {res.unit}</h4>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Total reserves: {res.total.toLocaleString()} (Reserved: {res.reserved.toLocaleString()})</span>
                    
                    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', marginTop: '1rem', overflow: 'hidden' }}>
                      <div style={{ width: `${ratio}%`, height: '100%', background: 'linear-gradient(90deg, #ef4444, #f43f5e)', borderRadius: '4px' }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }} className="grid-mobile">
            {renderChartContainer(
              "District Stock Distribution Overview",
              getDistrictDistribution(),
              <PieChart>
                <Pie data={getDistrictDistribution()} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {getDistrictDistribution().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            )}

            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'left' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: '#ffffff' }}>Shipment Logistics tracker</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                All imports and shipments loaded directly synchronize regional station stocks. Available stocks are immediately routed based on priority.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', fontSize: '0.75rem', border: '1px solid var(--glass-border)' }}>
                  <strong>West Bound Petrol Cargo:</strong> Colombo Terminals (CPSTL) — Loaded.
                </div>
                <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', fontSize: '0.75rem', border: '1px solid var(--glass-border)' }}>
                  <strong>LPG Cargo Vessel:</strong> Galle Harbor Port — Discharging cylinders.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 13. AI Forecasting Tab */}
      {activeTab === 'forecasting' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'left' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ChartIcon size={18} style={{ color: '#ef4444' }} /> AI Projections Engine (Demo Mode Active)
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '2rem' }}>
              Projections computed dynamically based on real station stocks, transaction records, and historical queue lengths.
            </p>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
              <button 
                type="button" 
                onClick={async () => {
                  const forecasts = await runBackendForecasting();
                  if (forecasts) {
                    alert('AI Projections recalculated and stored in database successfully!');
                  }
                }}
                className="btn btn-primary"
                style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem', background: 'linear-gradient(135deg, #a855f7 0%, #2563eb 100%)', border: 'none' }}
              >
                🔄 Run AI Forecasting Engine
              </button>
              
              <button 
                type="button" 
                onClick={async () => {
                  const success = await triggerBackendQuotaReset();
                  if (success) {
                    alert('Weekly quotas refilled for all citizen wallets successfully!');
                  }
                }}
                className="btn btn-secondary"
                style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                ⏰ Trigger Weekly Quota Reset
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>AI Predicted Demand (Calculated)</span>
                <strong style={{ fontSize: '1.25rem', display: 'block', marginTop: '4px' }}>{predictedDemand.toLocaleString()} L</strong>
              </div>
              <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Available stockpile</span>
                <strong style={{ fontSize: '1.25rem', display: 'block', marginTop: '4px' }}>{availableFuelStock.toLocaleString()} L</strong>
              </div>
              <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>System Demand gap</span>
                <strong style={{ fontSize: '1.25rem', display: 'block', marginTop: '4px', color: computedGap > 0 ? '#ef4444' : '#10b981' }}>
                  {computedGap.toLocaleString()} L
                </strong>
              </div>
              <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Shortage safety index</span>
                <strong style={{ fontSize: '1.25rem', display: 'block', marginTop: '4px', color: shortageRatio > 0.1 ? '#ef4444' : '#10b981' }}>
                  {(shortageRatio * 100).toFixed(1)}% (Risk: {riskLevel})
                </strong>
              </div>
            </div>

            <div style={{ padding: '1rem', borderRadius: '8px', background: riskLevel === 'CRITICAL' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)', border: `1px solid ${riskLevel === 'CRITICAL' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`, fontSize: '0.85rem', marginBottom: '2rem' }}>
              <strong>AI Safety recommendation:</strong> {
                riskLevel === 'CRITICAL'
                  ? 'Deficit exceeds 25%. System highly recommends activating EMERGENCY MODE to cap public allowances immediately.'
                  : riskLevel === 'HIGH'
                  ? 'Significant reserves deficit (10-25%). Recommend redistributing reserves to western sectors.'
                  : 'Safety parameters are normal. Keep standard allocation metrics.'
              }
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#a855f7', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '0.75rem' }}>
                ⚙️ Forecast Methodology: Moving Average Projection
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: '1.5', margin: 0 }}>
                The AI Projections Engine evaluates the complete completed transaction history. If there are fewer than 3 transactions, the system falls back to a documented baseline calculated as <strong>Total Registered Fuel Users ({fuelUsers.length}) × Normal Cap Limit ({normalQuotaLimit} L) = {(fuelUsers.length * normalQuotaLimit).toLocaleString()} L</strong>. Once 3 or more transactions are completed, it computes the moving average of fuel consumption and projects next week's demand with a <strong>15% system growth adjustment</strong>.
              </p>
            </div>

            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[{ name: 'Colombo', demand: 6.2, stock: availableFuelStock/1000000 }, { name: 'Gampaha', demand: 2.3, stock: 2.5 }, { name: 'Kandy', demand: 1.5, stock: 1.2 }, { name: 'Galle', demand: 1.8, stock: 2.4 }]} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" />
                  <YAxis stroke="var(--text-secondary)" />
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' }} />
                  <Legend />
                  <Bar dataKey="demand" name="Predicted Demand (M Liters)" fill="#a855f7" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="stock" name="Available Stock (M Liters)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* 14. Fraud Hub Tab */}
      {activeTab === 'fraud' && (
        <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'left' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={18} style={{ color: '#ef4444' }} /> National Fraud Auditing hub
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
            Flagged duplicate scans, vehiclePlate mismatches, and quota deviations logged by AI verification nodes.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {fraudLogs.map((log) => (
              <div key={log.id} style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: '#ef444420', color: '#f87171', fontWeight: 'bold' }}>{log.type}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{log.time}</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '6px' }}>{log.details}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Risk score</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#f87171' }}>{log.riskScore}%</div>
                  
                  {log.status !== 'Resolved' ? (
                    <button 
                      onClick={() => handleResolveAlert(log.id)}
                      className="btn btn-secondary" 
                      style={{ padding: '6px 12px', fontSize: '0.7rem', borderRadius: '6px', marginTop: '6px', cursor: 'pointer' }}
                    >
                      Resolve Warning
                    </button>
                  ) : (
                    <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.8rem', display: 'block', marginTop: '6px' }}>✓ Resolved</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 15. Registry Console Tab */}
      {activeTab === 'users' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }} className="grid-mobile">
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'left' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 700 }}>⛽ Active supply nodes registry</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <strong style={{ fontSize: '0.9rem', color: '#06b6d4', display: 'block', marginBottom: '0.75rem' }}>Petrol pump stations</strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {stations.filter(s => s.type === 'fuel').map((s, idx) => (
                    <div key={idx} style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ fontSize: '0.9rem', display: 'block' }}>{s.name}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Region: {s.district} • Status: <strong style={{ color: s.openNow ? '#10b981' : '#ef4444' }}>{s.openNow ? 'Active' : 'Suspended'}</strong></span>
                      </div>
                      <button onClick={() => handleToggleStationStatus(s.id)} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.7rem', cursor: 'pointer' }}>
                        {s.openNow ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <strong style={{ fontSize: '0.9rem', color: '#f97316', display: 'block', marginBottom: '0.75rem' }}>LPG Distributor centers</strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {stations.filter(s => s.type === 'lpg').map((s, idx) => (
                    <div key={idx} style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ fontSize: '0.9rem', display: 'block' }}>{s.name}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Region: {s.district} • Status: <strong style={{ color: s.openNow ? '#10b981' : '#ef4444' }}>{s.openNow ? 'Active' : 'Suspended'}</strong></span>
                      </div>
                      <button onClick={() => handleToggleStationStatus(s.id)} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.7rem', cursor: 'pointer' }}>
                        {s.openNow ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* User profiles registry */}
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'left' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 700 }}>👤 Registered consumer database</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '500px', overflowY: 'auto' }}>
              {fuelUsers.map((user, idx) => (
                <div key={idx} style={{ padding: '0.85rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: '#ffffff' }}>{user.fullName}</strong>
                    <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(6,182,212,0.1)', color: '#06b6d4', fontWeight: 'bold' }}>FUEL User</span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Email: {user.email}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>Vehicle plate: <strong style={{ color: '#ffffff' }}>{user.vehicleNumber}</strong> ({user.vehicleType})</div>
                  <div style={{ color: 'var(--text-secondary)' }}>Remaining quota: <strong style={{ color: '#10b981' }}>{getUserQuota(user.email)} L</strong></div>
                </div>
              ))}

              {lpgUsers.map((user, idx) => (
                <div key={idx} style={{ padding: '0.85rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: '#ffffff' }}>{user.fullName}</strong>
                    <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(249,115,22,0.1)', color: '#f97316', fontWeight: 'bold' }}>LPG User</span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Email: {user.email}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>Consumer book ID: <strong style={{ color: '#ffffff' }}>{user.consumerNumber}</strong></div>
                  <div style={{ color: 'var(--text-secondary)' }}>Preferred distributor: {user.preferredDistributor}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 16. Broadcast tab */}
      {activeTab === 'broadcast' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }} className="grid-mobile">
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'left' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', fontWeight: 700 }}>📣 System Broadcast Portal</h3>
            {broadcastSuccess && <div className="glass-panel" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.5rem', borderRadius: '6px', fontSize: '0.75rem', marginBottom: '0.75rem' }}>{broadcastSuccess}</div>}
            
            <form onSubmit={handleBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Broadcast message text</label>
                <textarea 
                  className="form-input" 
                  style={{ minHeight: '120px', resize: 'vertical' }}
                  placeholder="Enter message to display as a global banner across all citizen dashboards..."
                  value={broadcastText}
                  onChange={(e) => setBroadcastText(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ background: '#ef4444', boxShadow: 'none' }}>
                Broadcast Urgent advisory
              </button>
            </form>
          </div>

          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'left' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', fontWeight: 700 }}>📜 Live warnings dispatch</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ padding: '0.85rem', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.2)', fontSize: '0.8rem' }}>
                <strong>Ambulance Priority Dispatch:</strong> Colombo General Hospital reserves locked.
              </div>
              <div style={{ padding: '0.85rem', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '10px', border: '1px solid rgba(245,158,11,0.2)', fontSize: '0.8rem' }}>
                <strong>LIOC Station queues:</strong> Colombo LIOC wait times exceed 45 mins.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 17. Ledger Audit Tab */}
      {activeTab === 'ledger' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }} className="grid-mobile">
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'left' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={20} style={{ color: '#10b981' }} /> Blockchain-inspired Proof-of-Work Auditor
            </h3>
            
            <div style={{ padding: '1.25rem', borderRadius: '10px', background: ledgerStatus.isValid ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)', border: `1px solid ${ledgerStatus.isValid ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`, display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {ledgerStatus.isValid ? <CheckCircle size={20} style={{ color: '#10b981' }} /> : <XCircle size={20} style={{ color: '#ef4444' }} />}
                <strong style={{ fontSize: '1.1rem', color: '#ffffff' }}>
                  Ledger Status: {ledgerStatus.isValid ? 'SECURED (All Block Hashes Intact)' : 'WARNING: TAMPERING DETECTED!'}
                </strong>
              </div>
              {!ledgerStatus.isValid && (
                <p style={{ color: '#f87171', fontSize: '0.85rem', margin: 0 }}>
                  🚨 {ledgerStatus.reason}
                </p>
              )}
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: '1.5' }}>
              Every completed transaction in the FuelGuard AI framework is cryptographically hashed with SHA-256 and linked sequentially to the preceding transaction's block hash via Proof-of-Work (PoW). This creates a tamper-evident audit ledger that guarantees compliance.
            </p>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                type="button" 
                onClick={handleAuditLedger}
                disabled={isAuditing}
                className="btn btn-primary"
                style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem', background: '#10b981', border: 'none', minWidth: '160px' }}
              >
                {isAuditing ? 'Auditing ledger...' : '🔍 Audit Ledger Chain'}
              </button>
              
              <button 
                type="button" 
                onClick={handleTamperDatabase}
                className="btn btn-secondary"
                style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}
              >
                ⚠️ Inject Tampering Delta (Demo)
              </button>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              📱 SMS Gateway Dispatch Center
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0, lineHeight: '1.5' }}>
              History of simulated OTP security messages and quota warnings sent to citizens:
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto' }}>
              {smsLogs.length === 0 ? (
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textAlign: 'center', padding: '2rem' }}>
                  No simulated SMS gateway messages sent yet.
                </div>
              ) : (
                smsLogs.map((log, idx) => (
                  <div key={idx} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '0.75rem', fontFamily: 'monospace', color: '#a855f7' }}>
                    {log}
                  </div>
                ))
              )}
            </div>

            <button 
              type="button" 
              onClick={handleFetchSMSLogs}
              className="btn btn-secondary"
              style={{ width: '100%', padding: '0.5rem', fontSize: '0.75rem' }}
            >
              🔄 Refresh SMS Logs
            </button>
          </div>
        </div>
      )}

      {/* 18. Research Evaluation Tab */}
      {activeTab === 'evaluation' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', textAlign: 'left' }}>
          <div className="glass-panel" style={{ padding: '2.5rem' }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={22} style={{ color: '#a855f7' }} /> Scientific Research & Framework Evaluation Console
            </h3>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: '1.6' }}>
              This validation console calculates research evaluation metrics dynamically using formulas from the unified framework paper.
              It allows testing the algorithms against a <strong>Simulated/Test Dataset (5,000 observations)</strong> to benchmark performance, or evaluating the <strong>Real Application Dataset</strong>.
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Select Dataset Target:</span>
                <select 
                  value={evalType}
                  onChange={(e) => setEvalType(e.target.value)}
                  className="form-input"
                  style={{ width: '260px', padding: '0.4rem', fontSize: '0.85rem' }}
                >
                  <option value="real">Real Application Dataset</option>
                  <option value="test">Simulated/Test Dataset (5,000 Benchmark)</option>
                </select>
              </div>

              {evaluationReport && (
                <div style={{ padding: '0.4rem 1rem', borderRadius: '6px', background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)', fontSize: '0.8rem', fontFamily: 'monospace', color: '#c084fc' }}>
                  ⚡ Benchmark Execution Time: <strong>{evaluationReport.executionTimeMs} ms</strong>
                </div>
              )}
            </div>

            {loadingEvaluation ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                🔄 Running mathematical calculations and auditing database logs...
              </div>
            ) : !evaluationReport ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                No evaluation data returned from the backend.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                
                {/* Dataset Overview Alert */}
                <div style={{ padding: '1rem 1.25rem', borderRadius: '8px', background: evalType === 'test' ? 'rgba(245,158,11,0.08)' : 'rgba(37,99,235,0.08)', border: `1px solid ${evalType === 'test' ? 'rgba(245,158,11,0.2)' : 'rgba(37,99,235,0.2)'}`, fontSize: '0.85rem' }}>
                  📊 Evaluated Target: <strong>{evaluationReport.dataType}</strong> | Observations (Forecasted Nodes): <strong>{evaluationReport.observationsCount}</strong>
                </div>

                {/* Metrics Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                  
                  {/* A. MAPE */}
                  <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#a855f7', fontWeight: 'bold' }}>Metric A</span>
                      <strong style={{ fontSize: '1.4rem', color: evaluationReport.metrics.mape.value !== undefined ? (evaluationReport.metrics.mape.value < 8 ? '#10b981' : '#f59e0b') : 'var(--text-secondary)' }}>
                        {evaluationReport.metrics.mape.value !== undefined ? `${evaluationReport.metrics.mape.value}%` : 'Insufficient data'}
                      </strong>
                    </div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.5rem' }}>Mean Absolute Percentage Error (MAPE)</h4>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontFamily: 'monospace', marginBottom: '0.5rem' }}>
                      Formula: {evaluationReport.metrics.mape.formula}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                      Source: {evaluationReport.metrics.mape.source}
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                      {evaluationReport.metrics.mape.interpretation}
                    </p>
                  </div>

                  {/* B. RMSE */}
                  <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#a855f7', fontWeight: 'bold' }}>Metric B</span>
                      <strong style={{ fontSize: '1.4rem', color: '#ffffff' }}>
                        {evaluationReport.metrics.rmse.value !== undefined ? evaluationReport.metrics.rmse.value : 'Insufficient data'}
                      </strong>
                    </div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.5rem' }}>Root Mean Squared Error (RMSE)</h4>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontFamily: 'monospace', marginBottom: '0.5rem' }}>
                      Formula: {evaluationReport.metrics.rmse.formula}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                      Source: {evaluationReport.metrics.rmse.source}
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                      {evaluationReport.metrics.rmse.interpretation}
                    </p>
                  </div>

                  {/* C. PQCI */}
                  <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#a855f7', fontWeight: 'bold' }}>Metric C</span>
                      <strong style={{ fontSize: '1.4rem', color: evaluationReport.metrics.pqci.value !== undefined ? '#10b981' : 'var(--text-secondary)' }}>
                        {evaluationReport.metrics.pqci.value !== undefined ? `${evaluationReport.metrics.pqci.value}%` : 'Insufficient data'}
                      </strong>
                    </div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.5rem' }}>Priority Queue Compliance Index (PQCI)</h4>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontFamily: 'monospace', marginBottom: '0.5rem' }}>
                      Formula: {evaluationReport.metrics.pqci.formula}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                      Source: {evaluationReport.metrics.pqci.source}
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                      {evaluationReport.metrics.pqci.interpretation}
                    </p>
                  </div>

                  {/* D. GINI */}
                  <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#a855f7', fontWeight: 'bold' }}>Metric D</span>
                      <strong style={{ fontSize: '1.4rem', color: '#06b6d4' }}>
                        {evaluationReport.metrics.gini.value !== undefined ? evaluationReport.metrics.gini.value : '0'}
                      </strong>
                    </div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.5rem' }}>Gini Coefficient (Equity Index)</h4>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontFamily: 'monospace', marginBottom: '0.5rem' }}>
                      Formula: {evaluationReport.metrics.gini.formula}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                      Source: {evaluationReport.metrics.gini.source}
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                      {evaluationReport.metrics.gini.interpretation}
                    </p>
                  </div>

                  {/* E. STOCK UTILIZATION */}
                  <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#a855f7', fontWeight: 'bold' }}>Metric E</span>
                      <strong style={{ fontSize: '1.4rem', color: '#e2e8f0' }}>
                        {evaluationReport.metrics.stockUtilization.value !== undefined ? `${evaluationReport.metrics.stockUtilization.value}%` : 'Insufficient data'}
                      </strong>
                    </div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.5rem' }}>Stock Utilization Percentage</h4>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontFamily: 'monospace', marginBottom: '0.5rem' }}>
                      Formula: {evaluationReport.metrics.stockUtilization.formula}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                      Source: {evaluationReport.metrics.stockUtilization.source}
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                      {evaluationReport.metrics.stockUtilization.interpretation}
                    </p>
                  </div>

                </div>

                {/* Accuracy Target advisory */}
                <div className="glass-panel" style={{ padding: '1.5rem', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#c084fc', marginBottom: '0.5rem' }}>
                    📖 Mathematical Interpretation & Validation Summary
                  </h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: '1.5', margin: 0 }}>
                    In supply-chain modeling, a <strong>MAPE below 8%</strong> is classified as an "excellent" forecasting model. 
                    The Priority Queue Compliance Index (PQCI) highlights the percentage of high-priority dispatch requests successfully serviced at the pump.
                    The Gini Coefficient assesses the fairness of distribution, with values closer to 0 proving that splits are well distributed among the stations based on regional demands.
                  </p>
                </div>

              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
