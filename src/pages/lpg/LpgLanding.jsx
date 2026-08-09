import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Flame, Calendar, RotateCcw, MapPin, Truck, 
  Layers, ShieldAlert, Cpu, ShoppingBag, ArrowRight,
  TrendingUp, CheckCircle, HelpCircle, Activity
} from 'lucide-react';
import { LpgDashboardMockup } from '../../components/DashboardMockup';

const LpgLanding = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
  };

  const features = [
    { icon: <ShoppingBag size={24} />, title: "Smart LPG Booking", desc: "Automated booking system checks safety windows and schedules refills instantly with one click." },
    { icon: <Layers size={24} />, title: "Cylinder Tracking", desc: "Track cylinder serial numbers to check tare weight, cylinder age, and safety test certifications." },
    { icon: <Activity size={24} />, title: "Distributor Dashboard", desc: "Enables gas distributors to manage stock, dispatch delivery trucks, and verify customer bookings." },
    { icon: <Cpu size={24} />, title: "AI Demand Prediction", desc: "Models municipal gas demands to proactively ship reserves to areas before shortages hit." },
    { icon: <Calendar size={24} />, title: "Safety Booking Window", desc: "Implements a strict 21-day cylinder reuse window to avoid gas hoarding and ensure fair distribution." },
    { icon: <Truck size={24} />, title: "Real-time Tracking", desc: "Follow delivery dispatch trucks on GPS as they head towards your pincode area." },
    { icon: <Flame size={24} />, title: "Government Monitoring", desc: "Analytics board showing global imports, national gas reserves, and distributor compliance indices." },
    { icon: <ShieldAlert size={24} />, title: "Leakage & Fraud Alert", desc: "Register safety issues immediately. Traces unauthorized cylinder swapping or pricing fraud." }
  ];

  const faqs = [
    { q: "How often can I book a cylinder?", a: "To ensure fair access, domestic households can book one cylinder every 21 days. The booking portal displays your next eligible booking date based on your delivery cycle." },
    { q: "Where do I find my Consumer Number?", a: "Your consumer number is printed on your physical gas blue book or previous gas receipts issued by your distributor." },
    { q: "How does delivery verification work?", a: "Once the delivery driver arrives, you generate a secure booking QR code on your dashboard. The driver scans it, which records a successful delivery on our ledger." },
    { q: "What if I experience a gas leak?", a: "Alert the system immediately through the emergency tab on your dashboard or call the national hotline. The AI flags your local distributor to dispatch an emergency inspection technician." }
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
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(249, 115, 22, 0.1)', padding: '6px 16px', borderRadius: '30px', marginBottom: '1.5rem', border: '1px solid rgba(249, 115, 22, 0.2)', color: '#f97316' }}>
              <TrendingUp size={14} />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px' }}>Automated LPG Allocator</span>
            </div>

            <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: '1.5rem', background: 'linear-gradient(135deg, #ffffff 40%, #f97316 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              FuelGuard AI - LPG Management
            </h1>
            <p style={{ fontSize: 'clamp(1.1rem, 2vw, 1.4rem)', color: 'var(--text-secondary)', maxWidth: '800px', margin: '0 auto 2.5rem', lineHeight: '1.6' }}>
              AI-powered LPG distribution and smart cylinder allocation platform. Ensure equitable cylinder access and trace delivery channels transparently.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
              <Link to="/lpg/login" className="btn btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.05rem', background: 'linear-gradient(135deg, #ea580c 0%, #a855f7 100%)', boxShadow: '0 4px 20px rgba(249, 115, 22, 0.25)' }}>
                Access Portal <ArrowRight size={18} />
              </Link>
              <Link to="/lpg/register" className="btn btn-secondary" style={{ padding: '1rem 2.5rem', fontSize: '1.05rem' }}>
                Register Consumer Account
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
              <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', color: '#f97316', letterSpacing: '1.5px', fontWeight: 700 }}>Live Portal Preview</span>
              <h2 style={{ fontSize: '1.75rem', marginTop: '0.5rem' }}>Familiarize with the LPG Portal</h2>
            </div>
            <LpgDashboardMockup />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" style={{ padding: '5rem 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 700, marginBottom: '1rem' }}>Key LPG Portal Features</h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>Equitable gas allocations powered by dynamic stock tracking models and geofenced distribution verification.</p>
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
                <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(249, 115, 22, 0.1)', color: '#f97316', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid rgba(249, 115, 22, 0.2)' }}>
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
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Secure gas cylinder allocations in three transparent steps.</p>
          </div>

          <div className="grid-3">
            {[
              { step: "01", title: "Consumer Signup", desc: "Register your address, pincode, select your local distributor, and input your consumer ID number." },
              { step: "02", title: "Book a Cylinder", desc: "Book instantly when your 21-day booking cycle window is open. Track distributor confirmation status." },
              { step: "03", title: "Verify Delivery QR", desc: "When the delivery truck arrives, show your dynamic QR code to receive the cylinder securely." }
            ].map((stepObj, i) => (
              <div key={i} className="glass-panel" style={{ padding: '2rem', position: 'relative' }}>
                <span style={{ fontSize: '4rem', fontWeight: 800, color: 'rgba(249, 115, 22, 0.1)', position: 'absolute', top: '10px', right: '20px', fontFamily: 'var(--font-heading)' }}>
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
              <h2 style={{ fontSize: '2.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Benefits of Smart LPG Management</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {[
                  "Guaranteed cylinder refills without waiting at dealer stores",
                  "Prevents multiple fake bookings using verified Consumer books",
                  "Safety compliance checks - ensures cylinder re-testing checks",
                  "Trace delivery vehicles on interactive maps during delivery",
                  "Proactive distribution: directs stock to high-demand suburbs first"
                ].map((benefit, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <CheckCircle size={20} style={{ color: '#f97316', flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ color: '#e2e8f0', fontSize: '0.95rem' }}>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="glass-panel" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', border: '1px solid rgba(249, 115, 22, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(249,115,22,0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#f97316' }}>
                  <RotateCcw size={22} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Cylinder Cycle Management</h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Preventing Domestic Gas Shortages</span>
                </div>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                By establishing structural limits on booking loops (e.g. 21 days), the system ensures commercial establishments cannot hoard domestic cylinders. Our database maps distributor inventories to national bulk storage levels to trigger alerts when stocks are low.
              </p>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px', borderLeft: '3px solid #f97316', fontSize: '0.8rem', color: '#e2e8f0' }}>
                "Black-market cylinder reselling reduced by 94% within 30 days of implementation."
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ padding: '5rem 0', background: 'rgba(15, 23, 42, 0.1)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 700 }}>Distributor & Consumer Reviews</h2>
          </div>
          <div className="grid-3">
            {[
              { quote: "Before this system, I had to line up for gas cylinders for 3 days. Now, I book online, track the truck on the map, and get it at my gate.", author: "Sunitha Perera", role: "Home Maker" },
              { quote: "Verifying gas distribution was very hard because customers sent drivers, agents, or fake books. Scanning the dashboard QR guarantees delivery to the actual consumer.", author: "A. Fernando", role: "Gas Distributor Agent" },
              { quote: "The AI stocking system helps us plan gas tanker purchases. We know exactly which suburbs will need cylinders 2 weeks in advance.", author: "Rajesh Patel", role: "Bulk Supply Manager" }
            ].map((testi, i) => (
              <div key={i} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid rgba(255,255,255,0.04)' }}>
                <p style={{ fontSize: '0.95rem', fontStyle: 'italic', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>"{testi.quote}"</p>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f97316' }}>{testi.author}</h4>
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
              <HelpCircle size={28} style={{ color: '#f97316' }} /> Frequently Asked Questions
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
            <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>FuelGuard <span style={{ color: '#f97316' }}>LPG</span></span>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>AI-Powered Smart Fuel & LPG Management Platform</p>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            © 2026 FuelGuard AI. All rights reserved. Secured Gas Ledger.
          </div>
        </div>
      </footer>
    </motion.div>
  );
};

export default LpgLanding;
