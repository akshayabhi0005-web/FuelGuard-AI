import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';

// Layouts
import FuelLayout from './layouts/FuelLayout';
import LpgLayout from './layouts/LpgLayout';

// Pages
import ServiceSelection from './pages/ServiceSelection';
import NotFound from './pages/NotFound';

// Unified Gateways & Standalones
import Login from './pages/Login';
import Register from './pages/Register';
import About from './pages/About';
import Contact from './pages/Contact';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

// Fuel Pages
import FuelLanding from './pages/fuel/FuelLanding';
import FuelLogin from './pages/fuel/FuelLogin';
import FuelRegister from './pages/fuel/FuelRegister';
import FuelDashboard from './pages/fuel/FuelDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import PumpDashboard from './pages/pump/PumpDashboard';

// LPG Pages
import LpgLanding from './pages/lpg/LpgLanding';
import LpgLogin from './pages/lpg/LpgLogin';
import LpgRegister from './pages/lpg/LpgRegister';
import LpgDashboard from './pages/lpg/LpgDashboard';
import DistributorDashboard from './pages/distributor/DistributorDashboard';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* First Screen: Service Selection */}
          <Route path="/" element={<ServiceSelection />} />

          {/* Standalone Gateway pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Standalone informational & settings pages */}
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />

          {/* Fuel Module Routes */}
          <Route path="/fuel" element={<FuelLayout />}>
            <Route index element={<FuelLanding />} />
            <Route path="login" element={<FuelLogin />} />
            <Route path="register" element={<FuelRegister />} />
            <Route path="dashboard" element={<FuelDashboard />} />
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="pump" element={<PumpDashboard />} />
          </Route>

          {/* LPG Module Routes */}
          <Route path="/lpg" element={<LpgLayout />}>
            <Route index element={<LpgLanding />} />
            <Route path="login" element={<LpgLogin />} />
            <Route path="register" element={<LpgRegister />} />
            <Route path="dashboard" element={<LpgDashboard />} />
            <Route path="distributor" element={<DistributorDashboard />} />
          </Route>

          {/* Standalone Operator Dashboards at root-level */}
          <Route path="/admin" element={<FuelLayout />}>
            <Route index element={<AdminDashboard />} />
          </Route>
          
          <Route path="/pump" element={<FuelLayout />}>
            <Route index element={<PumpDashboard />} />
          </Route>
          
          <Route path="/distributor" element={<LpgLayout />}>
            <Route index element={<DistributorDashboard />} />
          </Route>

          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
