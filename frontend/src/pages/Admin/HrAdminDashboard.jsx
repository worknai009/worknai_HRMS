import React, { useEffect, useMemo, useRef, useState } from "react";
import API, { getApiErrorMessage } from "../../services/api";
import { useClientPagination } from "../../utils/useClientPagination";
import Pagination from "../../components/Pagination";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import {
  FaUsers,
  FaUserCheck,
  FaCalendarAlt,
  FaCheck,
  FaTimes,
  FaEye,
  FaTrash,
  FaBuilding,
  FaUmbrellaBeach,
  FaTasks,
  FaSyncAlt,
  FaPlus,
  FaClipboardList,
  FaFileAlt,
  FaLink,
  FaUserTie,
  FaRegClock,
  FaChalkboardTeacher,
  FaLayerGroup,
  FaDownload,
  FaBriefcase,
  FaEdit,
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

/* =========================
   FALLBACK REQUEST HELPERS
========================= */
const safeArray = (v) => (Array.isArray(v) ? v : []);

const tryGet = async (paths = []) => {
  let lastErr = null;
  for (const p of paths) {
    try {
      const res = await API.get(p);
      return res?.data;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
};

const tryPost = async (paths = [], payload = {}, config = undefined) => {
  let lastErr = null;
  for (const p of paths) {
    try {
      const res = await API.post(p, payload, config);
      return res?.data;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
};

const tryPut = async (paths = [], payload = {}) => {
  let lastErr = null;
  for (const p of paths) {
    try {
      const res = await API.put(p, payload);
      return res?.data;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
};

const tryDelete = async (paths = []) => {
  let lastErr = null;
  for (const p of paths) {
    try {
      const res = await API.delete(p);
      return res?.data;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
};

/* =========================
   UI MINI COMPONENTS
========================= */
const StatCard = ({ title, value, icon, tone = "orange" }) => {
  return (
    <div className={`stat-card tone-${tone}`}>
      <div className="stat-left">
        <div className="stat-value">{value}</div>
        <div className="stat-title">{title}</div>
      </div>
      <div className="stat-ic">{icon}</div>
    </div>
  );
};

const TabBtn = ({ active, onClick, icon, label, badge }) => (
  <button className={`tab-btn ${active ? "active" : ""}`} onClick={onClick} type="button">
    <span className="tab-ic">{icon}</span>
    <span className="tab-label">{label}</span>
    {badge ? <span className="tab-badge">{badge}</span> : null}
  </button>
);

const SubTabBtn = ({ active, onClick, icon, label, badge }) => (
  <button className={`subtab-btn ${active ? "active" : ""}`} onClick={onClick} type="button">
    <span className="subtab-ic">{icon}</span>
    <span className="subtab-label">{label}</span>
    {badge ? <span className="subtab-badge">{badge}</span> : null}
  </button>
);

const Pill = ({ text, tone = "neutral" }) => (
  <span className={`pill pill-${tone}`}>{String(text || "--")}</span>
);

const HrAdminDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  /* ================= STATE ================= */
  const { isLoaded: authLoaded } = useAuth(); // just to be safe if useAuth has properties

  // PAGINATION HOOKS
  // We use useClientPagination for each list. 
  // Note: Hooks must be called unconditionally.
  // We will pass the state arrays to them.

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const [activeTab, setActiveTab] = useState("employees");

  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [tasks, setTasks] = useState([]);

  // ✅ Recruitment sections
  const [interviews, setInterviews] = useState([]);
  const [applications, setApplications] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);

  // Onboarding
  const [templates, setTemplates] = useState([]);
  const [assignments, setAssignments] = useState([]);



  // --- PAGINATORS ---
  const employeesPager = useClientPagination(employees);
  const leavesPager = useClientPagination(leaves);
  const tasksPager = useClientPagination(tasks);
  const jobsPager = useClientPagination(jobs);
  const interviewsPager = useClientPagination(interviews);
  const applicationsPager = useClientPagination(applications);
  // (Templates/Assignments are short lists usually, but requirements say EVERY table)
  const templatesPager = useClientPagination(templates);
  const assignmentsPager = useClientPagination(assignments);

  // ✅ Recruitment Sub Tabs
  const [recruitmentTab, setRecruitmentTab] = useState("jobs"); // jobs | interviews | applications

  // Modals
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showAssignTaskModal, setShowAssignTaskModal] = useState(false);

  // Task Details
  const [showTaskDetailModal, setShowTaskDetailModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // Interview modal (Create/Edit)
  const [showScheduleInterviewModal, setShowScheduleInterviewModal] = useState(false);
  const [editingInterviewId, setEditingInterviewId] = useState(null);

  // ✅ Job modal (Create/Edit)
  const [showJobModal, setShowJobModal] = useState(false);
  const [editingJobId, setEditingJobId] = useState(null);

  // ✅ Paging & Search States
  const [jobPage, setJobPage] = useState(1);
  const [jobSearch, setJobSearch] = useState("");
  const [jobTotalPages, setJobTotalPages] = useState(1);
  const [jobDebouncer, setJobDebouncer] = useState(null);

  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showAssignOnboardingModal, setShowAssignOnboardingModal] = useState(false);

  const [selectedEmp, setSelectedEmp] = useState(null);

  // Forms
  const [approveForm, setApproveForm] = useState({ basicSalary: "", joiningDate: "" });
  const [holidayForm, setHolidayForm] = useState({ date: "", reason: "" });

  // Task Form
  const [taskForm, setTaskForm] = useState({
    userId: "",
    title: "",
    priority: "Medium",
    deadline: "",
    link: "",
    files: [],
  });

  // Interview form
  const [interviewForm, setInterviewForm] = useState({
    applicationId: "",
    scheduledAt: "",
    mode: "Online",
    meetingLink: "",
    location: "",
    notes: "",
  });

  // ✅ Job form (minimal)
  const [jobForm, setJobForm] = useState({
    title: "",
    department: "",
    employmentType: "Full-time",
    status: "Open",
    location: "",
    description: "",
    experience: "",
    skills: "",
    education: "",
    salaryRange: "",
    openings: 1,
    deadline: "",
  });

  // Template + Assignment forms
  const [templateForm, setTemplateForm] = useState({
    title: "",
    description: "",
    itemsText: "",
  });

  const [assignForm, setAssignForm] = useState({
    userId: "",
    templateId: "",
    dueDate: "",
    note: "",
  });

  const mountedRef = useRef(true);

  /* ================= HELPERS ================= */
  const normalizeEmployee = (e) => {
    const statusRaw = String(e?.status || "").toLowerCase();
    const approved = typeof e?.isApproved === "boolean" ? e.isApproved : statusRaw === "active";
    const status = approved ? "Active" : e?.status || "Pending";
    return {
      ...e,
      isApproved: approved,
      status,
    };
  };

  const sanitizePayload = (obj) => {
    const out = {};
    Object.keys(obj || {}).forEach((k) => {
      const v = obj[k];
      if (v === null || v === undefined) return;
      if (typeof v === "string" && v.trim() === "") return;
      out[k] = v;
    });
    return out;
  };

  const toDateTimeLocal = (d) => {
    if (!d) return "";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    const yyyy = dt.getFullYear();
    const mm = pad(dt.getMonth() + 1);
    const dd = pad(dt.getDate());
    const hh = pad(dt.getHours());
    const mi = pad(dt.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  };

  /* ================= STATS ================= */
  const pendingLeaves = useMemo(
    () => leaves.filter((l) => String(l?.status || "").toLowerCase() === "pending").length,
    [leaves]
  );

  const pendingApprovals = useMemo(
    () => employees.filter((e) => !normalizeEmployee(e).isApproved).length,
    [employees]
  );

  const activeEmployees = useMemo(
    () => employees.filter((e) => normalizeEmployee(e).isApproved).length,
    [employees]
  );

  // Applications pending
  const pendingApps = useMemo(
    () => applications.filter((a) => String(a?.stage || "").toLowerCase() === "applied").length,
    [applications]
  );

  const upcomingInterviewsCount = useMemo(() => {
    const now = Date.now();
    return interviews.filter((i) => {
      const t = i?.scheduledAt || i?.dateTime || i?.date || i?.createdAt;
      const ms = t ? new Date(t).getTime() : 0;
      const st = String(i?.status || "scheduled").toLowerCase();
      return ms >= now && !["cancelled", "canceled", "rejected"].includes(st);
    }).length;
  }, [interviews]);

  const pendingOnboardingCount = useMemo(() => {
    return assignments.filter((a) => {
      const st = String(a?.status || a?.state || "pending").toLowerCase();
      return ["pending", "in-progress", "assigned"].includes(st);
    }).length;
  }, [assignments]);

  const statsCards = useMemo(() => {
    return [
      { title: "Total Staff", value: employees.length, icon: <FaUsers />, tone: "orange" },
      { title: "Approvals", value: pendingApprovals, icon: <FaUserCheck />, tone: "red" },
      { title: "Leave Requests", value: pendingLeaves, icon: <FaCalendarAlt />, tone: "blue" },
      { title: "Active", value: activeEmployees, icon: <FaCheck />, tone: "green" },
      { title: "Upcoming Interviews", value: upcomingInterviewsCount, icon: <FaChalkboardTeacher />, tone: "violet" },
      { title: "Onboarding Pending", value: pendingOnboardingCount, icon: <FaLayerGroup />, tone: "teal" },
    ];
  }, [employees.length, pendingApprovals, pendingLeaves, activeEmployees, upcomingInterviewsCount, pendingOnboardingCount]);

  /* ================= FETCH DASHBOARD ================= */
  // New fetchJobs function -> now fetches all
  const fetchJobs = async (search = "") => {
    try {
      // Backend ignores page/limit now, but we keep search
      const query = `?limit=1000${search ? `&search=${encodeURIComponent(search)}` : ""}`;
      const res = await tryGet([`/recruitment/jobs${query}`, `/jobs${query}`]);

      if (res?.data && Array.isArray(res.data)) {
        setJobs(res.data);
      } else if (Array.isArray(res)) {
        setJobs(res);
      }
    } catch (e) {
      console.error("Fetch jobs error", e);
    }
  };

  // Debounced search effect
  useEffect(() => {
    if (mountedRef.current) {
      const handler = setTimeout(() => {
        fetchJobs(jobSearch);
      }, 800);
      return () => clearTimeout(handler);
    }
  }, [jobSearch]);

  useEffect(() => {
    mountedRef.current = true;
    fetchDashboardData(false);
    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboardData = async (isSync = false) => {
    try {
      isSync ? setSyncing(true) : setLoading(true);

      const [empRes, leaveRes, taskRes, interviewRes, appRes, candRes, jobsRes, tempRes, assignRes] =
        await Promise.allSettled([
          tryGet(["/company/employees", "/hr/employees"]),
          tryGet(["/leaves/all", "/leave/all"]),
          tryGet(["/tasks/all"]),
          tryGet(["/recruitment/interviews", "/interviews"]),
          tryGet(["/recruitment/applications", "/applications"]).catch(() => []),
          tryGet(["/recruitment/candidates", "/candidates"]).catch(() => []),
          // fetch jobs with current state params
          tryGet([`/recruitment/jobs`, `/jobs`]).catch(() => []),
          tryGet(["/onboarding/templates", "/onboarding/template"]).catch(() => []),
          tryGet(["/onboarding/assignments", "/onboarding/assignment"]).catch(() => []),
        ]);

      if (!mountedRef.current) return;

      const empData = empRes.status === "fulfilled" ? safeArray(empRes.value) : [];
      const leaveData = leaveRes.status === "fulfilled" ? safeArray(leaveRes.value) : [];

      // ✅ FIX: tasks may come as { items: [] }
      const rawTasks = taskRes.status === "fulfilled" ? taskRes.value : {};
      const taskData = Array.isArray(rawTasks) ? rawTasks : rawTasks.items || [];

      setEmployees(empData.map(normalizeEmployee));
      setLeaves(leaveData);
      setTasks(taskData);

      setInterviews(interviewRes.status === "fulfilled" ? safeArray(interviewRes.value) : []);
      setApplications(appRes.status === "fulfilled" ? safeArray(appRes.value) : []);
      setCandidates(candRes.status === "fulfilled" ? safeArray(candRes.value) : []);

      const jRes = jobsRes.status === "fulfilled" ? jobsRes.value : [];
      if (jRes?.data && Array.isArray(jRes.data)) {
        setJobs(jRes.data);
        setJobTotalPages(jRes.totalPages || 1);
      } else {
        setJobs(safeArray(jRes));
      }

      setTemplates(tempRes.status === "fulfilled" ? safeArray(tempRes.value) : []);
      setAssignments(assignRes.status === "fulfilled" ? safeArray(assignRes.value) : []);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Failed to load dashboard"));
    } finally {
      if (!mountedRef.current) return;
      isSync ? setSyncing(false) : setLoading(false);
    }
  };

  /* ================= ACTIONS ================= */
  // Employee Approval
  const initiateApproval = (emp) => {
    setSelectedEmp(emp);
    setApproveForm({
      basicSalary: "",
      joiningDate: new Date().toISOString().split("T")[0],
    });
    setShowApproveModal(true);
  };

  const submitApproval = async (e) => {
    e.preventDefault();
    if (!selectedEmp?._id) return;

    try {
      await tryPost(["/company/employee/approve", "/hr/employee/approve"], { userId: selectedEmp._id, ...approveForm });
      toast.success(`${selectedEmp.name} is now Active! 🚀`);
      setShowApproveModal(false);
      fetchDashboardData(true);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Approval Failed"));
    }
  };

  // Delete employee
  const handleDelete = async (userId, name) => {
    if (!window.confirm(`Delete ${name}?`)) return;
    try {
      await tryDelete([`/company/employee/${userId}`, `/hr/employee/${userId}`]);
      toast.success("Employee Deleted");
      fetchDashboardData(true);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Delete failed"));
    }
  };

  // Leave action
  const handleLeaveAction = async (leaveId, status) => {
    try {
      await tryPut(["/leaves/update-status", "/leave/update-status"], { leaveId, status });
      toast.success(`Request ${status}`);
      fetchDashboardData(true);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Action failed"));
    }
  };

  // Holiday
  const markHoliday = async () => {
    if (!holidayForm.date || !holidayForm.reason) return toast.warning("Fields required");
    try {
      await tryPost(["/hr/holiday", "/company/holiday"], holidayForm);
      toast.success("Holiday Marked! 🎉");
      setHolidayForm({ date: "", reason: "" });
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to mark holiday"));
    }
  };

  // Assign Task (multipart)
  const handleAssignTask = async (e) => {
    e.preventDefault();

    if (!taskForm.userId || !taskForm.title || !taskForm.deadline) {
      toast.warning("Please fill required fields");
      return;
    }

    const filesArr = taskForm.files ? Array.from(taskForm.files) : [];
    if (filesArr.length > 3) {
      toast.warning("Max 3 files allowed");
      return;
    }

    const formData = new FormData();
    formData.append("userId", taskForm.userId);
    formData.append("title", taskForm.title);
    formData.append("priority", taskForm.priority);
    formData.append("deadline", taskForm.deadline);
    if (taskForm.link) formData.append("externalLink", taskForm.link);
    filesArr.forEach((f) => formData.append("files", f));

    try {
      await tryPost(["/tasks/assign"], formData, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Task assigned successfully! 📂");
      setShowAssignTaskModal(false);
      setTaskForm({ userId: "", title: "", priority: "Medium", deadline: "", link: "", files: [] });
      fetchDashboardData(true);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Task assignment failed"));
    }
  };

  // Secure File Download
  const handleTaskFileDownload = async (taskId, fileUrl, fileName) => {
    try {
      const response = await API.get(`/tasks/download/${taskId}`, {
        params: { url: fileUrl },
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName || "download");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.error("Download Error", e);
      toast.error("Download failed. File might be missing or access denied.");
    }
  };

  const openTaskDetails = (task) => {
    setSelectedTask(task);
    setShowTaskDetailModal(true);
  };

  const handleTaskReview = async (taskId, newStatus) => {
    try {
      let action = "Approved";
      if (newStatus === "Verified") action = "Approved";
      if (newStatus === "In Progress" || newStatus === "Needs Rework") action = "Needs Rework";

      await tryPut([`/tasks/review/${taskId}`], { action, comment: "Admin Dashboard Action" });

      toast.success(`Task status updated: ${newStatus}`);
      setShowTaskDetailModal(false);
      fetchDashboardData(true);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Update failed"));
    }
  };

  /* ================= RECRUITMENT CRUD ================= */

  // Jobs
  const openCreateJob = () => {
    setEditingJobId(null);
    setJobForm({
      title: "",
      department: "",
      employmentType: "Full-time",
      status: "Open",
      location: "",
      description: "",
      experience: "",
      skills: "",
      education: "",
      salaryRange: "",
      openings: 1,
      deadline: "",
    });
    setShowJobModal(true);
  };

  const openEditJob = (job) => {
    setEditingJobId(job?._id || null);
    setJobForm({
      title: job?.title || "",
      department: job?.department || job?.dept || "",
      employmentType: job?.employmentType || job?.type || "Full-time",
      status: job?.status || "Open",
      location: job?.location || "",
      description: job?.description || "",
      experience: job?.experience || "",
      skills: Array.isArray(job?.skills) ? job.skills.join(", ") : (job?.skills || ""),
      education: job?.education || "",
      salaryRange: job?.salaryRange || "",
      openings: job?.openings || 1,
      deadline: job?.deadline ? new Date(job.deadline).toISOString().split('T')[0] : "",
    });
    setShowJobModal(true);
  };

  const submitJob = async (e) => {
    e.preventDefault();
    const payload = sanitizePayload({ ...jobForm });

    if (!payload.title || !payload.department) {
      toast.warning("Title + Department required");
      return;
    }

    try {
      if (editingJobId) {
        await tryPut([`/recruitment/job/${editingJobId}`, `/recruitment/jobs/${editingJobId}`, `/jobs/${editingJobId}`], payload);
        toast.success("Job updated ✅");
      } else {
        await tryPost(["/recruitment/job", "/recruitment/jobs", "/jobs"], payload);
        toast.success("Job created ✅");
      }
      setShowJobModal(false);
      fetchDashboardData(true);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Job save failed (routes mismatch?)"));
    }
  };

  const deleteJob = async (jobId, title) => {
    if (!window.confirm(`Delete job: ${title || "this job"} ?`)) return;
    try {
      await tryDelete([`/recruitment/job/${jobId}`, `/recruitment/jobs/${jobId}`, `/jobs/${jobId}`]);
      toast.success("Job deleted ✅");
      fetchDashboardData(true);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Delete job failed"));
    }
  };

  // Interviews
  const openScheduleInterview = () => {
    setEditingInterviewId(null);
    setInterviewForm({
      applicationId: "",
      scheduledAt: "",
      mode: "Video",
      meetingLink: "",
      location: "",
      notes: "",
    });
    setShowScheduleInterviewModal(true);
  };

  const openEditInterview = (i) => {
    setEditingInterviewId(i?._id || null);
    setInterviewForm({
      applicationId: i?.applicationId?._id || i?.applicationId || "",
      scheduledAt: toDateTimeLocal(i?.scheduledAt || i?.dateTime || i?.date || ""),
      mode: i?.mode || "Video",
      meetingLink: i?.meetingLink || "",
      location: i?.location || "",
      notes: i?.notes || "",
    });
    setShowScheduleInterviewModal(true);
  };

  const submitScheduleInterview = async (e) => {
    e.preventDefault();
    if (!interviewForm.applicationId || !interviewForm.scheduledAt) {
      toast.warning("Application + DateTime required");
      return;
    }

    try {
      const basePayload = {
        applicationId: interviewForm.applicationId,
        scheduledAt: new Date(interviewForm.scheduledAt).toISOString(),
        mode: interviewForm.mode,
        meetingLink: interviewForm.meetingLink,
        location: interviewForm.location,
        notes: interviewForm.notes,
      };

      const payload = sanitizePayload(basePayload);

      if (editingInterviewId) {
        await tryPut(
          [
            `/recruitment/interview/${editingInterviewId}`,
            `/recruitment/interviews/${editingInterviewId}`,
            `/interviews/${editingInterviewId}`,
          ],
          payload
        );
        toast.success("Interview updated ✅");
      } else {
        await tryPost(["/recruitment/interview", "/recruitment/interviews", "/interviews"], payload);
        toast.success("Interview scheduled ✅");
      }

      setShowScheduleInterviewModal(false);
      fetchDashboardData(true);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to schedule interview (route/fields mismatch?)"));
    }
  };

  const deleteInterview = async (interviewId) => {
    if (!window.confirm("Delete this interview?")) return;
    try {
      await tryDelete([
        `/recruitment/interview/${interviewId}`,
        `/recruitment/interviews/${interviewId}`,
        `/interviews/${interviewId}`,
      ]);
      toast.success("Interview deleted ✅");
      fetchDashboardData(true);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Delete interview failed"));
    }
  };

  // Applications (stage update + delete)
  const APP_STAGES = ["Applied", "Screening", "Interview", "Offered", "Hired", "Rejected"];

  // ✅ FIX: stable stage update (new Application model)
  const updateApplicationStage = async (applicationId, stage) => {
    try {
      await tryPut([`/recruitment/application/${applicationId}/stage`], { stage });
      toast.success(`Stage updated: ${stage}`);
      fetchDashboardData(true);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Stage update failed"));
    }
  };

  const deleteApplication = async (applicationId) => {
    if (!window.confirm("Delete this application?")) return;
    try {
      await tryDelete([`/recruitment/application/${applicationId}`, `/recruitment/applications/${applicationId}`, `/applications/${applicationId}`]);
      toast.success("Application deleted ✅");
      fetchDashboardData(true);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Delete application failed"));
    }
  };

  /* ================= TABLE HELPERS ================= */
  const fmtDate = (d) => {
    if (!d) return "--";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "--";
    return dt.toLocaleDateString();
  };

  const fmtDateTime = (d) => {
    if (!d) return "--";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "--";
    return dt.toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTaskAttachments = (task) => {
    const a = task?.attachments || task?.files || task?.docs || [];
    return Array.isArray(a) ? a : [];
  };

  if (loading) {
    return (
      <div className="loader-screen">
        <div className="loader-card">
          <div className="spinner" />
          <div className="ld-text">
            <div className="ld-title">Loading HR Dashboard…</div>
            <div className="ld-sub">Syncing employees, leaves, tasks, onboarding & interviews</div>
          </div>
        </div>
        <style>{`
          .loader-screen{min-height:100vh;display:grid;place-items:center;background:#f8fafc;padding:20px;font-family:Inter,system-ui}
          .loader-card{display:flex;gap:14px;align-items:center;background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:18px 20px;box-shadow:0 10px 30px rgba(0,0,0,.06)}
          .spinner{width:38px;height:38px;border-radius:50%;border:4px solid #e5e7eb;border-top-color:#ea580c;animation:spin 1s linear infinite}
          .ld-title{font-weight:950;color:#111827}
          .ld-sub{color:#6b7280;font-weight:700;font-size:13px;margin-top:2px}
          @keyframes spin{to{transform:rotate(360deg)}}
          .pagination-controls {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 12px;
            margin-top: 10px;
            padding: 10px 0;
          }
          .pg-btn {
            display: flex;
            align-items: center;
            gap: 6px;
            background: #fff;
            border: 1px solid #e2e8f0;
            padding: 6px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            color: #64748b;
            transition: all 0.2s;
          }
          .pg-btn:hover:not(:disabled) {
            border-color: #cbd5e1;
            color: #334155;
          }
          .pg-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          .pg-info {
            font-size: 13px;
            color: #475569;
            font-weight: 500;
          }
          .search-box-sm {
              display: flex;
              align-items: center;
              background: #fff;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 4px 10px;
              width: 200px;
          }
          .search-ic { color: #94a3b8; font-size: 12px; margin-right: 8px; }
          .search-box-sm input {
              border: none;
              outline: none;
              font-size: 13px;
              width: 100%;
              color: #334155;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="hr-dashboard">
      {/* HEADER */}
      <header className="dashboard-header">
        <div className="header-title">
          <div className="icon-box-header">
            <FaBuilding />
          </div>
          <div>
            <h1>HR Portal</h1>
            <p>Admin Dashboard</p>
          </div>
        </div>

        <div className="header-actions">
          <button className="btn-refresh" onClick={() => fetchDashboardData(true)} disabled={syncing}>
            <FaSyncAlt className={syncing ? "spin" : ""} /> {syncing ? "Syncing…" : "Sync Data"}
          </button>

          <button className="btn-ghost" onClick={logout} title="Logout" type="button">
            Logout
          </button>
        </div>
      </header>

      {/* STATS */}
      <div className="stats-strip">
        {statsCards.map((s, idx) => (
          <StatCard key={idx} title={s.title} value={s.value} icon={s.icon} tone={s.tone} />
        ))}
      </div>

      {/* TOP TABS */}
      <div className="tabs-wrapper">
        <div className="tabs-container">
          <TabBtn active={activeTab === "employees"} onClick={() => setActiveTab("employees")} icon={<FaUsers />} label="Directory" />
          <TabBtn
            active={activeTab === "recruitment"}
            onClick={() => {
              setActiveTab("recruitment");
            }}
            icon={<FaBriefcase />}
            label="Recruitment"
            badge={pendingApps}
          />
          <TabBtn active={activeTab === "tasks"} onClick={() => setActiveTab("tasks")} icon={<FaTasks />} label="Tasks" />
          <TabBtn
            active={activeTab === "leaves"}
            onClick={() => setActiveTab("leaves")}
            icon={<FaCalendarAlt />}
            label="Leaves"
            badge={pendingLeaves > 0 ? pendingLeaves : null}
          />

          {/* ✅ REMOVED DUPLICATE TOP-LEVEL INTERVIEWS TAB */}

          <TabBtn
            active={activeTab === "onboarding"}
            onClick={() => setActiveTab("onboarding")}
            icon={<FaLayerGroup />}
            label="Onboarding"
            badge={pendingOnboardingCount}
          />
          <TabBtn active={activeTab === "holidays"} onClick={() => setActiveTab("holidays")} icon={<FaUmbrellaBeach />} label="Holidays" />
        </div>
      </div>

      {/* CONTENT */}
      <div className="content-panel animate-up">
        {/* ================= RECRUITMENT TAB (NOW WITH SUB-TABS + CRUD) ================= */}
        {activeTab === "recruitment" && (
          <div className="recruitment-wrap">
            <div className="recruitment-head">
              <div className="section-head" style={{ marginBottom: 10 }}>
                <h3>
                  <FaBriefcase /> Recruitment
                </h3>
                <div className="head-actions">
                  <button className="btn-secondary-sm" onClick={() => fetchDashboardData(true)} type="button">
                    <FaSyncAlt className={syncing ? "spin" : ""} /> Refresh
                  </button>
                </div>
              </div>

              <div className="subtabs">
                <SubTabBtn
                  active={recruitmentTab === "jobs"}
                  onClick={() => setRecruitmentTab("jobs")}
                  icon={<FaBriefcase />}
                  label="Job Openings"
                  badge={jobs.length ? jobs.length : null}
                />
                <SubTabBtn
                  active={recruitmentTab === "interviews"}
                  onClick={() => setRecruitmentTab("interviews")}
                  icon={<FaChalkboardTeacher />}
                  label="Interviews"
                  badge={upcomingInterviewsCount ? upcomingInterviewsCount : null}
                />
                <SubTabBtn
                  active={recruitmentTab === "applications"}
                  onClick={() => setRecruitmentTab("applications")}
                  icon={<FaFileAlt />}
                  label="Applications"
                  badge={pendingApps ? pendingApps : null}
                />
              </div>
            </div>

            {/* JOBS */}
            {recruitmentTab === "jobs" && (
              <div className="recruitment-card">
                <div className="section-head">
                  <h3>
                    <FaBriefcase /> Job Openings
                  </h3>
                  <div className="head-actions">
                    <div className="search-box-sm">
                      <FaSearch className="search-ic" />
                      <input
                        type="text"
                        placeholder="Search jobs..."
                        value={jobSearch}
                        onChange={(e) => setJobSearch(e.target.value)}
                      />
                    </div>
                    <button className="btn-primary-sm" onClick={openCreateJob} type="button">
                      <FaPlus /> Add Job
                    </button>
                    <button className="btn-secondary-sm" onClick={() => navigate("/hr/recruitment/jobs")} type="button">
                      Manage PAGE
                    </button>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="modern-table compact">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Dept</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobsPager.paginatedItems.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="empty-row">
                            No jobs found.
                          </td>
                        </tr>
                      ) : (
                        jobsPager.paginatedItems.map((j) => {
                          const st = String(j?.status || "Open");
                          const tone = st.toLowerCase() === "open" ? "green" : st.toLowerCase() === "closed" ? "red" : "info";
                          return (
                            <tr key={j._id}>
                              <td>
                                <strong>{j.title || "--"}</strong>
                                <div className="muted text-sm">{j.location || ""}</div>
                              </td>
                              <td>{j.department || j.dept || "--"}</td>
                              <td>{j.employmentType || j.type || "--"}</td>
                              <td>
                                <Pill text={st} tone={tone} />
                              </td>
                              <td className="text-right">
                                <div className="action-row right-align">
                                  <button className="btn-icon view" type="button" title="Edit" onClick={() => openEditJob(j)}>
                                    <FaEdit />
                                  </button>
                                  <button className="btn-icon delete" type="button" title="Delete" onClick={() => deleteJob(j._id, j.title)}>
                                    <FaTrash />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>


                {/* JOBS PAGINATION */}
                <div className="section-foot">
                  <Pagination pager={jobsPager} />
                </div>
              </div>
            )}


            {/* INTERVIEWS */}
            {recruitmentTab === "interviews" && (
              <div className="recruitment-card">
                {/* ... table ... */}
                <div className="table-responsive">
                  <table className="modern-table compact">
                    {/* ... theads ... */}
                    <thead>
                      <tr>
                        <th>Candidate</th>
                        <th>Job</th>
                        <th>Time</th>
                        <th>Mode</th>
                        <th>Status</th>
                        <th>Response</th>
                        <th>Link/Location</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {interviewsPager.paginatedItems.length === 0 ? (
                        <tr><td colSpan="8" className="empty-row">No interviews yet.</td></tr>
                      ) : (
                        interviewsPager.paginatedItems.map((i) => {
                          const when = i?.scheduledAt || i?.dateTime || i?.createdAt;
                          const cand = i?.applicationId?.candidate?.name || i?.applicationId?.candidateId?.name || i?.candidateId?.name || "Unknown Candidate";
                          const job = i?.applicationId?.jobId?.title || i?.jobId?.title || "Unknown Job";
                          const mode = i?.mode || "Online";
                          const st = String(i?.status || "Scheduled");
                          const stKey = st.toLowerCase().replace(/\s+/g, "-");
                          const link = i?.meetingLink || "";
                          const location = i?.location || "";
                          const cRes = i?.candidateResponse || 'Pending';
                          const cResColor = cRes === 'Confirmed' ? '#22c55e' : cRes === 'Declined' ? '#ef4444' : '#f59e0b';
                          const cResBg = cRes === 'Confirmed' ? '#dcfce7' : cRes === 'Declined' ? '#fee2e2' : '#fef3c7';

                          return (
                            <tr key={i._id}>
                              <td><strong>{cand}</strong></td>
                              <td>{job}</td>
                              <td><div className="dt"><FaRegClock className="dt-ic" /> {fmtDateTime(when)}</div></td>
                              <td>{mode}</td>
                              <td><span className={`status-pill ${stKey}`}>{st}</span></td>
                              <td>
                                <span style={{ padding: '4px 8px', borderRadius: '4px', background: cResBg, color: cResColor, fontWeight: 700, fontSize: '0.75rem' }}>
                                  {cRes}
                                </span>
                              </td>
                              <td>
                                {link ? <a className="chip-link" href={link} target="_blank" rel="noreferrer"><FaLink /> Join</a> : location ? <span className="muted">{location}</span> : <span className="muted">—</span>}
                              </td>
                              <td className="text-right">
                                <div className="action-row right-align">
                                  <button className="btn-icon view" type="button" title="Edit" onClick={() => openEditInterview(i)}><FaEdit /></button>
                                  <button className="btn-icon delete" type="button" title="Delete" onClick={() => deleteInterview(i._id)}><FaTrash /></button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="section-foot">
                  <Pagination pager={interviewsPager} />
                </div>
              </div >
            )}

            {/* APPLICATIONS */}
            {recruitmentTab === "applications" && (
              <div className="recruitment-card">
                <div className="section-head">
                  <h3><FaFileAlt /> Applications</h3>
                  <div className="head-actions">
                    <button className="btn-secondary-sm" onClick={() => navigate("/hr/recruitment/applications")} type="button">View All (Page)</button>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="modern-table compact">
                    <thead><tr><th>Candidate</th><th>Job</th><th>Applied</th><th>Stage</th><th className="text-right">Actions</th></tr></thead>
                    <tbody>
                      {applicationsPager.paginatedItems.length === 0 ? (
                        <tr><td colSpan="5" className="empty-row">No applications found.</td></tr>
                      ) : (
                        applicationsPager.paginatedItems.map((a) => {
                          const cand = a?.candidate?.name || a?.candidateId?.name || "Unknown";
                          const email = a?.candidate?.email || a?.candidateId?.email || "";
                          const job = a?.jobId?.title || a?.job?.title || "Role";
                          const appliedAt = a?.appliedAt || a?.createdAt;
                          const stage = a?.stage || "Applied";
                          const stageTone = String(stage).toLowerCase() === "rejected" ? "red" : String(stage).toLowerCase() === "hired" ? "green" : "blue";
                          return (
                            <tr key={a._id}>
                              <td><strong>{cand}</strong><div className="muted text-sm">{email}</div></td>
                              <td>{job}</td>
                              <td>{fmtDate(appliedAt)}</td>
                              <td>
                                <div className="stage-cell">
                                  <Pill text={stage} tone={stageTone} />
                                  <select className="stage-select" value={stage} onChange={(e) => updateApplicationStage(a._id, e.target.value)}>
                                    {APP_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                                  </select>
                                </div>
                              </td>
                              <td className="text-right">
                                <div className="action-row right-align">
                                  <button className="btn-icon view" type="button" title="View (page)" onClick={() => navigate("/hr/recruitment/applications")}><FaEye /></button>
                                  <button className="btn-icon delete" type="button" title="Delete" onClick={() => deleteApplication(a._id)}><FaTrash /></button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="section-foot">
                  <Pagination pager={applicationsPager} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= EMPLOYEES ================= */}
        {activeTab === "employees" && (
          <div className="table-responsive">
            <div className="section-head">
              <h3><FaUsers /> Employee Directory</h3>
              <div className="head-actions">
                <button className="btn-secondary-sm" onClick={() => navigate("/admin/hr-payroll-slip")} type="button"><FaFileAlt /> Payroll Slip</button>
              </div>
            </div>

            <table className="modern-table">
              <thead><tr><th>Profile</th><th>Designation</th><th>Status</th><th>Salary</th><th>Joined</th><th className="text-right">Actions</th></tr></thead>
              <tbody>
                {employeesPager.paginatedItems.length === 0 ? (
                  <tr><td colSpan="6" className="empty-row">No employees found.</td></tr>
                ) : (
                  employeesPager.paginatedItems.map((emp) => {
                    const n = normalizeEmployee(emp);
                    return (
                      <tr key={emp._id}>
                        <td>
                          <div className="user-cell">
                            <div className="avatar-circle">{String(emp?.name || "U").charAt(0)}</div>
                            <div><strong>{emp?.name || "--"}</strong><small>{emp?.email || "--"}</small></div>
                          </div>
                        </td>
                        <td><span className="role-tag">{emp?.designation || emp?.role || "—"}</span></td>
                        <td><span className={`status-pill ${String(n.status).toLowerCase()}`}>{n.status}</span></td>
                        <td>₹{Number(emp?.basicSalary || 0).toLocaleString()}</td>
                        <td>{emp?.joiningDate ? fmtDate(emp.joiningDate) : "--"}</td>
                        <td className="text-right">
                          <div className="action-row right-align">
                            {!n.isApproved ? (<button className="btn-icon approve" onClick={() => initiateApproval(emp)} title="Approve" type="button"><FaCheck /></button>) : null}
                            <button className="btn-icon view" onClick={() => navigate(`/hr/view-employee/${emp._id}`)} title="View" type="button"><FaEye /></button>
                            <button className="btn-icon delete" onClick={() => handleDelete(emp._id, emp.name)} title="Delete" type="button"><FaTrash /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            <div className="section-foot">
              <Pagination pager={employeesPager} />
            </div>
          </div>
        )}

        {/* ================= TASKS ================= */}
        {
          activeTab === "tasks" && (
            <div className="task-section">
              <div className="section-head">
                <h3>
                  <FaClipboardList /> Task Workflow
                </h3>
                <div className="head-actions">
                  <button className="btn-primary-sm" onClick={() => setShowAssignTaskModal(true)} type="button">
                    <FaPlus /> Assign Task
                  </button>
                </div>
              </div>

              <div className="table-responsive">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Assigned To</th>
                      <th>Task</th>
                      <th>Priority</th>
                      <th>Deadline</th>
                      <th>Status</th>
                      <th>Files/Link</th>
                      <th className="text-right">Admin Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasksPager.paginatedItems.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="empty-row">
                          No tasks yet. Assign a new task to start.
                        </td>
                      </tr>
                    ) : (
                      tasksPager.paginatedItems.map((task) => {
                        const atts = getTaskAttachments(task);
                        const link = task?.externalLink || task?.link || "";
                        const status = String(task?.status || "In Progress");
                        const statusKey = status.toLowerCase().replace(/\s+/g, "-");
                        const pri = String(task?.priority || "Medium");
                        const priKey = pri.toLowerCase();

                        return (
                          <tr key={task._id}>
                            <td>
                              <strong>{task?.assignedTo?.name || task?.userId?.name || "Unknown"}</strong>
                            </td>
                            <td>{task?.title || "--"}</td>
                            <td>
                              <span className={`priority-badge ${priKey}`}>{pri}</span>
                            </td>
                            <td>{task?.deadline ? fmtDate(task.deadline) : "--"}</td>
                            <td>
                              <span className={`status-pill ${statusKey}`}>{status}</span>
                            </td>

                            <td>
                              <div className="files-cell">
                                {link ? (
                                  <a className="chip-link" href={link} target="_blank" rel="noreferrer">
                                    <FaLink /> Link
                                  </a>
                                ) : (
                                  <span className="muted">—</span>
                                )}

                                {atts.length ? (
                                  <div className="chip-row">
                                    {atts.slice(0, 3).map((a, idx) => (
                                      <button
                                        key={idx}
                                        className="chip-file"
                                        type="button"
                                        onClick={() => handleTaskFileDownload(task._id, a.url, a.originalName || a.name)}
                                      >
                                        <FaFileAlt /> {a?.originalName || a?.filename || `File-${idx + 1}`}
                                      </button>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            </td>

                            <td className="text-right">
                              <div className="action-row j-end">
                                <button className="btn-xs view-details" onClick={() => openTaskDetails(task)} type="button">
                                  <FaEye /> View
                                </button>

                                {String(status).toLowerCase() === "completed" && (
                                  <>
                                    <button className="btn-xs approve" onClick={() => handleTaskReview(task._id, "Verified")} type="button">
                                      Verify
                                    </button>
                                    <button className="btn-xs reject" onClick={() => handleTaskReview(task._id, "In Progress")} type="button">
                                      Redo
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>

                <div className="section-foot">
                  <Pagination pager={tasksPager} />
                </div>
              </div>
            </div>
          )
        }

        {/* ================= LEAVES ================= */}
        {
          activeTab === "leaves" && (
            <div className="table-responsive">
              <div className="section-head">
                <h3>
                  <FaCalendarAlt /> Leave Requests
                </h3>
              </div>

              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Type</th>
                    <th>Duration</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {leavesPager.paginatedItems.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="empty-row">
                        No leave requests found.
                      </td>
                    </tr>
                  ) : (
                    leavesPager.paginatedItems.map((l) => {
                      const st = String(l?.status || "Pending");
                      const stKey = st.toLowerCase();
                      const leaveType = String(l?.leaveType || l?.type || "Paid");
                      const ltKey = leaveType.toLowerCase().includes("unpaid") ? "unpaid" : "paid";

                      return (
                        <tr key={l._id}>
                          <td>
                            <strong>{l?.userId?.name || l?.employee?.name || "—"}</strong>
                          </td>
                          <td>
                            <span className={`type-badge ${ltKey}`}>{leaveType}</span>
                          </td>
                          <td>
                            {l?.startDate ? fmtDate(l.startDate) : "--"} - {l?.endDate ? fmtDate(l.endDate) : "--"}
                          </td>
                          <td className="reason-cell">{l?.reason || "--"}</td>
                          <td>
                            <span className={`status-pill ${stKey}`}>{st}</span>
                          </td>
                          <td className="text-right">
                            {stKey === "pending" ? (
                              <div className="action-row right-align">
                                <button className="btn-icon approve" onClick={() => handleLeaveAction(l._id, "Approved")} type="button">
                                  <FaCheck />
                                </button>
                                <button className="btn-icon delete" onClick={() => handleLeaveAction(l._id, "Rejected")} type="button">
                                  <FaTimes />
                                </button>
                              </div>
                            ) : (
                              <span className="text-muted">Finalized</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              <div className="section-foot">
                <Pagination pager={leavesPager} />
              </div>
            </div>
          )
        }

        {/* ✅ REMOVED ENTIRE TOP-LEVEL INTERVIEWS SECTION */}

        {/* ================= ONBOARDING ================= */}
        {
          activeTab === "onboarding" && (
            <div className="onb-wrap">
              <div className="section-head">
                <h3>
                  <FaLayerGroup /> Onboarding Center
                </h3>
                <div className="head-actions">
                  <button
                    className="btn-secondary-sm"
                    onClick={() => {
                      setTemplateForm({ title: "", description: "", itemsText: "" });
                      setShowTemplateModal(true);
                    }}
                    type="button"
                  >
                    <FaPlus /> New Template
                  </button>
                  <button
                    className="btn-primary-sm"
                    onClick={() => {
                      setAssignForm({ userId: "", templateId: "", dueDate: "", note: "" });
                      setShowAssignOnboardingModal(true);
                    }}
                    type="button"
                  >
                    <FaPlus /> Assign
                  </button>
                </div>
              </div>

              <div className="onb-grid">
                <div className="onb-card">
                  <div className="onb-head">
                    <h4>Templates</h4>
                    <Pill text={`${templates.length} total`} tone="neutral" />
                  </div>

                  <div className="onb-list">
                    {templatesPager.paginatedItems.length === 0 ? (
                      <div className="empty-mini">No templates yet.</div>
                    ) : (
                      templatesPager.paginatedItems.map((t) => (
                        <div key={t._id} className="onb-item">
                          <div>
                            <div className="onb-title">{t?.title || t?.name || "Template"}</div>
                            <div className="onb-sub">{(t?.description || "").slice(0, 60) || "—"}</div>
                          </div>
                          <Pill text={`${t?.items?.length || 0} steps`} tone="info" />
                        </div>
                      ))
                    )}
                    {templates.length > 0 && (
                      <div className="section-foot mini">
                        <Pagination pager={templatesPager} mini />
                      </div>
                    )}
                  </div>
                </div>

                <div className="onb-card">
                  <div className="onb-head">
                    <h4>Assignments</h4>
                    <Pill text={`${assignments.length} total`} tone="neutral" />
                  </div>

                  <div className="onb-list">
                    {assignmentsPager.paginatedItems.length === 0 ? (
                      <div className="empty-mini">No onboarding assignments.</div>
                    ) : (
                      assignmentsPager.paginatedItems.map((a) => {
                        const st = String(a?.status || a?.state || "Pending");
                        const stKey = st.toLowerCase();
                        const emp = a?.user?.name || a?.employee?.name || a?.userId?.name || "—";
                        const temp = a?.template?.title || a?.templateId?.title || a?.template?.name || "—";
                        return (
                          <div key={a._id} className="onb-item">
                            <div>
                              <div className="onb-title">{emp}</div>
                              <div className="onb-sub">{temp}</div>
                            </div>
                            <span className={`status-pill ${stKey}`}>{st}</span>
                          </div>
                        );
                      })
                    )}
                    {assignments.length > 0 && (
                      <div className="section-foot mini">
                        <Pagination pager={assignmentsPager} mini />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="sub-note">
                * Employee side pe `MyOnboarding.jsx` already updated hai (tumne bola), yaha HR ko overview + assign control milta hai.
              </div>
            </div>
          )
        }

        {/* ================= HOLIDAYS ================= */}
        {
          activeTab === "holidays" && (
            <div className="holiday-container">
              <div className="holiday-card">
                <h3>
                  <FaUmbrellaBeach /> Mark Holiday
                </h3>
                <div className="holiday-form">
                  <div className="form-group">
                    <label>Date</label>
                    <input type="date" value={holidayForm.date} onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Reason</label>
                    <input
                      type="text"
                      placeholder="e.g. Diwali"
                      value={holidayForm.reason}
                      onChange={(e) => setHolidayForm({ ...holidayForm, reason: e.target.value })}
                    />
                  </div>
                  <button onClick={markHoliday} className="btn-primary full-width" type="button">
                    Mark Holiday
                  </button>
                </div>
              </div>
            </div>
          )
        }
      </div >

      {/* ================= MODALS ================= */}

      {/* ✅ Job Modal (Create/Edit) */}
      {
        showJobModal && (
          <div className="modal-overlay">
            <div className="modal-card animate-pop">
              <div className="modal-header">
                <h3>{editingJobId ? "Update Job" : "Add Job"}</h3>
                <button className="close-btn" onClick={() => setShowJobModal(false)} type="button">
                  <FaTimes />
                </button>
              </div>

              <div className="modal-body">
                <form onSubmit={submitJob}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Job Title *</label>
                      <input value={jobForm.title} onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label>Department *</label>
                      <input value={jobForm.department} onChange={(e) => setJobForm({ ...jobForm, department: e.target.value })} required />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Employment Type</label>
                      <select value={jobForm.employmentType} onChange={(e) => setJobForm({ ...jobForm, employmentType: e.target.value })}>
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Internship">Internship</option>
                        <option value="Contract">Contract</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Status</label>
                      <select value={jobForm.status} onChange={(e) => setJobForm({ ...jobForm, status: e.target.value })}>
                        <option value="Open">Open</option>
                        <option value="Closed">Closed</option>
                        <option value="Draft">Draft</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Experience Required</label>
                      <input value={jobForm.experience} onChange={(e) => setJobForm({ ...jobForm, experience: e.target.value })} placeholder="e.g. 1-3 Years" />
                    </div>
                    <div className="form-group">
                      <label>Salary / CTC</label>
                      <input value={jobForm.salaryRange} onChange={(e) => setJobForm({ ...jobForm, salaryRange: e.target.value })} placeholder="e.g. 8-12 LPA" />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Education / Qual.</label>
                      <input value={jobForm.education} onChange={(e) => setJobForm({ ...jobForm, education: e.target.value })} placeholder="e.g. B.Tech CS" />
                    </div>
                    <div className="form-group">
                      <label>No. of Vacancies</label>
                      <input type="number" min="1" value={jobForm.openings} onChange={(e) => setJobForm({ ...jobForm, openings: e.target.value })} />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Location</label>
                      <input value={jobForm.location} onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })} placeholder="e.g. Remote / Pune" />
                    </div>
                    <div className="form-group">
                      <label>Deadline (Last Date)</label>
                      <input type="date" value={jobForm.deadline} onChange={(e) => setJobForm({ ...jobForm, deadline: e.target.value })} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Skills (Comma Separated)</label>
                    <input value={jobForm.skills} onChange={(e) => setJobForm({ ...jobForm, skills: e.target.value })} placeholder="React, Node.js, TypeScript..." />
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      rows="4"
                      value={jobForm.description}
                      onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                      placeholder="Job detailed description…"
                    />
                  </div>

                  <button type="submit" className="btn-primary full-width">
                    {editingJobId ? "Update Job" : "Create Job"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )
      }

      {/* Assign Task Modal */}
      {
        showAssignTaskModal && (
          <div className="modal-overlay">
            <div className="modal-card animate-pop">
              <div className="modal-header">
                <h3>Assign New Task</h3>
                <button className="close-btn" onClick={() => setShowAssignTaskModal(false)} type="button">
                  <FaTimes />
                </button>
              </div>

              <div className="modal-body">
                <form onSubmit={handleAssignTask}>
                  <div className="form-group">
                    <label>Select Employee</label>
                    <select required value={taskForm.userId} onChange={(e) => setTaskForm({ ...taskForm, userId: e.target.value })}>
                      <option value="">-- Choose Employee --</option>
                      {employees
                        .filter((e) => normalizeEmployee(e).isApproved)
                        .map((e) => (
                          <option key={e._id} value={e._id}>
                            {e.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Task Title</label>
                    <input
                      type="text"
                      required
                      placeholder="Describe task..."
                      value={taskForm.title}
                      onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <FaFileAlt /> Attach Files (Max 3)
                    </label>
                    <input type="file" multiple onChange={(e) => setTaskForm({ ...taskForm, files: e.target.files })} />
                  </div>

                  <div className="form-group">
                    <label>
                      <FaLink /> External Link (Optional)
                    </label>
                    <input type="text" placeholder="https://" value={taskForm.link} onChange={(e) => setTaskForm({ ...taskForm, link: e.target.value })} />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Priority</label>
                      <select value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Deadline</label>
                      <input type="date" required value={taskForm.deadline} onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })} />
                    </div>
                  </div>

                  <button type="submit" className="btn-primary full-width">
                    Send Task to Employee
                  </button>
                </form>
              </div>
            </div>
          </div>
        )
      }

      {/* Task Details Modal */}
      {
        showTaskDetailModal && selectedTask && (
          <div className="modal-overlay">
            <div className="modal-card wide animate-pop">
              <div className="modal-header">
                <h3>{selectedTask.title}</h3>
                <button className="close-btn" onClick={() => setShowTaskDetailModal(false)} type="button">
                  <FaTimes />
                </button>
              </div>

              <div className="modal-body">
                <div style={{ marginBottom: "12px", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px" }}>
                  <div style={{ display: "flex", gap: "10px", fontSize: "13px", color: "#64748b", flexWrap: "wrap" }}>
                    <span>
                      Status: <b>{selectedTask.status}</b>
                    </span>
                    <span>•</span>
                    <span>
                      Due: <b>{selectedTask.deadline ? new Date(selectedTask.deadline).toLocaleDateString() : "--"}</b>
                    </span>
                    <span>•</span>
                    <span>
                      Assigned To: <b>{selectedTask.assignedTo?.name || "Unknown"}</b>
                    </span>
                  </div>
                </div>

                <h4 style={{ margin: "0 0 8px", fontSize: "14px", fontWeight: 800 }}>Description</h4>
                <p
                  style={{
                    background: "#f8fafc",
                    padding: "10px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    color: "#334155",
                    margin: "0 0 20px",
                    lineHeight: 1.5,
                  }}
                >
                  {selectedTask.description || "No description provided."}
                </p>

                {selectedTask.attachments && selectedTask.attachments.length > 0 && (
                  <div style={{ marginBottom: "20px" }}>
                    <h4 style={{ margin: "0 0 8px", fontSize: "14px", fontWeight: 800 }}>Attachments (From HR)</h4>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {selectedTask.attachments.map((file, idx) =>
                        file.type === "link" ? (
                          <a key={idx} href={file.url} target="_blank" rel="noreferrer" className="chip-link">
                            <FaLink /> {file.name || "Link"}
                          </a>
                        ) : (
                          <button key={idx} onClick={() => handleTaskFileDownload(selectedTask._id, file.url, file.name)} className="chip-file" type="button">
                            <FaDownload /> {file.name}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )}

                <div style={{ borderTop: "1px dashed #e2e8f0", paddingTop: "16px", marginTop: "16px" }}>
                  <h4 style={{ margin: "0 0 8px", fontSize: "14px", fontWeight: 800, color: "#2563eb" }}>Employee Submission</h4>
                  {selectedTask.submission ? (
                    <>
                      <p style={{ fontSize: "13px", marginBottom: "10px" }}>
                        <b>Notes:</b> {selectedTask.submission.notes || "No notes."}
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        {selectedTask.submission.attachments &&
                          selectedTask.submission.attachments.map((file, idx) =>
                            file.type === "link" ? (
                              <a
                                key={idx}
                                href={file.url}
                                target="_blank"
                                rel="noreferrer"
                                className="chip-link"
                                style={{ background: "#eff6ff", borderColor: "#bfdbfe" }}
                              >
                                <FaLink /> {file.name || "Link"}
                              </a>
                            ) : (
                              <button
                                key={idx}
                                onClick={() => handleTaskFileDownload(selectedTask._id, file.url, file.name)}
                                className="chip-file"
                                style={{ background: "#eff6ff", borderColor: "#bfdbfe" }}
                                type="button"
                              >
                                <FaDownload /> {file.name}
                              </button>
                            )
                          )}
                      </div>
                      <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "8px" }}>
                        Submitted At: {selectedTask.submission.submittedAt ? new Date(selectedTask.submission.submittedAt).toLocaleString() : "--"}
                      </div>
                    </>
                  ) : (
                    <div style={{ color: "#94a3b8", fontSize: "13px", fontStyle: "italic" }}>Not submitted yet.</div>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "10px",
                    marginTop: "24px",
                    borderTop: "1px solid #f1f5f9",
                    paddingTop: "16px",
                    flexWrap: "wrap",
                  }}
                >
                  <button onClick={() => setShowTaskDetailModal(false)} className="btn-secondary-sm" style={{ padding: "10px 16px" }} type="button">
                    Close
                  </button>

                  {selectedTask.status === "Completed" && (
                    <>
                      <button onClick={() => handleTaskReview(selectedTask._id, "Needs Rework")} className="btn-primary-sm" style={{ background: "#f59e0b" }} type="button">
                        Rework
                      </button>
                      <button onClick={() => handleTaskReview(selectedTask._id, "Verified")} className="btn-primary-sm" style={{ background: "#10b981" }} type="button">
                        Verify Task
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Approve Employee Modal */}
      {
        showApproveModal && (
          <div className="modal-overlay">
            <div className="modal-card animate-pop">
              <div className="modal-header">
                <h3>Approve Employee</h3>
                <button className="close-btn" onClick={() => setShowApproveModal(false)} type="button">
                  <FaTimes />
                </button>
              </div>

              <div className="modal-body">
                <p className="emp-name-display">
                  <FaUserCheck /> {selectedEmp?.name}
                </p>

                <form onSubmit={submitApproval}>
                  <div className="form-group">
                    <label>Basic Salary (₹)</label>
                    <input type="number" required value={approveForm.basicSalary} onChange={(e) => setApproveForm({ ...approveForm, basicSalary: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Joining Date</label>
                    <input type="date" required value={approveForm.joiningDate} onChange={(e) => setApproveForm({ ...approveForm, joiningDate: e.target.value })} />
                  </div>
                  <button type="submit" className="btn-primary full-width">
                    Confirm Approval
                  </button>
                </form>
              </div>
            </div>
          </div>
        )
      }

      {/* Schedule/Edit Interview Modal */}
      {
        showScheduleInterviewModal && (
          <div className="modal-overlay">
            <div className="modal-card animate-pop">
              <div className="modal-header">
                <h3>{editingInterviewId ? "Update Interview" : "Schedule Interview"}</h3>
                <button className="close-btn" onClick={() => setShowScheduleInterviewModal(false)} type="button">
                  <FaTimes />
                </button>
              </div>

              <div className="modal-body">
                <form onSubmit={submitScheduleInterview}>
                  <div className="form-group">
                    <label>Application</label>
                    <select required value={interviewForm.applicationId} onChange={(e) => setInterviewForm({ ...interviewForm, applicationId: e.target.value })}>
                      <option value="">-- Select Application --</option>
                      {applications.map((a) => {
                        // ✅ FIX: new snapshot first
                        const cand = a?.candidate?.name || a?.candidateId?.name || "Unknown";
                        const job = a?.jobId?.title || "Role";
                        return (
                          <option key={a._id} value={a._id}>
                            {cand} — {job}
                          </option>
                        );
                      })}
                    </select>
                    {applications.length === 0 ? (
                      <div className="mini-note">
                        No applications loaded. (Backend: <b>/recruitment/applications</b>)
                      </div>
                    ) : null}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Date & Time</label>
                      <input type="datetime-local" required value={interviewForm.scheduledAt} onChange={(e) => setInterviewForm({ ...interviewForm, scheduledAt: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Mode</label>
                      <select value={interviewForm.mode} onChange={(e) => setInterviewForm({ ...interviewForm, mode: e.target.value })}>
                        <option value="Video">Video Call</option>
                        <option value="In-Person">In-Person</option>
                        <option value="Phone">Phone</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Meeting Link (Online)</label>
                    <input type="text" placeholder="https://meet…" value={interviewForm.meetingLink} onChange={(e) => setInterviewForm({ ...interviewForm, meetingLink: e.target.value })} />
                  </div>

                  <div className="form-group">
                    <label>Location (Offline)</label>
                    <input type="text" placeholder="Office address / room" value={interviewForm.location} onChange={(e) => setInterviewForm({ ...interviewForm, location: e.target.value })} />
                  </div>

                  <div className="form-group">
                    <label>Notes</label>
                    <input type="text" placeholder="Any instructions…" value={interviewForm.notes} onChange={(e) => setInterviewForm({ ...interviewForm, notes: e.target.value })} />
                  </div>

                  <button type="submit" className="btn-primary full-width">
                    {editingInterviewId ? "Update Interview" : "Schedule Interview"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )
      }

      {/* Create Template Modal */}
      {
        showTemplateModal && (
          <div className="modal-overlay">
            <div className="modal-card animate-pop">
              <div className="modal-header">
                <h3>Create Onboarding Template</h3>
                <button className="close-btn" onClick={() => setShowTemplateModal(false)} type="button">
                  <FaTimes />
                </button>
              </div>

              <div className="modal-body">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!templateForm.title) return toast.warning("Template title required");

                    const items = String(templateForm.itemsText || "")
                      .split(/\n|,/)
                      .map((x) => x.trim())
                      .filter(Boolean);

                    try {
                      await tryPost(["/onboarding/template"], {
                        title: templateForm.title,
                        description: templateForm.description,
                        items,
                      });
                      toast.success("Template created ✅");
                      setShowTemplateModal(false);
                      fetchDashboardData(true);
                    } catch (err) {
                      toast.error(getApiErrorMessage(err, "Failed to create template"));
                    }
                  }}
                >
                  <div className="form-group">
                    <label>Title</label>
                    <input value={templateForm.title} onChange={(e) => setTemplateForm({ ...templateForm, title: e.target.value })} required />
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <input value={templateForm.description} onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })} />
                  </div>

                  <div className="form-group">
                    <label>Steps (comma or new line)</label>
                    <textarea rows="4" value={templateForm.itemsText} onChange={(e) => setTemplateForm({ ...templateForm, itemsText: e.target.value })} placeholder={"Offer letter\nLaptop setup\nPolicy acknowledgement"} />
                  </div>

                  <button type="submit" className="btn-primary full-width">
                    Create Template
                  </button>
                </form>
              </div>
            </div>
          </div>
        )
      }

      {/* Assign Onboarding Modal */}
      {
        showAssignOnboardingModal && (
          <div className="modal-overlay">
            <div className="modal-card animate-pop">
              <div className="modal-header">
                <h3>Assign Onboarding</h3>
                <button className="close-btn" onClick={() => setShowAssignOnboardingModal(false)} type="button">
                  <FaTimes />
                </button>
              </div>

              <div className="modal-body">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!assignForm.userId || !assignForm.templateId) {
                      toast.warning("Employee + Template required");
                      return;
                    }
                    try {
                      await tryPost(["/onboarding/assignment"], {
                        userId: assignForm.userId,
                        templateId: assignForm.templateId,
                        dueDate: assignForm.dueDate ? new Date(assignForm.dueDate).toISOString() : undefined,
                        note: assignForm.note || undefined,
                      });
                      toast.success("Onboarding assigned ✅");
                      setShowAssignOnboardingModal(false);
                      fetchDashboardData(true);
                    } catch (err) {
                      toast.error(getApiErrorMessage(err, "Failed to assign onboarding"));
                    }
                  }}
                >
                  <div className="form-group">
                    <label>
                      <FaUserTie /> Employee
                    </label>
                    <select value={assignForm.userId} required onChange={(e) => setAssignForm({ ...assignForm, userId: e.target.value })}>
                      <option value="">-- Select Employee --</option>
                      {employees
                        .filter((e) => normalizeEmployee(e).isApproved)
                        .map((e) => (
                          <option key={e._id} value={e._id}>
                            {e.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>
                      <FaLayerGroup /> Template
                    </label>
                    <select value={assignForm.templateId} required onChange={(e) => setAssignForm({ ...assignForm, templateId: e.target.value })}>
                      <option value="">-- Select Template --</option>
                      {templates.map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.title || t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Due Date (Optional)</label>
                      <input type="date" value={assignForm.dueDate} onChange={(e) => setAssignForm({ ...assignForm, dueDate: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Note (Optional)</label>
                      <input value={assignForm.note} onChange={(e) => setAssignForm({ ...assignForm, note: e.target.value })} placeholder="Instructions…" />
                    </div>
                  </div>

                  <button type="submit" className="btn-primary full-width">
                    Assign Onboarding
                  </button>
                </form>
              </div>
            </div>
          </div>
        )
      }

      {/* ================= STYLE ================= */}
      <style>{`
        :root{
          --primary:#ea580c;
          --primary-dark:#c2410c;
          --primary-light:#fff7ed;
          --text-dark:#0f172a;
          --text-gray:#64748b;
          --border:#e5e7eb;
          --bg:#f8fafc;
          --white:#ffffff;
          --shadow: 0 10px 30px rgba(0,0,0,0.05);
        }

        .hr-dashboard{
          padding: 18px;
          background: var(--bg);
          min-height: 100vh;
          font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial;
          max-width: 1440px;
          margin: 0 auto;
        }

        /* Header */
        .dashboard-header{
          display:flex;
          justify-content:space-between;
          align-items:center;
          background: var(--white);
          padding: 14px 16px;
          border-radius: 16px;
          border: 1px solid var(--border);
          box-shadow: var(--shadow);
          gap: 12px;
          flex-wrap: wrap;
          position: sticky;
          top: 10px;
          z-index: 20;
        }
        .header-title{display:flex;gap:12px;align-items:center;}
        .icon-box-header{
          width: 46px; height: 46px;
          background: linear-gradient(135deg, #fb923c, #ea580c);
          color: white;
          border-radius: 12px;
          display:flex;align-items:center;justify-content:center;
          font-size: 1.3rem;
        }
        .header-title h1{margin:0;font-size:1.2rem;color:var(--text-dark);font-weight:950;}
        .header-title p{margin:2px 0 0;color:var(--text-gray);font-weight:700;font-size:.85rem;}

        .header-actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap;}
        .btn-refresh{
          background: white;
          border: 1px solid var(--primary);
          color: var(--primary);
          padding: 9px 14px;
          border-radius: 12px;
          font-weight: 900;
          cursor: pointer;
          display:flex;align-items:center;gap:8px;
        }
        .btn-refresh:disabled{opacity:.7;cursor:not-allowed;}
        .btn-ghost{
          background: #fff;
          border: 1px solid var(--border);
          padding: 9px 14px;
          border-radius: 12px;
          font-weight: 900;
          cursor: pointer;
          color: var(--text-dark);
        }

        /* Stats strip */
        .stats-strip{
          margin: 14px 0 16px;
          display:flex;
          gap: 12px;
          overflow-x:auto;
          padding-bottom: 6px;
          scroll-snap-type:x mandatory;
        }
        .stat-card{
          min-width: 220px;
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 14px 14px;
          box-shadow: 0 8px 20px rgba(0,0,0,0.04);
          display:flex;
          justify-content:space-between;
          align-items:center;
          scroll-snap-align:start;
        }
        .stat-left{display:flex;flex-direction:column;gap:4px;}
        .stat-value{font-size:1.6rem;font-weight:1000;color:var(--text-dark);line-height:1;}
        .stat-title{font-size:.82rem;color:var(--text-gray);font-weight:900;letter-spacing:.4px;text-transform:uppercase;}
        .stat-ic{font-size:2rem;opacity:.14;color:var(--text-dark);}

        .tone-orange{border-left:5px solid #ea580c;}
        .tone-red{border-left:5px solid #dc2626;}
        .tone-blue{border-left:5px solid #2563eb;}
        .tone-green{border-left:5px solid #16a34a;}
        .tone-violet{border-left:5px solid #7c3aed;}
        .tone-teal{border-left:5px solid #0f766e;}

        /* Tabs */
        .tabs-wrapper{overflow-x:auto;margin-bottom: 12px;}
        .tabs-container{display:flex;gap:10px;min-width:max-content;}
        .tab-btn{
          background: white;
          border: 1px solid var(--border);
          padding: 10px 14px;
          border-radius: 999px;
          cursor:pointer;
          display:flex;
          align-items:center;
          gap: 10px;
          color: var(--text-gray);
          font-weight: 950;
          white-space:nowrap;
        }
        .tab-btn.active{
          background: var(--primary);
          border-color: var(--primary);
          color: #fff;
          box-shadow: 0 10px 25px rgba(234,88,12,0.22);
        }
        .tab-ic{display:inline-flex;}
        .tab-badge{
          background: #ef4444;
          color: white;
          padding: 2px 8px;
          border-radius: 999px;
          font-size: .75rem;
          font-weight: 1000;
        }

        /* Content */
        .content-panel{
          background: white;
          border-radius: 16px;
          padding: 16px;
          box-shadow: var(--shadow);
          border: 1px solid var(--border);
        }

        .section-head{
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap: 12px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }
        .section-head h3{
          margin:0;
          font-size: 1.05rem;
          font-weight: 1000;
          color: var(--text-dark);
          display:flex;align-items:center;gap:10px;
        }
        .head-actions{display:flex;gap:10px;flex-wrap:wrap;}
        .btn-primary-sm, .btn-secondary-sm{
          border:none;
          padding: 9px 12px;
          border-radius: 12px;
          font-weight: 950;
          cursor:pointer;
          display:flex;align-items:center;gap:8px;
          white-space:nowrap;
        }
        .btn-primary-sm{background: var(--primary); color:#fff;}
        .btn-secondary-sm{background:#fff; border:1px solid var(--border); color: var(--text-dark);}

        /* Recruitment */
        .recruitment-wrap{display:flex;flex-direction:column;gap:12px;}
        .recruitment-head{display:flex;flex-direction:column;gap:10px;}
        .subtabs{
          display:flex;
          gap:10px;
          overflow-x:auto;
          padding-bottom: 4px;
        }
        .subtab-btn{
          background:#fff;
          border:1px solid var(--border);
          padding: 10px 12px;
          border-radius: 14px;
          cursor:pointer;
          display:flex;
          align-items:center;
          gap:10px;
          font-weight: 950;
          color: var(--text-gray);
          white-space:nowrap;
        }
        .subtab-btn.active{
          border-color: rgba(234,88,12,0.35);
          background: #fff7ed;
          color: var(--primary);
        }
        .subtab-badge{
          background: #0f172a;
          color:#fff;
          padding: 2px 8px;
          border-radius: 999px;
          font-size: .75rem;
          font-weight: 1000;
        }
        .recruitment-card{
          border:1px solid var(--border);
          border-radius: 16px;
          padding: 14px;
          background:#fff;
          box-shadow: 0 10px 25px rgba(0,0,0,0.03);
        }
        .stage-cell{display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
        .stage-select{
          padding: 8px 10px;
          border:1px solid var(--border);
          border-radius: 12px;
          font-weight: 900;
          background:#fff;
          outline:none;
          min-width: 160px;
        }
        .stage-select:focus{border-color: var(--primary); box-shadow: 0 0 0 3px rgba(234,88,12,0.12);}

        /* Tables */
        .table-responsive{overflow-x:auto;}
        .modern-table{width:100%;border-collapse:collapse;min-width:980px;}
        .modern-table.compact{min-width:860px;}
        .modern-table th{
          text-align:left;
          padding: 12px 12px;
          background:#f8fafc;
          color:#64748b;
          font-size:.8rem;
          border-bottom: 2px solid var(--border);
          white-space:nowrap;
          text-transform:uppercase;
          letter-spacing:.7px;
          font-weight: 1000;
        }
        .modern-table td{
          padding: 12px 12px;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
          font-size: .92rem;
          font-weight: 750;
        }
        .empty-row{padding:18px !important; text-align:center; color:#94a3b8; font-weight:950;}

        /* Cells */
        .user-cell{display:flex;align-items:center;gap:12px;}
        .avatar-circle{
          width:36px;height:36px;border-radius:50%;
          background: var(--primary-light);
          color: var(--primary);
          display:flex;align-items:center;justify-content:center;
          font-weight: 1000;
        }
        .role-tag{
          background:#fff7ed;
          color: var(--primary);
          padding: 6px 10px;
          border-radius: 999px;
          font-size:.8rem;
          font-weight: 950;
          white-space:nowrap;
        }

        .status-pill{
          padding: 6px 10px;
          border-radius: 999px;
          font-size:.78rem;
          font-weight: 1000;
          white-space:nowrap;
          text-transform: capitalize;
          border: 1px solid rgba(226,232,240,0.9);
          background: #f8fafc;
          color: #0f172a;
        }
        .status-pill.active, .status-pill.verified{
          background:#dcfce7;color:#166534;border-color:#bbf7d0;
        }
        .status-pill.pending{
          background:#fef9c3;color:#a16207;border-color:#fde68a;
        }
        .status-pill.approved{
          background:#dcfce7;color:#166534;border-color:#bbf7d0;
        }
        .status-pill.rejected{
          background:#fee2e2;color:#991b1b;border-color:#fecaca;
        }
        .status-pill.completed{
          background:#e0f2fe;color:#075985;border-color:#bae6fd;
        }
        .status-pill.in-progress, .status-pill.inprogress{
          background:#e0e7ff;color:#3730a3;border-color:#c7d2fe;
        }

        .priority-badge{
          padding: 4px 8px;
          border-radius: 8px;
          font-size: .72rem;
          font-weight: 1000;
          text-transform: uppercase;
          letter-spacing:.6px;
          border: 1px solid rgba(226,232,240,0.9);
          white-space:nowrap;
        }
        .priority-badge.high{background:#fee2e2;color:#991b1b;border-color:#fecaca;}
        .priority-badge.medium{background:#ffedd5;color:#9a3412;border-color:#fed7aa;}
        .priority-badge.low{background:#dcfce7;color:#166534;border-color:#bbf7d0;}

        .action-row{display:flex;gap:8px;}
        .right-align,.j-end{justify-content:flex-end;}
        .btn-icon{
          width:34px;height:34px;
          border-radius: 10px;
          border:none;cursor:pointer;
          display:flex;align-items:center;justify-content:center;
        }
        .btn-icon.approve{background:#dcfce7;color:#166534;}
        .btn-icon.view{background:#e0f2fe;color:#0284c7;}
        .btn-icon.delete{background:#fee2e2;color:#dc2626;}

        .btn-xs{
          padding: 7px 10px;
          border-radius: 10px;
          border:none;
          cursor:pointer;
          font-size:.78rem;
          font-weight: 1000;
          display:inline-flex;
          align-items:center;
          gap:8px;
          white-space:nowrap;
        }
        .btn-xs.approve{background:#dcfce7;color:#166534;}
        .btn-xs.reject{background:#fee2e2;color:#991b1b;}
        .btn-xs.view-details{background:#eff6ff;color:#1e40af;}

        .reason-cell{max-width: 320px; color:#334155;}

        /* Files cell */
        .files-cell{display:flex;flex-direction:column;gap:8px;}
        .chip-row{display:flex;flex-wrap:wrap;gap:8px;}
        .chip-file{
          border:1px solid var(--border);
          background:#fff;
          padding:6px 10px;
          border-radius:999px;
          font-weight:900;
          cursor:pointer;
          display:flex;align-items:center;gap:8px;
          font-size:.78rem;
        }
        .chip-link{
          display:inline-flex;align-items:center;gap:8px;
          border:1px solid var(--border);
          background:#fff;
          padding:6px 10px;
          border-radius:999px;
          font-weight:950;
          text-decoration:none;
          color:#0f172a;
          width: fit-content;
        }
        .muted{color:#94a3b8;font-weight:900;}
        .dt{display:flex;align-items:center;gap:8px;}
        .dt-ic{color:#ea580c;opacity:.9}

        .sub-note{
          margin-top: 12px;
          color:#64748b;
          font-weight: 800;
          font-size: .85rem;
          line-height: 1.4;
        }

        /* Onboarding */
        .onb-wrap{display:flex;flex-direction:column;gap:12px;}
        .onb-grid{
          display:grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .onb-card{
          border:1px solid var(--border);
          border-radius: 16px;
          background: #fff;
          padding: 12px;
          box-shadow: 0 8px 20px rgba(0,0,0,0.03);
          min-height: 240px;
        }
        .onb-head{
          display:flex;justify-content:space-between;align-items:center;
          padding-bottom: 10px;
          border-bottom: 1px solid #f1f5f9;
          margin-bottom: 10px;
        }
        .onb-head h4{margin:0;font-weight:1000;color:#0f172a;}
        .onb-list{display:flex;flex-direction:column;gap:10px;}
        .onb-item{
          display:flex;justify-content:space-between;align-items:center;
          gap: 12px;
          border: 1px solid #f1f5f9;
          border-radius: 14px;
          padding: 10px;
          background: #fafafa;
        }
        .onb-title{font-weight:1000;color:#0f172a;}
        .onb-sub{font-size:.82rem;color:#64748b;font-weight:850;margin-top:2px;}
        .empty-mini{color:#94a3b8;font-weight:950;padding:12px;border:1px dashed #e2e8f0;border-radius:14px;background:#f8fafc;}

        /* Pill */
        .pill{
          padding: 6px 10px;
          border-radius: 999px;
          font-weight: 1000;
          font-size: .78rem;
          border: 1px solid rgba(226,232,240,0.9);
          background: #f8fafc;
          color:#0f172a;
          white-space:nowrap;
        }
        .pill-neutral{background:#f8fafc;color:#0f172a;border-color:#e2e8f0;}
        .pill-info{background:#e0f2fe;color:#075985;border-color:#bae6fd;}
        .pill-blue{background:#dbeafe;color:#1e40af;border-color:#bfdbfe;}
        .pill-green{background:#dcfce7;color:#166534;border-color:#bbf7d0;}
        .pill-red{background:#fee2e2;color:#991b1b;border-color:#fecaca;}

        /* Holiday */
        .holiday-container{display:flex;justify-content:center;padding: 10px;}
        .holiday-card{
          width: 100%;
          max-width: 520px;
          border:1px solid var(--border);
          border-radius: 18px;
          padding: 16px;
          background:#fff;
          box-shadow: 0 10px 25px rgba(0,0,0,0.04);
        }
        .holiday-card h3{margin:0 0 10px;font-weight:1000;color:#0f172a;display:flex;gap:10px;align-items:center;}
        .holiday-form{display:flex;flex-direction:column;gap:12px;}
        .form-group label{
          display:block;
          font-weight:900;
          font-size:.82rem;
          color:#475569;
          margin-bottom: 6px;
        }
        .form-group input, .form-group select, textarea{
          width:100%;
          padding: 10px 12px;
          border: 1px solid var(--border);
          border-radius: 12px;
          outline:none;
          font-weight: 800;
          box-sizing:border-box;
          background:#fff;
        }
        textarea{resize:none;}
        .form-row{
          display:grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .btn-primary{
          background: var(--primary);
          color:#fff;
          border:none;
          border-radius: 12px;
          padding: 12px;
          font-weight: 1000;
          cursor:pointer;
        }
        .btn-primary:hover{background: var(--primary-dark);}
        .full-width{width:100%;}

        /* Modal */
        .modal-overlay{
          position: fixed; inset:0;
          background: rgba(2,6,23,0.55);
          display:flex;align-items:center;justify-content:center;
          z-index: 1000;
          padding: 16px;
          backdrop-filter: blur(6px);
        }
        .modal-card{
          background:#fff;
          width: 100%;
          max-width: 520px;
          border-radius: 18px;
          overflow:hidden;
          box-shadow: 0 30px 70px rgba(0,0,0,0.22);
          border: 1px solid rgba(226,232,240,0.9);
        }
        .modal-card.wide { max-width: 700px; }
        .modal-header{
          display:flex;justify-content:space-between;align-items:center;
          padding: 12px 14px;
          background:#f8fafc;
          border-bottom:1px solid var(--border);
        }
        .modal-header h3{margin:0;font-weight:1000;color:#0f172a;}
        .close-btn{
          width:38px;height:38px;border-radius:12px;
          border:1px solid var(--border);
          background:#fff;
          cursor:pointer;
          display:grid;place-items:center;
        }
        .modal-body{padding: 14px;}
        .emp-name-display{
          background:#fff7ed;
          color: var(--primary);
          border: 1px solid #fed7aa;
          border-radius: 14px;
          padding: 10px 12px;
          font-weight: 1000;
          display:flex;align-items:center;gap:10px;
          margin: 0 0 12px;
        }
        .mini-note{margin-top:6px;color:#94a3b8;font-weight:900;font-size:.82rem;}

        .animate-up{animation: slideUp .35s ease-out;}
        @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .animate-pop{animation: pop .22s ease-out;}
        @keyframes pop{from{transform:scale(.96);opacity:.4}to{transform:scale(1);opacity:1}}

        .spin{animation: spin 1s linear infinite;}
        @keyframes spin{to{transform:rotate(360deg)}}

        .text-right{text-align:right;}
        .text-muted{color:#94a3b8;font-weight:900;}
        .text-sm{font-size:.82rem;}

        /* Responsive */
        @media(max-width: 980px){
          .modern-table{min-width: 860px;}
          .modern-table.compact{min-width: 820px;}
          .onb-grid{grid-template-columns: 1fr;}
        }
        @media(max-width: 720px){
          .hr-dashboard{padding: 12px;}
          .content-panel{padding: 12px;}
          .form-row{grid-template-columns: 1fr;}
          .stat-card{min-width: 200px;}
          .recruitment-card{padding: 12px;}
        }
      `}</style>
    </div >
  );
};

export default HrAdminDashboard;
