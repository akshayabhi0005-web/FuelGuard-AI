import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, BrainCircuit, QrCode, Wallet, Gauge, 
  Building2, LineChart, AlertTriangle, BellRing, ArrowRight,
  TrendingUp, CheckCircle, HelpCircle, UserCheck
} from 'lucide-react';
import { FuelDashboardMockup } from '../../components/DashboardMockup';

const FuelLanding = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
  };

  const features = [
    { icon: <BrainCircuit size={24} />, title: "AI Demand Forecasting", desc: "Machine learning algorithms analyze seasonal trends, holiday peaks, and supply variables to predict regional demand index." },
    { icon: <ShieldCheck size={24} />, title: "Emergency Fuel Allocation", desc: "Automated routing and higher quota provisioning for ambulance services, fire trucks, public transit, and emergency responders." },
    { icon: <QrCode size={24} />, title: "QR Verification", desc: "Encrypted, single-use, time-bound QR codes generated instantly for contact-free authentication at the dispensing pump." },
    { icon: <Wallet size={24} />, title: "Fuel Quota Wallet", desc: "Track remaining allowance, view transaction log, and receive notifications about upcoming resets and quota updates." },
    { icon: <Gauge size={24} />, title: "Petrol Pump Dashboard", desc: "Allows pump station agents to log transactions, inspect citizen details, scan QR codes, and monitor local inventory." },
    { icon: <Building2 size={24} />, title: "Government Dashboard", desc: "Provides high-level analytical tools for regulators to inspect national fuel reserves, detect shortages, and adjust allocations." },
    { icon: <LineChart size={24} />, title: "Live Analytics", desc: "Real-time graphs and supply chain visualization charts showing consumer fills, fuel reserves, and regional demands." },
    { icon: <AlertTriangle size={24} />, title: "Fraud Detection", desc: "AI flags double-fills, license plate mismatch, abnormal frequencies, or suspicious transactions instantly." },
    { icon: <BellRing size={24} />, title: "Notifications", desc: "Receive immediate updates via SMS, push notifications, and email about local pump supply statuses and quota resets." }
  ];

  const faqs = [
    { q: "How is my weekly fuel quota calculated?", a: "Your quota is determined using vehicle type (e.g. Car vs Motorcycle), usage class (commercial vs private), and real-time regional fuel availability index computed by our AI model." },
    { q: "Can I transfer my quota to another person?", a: "No. Quotas are tied strictly to the vehicle registration number and verified citizen ID to prevent black market hoarding." },
    { q: "What should I do in case of an emergency?", a: "Registered emergency service vehicles receive automatic unlimited or high-priority quotas. Citizens with medical emergencies can apply for temporary extensions through the portal." },
    { q: "How does the pump verify my transaction?", a: "You generate a QR code on your dashboard which is scanned by the pump operator. Once authorized, fuel is pumped, and the transaction is recorded on the blockchain ledger." }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ paddingBottom: '4rem' }}
    >
      {/* Hero Section */}
      <section style={{ padding: '6rem 0 4rem', textAlign: 'center', position: 'relative' }}>
        <div className="container" style={{ maxWidth: '1000px' }}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(6, 182, 212, 0.1)', padding: '6px 16px', borderRadius: '30px', marginBottom: '1.5rem', border: '1px solid rgba(6, 182, 212, 0.2)', color: '#06b6d4' }}>
              <TrendingUp size={14} />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px' }}>Next-Gen Fuel Allocator</span>
            </div>

            <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: '1.5rem', background: 'linear-gradient(135deg, #ffffff 40%, #06b6d4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              FuelGuard AI - Fuel Management
            </h1>
            <p style={{ fontSize: 'clamp(1.1rem, 2vw, 1.4rem)', color: 'var(--text-secondary)', maxWidth: '800px', margin: '0 auto 2.5rem', lineHeight: '1.6' }}>
              AI-powered intelligent fuel allocation and emergency management system. Secure and optimize resources during supply shortages.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
              <Link to="/fuel/login" className="btn btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.05rem' }}>
                Access Portal <ArrowRight size={18} />
              </Link>
              <Link to="/fuel/register" className="btn btn-secondary" style={{ padding: '1rem 2.5rem', fontSize: '1.05rem' }}>
                Register Vehicle
              </Link>
              <button 
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} 
                className="btn btn-secondary" 
                style={{ padding: '1rem 2.5rem', fontSize: '1.05rem' }}
              >
                Learn More
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Interactive Mockup Preview (Screenshots) Section */}
      <section style={{ padding: '2rem 0' }}>
        <div className="container">
          <div className="glass-panel" style={{ padding: '2rem', background: 'rgba(15, 23, 42, 0.3)', border: '1px solid rgba(255,255,255,0.05)', maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', color: '#06b6d4', letterSpacing: '1.5px', fontWeight: 700 }}>Live Dashboard Preview</span>
              <h2 style={{ fontSize: '1.75rem', marginTop: '0.5rem' }}>Familiarize with the Portal</h2>
            </div>
            <FuelDashboardMockup />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" style={{ padding: '5rem 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 700, marginBottom: '1rem' }}>Key Platform Features</h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>Our AI-driven backend utilizes state-of-the-art predictive analytics to optimize distribution channels and guarantee allocation.</p>
          </div>

          <motion.div 
            className="grid-3"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {features.map((feat, index) => (
              <motion.div 
                key={index}
                variants={itemVariants}
                className="glass-card"
                style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                  {feat.icon}
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>{feat.title}</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{feat.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it Works Section */}
      <section style={{ padding: '5rem 0', background: 'rgba(15, 23, 42, 0.2)', borderY: '1px solid rgba(255,255,255,0.03)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 700 }}>How It Works</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Get fuel in three simple steps, bypassing tedious lines and manual approvals.</p>
          </div>

          <div className="grid-3">
            {[
              { step: "01", title: "Register Account", desc: "Input your personal, vehicle registration number, and state details. Verify your contact number." },
              { step: "02", title: "View Weekly Quota", desc: "Our AI computes your fuel allocation balance based on regional availability indices." },
              { step: "03", title: "Scan & Dispense", desc: "Present your secure dashboard QR code to the station operator to authorize and pump fuel." }
            ].map((stepObj, i) => (
              <div key={i} className="glass-panel" style={{ padding: '2rem', position: 'relative' }}>
                <span style={{ fontSize: '4rem', fontWeight: 800, color: 'rgba(6, 182, 212, 0.1)', position: 'absolute', top: '10px', right: '20px', fontFamily: 'var(--font-heading)' }}>
                  {stepObj.step}
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', marginTop: '1.5rem', color: '#ffffff' }}>{stepObj.title}</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{stepObj.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section style={{ padding: '5rem 0' }}>
        <div className="container">
          <div className="grid-2" style={{ alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '2.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Benefits of Smart Allocation</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {[
                  "No more endless queues - predictable fueling schedules",
                  "Eliminate fuel hoarding and unauthorized black market reselling",
                  "Guarantee emergency fuel for ambulance services and fire brigades",
                  "Real-time analytical graphs for municipal fuel budgeting",
                  "Secure verified citizen authentication via dynamic QR technology"
                ].map((benefit, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <CheckCircle size={20} style={{ color: '#06b6d4', flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ color: '#e2e8f0', fontSize: '0.95rem' }}>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="glass-panel" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(6,182,212,0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#06b6d4' }}>
                  <UserCheck size={22} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Zero Waste Logistics</h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Powered by AI Forecasting</span>
                </div>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                By aligning regional allocations with consumer demands, FuelGuard prevents stations from going completely dry while others remain idle. Real-time updates help refilling bowsers steer towards high-priority destinations.
              </p>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px', borderLeft: '3px solid #06b6d4', fontSize: '0.8rem', color: '#e2e8f0' }}>
                "Average queue wait times reduced from 4.5 hours to less than 15 minutes in pilot sectors."
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ padding: '5rem 0', background: 'rgba(15, 23, 42, 0.1)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 700 }}>Citizen & Operator Feedback</h2>
          </div>
          <div className="grid-3">
            {[
              { quote: "Generating my QR takes 2 seconds on my phone. Pumping station scanned it and I was on my way. Simple, clean, and highly secure.", author: "Amrit Sandhu", role: "Daily Commuter" },
              { quote: "Before FuelGuard, our station faced massive traffic control problems and hoarding. The AI demand predictions tell us exactly when to request bowser refills.", author: "Sunil Rajapakse", role: "Pump Station Owner" },
              { quote: "During crisis times, routing fuel to emergency responders was a administrative nightmare. Now emergency vehicles get automatic dispatch verification.", author: "Dr. K. Silva", role: "Healthcare Coordinator" }
            ].map((testi, i) => (
              <div key={i} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid rgba(255,255,255,0.04)' }}>
                <p style={{ fontSize: '0.95rem', fontStyle: 'italic', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>"{testi.quote}"</p>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#06b6d4' }}>{testi.author}</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{testi.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section style={{ padding: '5rem 0' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <HelpCircle size={28} style={{ color: '#06b6d4' }} /> Frequently Asked Questions
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {faqs.map((faq, i) => (
              <div key={i} className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#ffffff' }}>{faq.q}</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '4rem', marginTop: '4rem' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>FuelGuard <span style={{ color: '#06b6d4' }}>AI</span></span>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>AI-Powered Smart Fuel & LPG Management Platform</p>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            © 2026 FuelGuard AI. All rights reserved. Secured Government Ledger System.
          </div>
        </div>
      </footer>
    </motion.div>
  );
};

export default FuelLanding;
