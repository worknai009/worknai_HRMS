import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import API, { assignTask, getAllTasks, getMyTasks, submitTask, reviewTask, updateTaskStatus } from "../../services/api";
import { toast } from "react-toastify";
import { FaTasks, FaDownload, FaFileUpload, FaCheckCircle, FaClock, FaExclamationCircle, FaPlay, FaPaperPlane } from "react-icons/fa";
import { useClientPagination } from "../../utils/useClientPagination";
import Pagination from "../../components/Pagination";

// Helper to safely get data array
const pickArray = (d) => {
    if (Array.isArray(d)) return d;
    if (Array.isArray(d?.items)) return d.items;
    if (Array.isArray(d?.data)) return d.data;
    return [];
};

// Helper to download files
const handleDownload = async (taskId, fileUrl, fileName) => {
    try {
        const response = await API.get(`/tasks/download/${taskId}`, {
            params: { url: fileUrl },
            responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (e) {
        toast.error("Download failed");
    }
};

const Tasks = () => {
    const { user } = useAuth();
    const isHR = ["Admin", "CompanyAdmin", "SuperAdmin"].includes(user?.role);

    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [activeModal, setActiveModal] = useState(null); // 'create' | 'submit' | 'details'
    const [selectedTask, setSelectedTask] = useState(null);

    // Forms
    const [newTask, setNewTask] = useState({ title: "", description: "", deadline: "", userId: "", priority: "Medium" });
    const [submission, setSubmission] = useState({ notes: "", file: null, link: "" });

    useEffect(() => {
        if (user) fetchTasks();
    }, [user]);

    const pager = useClientPagination(tasks);
    const { paginatedItems } = pager;

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const res = isHR ? await getAllTasks() : await getMyTasks();
            setTasks(pickArray(res?.data));
        } catch (error) {
            toast.error("Failed to load tasks");
        } finally {
            setLoading(false);
        }
    };

    const handleStartTask = async (taskId) => {
        try {
            await updateTaskStatus(taskId, "In Progress");
            toast.success("Task Started! 🚀");
            fetchTasks();
        } catch (e) {
            toast.error("Failed to start task");
        }
    };

    const handleSubmitWork = async (e) => {
        e.preventDefault();
        if (!selectedTask) return;

        const formData = new FormData();
        formData.append("notes", submission.notes);
        formData.append("link", submission.link);
        if (submission.file) formData.append("files", submission.file);

        try {
            await submitTask(selectedTask._id, formData);
            toast.success("Work Submitted Successfully! 🎉");
            setActiveModal(null);
            setSubmission({ notes: "", file: null, link: "" });
            fetchTasks();
        } catch (error) {
            toast.error(error.response?.data?.message || "Submission failed");
        }
    };

    const handleAssign = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        Object.keys(newTask).forEach(k => formData.append(k, newTask[k]));
        // Add file handling here if HR uploads files during creation (simplified for now)

        try {
            await assignTask(formData);
            toast.success("Task Assigned! 📋");
            setActiveModal(null);
            setNewTask({ title: "", description: "", deadline: "", userId: "", priority: "Medium" });
            fetchTasks();
        } catch (e) {
            toast.error(e.response?.data?.message || "Assign failed");
        }
    };

    const handleReview = async (taskId, action) => {
        try {
            await reviewTask(taskId, { action, comment: "Reviewed by HR" });
            toast.success(`Task ${action} ✅`);
            fetchTasks();
            setActiveModal(null);
        } catch (e) { toast.error("Review failed"); }
    };

    // --- UI Components ---

    const StatusBadge = ({ status }) => {
        const map = {
            'Pending': { bg: '#fef3c7', c: '#d97706', ic: <FaClock /> },
            'In Progress': { bg: '#dbeafe', c: '#2563eb', ic: <FaPlay /> },
            'Completed': { bg: '#d1fae5', c: '#059669', ic: <FaCheckCircle /> },
            'Verified': { bg: '#ecfdf5', c: '#047857', ic: <FaCheckCircle /> },
            'Needs Rework': { bg: '#fee2e2', c: '#dc2626', ic: <FaExclamationCircle /> },
        };
        const s = map[status] || map['Pending'];
        return (
            <span style={{
                background: s.bg, color: s.c, padding: '4px 10px',
                borderRadius: '20px', fontSize: '11px', fontWeight: 900,
                display: 'inline-flex', alignItems: 'center', gap: '6px'
            }}>
                {s.ic} {status}
            </span>
        );
    };

    const openDetails = (t) => {
        setSelectedTask(t);
        setActiveModal('details');
    };

    const openSubmit = (t) => {
        setSelectedTask(t);
        setActiveModal('submit');
    };

    return (
        <div className="page-anim" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FaTasks style={{ color: '#10b981' }} /> {isHR ? "Task Management" : "My Tasks"}
                    </h2>
                    <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>
                        {isHR ? "Assign and review employee work." : "Track and submit your assignments."}
                    </p>
                </div>
                {isHR && (
                    <button onClick={() => setActiveModal('create')} className="btn-primary">
                        + New Task
                    </button>
                )}
            </div>

            {/* Task List */}
            {loading ? <div className="loader">Loading...</div> : (
                <div style={{ display: 'grid', gap: '16px' }}>
                    {paginatedItems.length === 0 ? <div style={{ textAlign: 'center', padding: '40px', background: '#f8fafc', borderRadius: '16px', color: '#64748b' }}>No tasks found.</div> :
                        paginatedItems.map(t => (
                            <div key={t._id} className="task-card">
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', gap: '10px', marginBottom: '6px' }}>
                                        <StatusBadge status={t.status} />
                                        <span style={{ fontSize: '11px', padding: '4px 8px', background: '#f1f5f9', borderRadius: '4px', fontWeight: 700 }}>
                                            Due: {new Date(t.deadline).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700 }}>{t.title}</h3>
                                    <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineClamp: 2 }}>
                                        {t.description || "No description provided."}
                                    </p>
                                    {isHR && <div style={{ fontSize: '12px', marginTop: '8px', color: '#6366f1', fontWeight: 600 }}>Assigned To: {t.assignedTo?.name || "User"}</div>}
                                </div>

                                <div className="card-actions">
                                    <button onClick={() => openDetails(t)} className="btn-light">View Details</button>

                                    {!isHR && (
                                        <>
                                            {t.status === 'Pending' && (
                                                <button onClick={() => handleStartTask(t._id)} className="btn-green">Start</button>
                                            )}
                                            {(t.status === 'In Progress' || t.status === 'Needs Rework') && (
                                                <button onClick={() => openSubmit(t)} className="btn-blue">
                                                    {t.status === 'Needs Rework' ? 'Resubmit' : 'Submit'}
                                                </button>
                                            )}
                                        </>
                                    )}

                                    {isHR && t.status === 'Completed' && (
                                        <button onClick={() => openDetails(t)} className="btn-orange">Review</button>
                                    )}
                                </div>
                            </div>
                        ))
                    }
                </div>
            )}



            {
                !loading && tasks.length > 0 && (
                    <Pagination pager={pager} />
                )
            }

            {/* --- MODALS --- */}

            {/* 1. Create Modal (HR) */}
            {
                activeModal === 'create' && (
                    <div className="modal-overlay">
                        <div className="modal-box">
                            <h3>Assign New Task</h3>
                            <form onSubmit={handleAssign} style={{ display: 'grid', gap: '12px' }}>
                                <input className="input" placeholder="Title" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} required />
                                <textarea className="input" placeholder="Description" rows={3} value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} />
                                <input className="input" type="date" value={newTask.deadline} onChange={e => setNewTask({ ...newTask, deadline: e.target.value })} required />
                                <input className="input" placeholder="Employee User ID" value={newTask.userId} onChange={e => setNewTask({ ...newTask, userId: e.target.value })} required />

                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                    <button type="submit" className="btn-primary" style={{ flex: 1 }}>Assign</button>
                                    <button type="button" onClick={() => setActiveModal(null)} className="btn-light">Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* 2. Submit Modal (Employee) */}
            {
                activeModal === 'submit' && selectedTask && (
                    <div className="modal-overlay">
                        <div className="modal-box">
                            <h3>Submit Work: {selectedTask.title}</h3>
                            <form onSubmit={handleSubmitWork} style={{ display: 'grid', gap: '12px' }}>
                                <textarea className="input" placeholder="Notes..." rows={4} value={submission.notes} onChange={e => setSubmission({ ...submission, notes: e.target.value })} required />
                                <input className="input" type="text" placeholder="External Link (Optional)" value={submission.link} onChange={e => setSubmission({ ...submission, link: e.target.value })} />
                                <div style={{ border: '1px dashed #cbd5e1', padding: '10px', borderRadius: '8px' }}>
                                    <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Attach File</label>
                                    <input type="file" onChange={e => setSubmission({ ...submission, file: e.target.files[0] })} />
                                </div>

                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                    <button type="submit" className="btn-blue" style={{ flex: 1 }}>Send to HR <FaPaperPlane /></button>
                                    <button type="button" onClick={() => setActiveModal(null)} className="btn-light">Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* 3. Details Modal (View Attachments & Review) */}
            {
                activeModal === 'details' && selectedTask && (
                    <div className="modal-overlay">
                        <div className="modal-box wide">
                            <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '12px' }}>
                                <h3 style={{ margin: 0 }}>{selectedTask.title}</h3>
                                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                                    Status: <b>{selectedTask.status}</b> | Due: {new Date(selectedTask.deadline).toLocaleDateString()}
                                </div>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <h4 style={{ fontSize: '14px', margin: '0 0 8px' }}>Description</h4>
                                <p style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', fontSize: '13px', margin: 0 }}>
                                    {selectedTask.description || "No description."}
                                </p>
                            </div>

                            {/* HR Attachments (From HR to Employee) */}
                            {selectedTask.attachments && selectedTask.attachments.length > 0 && (
                                <div style={{ marginBottom: '20px' }}>
                                    <h4 style={{ fontSize: '14px', margin: '0 0 8px' }}>Attachments (From HR)</h4>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {selectedTask.attachments.map((file, idx) => (
                                            file.type === 'link' ? (
                                                <a key={idx} href={file.url} target="_blank" rel="noreferrer" className="file-chip">
                                                    🔗 {file.name || "Link"}
                                                </a>
                                            ) : (
                                                <button key={idx} onClick={() => handleDownload(selectedTask._id, file.url, file.name)} className="file-chip">
                                                    <FaDownload /> {file.name}
                                                </button>
                                            )
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Submission (From Employee to HR) */}
                            {selectedTask.submission && (
                                <div style={{ marginBottom: '20px', borderTop: '1px dashed #cbd5e1', paddingTop: '16px' }}>
                                    <h4 style={{ fontSize: '14px', margin: '0 0 8px', color: '#2563eb' }}>Employee Submission</h4>
                                    <p style={{ fontSize: '13px', marginBottom: '8px' }}><b>Notes:</b> {selectedTask.submission.notes}</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {selectedTask.submission.attachments && selectedTask.submission.attachments.map((file, idx) => (
                                            file.type === 'link' ? (
                                                <a key={idx} href={file.url} target="_blank" rel="noreferrer" className="file-chip blue">
                                                    🔗 {file.name || "Link"}
                                                </a>
                                            ) : (
                                                <button key={idx} onClick={() => handleDownload(selectedTask._id, file.url, file.name)} className="file-chip blue">
                                                    <FaDownload /> {file.name}
                                                </button>
                                            )
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                                <button type="button" onClick={() => setActiveModal(null)} className="btn-light">Close</button>

                                {isHR && selectedTask.status === 'Completed' && (
                                    <>
                                        <button onClick={() => handleReview(selectedTask._id, "Needs Rework")} className="btn-orange">Rework</button>
                                        <button onClick={() => handleReview(selectedTask._id, "Approved")} className="btn-green">Approve</button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* --- STYLES --- */}
            <style>{`
        .btn-primary { background: #10b981; color: white; border: none; padding: 10px 16px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: 0.2s; }
        .btn-primary:hover { background: #059669; }
        
        .btn-green { background: #10b981; color: white; border: none; padding: 8px 14px; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 13px; }
        .btn-blue { background: #2563eb; color: white; border: none; padding: 8px 14px; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 13px; }
        .btn-orange { background: #f59e0b; color: white; border: none; padding: 8px 14px; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 13px; }
        .btn-light { background: white; border: 1px solid #e2e8f0; color: #475569; padding: 8px 14px; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 13px; }
        .btn-light:hover { background: #f8fafc; color: #0f172a; }

        .task-card { 
            background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; 
            display: flex; justify-content: space-between; align-items: center; gap: 20px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); transition: 0.2s;
        }
        .task-card:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05); border-color: #10b981; }
        .card-actions { display: flex; gap: 8px; flex-direction: column; min-width: 100px; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 999; padding: 20px; }
        .modal-box { background: white; width: 100%; max-width: 500px; padding: 24px; border-radius: 20px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); animation: popIn 0.2s ease-out; }
        .modal-box.wide { max-width: 700px; }

        .input { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #cbd5e1; font-family: inherit; font-size: 14px; box-sizing: border-box; }
        .input:focus { outline: none; border-color: #10b981; box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1); }

        .file-chip { 
            display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; 
            background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 99px; 
            font-size: 12px; font-weight: 700; color: #475569; text-decoration: none; cursor: pointer;
        }
        .file-chip:hover { background: #e2e8f0; color: #0f172a; }
        .file-chip.blue { background: #eff6ff; border-color: #bfdbfe; color: #1e40af; }

        @media (max-width: 640px) {
            .task-card { flex-direction: column; align-items: flex-start; }
            .card-actions { flex-direction: row; width: 100%; }
            .card-actions button { flex: 1; }
        }
        @keyframes popIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
        </div >
    );
};

export default Tasks;