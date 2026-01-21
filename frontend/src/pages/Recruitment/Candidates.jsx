import React, { useEffect, useState } from "react";
import API from "../../services/api";
import { toast } from "react-toastify";
import { FaEnvelope, FaPhone, FaFilePdf, FaSearch, FaBriefcase, FaMoneyBillWave, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useClientPagination } from "../../utils/useClientPagination";

import Pagination from "../../components/Pagination";

const Candidates = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { fetchCandidates(); }, []);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const res = await API.get("/recruitment/candidates");
      setCandidates(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error("Failed to load candidates");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadResume = (c) => {
    if (c.resumeFile?.url) {
      window.open(`http://localhost:5000/${c.resumeFile.url}`, "_blank");
    } else {
      toast.error("No resume uploaded");
    }
  };

  const filtered = candidates.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const pager = useClientPagination(filtered);
  const { paginatedItems } = pager;

  return (
    <div className="page-container page-anim">
      <div className="header">
        <div>
          <h2>Candidate Database</h2>
          <p>Pool of applicants from all job posts.</p>
        </div>
        <div className="search-box">
          <FaSearch className="s-icon" />
          <input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="table-card">
        {loading ? (
          <div className="loader">Loading Candidates...</div>
        ) : paginatedItems.length === 0 ? (
          <div className="empty-state">No candidates found.</div>
        ) : (
          <div className="table-responsive">
            <table className="modern-table">
              <thead><tr><th>Candidate</th><th>Contact</th><th>Experience</th><th>CTC</th><th>Resume</th></tr></thead>
              <tbody>
                {paginatedItems.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <div className="user-cell">
                        <div className="avatar">{c.name.charAt(0)}</div>
                        <div><div className="name">{c.name}</div><div className="sub-text">Source: {c.source || "Portal"}</div></div>
                      </div>
                    </td>
                    <td><div className="contact-row"><FaEnvelope /> {c.email}</div><div className="contact-row"><FaPhone /> {c.mobile || "--"}</div></td>
                    <td><div className="badge-exp"><FaBriefcase /> {c.totalExperience} Years</div></td>
                    <td><div className="money-text"><FaMoneyBillWave /> {Number(c.expectedCTC).toLocaleString()}</div></td>
                    <td>
                      <button onClick={() => handleDownloadResume(c)} className={`resume-btn ${c.resumeFile ? 'active' : 'disabled'}`}>
                        <FaFilePdf /> {c.resumeFile ? "PDF" : "No File"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && filtered.length > 0 && (
          <div style={{ padding: '16px', borderTop: '1px solid #e2e8f0' }}>
            <Pagination pager={pager} />
          </div>
        )}
      </div>

      <style>{`
        .page-container { padding: 24px; max-width: 1400px; margin: 0 auto; font-family: 'Inter', sans-serif; }
        .page-anim { animation: fadeIn 0.4s ease-out; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
        .header h2 { margin: 0; font-size: 24px; color: #1e293b; font-weight: 800; }
        .header p { margin: 4px 0 0; color: #64748b; font-size: 14px; }
        
        .search-box { position: relative; width: 100%; max-width: 320px; }
        .search-box input { width: 100%; padding: 12px 12px 12px 40px; border: 1px solid #cbd5e1; border-radius: 12px; font-size: 14px; outline: none; }
        .s-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #94a3b8; }

        .table-card { background: white; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
        .modern-table { width: 100%; border-collapse: collapse; min-width: 900px; }
        .modern-table th { text-align: left; padding: 16px; background: #f8fafc; color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; }
        .modern-table td { padding: 16px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; color: #334155; font-size: 14px; }
        .user-cell { display: flex; align-items: center; gap: 12px; }
        .avatar { width: 40px; height: 40px; background: #eff6ff; color: #2563eb; border-radius: 50%; display: grid; place-items: center; font-weight: 700; font-size: 16px; }
        .name { font-weight: 700; color: #0f172a; }
        .sub-text { font-size: 12px; color: #94a3b8; margin-top: 2px; }
        .contact-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; font-size: 13px; color: #475569; }
        .contact-row svg { color: #94a3b8; }
        .badge-exp { display: inline-flex; align-items: center; gap: 6px; background: #f1f5f9; padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 13px; color: #475569; }
        .money-text { font-weight: 700; color: #059669; display: flex; align-items: center; gap: 6px; }
        .resume-btn { display: flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1px solid transparent; }
        .resume-btn.active { background: #fee2e2; color: #b91c1c; border-color: #fecaca; }
        .resume-btn.active:hover { background: #fecaca; }
        .resume-btn.disabled { background: #f1f5f9; color: #94a3b8; cursor: not-allowed; }
        .loader { padding: 40px; text-align: center; color: #64748b; }
        .empty-state { padding: 40px; text-align: center; color: #64748b; font-style: italic; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div >
  );
};

export default Candidates;