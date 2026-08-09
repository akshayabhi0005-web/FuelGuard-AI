import React from 'react';

export const FuelDashboardMockup = () => {
  return (
    <div className="glass-panel" style={{ padding: '1.5rem', border: '1px solid rgba(6, 182, 212, 0.25)', boxShadow: '0 8px 32px 0 rgba(6, 182, 212, 0.1)' }}>
      {/* Mock Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#06b6d4' }}></div>
          <span style={{ fontSize: '0.85rem', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase', color: '#06b6d4' }}>FuelGuard Terminal</span>
        </div>
        <div style={{ background: 'rgba(6, 182, 212, 0.1)', padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem', color: '#06b6d4', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
          SECURE CONNECTION
        </div>
      </div>

      {/* Mock Analytics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Remaining Quota</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#06b6d4' }}>35.0 L</div>
          <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '5px' }}>
            <div style={{ width: '70%', height: '100%', background: '#06b6d4', borderRadius: '2px' }}></div>
          </div>
        </div>
        
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Demand Index</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2563eb' }}>High (8.7)</div>
          <div style={{ fontSize: '0.65rem', color: '#10b981', marginTop: '5px' }}>↑ Normal Supply</div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Next Reset</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#e2e8f0' }}>4 Days</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '5px' }}>Sunday 12:00 AM</div>
        </div>
      </div>

      {/* Mock Visual Graph/QR display */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '1rem' }}>
        {/* Mock Chart */}
        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '140px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>AI Forecasted Demand vs Real Usage</span>
          {/* Simple SVG Graph */}
          <svg viewBox="0 0 100 40" style={{ width: '100%', height: '70px' }}>
            {/* Grid lines */}
            <line x1="0" y1="10" x2="100" y2="10" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
            <line x1="0" y1="20" x2="100" y2="20" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
            <line x1="0" y1="30" x2="100" y2="30" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
            {/* Area Path */}
            <path d="M 0 35 Q 20 20 40 28 T 80 10 T 100 5 L 100 40 L 0 40 Z" fill="rgba(6, 182, 212, 0.1)" />
            {/* Chart Line */}
            <path d="M 0 35 Q 20 20 40 28 T 80 10 T 100 5" fill="none" stroke="#06b6d4" strokeWidth="1.5" />
            {/* Realized Line (dashed) */}
            <path d="M 0 32 Q 25 24 50 18 T 100 12" fill="none" stroke="#2563eb" strokeWidth="1" strokeDasharray="2" />
          </svg>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: 'var(--text-secondary)' }}>
            <span>Mon</span>
            <span>Wed</span>
            <span>Fri</span>
            <span>Sun</span>
          </div>
        </div>

        {/* Mock QR */}
        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ width: '60px', height: '60px', background: '#ffffff', borderRadius: '8px', padding: '4px', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }} className="pulse-indicator">
            {/* Mock QR lines */}
            <div style={{ width: '100%', height: '100%', border: '4px solid #0f172a', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2px' }}>
              <div style={{ background: '#0f172a' }}></div>
              <div></div>
              <div style={{ background: '#0f172a' }}></div>
              <div style={{ background: '#0f172a' }}></div>
              <div></div>
              <div style={{ background: '#0f172a' }}></div>
              <div></div>
              <div></div>
              <div style={{ background: '#0f172a' }}></div>
              <div></div>
              <div style={{ background: '#0f172a' }}></div>
              <div style={{ background: '#0f172a' }}></div>
              <div style={{ background: '#0f172a' }}></div>
              <div style={{ background: '#0f172a' }}></div>
              <div></div>
              <div style={{ background: '#0f172a' }}></div>
            </div>
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Active Fuel QR</span>
          <span style={{ fontSize: '0.6rem', color: '#10b981' }}>Expires in 9m</span>
        </div>
      </div>
    </div>
  );
};

export const LpgDashboardMockup = () => {
  return (
    <div className="glass-panel" style={{ padding: '1.5rem', border: '1px solid rgba(249, 115, 22, 0.25)', boxShadow: '0 8px 32px 0 rgba(249, 115, 22, 0.1)' }}>
      {/* Mock Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f97316' }}></div>
          <span style={{ fontSize: '0.85rem', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase', color: '#f97316' }}>LPG Guard Portal</span>
        </div>
        <div style={{ background: 'rgba(249, 115, 22, 0.1)', padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem', color: '#f97316', border: '1px solid rgba(249, 115, 22, 0.2)' }}>
          SECURE ENCRYPTED
        </div>
      </div>

      {/* Mock Tracker */}
      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Cylinder Delivery Tracking</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#f97316' }}>In Transit</span>
        </div>
        
        {/* Progress Bar steps */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', padding: '0 10px' }}>
          <div style={{ position: 'absolute', top: '13px', left: '10px', right: '10px', height: '3px', background: 'rgba(255,255,255,0.1)', zIndex: 0 }}>
            <div style={{ width: '66%', height: '100%', background: 'linear-gradient(90deg, #f97316, #a855f7)' }}></div>
          </div>
          
          {[
            { step: 'Booked', active: true },
            { step: 'Assigned', active: true },
            { step: 'In Transit', active: true, pulse: true },
            { step: 'Delivered', active: false }
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
              <div 
                className={item.pulse ? 'pulse-indicator' : ''}
                style={{ 
                  width: '28px', 
                  height: '28px', 
                  borderRadius: '50%', 
                  background: item.active ? 'linear-gradient(135deg, #f97316, #a855f7)' : '#334155', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  fontSize: '0.65rem',
                  fontWeight: 'bold',
                  color: '#ffffff',
                  border: '3px solid #0f172a'
                }}
              >
                {i + 1}
              </div>
              <span style={{ fontSize: '0.6rem', color: item.active ? '#f97316' : 'var(--text-secondary)', marginTop: '4px' }}>{item.step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Booking Status Card */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Next Booking Opens</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#e2e8f0', marginTop: '3px' }}>Sep 02, 2026</div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Cycle Limit: 21 Days</div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Registered Distributor</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#a855f7', marginTop: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Gas Point Corp</div>
          <div style={{ fontSize: '0.6rem', color: '#f97316' }}>★ 4.8 Rating</div>
        </div>
      </div>
    </div>
  );
};
