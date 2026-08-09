import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppContext } from '../../context/AppContext';
import { Fuel, ClipboardCheck, ArrowRight, ShieldCheck } from 'lucide-react';

const FuelRegister = () => {
  const { registerFuelUser } = useContext(AppContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    vehicleNumber: '',
    vehicleType: 'Car',
    district: '',
    state: '',
    citizenId: '',
    agreeToTerms: false
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const vehicleTypes = ['Car', 'Motorcycle', 'Three Wheeler', 'Dual Purpose (Van/SUV)', 'Heavy Vehicle (Truck/Bus)'];
  const districts = ['Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Galle', 'Matara', 'Jaffna', 'Kurunegala', 'Anuradhapura'];
  const states = ['Western', 'Central', 'Southern', 'Northern', 'North Western', 'North Central', 'Sabaragamuwa'];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validations
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!formData.agreeToTerms) {
      setError('You must agree to the Terms of Service & Privacy Policy.');
      return;
    }

    setLoading(true);

    const res = await registerFuelUser({
      email: formData.email,
      password: formData.password,
      fullName: formData.fullName,
      phone: formData.phone,
      vehicleNumber: formData.vehicleNumber.toUpperCase(),
      vehicleType: formData.vehicleType,
      district: formData.district,
      state: formData.state,
      citizenId: formData.citizenId
    });

    setLoading(false);

    if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        navigate('/fuel/login');
      }, 1500);
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
        style={{ width: '100%', maxWidth: '650px', padding: '2.5rem', border: '1px solid rgba(6, 182, 212, 0.25)', boxShadow: '0 8px 32px 0 rgba(6, 182, 212, 0.1)' }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', color: '#ffffff', marginBottom: '1rem' }}>
            <Fuel size={24} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ffffff' }}>Vehicle Quota Registration</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Register your vehicle details to qualify for AI-calculated fuel quotas.
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="glass-panel" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', padding: '0.75rem 1rem', borderRadius: '10px', color: '#f87171', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            <span>{error}</span>
          </div>
        )}

        {/* Success notification */}
        {success && (
          <div className="glass-panel" style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)', padding: '1rem', borderRadius: '10px', color: '#34d399', fontSize: '0.9rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
            <ShieldCheck size={20} />
            <span>Registration Successful! Redirecting to login...</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="grid-mobile">
            {/* Column 1 */}
            <div>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input 
                  type="text" 
                  name="fullName"
                  className="form-input" 
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="e.g. John Doe"
                  required
                  disabled={loading || success}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input 
                  type="tel" 
                  name="phone"
                  className="form-input" 
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g. 0771234567"
                  required
                  disabled={loading || success}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input 
                  type="email" 
                  name="email"
                  className="form-input" 
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. john@example.com"
                  required
                  disabled={loading || success}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input 
                  type="password" 
                  name="password"
                  className="form-input" 
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  disabled={loading || success}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input 
                  type="password" 
                  name="confirmPassword"
                  className="form-input" 
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  disabled={loading || success}
                />
              </div>
            </div>

            {/* Column 2 */}
            <div>
              <div className="form-group">
                <label className="form-label">Vehicle Number</label>
                <input 
                  type="text" 
                  name="vehicleNumber"
                  className="form-input" 
                  value={formData.vehicleNumber}
                  onChange={handleChange}
                  placeholder="e.g. WP-CAD-8930"
                  required
                  disabled={loading || success}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Vehicle Type</label>
                <select 
                  name="vehicleType"
                  className="form-select"
                  value={formData.vehicleType}
                  onChange={handleChange}
                  disabled={loading || success}
                >
                  {vehicleTypes.map((type, i) => (
                    <option key={i} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">State / Province</label>
                <select 
                  name="state"
                  className="form-select"
                  value={formData.state}
                  onChange={handleChange}
                  required
                  disabled={loading || success}
                >
                  <option value="">Select State</option>
                  {states.map((st, i) => (
                    <option key={i} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">District</label>
                <select 
                  name="district"
                  className="form-select"
                  value={formData.district}
                  onChange={handleChange}
                  required
                  disabled={loading || success}
                >
                  <option value="">Select District</option>
                  {districts.map((dist, i) => (
                    <option key={i} value={dist}>{dist}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Citizen ID / Passport (Optional)</label>
                <input 
                  type="text" 
                  name="citizenId"
                  className="form-input" 
                  value={formData.citizenId}
                  onChange={handleChange}
                  placeholder="e.g. 199823901A"
                  disabled={loading || success}
                />
              </div>
            </div>
          </div>

          {/* Terms checkbox */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginTop: '1rem', marginBottom: '1.5rem', textAlign: 'left' }}>
            <input 
              type="checkbox" 
              name="agreeToTerms"
              id="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={handleChange}
              style={{ marginTop: '3px', cursor: 'pointer' }}
              disabled={loading || success}
            />
            <label htmlFor="agreeToTerms" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              I agree to the FuelGuard AI Terms of Service, consent to vehicle verification checks, and agree to the weekly quota policies.
            </label>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '0.85rem' }}
            disabled={loading || success}
          >
            {loading ? (
              <span className="skeleton" style={{ width: '60px', height: '18px', display: 'block', margin: '0 auto' }}></span>
            ) : (
              <>
                Register Vehicle & Citizen <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '1.5rem' }}>
          Already have an account?{' '}
          <Link to="/fuel/login" style={{ color: '#06b6d4', textDecoration: 'none', fontWeight: 600 }}>
            Login here
          </Link>
        </p>
      </motion.div>

      <style>{`
        @media (max-width: 600px) {
          .grid-mobile {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default FuelRegister;
