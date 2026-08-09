import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

const LpgLayout = () => {
  return (
    <div className="theme-lpg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-color)', transition: 'background-color 0.4s ease' }}>
      {/* Background Particles */}
      <div className="particles-bg">
        <div className="particle" style={{ width: '30vw', height: '30vw', top: '-10%', left: '10%', background: 'radial-gradient(circle, rgba(249, 115, 22, 0.15) 0%, transparent 70%)' }}></div>
        <div className="particle" style={{ width: '40vw', height: '40vw', bottom: '-10%', right: '5%', background: 'radial-gradient(circle, rgba(168, 85, 247, 0.12) 0%, transparent 70%)' }}></div>
      </div>

      {/* Unified Navbar */}
      <Navbar />

      {/* Nested Route Pages */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', zIndex: 1 }}>
        <Outlet />
      </main>
    </div>
  );
};

export default LpgLayout;
