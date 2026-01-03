import React, { useState } from 'react';
import API from '../../services/api';
import { toast } from 'react-toastify';
import { 
  FaEnvelope, FaPhoneAlt, FaMapMarkerAlt, FaClock, 
  FaHeadset, FaBuilding, FaLinkedin, FaTwitter, FaPaperPlane 
} from 'react-icons/fa';

const Contact = () => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    mobile: '',
    message: '',
    // Hidden field for admin notification logic
    targetAdmin: 'skhandagle1233@gmail.com' 
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Direct SaaS Inquiry logic: backend handles the email routing
      await API.post('/auth/inquiry', { ...form, address: 'Inquiry from Contact Page' });
      toast.success("Enquiry sent to the core team! We will reach out to you. 🚀");
      setForm({ companyName: '', contactPerson: '', email: '', mobile: '', message: '', targetAdmin: 'skhandagle1233@gmail.com' });
    } catch (error) {
      toast.error("Cloud communication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-wrapper">
      {/* --- PREMIUM HERO --- */}
      <section className="contact-hero animate-fade">
        <div className="container">
          <span className="support-badge">24/7 PRIORITY SUPPORT</span>
          <h1>Let's Scale Your <span>Business</span> Together</h1>
          <p>Have questions about implementation? Our SaaS experts are ready to guide your organization's digital transformation.</p>
        </div>
      </section>

      <div className="container main-grid">
        {/* === LEFT: CONTACT INFO === */}
        <aside className="info-panel animate-up">
            <div className="glass-card contact-card">
                <h3><FaHeadset className="icon-blue"/> Connectivity Hub</h3>
                <div className="contact-links">
                    <div className="c-item">
                        <FaEnvelope className="c-icon"/>
                        <div>
                            <label>Official Support</label>
                            <p>skhandagle1233@gmail.com</p>
                        </div>
                    </div>
                    <div className="c-item">
                        <FaPhoneAlt className="c-icon"/>
                        <div>
                            <label>Sales Hotline</label>
                            <p>+91 98765 43210</p>
                        </div>
                    </div>
                    <div className="c-item">
                        <FaClock className="c-icon"/>
                        <div>
                            <label>Operational Hours</label>
                            <p>Mon - Sat: 09:00 AM - 07:00 PM</p>
                        </div>
                    </div>
                </div>
                
                <div className="social-connect">
                    <p>Follow our journey</p>
                    <div className="social-icons">
                        <FaLinkedin/> <FaTwitter/> <FaBuilding/>
                    </div>
                </div>
            </div>

            {/* Simple Map Placeholder */}
            <div className="map-frame animate-up-slow">
                <img src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" alt="World Map" />
                <div className="map-overlay">
                    <FaMapMarkerAlt/> Global Operations Center
                </div>
            </div>
        </aside>

        {/* === RIGHT: ENQUIRY FORM === */}
        <main className="form-panel animate-up">
            <div className="glass-card form-card">
                <div className="form-header">
                    <h2>Send an <span>Enquiry</span></h2>
                    <p>Please provide your business details for a personalized demo.</p>
                </div>
                <form onSubmit={handleSubmit} className="premium-form">
                    <div className="input-row">
                        <div className="input-group">
                            <label>Organization Name</label>
                            <input type="text" required placeholder="e.g. Acme Corp" 
                                value={form.companyName} onChange={(e)=>setForm({...form, companyName:e.target.value})}/>
                        </div>
                        <div className="input-group">
                            <label>Contact Person</label>
                            <input type="text" required placeholder="Your Name"
                                value={form.contactPerson} onChange={(e)=>setForm({...form, contactPerson:e.target.value})}/>
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Business Email</label>
                        <input type="email" required placeholder="name@company.com"
                            value={form.email} onChange={(e)=>setForm({...form, email:e.target.value})}/>
                    </div>

                    <div className="input-group">
                        <label>Mobile Number</label>
                        <input type="text" required placeholder="+91 XXXXX XXXXX"
                            value={form.mobile} onChange={(e)=>setForm({...form, mobile:e.target.value})}/>
                    </div>

                    <div className="input-group">
                        <label>Additional Requirements (Optional)</label>
                        <textarea placeholder="Tell us about your team size and office locations..."
                            value={form.message} onChange={(e)=>setForm({...form, message:e.target.value})}></textarea>
                    </div>

                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? "Transmitting..." : <><FaPaperPlane/> Dispatch Enquiry</>}
                    </button>
                </form>
            </div>
        </main>
      </div>

      <style>{`
        .contact-wrapper { background: #fff; font-family: 'Plus Jakarta Sans', sans-serif; padding-bottom: 100px; overflow-x: hidden; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }

        /* Hero */
        .contact-hero { padding: 120px 0 80px; text-align: center; background: radial-gradient(circle at top right, #f8faff, #fff); }
        .support-badge { background: #e0f2fe; color: #1a73e8; padding: 8px 20px; border-radius: 50px; font-weight: 800; font-size: 0.75rem; letter-spacing: 1px; }
        .contact-hero h1 { font-size: 3.5rem; font-weight: 900; margin: 25px 0; letter-spacing: -2px; }
        .contact-hero h1 span { color: #1a73e8; }
        .contact-hero p { max-width: 700px; margin: 0 auto; color: #64748b; font-size: 1.2rem; line-height: 1.6; }

        /* Grid Layout */
        .main-grid { display: grid; grid-template-columns: 400px 1fr; gap: 40px; }
        .glass-card { background: #fff; border-radius: 24px; border: 1px solid #eef2f6; box-shadow: 0 20px 40px rgba(0,0,0,0.03); overflow: hidden; }
        
        /* Info Panel */
        .contact-card { padding: 40px; }
        .contact-card h3 { font-size: 1.3rem; margin-bottom: 30px; display: flex; align-items: center; gap: 12px; }
        .icon-blue { color: #1a73e8; }
        
        .contact-links { display: flex; flex-direction: column; gap: 25px; }
        .c-item { display: flex; gap: 15px; align-items: flex-start; }
        .c-icon { font-size: 1.2rem; color: #1a73e8; margin-top: 5px; }
        .c-item label { display: block; font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 2px; }
        .c-item p { margin: 0; font-weight: 600; color: #1e293b; font-size: 0.95rem; }

        .social-connect { margin-top: 50px; padding-top: 30px; border-top: 1px solid #f1f5f9; }
        .social-connect p { font-size: 0.8rem; font-weight: 700; color: #94a3b8; margin-bottom: 15px; }
        .social-icons { display: flex; gap: 20px; font-size: 1.5rem; color: #cbd5e1; }
        
        .map-frame { position: relative; border-radius: 24px; overflow: hidden; margin-top: 30px; }
        .map-frame img { width: 100%; height: 200px; object-fit: cover; filter: grayscale(100%); transition: 0.5s; }
        .map-frame:hover img { filter: grayscale(0%); }
        .map-overlay { position: absolute; inset: 0; background: rgba(26, 115, 232, 0.1); display: flex; align-items: center; justify-content: center; font-weight: 800; color: #fff; font-size: 0.9rem; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }

        /* Form Card */
        .form-card { padding: 50px; }
        .form-header { margin-bottom: 35px; }
        .form-header h2 { font-size: 2rem; font-weight: 800; margin-bottom: 10px; }
        .form-header h2 span { color: #1a73e8; }
        .form-header p { color: #64748b; }

        .premium-form { display: flex; flex-direction: column; gap: 20px; }
        .input-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .input-group label { display: block; font-size: 0.85rem; font-weight: 700; color: #475569; margin-bottom: 8px; }
        .input-group input, .input-group textarea { width: 100%; padding: 14px; border: 1.5px solid #e2e8f0; border-radius: 12px; outline: none; transition: 0.2s; font-family: inherit; box-sizing: border-box; }
        .input-group input:focus, .input-group textarea:focus { border-color: #1a73e8; box-shadow: 0 0 0 4px rgba(26, 115, 232, 0.05); }
        .input-group textarea { height: 120px; resize: none; }

        .submit-btn { background: #1a73e8; color: #fff; border: none; padding: 18px; border-radius: 15px; font-weight: 800; font-size: 1rem; cursor: pointer; transition: 0.3s; display: flex; align-items: center; justify-content: center; gap: 12px; box-shadow: 0 10px 20px rgba(26, 115, 232, 0.2); }
        .submit-btn:hover { background: #1557b0; transform: translateY(-3px); }
        .submit-btn:disabled { background: #94a3b8; cursor: not-allowed; }

        @media (max-width: 1024px) {
            .main-grid { grid-template-columns: 1fr; }
            .info-panel { order: 2; }
            .form-card { padding: 30px; }
            .contact-hero h1 { font-size: 2.5rem; }
        }
        @media (max-width: 600px) {
            .input-row { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default Contact;