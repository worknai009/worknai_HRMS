import React, { useState } from "react";
import { toast } from "react-toastify";
import {
  FaEnvelope,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaClock,
  FaHeadset,
  FaBuilding,
  FaLinkedin,
  FaTwitter,
  FaPaperPlane,
  FaUser,
  FaUsers,
  FaCommentDots,
} from "react-icons/fa";
import locationImg from "../../assets/location.png";

const Contact = () => {
  const WEB3FORMS_ACCESS_KEY = "ff3f8fa1-188b-41fa-89a0-70fe6224c214"; // ✅ your web3forms access_key

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    companyName: "",
    contactPerson: "",
    email: "",
    mobile: "",
    employeeRange: "", // ✅ new field
    message: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        access_key: WEB3FORMS_ACCESS_KEY, // required :contentReference[oaicite:2]{index=2}
        subject: `New Enquiry - ${form.companyName}`, // optional :contentReference[oaicite:3]{index=3}
        from_name: "WorknAI Website", // optional :contentReference[oaicite:4]{index=4}
        replyto: form.email, // optional :contentReference[oaicite:5]{index=5}
        botcheck: false, // recommended anti-spam field :contentReference[oaicite:6]{index=6}

        // your custom fields (forwarded to email as-is) :contentReference[oaicite:7]{index=7}
        companyName: form.companyName,
        contactPerson: form.contactPerson,
        email: form.email,
        mobile: form.mobile,
        employeeRange: form.employeeRange,
        message: form.message || "-",
        source: "Inquiry from Contact Page",
      };

      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data?.success) {
        toast.success("Enquiry sent successfully! ✅");
        setForm({
          companyName: "",
          contactPerson: "",
          email: "",
          mobile: "",
          employeeRange: "",
          message: "",
        });
      } else {
        toast.error(
          data?.message || "Failed to send enquiry. Please try again."
        );
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-wrapper">
      {/* Background Blobs for Depth */}
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>
      <div className="blob blob-3"></div>

      {/* --- PREMIUM HERO --- */}
      <section className="contact-hero animate-fade">
        <div className="container">
          <span className="support-badge">24/7 PRIORITY SUPPORT</span>
          <h1>
            Let's Scale Your <span>Business</span> Together
          </h1>
          <p>
            Have questions about implementation? Our SaaS experts are ready to
            guide your organization's digital transformation.
          </p>
        </div>
      </section>

      <div className="container main-grid">
        {/* === LEFT: CONTACT INFO === */}
        <aside className="info-panel animate-up">
          <div className="glass-card contact-card">
            <h3>
              <FaHeadset className="icon-blue" /> Connectivity Hub
            </h3>
            <div className="contact-links">
              <div className="c-item">
                <FaEnvelope className="c-icon" />
                <div>
                  <label>Official Support</label>
                  <p>worknai009@gmail.com</p>
                </div>
              </div>
              <div className="c-item">
                <FaPhoneAlt className="c-icon" />
                <div>
                  <label>Sales Hotline</label>
                  <p>+91 99234 00442</p>
                </div>
              </div>
              <div className="c-item">
                <FaClock className="c-icon" />
                <div>
                  <label>Operational Hours</label>
                  <p>Mon - Sat: 09:00 AM - 07:00 PM</p>
                </div>
              </div>
            </div>


          </div>

          {/* Support Team Image Placeholder */}
          <div className="map-frame animate-up-slow">
            <img
              src={locationImg}
              alt="Location"
            />
            <div className="map-overlay">
              <FaHeadset style={{ marginRight: "6px" }} /> 24/7 Priority Support Center
            </div>
          </div>
        </aside>

        {/* === RIGHT: ENQUIRY FORM === */}
        <main className="form-panel animate-up">
          <div className="glass-card form-card">
            <div className="form-header">
              <h2>
                Send an <span>Enquiry</span>
              </h2>
              <p>
                Please provide your business details for a personalized demo.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="premium-form">
              <div className="input-row">
                <div className="input-group">
                  <label>Organization Name</label>
                  <div className="input-wrapper">
                    <FaBuilding className="input-icon" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Acme Corp"
                      value={form.companyName}
                      onChange={(e) =>
                        setForm({ ...form, companyName: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Contact Person</label>
                  <div className="input-wrapper">
                    <FaUser className="input-icon" />
                    <input
                      type="text"
                      required
                      placeholder="Your Name"
                      value={form.contactPerson}
                      onChange={(e) =>
                        setForm({ ...form, contactPerson: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="input-row">
                <div className="input-group">
                  <label>Business Email</label>
                  <div className="input-wrapper">
                    <FaEnvelope className="input-icon" />
                    <input
                      type="email"
                      required
                      placeholder="name@company.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Mobile Number</label>
                  <div className="input-wrapper">
                    <FaPhoneAlt className="input-icon" />
                    <input
                      type="text"
                      required
                      placeholder="+91 XXXX XXXX"
                      value={form.mobile}
                      onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="input-group">
                <label>Total Employees</label>
                <div className="input-wrapper">
                  <FaUsers className="input-icon" />
                  <select
                    required
                    value={form.employeeRange}
                    onChange={(e) =>
                      setForm({ ...form, employeeRange: e.target.value })
                    }
                  >
                    <option value="">Select range</option>
                    <option value="0-15">0 - 15</option>
                    <option value="15-40">15 - 40</option>
                    <option value="40-100">40 - 100</option>
                    <option value="100-250">100 - 250</option>
                    <option value="250+">250+</option>
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label>Additional Requirements (Optional)</label>
                <div className="input-wrapper text-area-wrap">
                  <FaCommentDots className="input-icon area-icon" />
                  <textarea
                    placeholder="Tell us about your team size, locations or specific needs..."
                    value={form.message}
                    onChange={(e) =>
                      setForm({ ...form, message: e.target.value })
                    }
                  />
                </div>
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? (
                  "Transmitting..."
                ) : (
                  <>
                    <FaPaperPlane /> Dispatch Enquiry
                  </>
                )}
              </button>
            </form>
          </div>
        </main>
      </div>

      <style>{`
        .contact-wrapper { background: #0c0f24; font-family: 'Plus Jakarta Sans', sans-serif; padding-bottom: 100px; overflow-x: hidden; padding-top: 70px; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        
        /* Premium Background Elements */
        .blob {
          position: fixed;
          border-radius: 50%;
          filter: blur(80px);
          z-index: 0;
          opacity: 0.15;
          pointer-events: none;
          animation: float 20s infinite alternate;
        }
        .blob-1 { width: 500px; height: 500px; background: #a78bfa; top: -100px; right: -100px; animation-delay: 0s; }
        .blob-2 { width: 400px; height: 400px; background: #50c8ff; bottom: -50px; left: -50px; animation-delay: -5s; }
        .blob-3 { width: 300px; height: 300px; background: #e879f9; top: 40%; left: 30%; animation-delay: -10s; }

        @keyframes float {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, 40px) scale(1.1); }
          100% { transform: translate(-20px, 20px) scale(0.9); }
        }

        /* Hero */
        .contact-hero { padding: 60px 0 30px; text-align: center; position: relative; z-index: 1; }
        .support-badge { 
          background: rgba(167, 139, 250, 0.1); 
          color: #fff; 
          padding: 10px 24px; 
          border-radius: 50px; 
          font-weight: 800; 
          font-size: 0.7rem; 
          letter-spacing: 2.5px;
          border: 1px solid rgba(167, 139, 250, 0.3);
          box-shadow: 0 0 30px rgba(167, 139, 250, 0.15);
          display: inline-block;
          background: linear-gradient(90deg, rgba(167, 139, 250, 0.1), rgba(80, 200, 255, 0.1));
        }
        .contact-hero h1 { font-size: clamp(1.8rem, 4vw, 2.8rem); font-weight: 900; margin: 20px 0; letter-spacing: -1.5px; color: #fff; line-height: 1.1; }
        .contact-hero h1 span { 
          background: linear-gradient(135deg, #a78bfa 0%, #50c8ff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .contact-hero p { max-width: 600px; margin: 0 auto; color: rgba(255, 255, 255, 0.6); font-size: 1.05rem; line-height: 1.5; }

        /* Grid Layout */
        .main-grid { display: grid; grid-template-columns: 320px 1fr; gap: 24px; position: relative; z-index: 1; margin-top: -30px; }
        .glass-card { 
          background: rgba(255, 255, 255, 0.03); 
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-radius: 28px; 
          border: 1px solid rgba(255, 255, 255, 0.08); 
          box-shadow: 0 25px 50px rgba(0,0,0,0.2); 
          overflow: hidden; 
          transition: 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .info-panel {
          position: sticky;
          top: 90px;
          height: fit-content;
        }

        /* Info Panel */
        .contact-card { padding: 25px; position: relative; }
        .contact-card h3 { font-size: 1.25rem; margin-bottom: 25px; display: flex; align-items: center; gap: 10px; color: #fff; }
        .icon-blue { color: #50c8ff; }

        .contact-links { display: flex; flex-direction: column; gap: 20px; }
        .c-item { display: flex; gap: 15px; align-items: flex-start; transition: 0.3s; }
        .c-item:hover { transform: translateX(8px); }
        .c-icon { font-size: 1rem; color: #a78bfa; padding: 10px; background: rgba(167, 139, 250, 0.12); border-radius: 12px; border: 1px solid rgba(167, 139, 250, 0.15); display: flex; align-items: center; justify-content: center; }
        .c-item label { display: block; font-size: 0.68rem; font-weight: 800; color: #a78bfa; text-transform: uppercase; margin-bottom: 2px; letter-spacing: 1.2px; opacity: 0.8; }
        .c-item p { margin: 0; font-weight: 600; color: #fff; font-size: 0.92rem; letter-spacing: 0.2px; }

        .map-frame { position: relative; border-radius: 20px; overflow: hidden; margin-top: 20px; border: 1px solid rgba(255, 255, 255, 0.08); box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
        .map-frame img { 
          width: 100%; 
          height: 300px; 
          object-fit: cover; 
          object-position: center;
          filter: contrast(1.05) brightness(1); 
          transition: 0.8s cubic-bezier(0.16, 1, 0.3, 1); 
        }
        .map-frame:hover img { filter: contrast(1.1) brightness(1.1); transform: scale(1.05); }
        .map-overlay { 
          position: absolute; 
          inset: 0; 
          background: linear-gradient(to top, rgba(12, 15, 36, 0.8), transparent 60%); 
          display: flex; 
          align-items: flex-end; 
          justify-content: center; 
          padding-bottom: 20px; 
          font-weight: 700; 
          color: #fff; 
          font-size: 0.85rem; 
          letter-spacing: 0.5px; 
          text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }

        /* Form Card */
        .form-card { 
          padding: 30px 40px; 
          max-height: 560px;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(167, 139, 250, 0.3) transparent;
        }

        .form-card::-webkit-scrollbar {
          width: 6px;
        }
        .form-card::-webkit-scrollbar-track {
          background: transparent;
        }
        .form-card::-webkit-scrollbar-thumb {
          background: rgba(167, 139, 250, 0.2);
          border-radius: 10px;
        }
        .form-card::-webkit-scrollbar-thumb:hover {
          background: rgba(167, 139, 250, 0.4);
        }
        .form-header { margin-bottom: 25px; }
        .form-header h2 { font-size: 2rem; font-weight: 900; margin-bottom: 8px; color: #fff; letter-spacing: -1px; }
        .form-header h2 span { 
          background: linear-gradient(135deg, #a78bfa 0%, #e879f9 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .form-header p { color: rgba(255, 255, 255, 0.5); font-size: 0.95rem; }

        .premium-form { display: flex; flex-direction: column; gap: 12px; }
        .input-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .input-group label { display: block; font-size: 0.78rem; font-weight: 700; color: rgba(255, 255, 255, 0.5); margin-bottom: 6px; margin-left: 2px; text-transform: uppercase; letter-spacing: 0.5px; }

        .input-wrapper { position: relative; display: flex; align-items: center; }
        .input-icon { position: absolute; left: 16px; color: #a78bfa; font-size: 0.85rem; pointer-events: none; opacity: 0.6; transition: 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .input-wrapper:focus-within .input-icon { color: #50c8ff; opacity: 1; transform: scale(1.1) translateX(2px); }
        .area-icon { top: 14px; }

        .input-group input, .input-group textarea, .input-group select {
          width: 100%;
          padding: 12px 16px 12px 45px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          outline: none;
          transition: 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          font-family: inherit;
          color: #fff;
          font-size: 0.92rem;
          box-sizing: border-box;
          backdrop-filter: blur(4px);
        }

        .input-group textarea { height: 90px; resize: none; padding-top: 12px; }

        .input-group input:focus, .input-group textarea:focus, .input-group select:focus {
          border-color: rgba(167, 139, 250, 0.4);
          background: rgba(255, 255, 255, 0.06);
          box-shadow: 0 0 0 4px rgba(167, 139, 250, 0.1), inset 0 0 10px rgba(167, 139, 250, 0.05);
        }

        /* Dropdown Styling Fix */
        .input-group select {
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23a78bfa' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: calc(100% - 15px) center;
        }

        .input-group select option {
          background-color: #0c0f24;
          color: #fff;
          padding: 10px;
        }

        .submit-btn {
          background: linear-gradient(135deg, #a78bfa 0%, #50c8ff 100%);
          color: #fff;
          border: none;
          padding: 16px;
          border-radius: 14px;
          font-weight: 800;
          font-size: 1rem;
          cursor: pointer;
          transition: 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-top: 5px;
          box-shadow: 0 10px 30px rgba(167, 139, 250, 0.2);
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .submit-btn:hover { 
          transform: translateY(-3px); 
          box-shadow: 0 15px 40px rgba(167, 139, 250, 0.3);
          filter: brightness(1.1);
        }
        .submit-btn:disabled { background: #334155; transform: none; box-shadow: none; opacity: 0.6; }

        @media (max-width: 1024px) {
          .main-grid { grid-template-columns: 1fr; gap: 30px; }
          .info-panel { order: 2; position: static; }
          .form-card { padding: 40px 30px; max-height: none; overflow: visible; }
          .contact-hero h1 { font-size: 2.8rem; }
        }
        @media (max-width: 600px) {
          .input-row { grid-template-columns: 1fr; }
          .contact-hero { padding-top: 80px; }
          .form-card { padding: 30px 20px; }
        }
      `}</style>
    </div>
  );
};

export default Contact;