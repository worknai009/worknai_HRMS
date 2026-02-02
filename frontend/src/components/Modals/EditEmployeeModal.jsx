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
                        <FaUserEdit /> Edit Employee
                    </h3>
                    <button className="close-btn" onClick={onClose}>
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
                            <label>Basic Salary (₹)</label>
                            <input
                                type="number"
                                name="basicSalary"
                                value={formData.basicSalary}
                                onChange={handleChange}
                                placeholder="0"
                                min="0"
                            />
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

                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? "Saving..." : <><FaSave /> Save Changes</>}
                        </button>
                    </div>
                </form>
            </div>

            <style>{`
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          backdrop-filter: blur(4px);
        }
        .modal-content {
          background: #fff;
          border-radius: 12px;
          width: 90%;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
          overflow: hidden;
        }
        .animate-slide-up { animation: slideUp 0.3s ease-out; }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }
        .modal-header h3 { margin: 0; font-size: 18px; display: flex; align-items: center; gap: 10px; color: #1e293b; }
        .close-btn { background: none; border: none; font-size: 16px; cursor: pointer; color: #64748b; }
        .close-btn:hover { color: #ef4444; }
        
        .modal-body { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
        
        .input-group { display: flex; flex-direction: column; gap: 6px; }
        .input-group label { font-size: 13px; font-weight: 600; color: #475569; }
        .input-group input {
          padding: 10px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
        }
        .input-group input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
        
        .row-inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 8px;
        }
        .btn-primary {
          background: #3b82f6; color: white; border: none; padding: 10px 20px;
          border-radius: 6px; font-weight: 600; cursor: pointer;
          display: flex; align-items: center; gap: 8px;
          transition: background 0.2s;
        }
        .btn-primary:hover:not(:disabled) { background: #2563eb; }
        .btn-primary:disabled { opacity: 0.6; cursor: wait; }
        
        .btn-secondary {
          background: #fff; color: #475569; border: 1px solid #cbd5e1;
          padding: 10px 20px; border-radius: 6px; font-weight: 600; cursor: pointer;
        }
        .btn-secondary:hover { background: #f1f5f9; color: #1e293b; }
      `}</style>
        </div>
    );
};

export default EditEmployeeModal;
