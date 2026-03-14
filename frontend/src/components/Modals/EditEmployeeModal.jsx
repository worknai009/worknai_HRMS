import React, { useState, useEffect } from "react";
import { FaTimes, FaSave, FaUserEdit } from "react-icons/fa";
import { toast } from "react-toastify";
import API, { getApiErrorMessage } from "../../services/api";

const EditEmployeeModal = ({ isOpen, onClose, employee, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: "",
        mobile: "",
        designation: "",
        basicSalary: "",
        joiningDate: "",
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (employee) {
            setFormData({
                name: employee.name || "",
                mobile: employee.mobile || "",
                designation: employee.designation || "",
                basicSalary: employee.basicSalary ?? employee.salary ?? "",
                joiningDate: employee.joiningDate
                    ? new Date(employee.joiningDate).toISOString().split("T")[0]
                    : "",
                employmentType: employee.employmentType || "On-Roll",
            });
        }
    }, [employee]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!employee?._id) return;

        // Client-side Validation
        if (!formData.name.trim()) {
            toast.error("Name is required");
            return;
        }
        // Basic mobile validation (digits only, length 10-15) - optional but recommended
        if (formData.mobile && !/^\d{10,15}$/.test(formData.mobile)) {
            toast.warning("Mobile number should be 10-15 digits");
            return;
        }
        if (Number(formData.basicSalary) < 0) {
            toast.error("Salary cannot be negative");
            return;
        }

        try {
            setLoading(true);
            // Try multiple routes for robustness (legacy vs new structure)
            // Usually one is correct, but safe to try sequence or parallel if consistent
            // Relying on one consistent HR route from analysis: /hr/employee/:id
            // But preserving the 'try' pattern from dashboard just in case.

            await API.put(`/hr/employee/${employee._id}`, formData);

            toast.success("Employee updated successfully! ✅");
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            // Fallback: try company route if HR route failed (rare but possible in mixed auth)
            try {
                await API.put(`/company/employee/${employee._id}`, formData);
                toast.success("Employee updated successfully! ✅");
                if (onSuccess) onSuccess();
                onClose();
            } catch (fallbackErr) {
                toast.error(getApiErrorMessage(err, "Update failed"));
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content animate-slide-up" style={{ maxWidth: "500px" }}>
                <div className="modal-header">
                    <h3>
                        <div className="pro-icon-container">
                            <div className="pro-icon-box blue-theme">
                                <FaUserEdit className="pro-icon" />
                            </div>
                            <div className="pro-icon-ring"></div>
                        </div>
                        <span className="grad-text">Edit Employee Profile</span>
                    </h3>
                    <button className="close-btn" onClick={onClose} title="Close">
                        <FaTimes />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="input-group">
                        <label>Full Name *</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g. John Doe"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label>Mobile Number</label>
                        <input
                            type="text"
                            name="mobile"
                            value={formData.mobile}
                            onChange={handleChange}
                            placeholder="e.g. 9876543210"
                        />
                    </div>

                    <div className="input-group">
                        <label>Designation</label>
                        <input
                            type="text"
                            name="designation"
                            value={formData.designation}
                            onChange={handleChange}
                            placeholder="e.g. Software Engineer"
                        />
                    </div>

                    <div className="row-inputs">
                        <div className="input-group">
                            <label>Employment Type</label>
                            <select
                                name="employmentType"
                                value={formData.employmentType}
                                onChange={handleChange}
                                className="modal-select"
                            >
                                <option value="On-Roll">On-Roll</option>
                                <option value="Intern">Intern</option>
                            </select>
                        </div>

                        <div className="input-group">
                            <label>Joining Date</label>
                            <input
                                type="date"
                                name="joiningDate"
                                value={formData.joiningDate}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Basic Salary (₹) {formData.employmentType === 'Intern' ? '(Optional for Intern)' : '*'}</label>
                        <input
                            type="number"
                            name="basicSalary"
                            value={formData.basicSalary}
                            onChange={handleChange}
                            placeholder={formData.employmentType === 'Intern' ? "Unpaid (leave as 0)" : "0"}
                            min="0"
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? (
                                <span className="loader-inner">
                                    <span className="spin-dot"></span> Saving...
                                </span>
                            ) : (
                                <><FaSave /> Save Changes</>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            <style>{`
        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(5, 7, 20, 0.85);
          display: flex; align-items: center; justify-content: center;
          z-index: 9999; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
        }

        .modal-content {
          background: rgba(13, 17, 34, 0.85);
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          width: 90%;
          box-shadow: 0 40px 100px rgba(0, 0, 0, 0.6);
          overflow: hidden;
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          color: #fff;
        }

        .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.165, 0.84, 0.44, 1); }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .modal-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 24px 30px; border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          background: linear-gradient(135deg, rgba(80, 200, 255, 0.05), transparent);
        }

        .modal-header h3 { margin: 0; display: flex; align-items: center; gap: 15px; }
        .grad-text { 
          font-size: 20px; font-weight: 900; 
          background: linear-gradient(90deg, #50c8ff, #a78bfa, #e879f9);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }

        .pro-icon-container { position: relative; width: 44px; height: 44px; display: grid; place-items: center; }
        .pro-icon-box { 
            width: 36px; height: 36px; border-radius: 12px; 
            background: rgba(80, 200, 255, 0.1); border: 1px solid rgba(80, 200, 255, 0.2); 
            display: grid; place-items: center; transform: rotate(-5deg);
        }
        .pro-icon { font-size: 16px; color: #50c8ff; }
        .pro-icon-ring { 
            position: absolute; inset: 0; border: 1px dashed rgba(80, 200, 255, 0.3); 
            border-radius: 14px; animation: spin 10s linear infinite; 
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .close-btn { 
          background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); 
          width: 38px; height: 38px; border-radius: 12px; cursor: pointer; color: rgba(255, 255, 255, 0.6); 
          display: grid; place-items: center; transition: 0.3s;
        }
        .close-btn:hover { background: rgba(239, 68, 68, 0.1); color: #ef4444; border-color: #ef4444; }
        
        .modal-body { padding: 30px; display: flex; flex-direction: column; gap: 20px; }
        
        .input-group { display: flex; flex-direction: column; gap: 8px; }
        .input-group label { font-size: 12px; font-weight: 800; color: rgba(255, 255, 255, 0.5); text-transform: uppercase; letter-spacing: 1px; }
        .input-group input {
          padding: 12px 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          font-size: 14px;
          outline: none;
          background: rgba(255, 255, 255, 0.03);
          color: #fff;
          transition: 0.3s;
          font-weight: 600;
        }
        .input-group input::placeholder { color: rgba(255, 255, 255, 0.2); }
        .input-group input:focus, .modal-select:focus { 
          border-color: #50c8ff; 
          background: rgba(80, 200, 255, 0.05);
          box-shadow: 0 0 20px rgba(80, 200, 255, 0.15); 
        }
        .input-group input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(1); }
        .modal-select {
          padding: 12px 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          font-size: 14px;
          outline: none;
          background: rgba(255, 255, 255, 0.01);
          color: #fff;
          transition: 0.3s;
          font-weight: 600;
          cursor: pointer;
        }
        .modal-select option { background: #0d1122; color: #fff; }
        
        .row-inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        
        .modal-actions { display: flex; justify-content: flex-end; gap: 14px; margin-top: 10px; }

        .btn-primary {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6, #e879f9);
          color: white; border: none; padding: 14px 28px;
          border-radius: 16px; font-weight: 800; cursor: pointer;
          display: flex; align-items: center; gap: 10px;
          transition: 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
          box-shadow: 0 10px 25px rgba(139, 92, 246, 0.3);
        }
        .btn-primary:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 15px 35px rgba(139, 92, 246, 0.5); filter: brightness(1.1); }
        .btn-primary:disabled { opacity: 0.6; cursor: wait; }
        
        .btn-secondary {
          background: rgba(255, 255, 255, 0.05); color: rgba(255, 255, 255, 0.7); 
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 14px 24px; border-radius: 16px; font-weight: 800; cursor: pointer; transition: 0.3s;
        }
        .btn-secondary:hover { background: rgba(255, 255, 255, 0.1); color: #fff; }

        .loader-inner { display: flex; align-items: center; gap: 10px; }
        .spin-dot { width: 14px; height: 14px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; animation: spin 0.8s linear infinite; }

        @media (max-width: 500px) {
            .row-inputs { grid-template-columns: 1fr; gap: 15px; }
            .modal-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            .btn-primary, .btn-secondary { padding: 12px; font-size: 13px; justify-content: center; text-align: center; }
            .modal-content { width: 95%; max-height: 90vh; overflow-y: auto; }
            .modal-header { padding: 16px 20px; }
            .modal-body { padding: 20px; gap: 14px; }
        }
      `}</style>
        </div>
    );
};

export default EditEmployeeModal;
