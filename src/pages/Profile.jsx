import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { User, Mail, Phone, ShieldCheck, Car, Key, Settings as SettingsIcon, Plus, Download, Trash2, Camera } from 'lucide-react';
import Navbar from '../components/Navbar';

const Profile = () => {
  const { fuelUser, lpgUser, updateUserProfile } = useContext(AppContext);
  const navigate = useNavigate();

  // Pick whichever user session is active (defaulting to fuel user if none)
  const isLpg = !!lpgUser;
  const activeUser = lpgUser || fuelUser || {
    fullName: 'Guest User',
    email: 'guest@fuelguard.ai',
    phone: '9876543210',
    vehicleNumber: 'WP-CAD-8930',
    vehicleType: 'Car',
    address: '123 Main St, Colombo',
    consumerNumber: 'LPG-892301-A',
    preferredDistributor: 'Super Gas Distributors'
  };

  const [formData, setFormData] = useState({
    fullName: activeUser.fullName || '',
    email: activeUser.email || '',
    phone: activeUser.phone || '',
    vehicleNumber: activeUser.vehicleNumber || '',
    vehicleType: activeUser.vehicleType || 'Car',
    address: activeUser.address || '',
    consumerNumber: activeUser.consumerNumber || '',
    preferredDistributor: activeUser.preferredDistributor || ''
  });

  const [passwordData, setPasswordData] = useState({ old: '', new: '' });
  const [successMsg, setSuccessMsg] = useState('');
  
  // Custom states for photo, secondary vehicles, receipts
  const [avatar, setAvatar] = useState('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80');
  const [secondaryVehicles, setSecondaryVehicles] = useState([
    { id: 1, plate: 'WP-CAD-1032', type: 'Bike' }
  ]);
  const [newPlate, setNewPlate] = useState('');
  const [newType, setNewType] = useState('Bike');

  const [bookingHistory, setBookingHistory] = useState([
    { id: 'TXN-90231', date: '2026-08-01', amount: '15.0 L', station: 'Ceypetco - Town Hall', price: 'Rs. 5,550' },
    { id: 'TXN-88120', date: '2026-07-24', amount: '12.5 L', station: 'LIOC - Colombo 03', price: 'Rs. 4,625' }
  ]);

  const handleAddVehicle = (e) => {
    e.preventDefault();
    if (!newPlate.trim()) return;
    setSecondaryVehicles(prev => [...prev, { id: Date.now(), plate: newPlate.toUpperCase(), type: newType }]);
    setNewPlate('');
    setSuccessMsg('Secondary vehicle registered successfully!');
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  const handleRemoveVehicle = (id) => {
    setSecondaryVehicles(prev => prev.filter(v => v.id !== id));
  };

  const handleAvatarChange = () => {
    const nextUrl = prompt('Enter image URL or select mock profile image path:', 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80');
    if (nextUrl) {
      setAvatar(nextUrl);
      setSuccessMsg('Profile photo updated successfully!');
      setTimeout(() => setSuccessMsg(''), 2500);
    }
  };

  // Sync state if activeUser hydrates
  useEffect(() => {
    if (fuelUser || lpgUser) {
      const u = lpgUser || fuelUser;
      setFormData({
        fullName: u.fullName || '',
        email: u.email || '',
        phone: u.phone || '',
        vehicleNumber: u.vehicleNumber || '',
        vehicleType: u.vehicleType || 'Car',
        address: u.address || '',
        consumerNumber: u.consumerNumber || '',
        preferredDistributor: u.preferredDistributor || ''
      });
    }
  }, [fuelUser, lpgUser]);

  const handleSubmitProfile = (e) => {
    e.preventDefault();
    setSuccessMsg('');
    const module = isLpg ? 'lpg' : 'fuel';
    
    updateUserProfile(module, formData);
    setSuccessMsg('Profile changes saved successfully!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    if (!passwordData.new.trim()) return;
    alert('Security verification passed. Password updated successfully!');
    setPasswordData({ old: '', new: '' });
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
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: '#06b6d4', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={14} /> Security Vault
              </span>
              <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Account & Profile Details</h1>
            </div>
            <button onClick={() => navigate('/settings')} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <SettingsIcon size={14} /> Settings
            </button>
          </div>

          {successMsg && (
            <div className="glass-panel" style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)', padding: '1rem', borderRadius: '12px', color: '#34d399', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
              <span>✓ {successMsg}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }} className="grid-mobile">
            {/* Left: General Profile Form */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1.5rem' }}>
                <div style={{ position: 'relative', width: '80px', height: '80px', flexShrink: 0 }}>
                  <img src={avatar} alt="Avatar" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #06b6d4' }} />
                  <button 
                    type="button"
                    onClick={handleAvatarChange}
                    style={{ position: 'absolute', bottom: 0, right: 0, background: '#06b6d4', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', cursor: 'pointer' }}
                  >
                    <Camera size={14} />
                  </button>
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Profile Photo</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Update photo URL string instantly</span>
                </div>
              </div>

              <form onSubmit={handleSubmitProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formData.fullName} 
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    value={formData.email} 
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Mobile</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formData.phone} 
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    required
                  />
                </div>

                {isLpg ? (
                  <>
                    <div className="form-group">
                      <label className="form-label">Utility Billing Address</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={formData.address} 
                        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Preferred Distributor</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={formData.preferredDistributor} 
                        onChange={(e) => setFormData(prev => ({ ...prev, preferredDistributor: e.target.value }))}
                      />
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">Vehicle Plate Number</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={formData.vehicleNumber} 
                        onChange={(e) => setFormData(prev => ({ ...prev, vehicleNumber: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Vehicle Type</label>
                      <select 
                        className="form-select" 
                        value={formData.vehicleType} 
                        onChange={(e) => setFormData(prev => ({ ...prev, vehicleType: e.target.value }))}
                      >
                        <option value="Car">Car</option>
                        <option value="Bike">Motorcycle</option>
                        <option value="ThreeWheeler">Three Wheeler</option>
                        <option value="Van">Van / Lorry</option>
                      </select>
                    </div>
                  </div>
                )}

                <button type="submit" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #2563eb, #06b6d4)', marginTop: '0.5rem' }}>
                  Save Profile Details
                </button>
              </form>
            </div>

            {/* Right: Security Settings */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Password update form */}
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1.25rem' }}>
                  <Key size={16} style={{ color: '#06b6d4' }} /> Change Password
                </h3>
                <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Old Password</label>
                    <input 
                      type="password" 
                      className="form-input" 
                      value={passwordData.old}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, old: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">New Password</label>
                    <input 
                      type="password" 
                      className="form-input" 
                      value={passwordData.new}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, new: e.target.value }))}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-secondary" style={{ width: '100%' }}>
                    Update Password Key
                  </button>
                </form>
              </div>

              {/* Status info */}
              <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.01)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Verify Signature</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  Your account is secured with end-to-end identity verification. Quota tokens are encrypted using your unique vehicle chassis signature. Keep your contact phone active to receive verification codes at pump terminal handoffs.
                </p>
              </div>

              {/* Manage Multiple Vehicles panel */}
              <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'left' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1.25rem' }}>
                  <Car size={16} style={{ color: '#06b6d4' }} /> Register Secondary Vehicles
                </h3>
                <form onSubmit={handleAddVehicle} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Plate (e.g. WP-CA-1029)" 
                    value={newPlate} 
                    onChange={(e) => setNewPlate(e.target.value)} 
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }} 
                  />
                  <select 
                    className="form-select" 
                    value={newType} 
                    onChange={(e) => setNewType(e.target.value)} 
                    style={{ fontSize: '0.8rem', width: '90px' }}
                  >
                    <option value="Car">Car</option>
                    <option value="Bike">Bike</option>
                  </select>
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.4rem 0.75rem' }}>
                    <Plus size={14} /> Add
                  </button>
                </form>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {secondaryVehicles.map(v => (
                    <div key={v.id} style={{ padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                      <span><strong>{v.plate}</strong> ({v.type})</span>
                      <button 
                        onClick={() => handleRemoveVehicle(v.id)} 
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Booking History & Receipt Downloads panel */}
          <div className="glass-panel" style={{ padding: '2rem', marginTop: '2.5rem', textAlign: 'left' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Download size={18} style={{ color: '#06b6d4' }} /> Booking Ledger & Cryptographic Receipts
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {bookingHistory.map((txn, i) => (
                <div key={i} style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <strong style={{ fontSize: '0.9rem', display: 'block' }}>Ref ID: {txn.id}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Station: {txn.station} • Date: {txn.date}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <strong style={{ fontSize: '0.9rem', color: '#06b6d4', display: 'block' }}>{txn.amount}</strong>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{txn.price}</span>
                    </div>
                    <button 
                      onClick={() => alert(`Receipt downloaded for transaction reference ID: ${txn.id}`)}
                      className="btn btn-secondary" 
                      style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Download size={12} /> Receipt
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;
