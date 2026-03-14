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
import EditEmployeeModal from "../../components/Modals/EditEmployeeModal";
import worknaiLogo from "../../assets/worknai logo.png";

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

  // ✅ Edit Employee Modal State
  const [showEditEmployeeModal, setShowEditEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

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

  // Open Edit Employee Modal
  const openEditEmployee = (emp) => {
    setEditingEmployee(emp);
    setShowEditEmployeeModal(true);
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
            <img src={worknaiLogo} alt="WorknAi" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div>
            <h1>WorknAi <span>HRMS</span></h1>
            <p>Admin Dashboard</p>
          </div>
        </div>

        <div className="header-actions">
          <button className="btn-refresh" onClick={() => fetchDashboardData(true)} disabled={syncing}>
            <FaSyncAlt className={syncing ? "spin" : ""} /> {syncing ? "Syncing…" : "Sync Data"}
          </button>

          <button className="btn-ghost" onClick={() => logout("/")} title="Logout" type="button">
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

                <div className="table-responsive desktop-only">
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
                          <td colSpan="5" className="empty-row"> No jobs found. </td>
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
                              <td> <Pill text={st} tone={tone} /> </td>
                              <td className="text-right">
                                <div className="action-row right-align">
                                  <button className="btn-icon view" type="button" title="Edit" onClick={() => openEditJob(j)}> <FaEdit /> </button>
                                  <button className="btn-icon delete" type="button" title="Delete" onClick={() => deleteJob(j._id, j.title)}> <FaTrash /> </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* MOBILE JOBS */}
                <div className="mobile-cards">
                  {jobsPager.paginatedItems.map((j) => {
                    const st = String(j?.status || "Open");
                    const tone = st.toLowerCase() === "open" ? "green" : st.toLowerCase() === "closed" ? "red" : "info";
                    return (
                      <div key={j._id} className="m-card">
                        <div className="m-card-top">
                          <div className="m-title">{j.title || "--"}</div>
                          <Pill text={st} tone={tone} />
                        </div>
                        <div className="m-card-body">
                          <div className="m-item"><strong>Dept:</strong> {j.department || j.dept || "--"}</div>
                          <div className="m-item"><strong>Type:</strong> {j.employmentType || j.type || "--"}</div>
                          <div className="m-item"><strong>Location:</strong> {j.location || "--"}</div>
                        </div>
                        <div className="m-card-actions">
                          <button className="btn-icon view" onClick={() => openEditJob(j)}> <FaEdit /> Edit </button>
                          <button className="btn-icon delete" onClick={() => deleteJob(j._id, j.title)}> <FaTrash /> Delete </button>
                        </div>
                      </div>
                    );
                  })}
                  {jobsPager.paginatedItems.length === 0 && <div className="empty-row">No jobs found.</div>}
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
                <div className="table-responsive desktop-only">
                  <table className="modern-table compact">
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

                {/* MOBILE INTERVIEWS */}
                <div className="mobile-cards">
                  {interviewsPager.paginatedItems.map((i) => {
                    const when = i?.scheduledAt || i?.dateTime || i?.createdAt;
                    const cand = i?.applicationId?.candidate?.name || i?.applicationId?.candidateId?.name || i?.candidateId?.name || "Unknown Candidate";
                    const job = i?.applicationId?.jobId?.title || i?.jobId?.title || "Unknown Job";
                    const st = String(i?.status || "Scheduled");
                    const stKey = st.toLowerCase().replace(/\s+/g, "-");
                    const cRes = i?.candidateResponse || 'Pending';
                    return (
                      <div key={i._id} className="m-card">
                        <div className="m-card-top">
                          <div className="m-title">{cand}</div>
                          <span className={`status-pill ${stKey}`}>{st}</span>
                        </div>
                        <div className="m-card-body">
                          <div className="m-item"><strong>Job:</strong> {job}</div>
                          <div className="m-item"><strong>Time:</strong> {fmtDateTime(when)}</div>
                          <div className="m-item"><strong>Mode:</strong> {i.mode || "Online"}</div>
                          <div className="m-item"><strong>Response:</strong> {cRes}</div>
                        </div>
                        <div className="m-card-actions">
                          <button className="btn-icon view" onClick={() => openEditInterview(i)}> <FaEdit /> Edit </button>
                          <button className="btn-icon delete" onClick={() => deleteInterview(i._id)}> <FaTrash /> Delete </button>
                        </div>
                      </div>
                    );
                  })}
                  {interviewsPager.paginatedItems.length === 0 && <div className="empty-row">No interviews yet.</div>}
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

                <div className="table-responsive desktop-only">
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

                {/* MOBILE APPLICATIONS */}
                <div className="mobile-cards">
                  {applicationsPager.paginatedItems.map((a) => {
                    const cand = a?.candidate?.name || a?.candidateId?.name || "Unknown";
                    const job = a?.jobId?.title || a?.job?.title || "Role";
                    const stage = a?.stage || "Applied";
                    const stageTone = String(stage).toLowerCase() === "rejected" ? "red" : String(stage).toLowerCase() === "hired" ? "green" : "blue";
                    return (
                      <div key={a._id} className="m-card">
                        <div className="m-card-top">
                          <div className="m-title">{cand}</div>
                          <Pill text={stage} tone={stageTone} />
                        </div>
                        <div className="m-card-body">
                          <div className="m-item"><strong>Job:</strong> {job}</div>
                          <div className="m-item"><strong>Applied:</strong> {fmtDate(a.appliedAt || a.createdAt)}</div>
                          <div className="m-item">
                            <strong>Update Stage:</strong>
                            <select className="stage-select" style={{ marginTop: 8 }} value={stage} onChange={(e) => updateApplicationStage(a._id, e.target.value)}>
                              {APP_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="m-card-actions">
                          <button className="btn-icon view" onClick={() => navigate("/hr/recruitment/applications")}> <FaEye /> View </button>
                          <button className="btn-icon delete" onClick={() => deleteApplication(a._id)}> <FaTrash /> Delete </button>
                        </div>
                      </div>
                    );
                  })}
                  {applicationsPager.paginatedItems.length === 0 && <div className="empty-row">No applications found.</div>}
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

            <table className="modern-table desktop-only">
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
                            <div>
                              <strong>{emp?.name || "--"}</strong>
                              <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '11px', marginTop: '2px' }}>{emp?.email || "--"}</div>
                            </div>
                          </div>
                        </td>
                        <td><span className="role-tag">{emp?.designation || emp?.role || "—"}</span></td>
                        <td><span className={`status-pill ${String(n.status).toLowerCase()}`}>{n.status}</span></td>
                        <td>
                          {emp?.employmentType === 'Intern' ? (
                            <span className="pill pill-neutral">Unpaid (Intern)</span>
                          ) : (
                            `₹${Number(emp?.basicSalary || 0).toLocaleString()}`
                          )}
                        </td>
                        <td>{emp?.joiningDate ? fmtDate(emp.joiningDate) : "--"}</td>
                        <td className="text-right">
                          <div className="action-row right-align">
                            {!n.isApproved ? (<button className="btn-icon approve" onClick={() => initiateApproval(emp)} title="Approve" type="button"><FaCheck /></button>) : null}
                            <button className="btn-icon view" onClick={() => openEditEmployee(emp)} title="Edit" type="button"><FaEdit /></button>
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

            {/* MOBILE DIRECTORY */}
            <div className="mobile-cards">
              {employeesPager.paginatedItems.map((emp) => {
                const n = normalizeEmployee(emp);
                return (
                  <div key={emp._id} className="m-card">
                    <div className="m-card-top">
                      <div className="user-cell">
                        <div className="avatar-circle">{String(emp?.name || "U").charAt(0)}</div>
                        <div><strong>{emp?.name || "--"}</strong></div>
                      </div>
                      <span className={`status-pill ${String(n.status).toLowerCase()}`}>{n.status}</span>
                    </div>
                    <div className="m-card-body">
                      <div className="m-item"><strong>Role:</strong> {emp?.designation || emp?.role || "—"}</div>
                      <div className="m-item"><strong>Email:</strong> {emp?.email || "--"}</div>
                      <div className="m-item">
                        <strong>Salary:</strong> {emp?.employmentType === 'Intern' ? 'Unpaid (Intern)' : `₹${Number(emp?.basicSalary || 0).toLocaleString()}`}
                      </div>
                      <div className="m-item"><strong>Joined:</strong> {emp?.joiningDate ? fmtDate(emp.joiningDate) : "--"}</div>
                    </div>
                    <div className="m-card-actions">
                      {!n.isApproved && <button className="btn-icon approve" onClick={() => initiateApproval(emp)}> <FaCheck /> Approve </button>}
                      <button className="btn-icon view" onClick={() => openEditEmployee(emp)}> <FaEdit /> Edit </button>
                      <button className="btn-icon view" onClick={() => navigate(`/hr/view-employee/${emp._id}`)}> <FaEye /> View </button>
                      <button className="btn-icon delete" onClick={() => handleDelete(emp._id, emp.name)}> <FaTrash /> Delete </button>
                    </div>
                  </div>
                );
              })}
              {employeesPager.paginatedItems.length === 0 && <div className="empty-row">No employees found.</div>}
            </div>

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

              <div className="table-responsive desktop-only">
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
              </div>

              {/* MOBILE TASKS */}
              <div className="mobile-cards">
                {tasksPager.paginatedItems.map((task) => {
                  const status = String(task?.status || "In Progress");
                  const pri = String(task?.priority || "Medium");
                  return (
                    <div key={task._id} className="m-card">
                      <div className="m-card-top">
                        <div className="m-title">{task?.title || "--"}</div>
                        <span className={`status-pill ${status.toLowerCase().replace(/\s+/g, "-")}`}>{status}</span>
                      </div>
                      <div className="m-card-body">
                        <div className="m-item"><strong>Assigned To:</strong> {task?.assignedTo?.name || task?.userId?.name || "Unknown"}</div>
                        <div className="m-item"><strong>Priority:</strong> <span className={`priority-badge ${pri.toLowerCase()}`}>{pri}</span></div>
                        <div className="m-item"><strong>Deadline:</strong> {task?.deadline ? fmtDate(task.deadline) : "--"}</div>
                      </div>
                      <div className="m-card-actions">
                        <button className="btn-icon view" onClick={() => openTaskDetails(task)}> <FaEye /> Details </button>
                        {status.toLowerCase() === "completed" && (
                          <>
                            <button className="btn-icon approve" onClick={() => handleTaskReview(task._id, "Verified")}> Verify </button>
                            <button className="btn-icon delete" onClick={() => handleTaskReview(task._id, "In Progress")}> Redo </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
                {tasksPager.paginatedItems.length === 0 && <div className="empty-row">No tasks found.</div>}
              </div>

              <div className="section-foot">
                <Pagination pager={tasksPager} />
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

              <table className="modern-table desktop-only">
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
                      <td colSpan="6" className="empty-row"> No leave requests found. </td>
                    </tr>
                  ) : (
                    leavesPager.paginatedItems.map((l) => {
                      const st = String(l?.status || "Pending");
                      const stKey = st.toLowerCase();
                      const leaveType = String(l?.leaveType || l?.type || "Paid");
                      const ltKey = leaveType.toLowerCase().includes("unpaid") ? "unpaid" : "paid";

                      return (
                        <tr key={l._id}>
                          <td><strong>{l?.userId?.name || l?.employee?.name || "—"}</strong></td>
                          <td><span className={`type-badge ${ltKey}`}>{leaveType}</span></td>
                          <td>{l?.startDate ? fmtDate(l.startDate) : "--"} - {l?.endDate ? fmtDate(l.endDate) : "--"}</td>
                          <td className="reason-cell">{l?.reason || "--"}</td>
                          <td><span className={`status-pill ${stKey}`}>{st}</span></td>
                          <td className="text-right">
                            {stKey === "pending" ? (
                              <div className="action-row right-align">
                                <button className="btn-icon approve" onClick={() => handleLeaveAction(l._id, "Approved")} type="button"> <FaCheck /> </button>
                                <button className="btn-icon delete" onClick={() => handleLeaveAction(l._id, "Rejected")} type="button"> <FaTimes /> </button>
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

              {/* MOBILE LEAVES */}
              <div className="mobile-cards">
                {leavesPager.paginatedItems.map((l) => {
                  const st = String(l?.status || "Pending");
                  const leaveType = String(l?.leaveType || l?.type || "Paid");
                  return (
                    <div key={l._id} className="m-card">
                      <div className="m-card-top">
                        <div className="m-title">{l?.userId?.name || l?.employee?.name || "—"}</div>
                        <span className={`status-pill ${st.toLowerCase()}`}>{st}</span>
                      </div>
                      <div className="m-card-body">
                        <div className="m-item"><strong>Type:</strong> {leaveType}</div>
                        <div className="m-item"><strong>Duration:</strong> {fmtDate(l.startDate)} - {fmtDate(l.endDate)}</div>
                        <div className="m-item"><strong>Reason:</strong> {l.reason || "--"}</div>
                      </div>
                      <div className="m-card-actions">
                        {st.toLowerCase() === "pending" ? (
                          <>
                            <button className="btn-icon approve" onClick={() => handleLeaveAction(l._id, "Approved")}> <FaCheck /> Approve </button>
                            <button className="btn-icon delete" onClick={() => handleLeaveAction(l._id, "Rejected")}> <FaTimes /> Reject </button>
                          </>
                        ) : <span className="text-muted">Finalized</span>}
                      </div>
                    </div>
                  );
                })}
                {leavesPager.paginatedItems.length === 0 && <div className="empty-row">No leave requests found.</div>}
              </div>
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
                          <div className="onb-item-left">
                            <div className="onb-icon-static"><FaFileAlt /></div>
                            <div>
                              <div className="onb-title">{t?.title || t?.name || "Template"}</div>
                              <div className="onb-sub">{(t?.description || "").slice(0, 60) || "—"}</div>
                            </div>
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
                            <div className="onb-item-left">
                              <div className="onb-icon-static variant-teal"><FaUserCheck /></div>
                              <div>
                                <div className="onb-title">{emp}</div>
                                <div className="onb-sub">{temp}</div>
                              </div>
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

      {/* ✅ Edit Employee Modal (New) */}
      <EditEmployeeModal
        isOpen={showEditEmployeeModal}
        onClose={() => setShowEditEmployeeModal(false)}
        employee={editingEmployee}
        onSuccess={() => fetchDashboardData(true)}
      />

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
      {showTemplateModal && (
        <div className="modal-overlay">
          <div className="modal-card animate-pop">
            <div className="modal-header">
              <div className="modal-title-wrap">
                <div className="modal-icon-hex"><FaLayerGroup /></div>
                <h3>Create Onboarding Template</h3>
              </div>
              <button className="close-btn" onClick={() => setShowTemplateModal(false)} type="button">
                <FaTimes />
              </button>
            </div>

            <div className="modal-body p-30">
              <form
                className="premium-form"
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
                <div className="form-group animate-slide-in-1">
                  <label>Template Title <span className="req">*</span></label>
                  <div className="input-with-icon">
                    <FaFileAlt className="field-ic" />
                    <input
                      value={templateForm.title}
                      placeholder="e.g., Senior Developer Induction"
                      onChange={(e) => setTemplateForm({ ...templateForm, title: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group animate-slide-in-2">
                  <label>Description (Optional)</label>
                  <input
                    value={templateForm.description}
                    placeholder="Briefly describe the purpose of this template"
                    onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                  />
                </div>

                <div className="form-group animate-slide-in-3">
                  <label>Steps <span className="helper-hint">(one per line or comma separated)</span></label>
                  <div className="textarea-wrapper">
                    <textarea
                      rows="5"
                      value={templateForm.itemsText}
                      onChange={(e) => setTemplateForm({ ...templateForm, itemsText: e.target.value })}
                      placeholder={"Offer letter\nLaptop setup\nPolicy acknowledgement\nTeam Introduction"}
                    />
                    <div className="textarea-stats">
                      {String(templateForm.itemsText || "").split(/\n|,/).filter(x => x.trim()).length} steps detected
                    </div>
                  </div>
                </div>

                <div className="modal-actions-footer animate-slide-in-4">
                  <button type="button" className="btn-secondary-sm full-width" onClick={() => setShowTemplateModal(false)}>Cancel</button>
                  <button type="submit" className="btn-primary full-width">
                    <FaPlus /> Build Template
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Assign Onboarding Modal */}
      {showAssignOnboardingModal && (
        <div className="modal-overlay">
          <div className="modal-card animate-pop">
            <div className="modal-header">
              <div className="modal-title-wrap">
                <div className="modal-icon-hex variant-teal"><FaUserTie /></div>
                <h3>Assign Onboarding Journey</h3>
              </div>
              <button className="close-btn" onClick={() => setShowAssignOnboardingModal(false)} type="button">
                <FaTimes />
              </button>
            </div>

            <div className="modal-body p-30">
              <form
                className="premium-form"
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
                <div className="form-row">
                  <div className="form-group animate-slide-in-1">
                    <label>Target Employee <span className="req">*</span></label>
                    <div className="input-with-icon">
                      <FaUserTie className="field-ic" />
                      <select value={assignForm.userId} required onChange={(e) => setAssignForm({ ...assignForm, userId: e.target.value })}>
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
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group animate-slide-in-2">
                    <label>Select Template <span className="req">*</span></label>
                    <div className="input-with-icon">
                      <FaLayerGroup className="field-ic" />
                      <select value={assignForm.templateId} required onChange={(e) => setAssignForm({ ...assignForm, templateId: e.target.value })}>
                        <option value="">-- Choose Template --</option>
                        {templates.map((t) => (
                          <option key={t._id} value={t._id}>
                            {t.title || t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group animate-slide-in-3">
                    <label>Completion Deadline</label>
                    <div className="input-with-icon">
                      <FaCalendarAlt className="field-ic" />
                      <input type="date" value={assignForm.dueDate} onChange={(e) => setAssignForm({ ...assignForm, dueDate: e.target.value })} />
                    </div>
                  </div>
                </div>

                <div className="form-group animate-slide-in-4">
                  <label>Internal Note (Optional)</label>
                  <textarea rows="2" value={assignForm.note} onChange={(e) => setAssignForm({ ...assignForm, note: e.target.value })} placeholder="Add specific instructions for this employee…" />
                </div>

                <div className="modal-actions-footer animate-slide-in-5">
                  <button type="button" className="btn-secondary-sm full-width" onClick={() => setShowAssignOnboardingModal(false)}>Cancel</button>
                  <button type="submit" className="btn-primary full-width">
                    <FaPlus /> Start Journey
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ================= STYLE ================= */}
      <style>{`
        :root {
          --primary: #50c8ff;
          --primary-glow: rgba(80, 200, 255, 0.4);
          --accent-violet: #a78bfa;
          --accent-pink: #e879f9;
          --bg-dark: #050714;
          --card-glass: rgba(13, 17, 34, 0.6);
          --border-glass: rgba(255, 255, 255, 0.1);
          --text-bright: #ffffff;
          --text-dim: rgba(255, 255, 255, 0.6);
          --brand-grad: linear-gradient(135deg, #3b82f6, #8b5cf6, #e879f9);
        }

        .hr-dashboard {
          padding: 24px;
          background: radial-gradient(circle at 50% 50%, #0f172a, #050714);
          min-height: 100vh;
          font-family: 'Inter', sans-serif;
          max-width: 100vw;
          margin: 0 auto;
          color: var(--text-bright);
          box-sizing: border-box;
          overflow-x: hidden; /* Prevent horizontal scroll on small devices */
        }

        /* Header */
        .dashboard-header {
          display: flex; justify-content: space-between; align-items: center;
          background: rgba(13, 17, 34, 0.8);
          padding: 20px 28px;
          border-radius: 24px;
          border: 1px solid var(--border-glass);
          box-shadow: 0 20px 50px rgba(0,0,0,0.4);
          gap: 12px; flex-wrap: wrap;
          position: sticky; top: 10px; z-index: 20;
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
        }
        .header-title { display: flex; gap: 18px; align-items: center; }
        .icon-box-header {
          width: 52px; height: 52px;
          background: var(--brand-grad);
          color: white; border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.4rem; box-shadow: 0 10px 20px rgba(139, 92, 246, 0.3);
        }
        .header-title h1 { 
          margin: 0; font-size: 1.4rem; font-weight: 900; 
          background: linear-gradient(90deg, #fff, rgba(255,255,255,0.8));
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .header-title p { margin: 2px 0 0; color: var(--text-dim); font-weight: 700; font-size: .85rem; letter-spacing: 0.5px; }

        .header-actions { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
        .btn-refresh {
          background: rgba(80, 200, 255, 0.1);
          border: 1px solid rgba(80, 200, 255, 0.3);
          color: #50c8ff;
          padding: 11px 18px;
          border-radius: 14px;
          font-weight: 900;
          cursor: pointer;
          display: flex; align-items: center; gap: 10px;
          transition: 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
        }
        .btn-refresh:hover:not(:disabled) { background: rgba(80, 200, 255, 0.2); transform: translateY(-2px); box-shadow: 0 10px 20px rgba(80, 200, 255, 0.15); }
        .btn-refresh:disabled { opacity: .5; cursor: not-allowed; }
        
        .btn-ghost {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-glass);
          padding: 11px 18px;
          border-radius: 14px;
          font-weight: 900;
          cursor: pointer;
          color: #fff;
          transition: 0.3s;
        }
        .btn-ghost:hover { background: rgba(255, 255, 255, 0.1); }

        /* Stats strip */
        .stats-strip {
          margin: 24px 0;
          display: flex; gap: 16px;
          overflow-x: auto; padding-bottom: 12px;
          scrollbar-width: none;
        }
        .stats-strip::-webkit-scrollbar { display: none; }
        
        .stat-card {
          min-width: 240px;
          background: rgba(13, 17, 34, 0.5);
          border: 1px solid var(--border-glass);
          border-radius: 24px;
          padding: 20px 24px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          display: flex; justify-content: space-between; align-items: center;
          transition: 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
          backdrop-filter: blur(10px);
        }
        .stat-card:hover { transform: translateY(-5px); background: rgba(13, 17, 34, 0.7); border-color: rgba(255, 255, 255, 0.2); }
        .stat-left { display: flex; flex-direction: column; gap: 6px; }
        .stat-value { font-size: 1.8rem; font-weight: 900; color: #fff; line-height: 1; text-shadow: 0 0 20px rgba(255,255,255,0.1); }
        .stat-title { font-size: .8rem; color: var(--text-dim); font-weight: 800; letter-spacing: 1px; text-transform: uppercase; }
        .stat-ic { font-size: 1.8rem; background: var(--brand-grad); -webkit-background-clip: text; -webkit-text-fill-color: transparent; filter: drop-shadow(0 0 10px rgba(139, 92, 246, 0.5)); }

        .tone-orange { border-bottom: 3px solid #f59e0b; }
        .tone-red { border-bottom: 3px solid #ef4444; }
        .tone-blue { border-bottom: 3px solid #3b82f6; }
        .tone-green { border-bottom: 3px solid #10b981; }
        .tone-violet { border-bottom: 3px solid #8b5cf6; }
        .tone-teal { border-bottom: 3px solid #14b8a6; }

        /* Tabs */
        .tabs-wrapper { overflow-x: auto; margin-bottom: 20px; padding: 4px; }
        .tabs-container { display: flex; gap: 12px; min-width: max-content; }
        .tab-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-glass);
          padding: 12px 22px;
          border-radius: 16px;
          cursor: pointer;
          display: flex; align-items: center; gap: 12px;
          color: var(--text-dim);
          font-weight: 900;
          white-space: nowrap;
          transition: 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
        }
        .tab-btn:hover:not(.active) { background: rgba(255, 255, 255, 0.1); color: #fff; }
        .tab-btn.active {
          background: var(--brand-grad);
          border-color: transparent;
          color: #fff;
          box-shadow: 0 15px 35px rgba(139, 92, 246, 0.4);
          transform: translateY(-2px);
        }
        .tab-badge {
          background: #ef4444; color: white;
          padding: 2px 8px; border-radius: 8px;
          font-size: .75rem; font-weight: 900;
          box-shadow: 0 4px 10px rgba(239, 68, 68, 0.4);
        }

        /* Content */
        .content-panel {
          background: rgba(13, 17, 34, 0.6);
          border-radius: 28px;
          padding: 28px;
          box-shadow: 0 30px 60px rgba(0,0,0,0.5);
          border: 1px solid var(--border-glass);
          backdrop-filter: blur(20px);
          width: 100%;
          box-sizing: border-box;
        }

        .section-head {
          display: flex; justify-content: space-between; align-items: center;
          gap: 16px; margin-bottom: 24px; flex-wrap: wrap;
        }
        .section-head h3 {
          margin: 0; font-size: 1.2rem; font-weight: 900;
          background: linear-gradient(90deg, #50c8ff, #a78bfa);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          display: flex; align-items: center; gap: 12px;
        }
        .head-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        
        .btn-primary-sm {
          background: var(--brand-grad);
          color: #fff; border: none; padding: 10px 20px;
          border-radius: 14px; font-weight: 900; cursor: pointer;
          display: flex; align-items: center; gap: 10px;
          transition: 0.3s; box-shadow: 0 8px 15px rgba(139, 92, 246, 0.2);
        }
        .btn-primary-sm:hover { transform: translateY(-2px); box-shadow: 0 12px 25px rgba(139, 92, 246, 0.4); }

        .btn-secondary-sm {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-glass);
          color: #fff; padding: 10px 20px;
          border-radius: 14px; font-weight: 900; cursor: pointer;
          transition: 0.3s;
        }
        .btn-secondary-sm:hover { background: rgba(255, 255, 255, 0.1); border-color: #50c8ff; }

        .recruitment-card, .onb-card, .holiday-card {
          background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-glass);
          border-radius: 24px; padding: 24px; margin-bottom: 20px;
        }

        /* Tables */
        .table-responsive { overflow-x: auto; border-radius: 18px; border: 1px solid var(--border-glass); }
        .modern-table { width: 100%; border-collapse: collapse; min-width: 980px; background: rgba(255, 255, 255, 0.02); }
        .modern-table th {
          text-align: left; padding: 16px;
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.5);
          font-size: .75rem; border-bottom: 1px solid var(--border-glass);
          text-transform: uppercase; letter-spacing: 1.5px; font-weight: 900;
        }
        .modern-table td {
          padding: 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          vertical-align: middle; font-size: .9rem; font-weight: 600; color: #fff;
        }
        .modern-table tr:hover { background: rgba(80, 200, 255, 0.05); }

        .status-pill {
          padding: 6px 14px; border-radius: 999px;
          font-size: .72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;
          border: 1px solid rgba(255, 255, 255, 0.1); background: rgba(255, 255, 255, 0.05); color: #fff;
        }
        .status-pill.active, .status-pill.verified { 
          background: rgba(16, 185, 129, 0.1); color: #10b981; border-color: rgba(16, 185, 129, 0.3);
          box-shadow: 0 0 15px rgba(16, 185, 129, 0.15);
        }
        .status-pill.pending { 
          background: rgba(245, 158, 11, 0.1); color: #f59e0b; border-color: rgba(245, 158, 11, 0.3);
        }

        .avatar-circle {
          width: 38px; height: 38px; border-radius: 12px;
          background: rgba(80, 200, 255, 0.1); color: #50c8ff;
          display: flex; align-items: center; justify-content: center;
          font-weight: 900; border: 1px solid rgba(80, 200, 255, 0.2);
        }

        /* Pagination & Search */
        .pagination-controls { display: flex; align-items: center; justify-content: flex-end; gap: 16px; margin-top: 20px; }
        .pg-btn {
          background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-glass);
          color: #fff; padding: 8px 16px; border-radius: 12px; cursor: pointer;
          display: flex; align-items: center; gap: 8px; font-weight: 800; transition: 0.3s;
        }
        .pg-btn:hover:not(:disabled) { background: rgba(80, 200, 255, 0.1); border-color: #50c8ff; }
        .pg-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .pg-info { font-size: 13px; color: var(--text-dim); font-weight: 700; }

        .search-box-sm {
          display: flex; align-items: center; background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-glass); border-radius: 14px; padding: 6px 14px;
          width: 240px; transition: 0.3s;
        }
        .search-box-sm:focus-within { border-color: #50c8ff; background: rgba(80, 200, 255, 0.05); }
        .search-ic { color: var(--text-dim); margin-right: 10px; font-size: 14px; }
        .search-box-sm input {
          border: none; background: transparent; color: #fff; outline: none;
          font-size: 13px; font-weight: 600; width: 100%;
        }

        /* Recruitment Subtabs */
        .subtabs { display: flex; gap: 10px; margin-bottom: 20px; overflow-x: auto; padding-bottom: 8px; }
        .subtab-btn {
          background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-glass);
          padding: 10px 18px; border-radius: 14px; color: var(--text-dim);
          cursor: pointer; display: flex; align-items: center; gap: 10px;
          font-weight: 800; transition: 0.3s; white-space: nowrap;
        }
        .subtab-btn:hover:not(.active) { background: rgba(255, 255, 255, 0.08); color: #fff; }
        .subtab-btn.active { background: rgba(80, 200, 255, 0.1); border-color: #50c8ff; color: #50c8ff; }
        .subtab-badge { background: #50c8ff; color: #050714; padding: 2px 8px; border-radius: 8px; font-size: 11px; font-weight: 900; }

        .stage-select {
          background: rgba(13, 17, 34, 0.6); border: 1px solid var(--border-glass);
          color: #fff; padding: 8px 12px; border-radius: 12px; outline: none;
          font-weight: 700; cursor: pointer; transition: 0.3s;
        }
        .stage-select:focus { border-color: #50c8ff; }

        .btn-xs {
          padding: 6px 12px; border-radius: 10px; border: none; cursor: pointer;
          font-size: 11px; font-weight: 800; text-transform: uppercase;
          transition: 0.3s; margin-left: 6px;
        }
        .btn-xs.approve { background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); }
        .btn-xs.reject { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }
        .btn-xs:hover { filter: brightness(1.2); transform: translateY(-1px); }

        /* Modals */
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(5, 7, 20, 0.85);
          display: flex; align-items: flex-start; justify-content: center;
          z-index: 1000; padding: 40px 10px; backdrop-filter: blur(12px);
          overflow-y: auto; /* ALLOW OVERLAY TO SCROLL */
          -webkit-overflow-scrolling: touch;
        }
        .modal-card {
          background: rgba(13, 17, 34, 0.95);
          width: 95%; max-width: 580px; border-radius: 28px;
          margin: auto; /* Vertical centering */
          overflow: visible; /* Let children handle their own scroll overflow if needed, but card needs to be visible */
          box-shadow: 0 50px 100px rgba(0,0,0,0.6);
          border: 1px solid var(--border-glass); backdrop-filter: blur(20px);
          color: #fff;
          position: relative;
        }
        .modal-card.wide { max-width: 900px; }

        .modal-header {
          padding: 24px 30px; border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          background: linear-gradient(135deg, rgba(80, 200, 255, 0.05), transparent);
          display: flex; justify-content: space-between; align-items: center;
          position: sticky; top: 0; z-index: 10;
          background: rgba(13, 17, 34, 0.98);
          border-top-left-radius: 28px; border-top-right-radius: 28px;
        }
        .modal-body { 
          padding: 24px 24px 40px 24px; /* Increased bottom padding for buttom gap */
          min-height: min-content;
        }
        .modal-header h3 { 
          margin: 0; font-size: 1.15rem; font-weight: 950; 
          background: var(--brand-grad); -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          letter-spacing: -0.5px;
        }
        .close-btn { 
          width: 34px; height: 34px; border-radius: 50%; background: rgba(255, 255, 255, 0.08);
          border: 1px solid var(--border-glass); cursor: pointer; color: #fff;
          display: grid; place-items: center; transition: 0.3s;
        }

        .close-btn:hover { background: rgba(239, 68, 68, 0.15); color: #ef4444; border-color: #ef4444; transform: rotate(90deg); }

        .form-group { display: flex; flex-direction: column; width: 100%; }
        .form-group label { color: var(--text-dim); font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
        .form-group input, .form-group select, .form-group textarea {
          background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-glass);
          border-radius: 14px; padding: 12px 16px; color: #fff; font-weight: 600; outline: none;
          width: 100%; box-sizing: border-box; transition: 0.3s;
        }
        .form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: #50c8ff; background: rgba(80, 200, 255, 0.05); }

        .form-row { display: flex; gap: 16px; width: 100%; }
        @media (max-width: 640px) { 
          .form-row { flex-direction: column; gap: 0; } 
          .form-row > .form-group { margin-bottom: 12px; }
          .form-group { width: 100%; }
        }

        .btn-primary {
          background: var(--brand-grad); color: #fff; border: none; padding: 14px;
          border-radius: 16px; font-weight: 900; cursor: pointer; text-transform: uppercase; letter-spacing: 1px;
          transition: 0.4s cubic-bezier(0.165, 0.84, 0.44, 1); box-shadow: 0 10px 25px rgba(139, 92, 246, 0.3);
        }
        .btn-primary.full-width { margin-top: 24px; } /* Added gap before created button */
        .btn-primary:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 15px 35px rgba(139, 92, 246, 0.5); filter: brightness(1.1); }

        /* Loader */
        .loader-screen {
          height: 100vh; background: radial-gradient(circle at 50% 50%, #0f172a, #050714);
          display: grid; place-items: center; color: #fff;
        }
        .loader-card { text-align: center; }
        .spinner-container {
          position: relative; width: 80px; height: 80px; margin: 0 auto 24px;
          display: flex; align-items: center; justify-content: center;
        }
        .spinner-ring {
          position: absolute; inset: 0; border: 2px solid rgba(80, 200, 255, 0.1);
          border-radius: 50%; border-top-color: #50c8ff;
          animation: spin 1s cubic-bezier(0.55, 0.17, 0.21, 0.76) infinite;
        }
        .spinner-kinetic {
          position: absolute; inset: 10px; border: 2px solid transparent;
          border-radius: 50%; border-left-color: #a78bfa; border-right-color: #e879f9;
          animation: spin 1.5s linear infinite reverse;
        }
        .loader-ic { font-size: 24px; color: #50c8ff; filter: drop-shadow(0 0 10px rgba(80, 200, 255, 0.5)); animation: pulse 2s ease-in-out infinite; }

        .ld-title { font-size: 1.5rem; font-weight: 900; background: var(--brand-grad); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .ld-sub { color: var(--text-dim); margin-top: 8px; font-weight: 600; font-size: 0.9rem; }

        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 0.6; transform: scale(0.9); } 50% { opacity: 1; transform: scale(1.1); } }
        .animate-pop { animation: pop 0.4s cubic-bezier(0.165, 0.84, 0.44, 1); }
        @keyframes pop { from { opacity: 0; transform: scale(0.95) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }

        .onb-item:hover { background: rgba(255, 255, 255, 0.05); transform: translateX(5px); border-color: rgba(80, 200, 255, 0.2); }

        /* Hide mobile cards on desktop */
        .mobile-cards { display: none; }

        /* Responsive Media Queries */
        @media (max-width: 1024px) {
          .hr-dashboard { padding: 15px; }
          .stat-card { min-width: 200px; padding: 15px 20px; }
          .stat-value { font-size: 1.4rem; }
        }

        @media (max-width: 768px) {
          .dashboard-header { padding: 15px 20px; border-radius: 18px; position: static; }
          .header-title h1 { font-size: 1.1rem; }
          .header-title p { font-size: 0.75rem; }
          .icon-box-header { width: 42px; height: 42px; font-size: 1.1rem; }
          
          .desktop-only { display: none !important; }
          .mobile-cards { display: grid; gap: 15px; margin-top: 10px; }
          
          .m-card {
            background: rgba(255,255,255,0.03); 
            border: 1px solid var(--border-glass);
            border-radius: 18px; 
            padding: 16px;
            display: flex; flex-direction: column; gap: 12px;
          }
          .m-card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
          .m-title { font-weight: 800; font-size: 1rem; color: #fff; }
          .m-card-body { display: flex; flex-direction: column; gap: 6px; }
          .m-item { font-size: 0.85rem; color: var(--text-dim); }
          .m-item strong { color: rgba(255,255,255,0.9); margin-right: 4px; }
          .m-card-actions { 
            display: flex; gap: 10px; flex-wrap: wrap; 
            padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.05);
            margin-top: 5px;
          }
          .m-card-actions .btn-icon {
            flex: 1; min-width: 100px;
            justify-content: center;
            background: rgba(255,255,255,0.05);
            border: 1px solid var(--border-glass);
            color: #fff; padding: 10px; border-radius: 10px;
            font-size: 0.8rem; font-weight: 700;
            display: flex; align-items: center; gap: 8px;
            cursor: pointer; transition: 0.2s;
          }
          .m-card-actions .btn-icon.view:hover { background: rgba(80, 200, 255, 0.2); }
          .m-card-actions .btn-icon.delete:hover { background: rgba(239, 68, 68, 0.2); }
          .m-card-actions .btn-icon.approve:hover { background: rgba(34, 197, 94, 0.2); }

          .stats-strip { margin: 15px 0; gap: 12px; }
          .tabs-container { gap: 8px; }
          .tab-btn { padding: 10px 16px; font-size: 0.85rem; border-radius: 12px; }
          .content-panel { padding: 20px; border-radius: 20px; }
          .section-head h3 { font-size: 1rem; }
        }

        /* Media queries relocated to end for correct override cascade */

        @media (max-width: 480px) {
          .hr-dashboard { padding: 10px 10px 40px 10px; } /* Increased bottom gap */
          .dashboard-header { padding: 12px; gap: 15px; }
          .header-actions { width: 100%; display: grid; grid-template-columns: 1fr; gap: 8px; }
          .btn-refresh, .btn-ghost { padding: 10px; font-size: 0.75rem; width: 100%; justify-content: center; }
          .m-card-actions .btn-icon { min-width: 100%; }
          .modal-card { border-radius: 20px; margin-bottom: 40px; } /* Card gap for small screens */
          .modal-header { padding: 18px 20px; }
          .p-30 { padding: 20px !important; }
          .modal-actions-footer { flex-direction: column; gap: 8px; }
          .modal-actions-footer button { width: 100% !important; margin: 0 !important; }
          .head-actions { width: 100%; display: grid; grid-template-columns: 1fr; gap: 12px; margin-top: 5px; }
          .head-actions .btn-primary-sm, .head-actions .btn-secondary-sm, .head-actions .search-box-sm { 
            width: 100%; height: 48px; border-radius: 16px; justify-content: center; font-size: 0.95rem; 
            margin: 0; box-sizing: border-box;
          }
          .head-actions .search-box-sm { padding: 0 16px; }
          .head-actions .search-box-sm input { font-size: 0.95rem; }
          .btn-secondary-sm { background: rgba(255, 255, 255, 0.08); border-color: rgba(255, 255, 255, 0.2); }
          .content-panel { padding: 15px; padding-bottom: 40px; }
        }

        /* PREMIUM NEW STYLES */
        .modal-title-wrap { display: flex; align-items: center; gap: 15px; }
        .modal-icon-hex {
          width: 40px; height: 40px; background: rgba(80, 200, 255, 0.1);
          border: 1px solid rgba(80, 200, 255, 0.3); border-radius: 10px;
          display: grid; place-items: center; color: #50c8ff; font-size: 1.2rem;
        }
        .modal-icon-hex.variant-teal { background: rgba(20, 184, 166, 0.1); border-color: rgba(20, 184, 166, 0.3); color: #14b8a6; }
        
        .p-30 { padding: 30px !important; }
        .premium-form { display: flex; flex-direction: column; gap: 20px; }
        
        .input-with-icon { position: relative; display: flex; align-items: center; }
        .field-ic { position: absolute; left: 14px; color: var(--text-dim); pointer-events: none; transition: 0.3s; }
        .input-with-icon input, .input-with-icon select { padding-left: 42px !important; width: 100%; }
        .input-with-icon input:focus + .field-ic, .input-with-icon select:focus + .field-ic { color: #50c8ff; }
        
        .textarea-wrapper { display: flex; flex-direction: column; gap: 6px; }
        .textarea-stats { align-self: flex-end; font-size: 10px; font-weight: 800; color: #50c8ff; text-transform: uppercase; background: rgba(80, 200, 255, 0.05); padding: 2px 8px; border-radius: 6px; }
        
        .modal-actions-footer { display: flex; gap: 12px; margin-top: 24px; }
        .req { color: #ef4444; margin-left: 2px; }
        .helper-hint { font-size: 10px; color: var(--text-dim); font-style: italic; text-transform: none; letter-spacing: 0; opacity: 0.8; }
        
        /* Animations */
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-in-1 { animation: slideInUp 0.3s ease-out forwards; }
        .animate-slide-in-2 { animation: slideInUp 0.3s ease-out 0.1s forwards; opacity: 0; }
        .animate-slide-in-3 { animation: slideInUp 0.3s ease-out 0.2s forwards; opacity: 0; }
        .animate-slide-in-4 { animation: slideInUp 0.3s ease-out 0.3s forwards; opacity: 0; }
        .animate-slide-in-5 { animation: slideInUp 0.3s ease-out 0.4s forwards; opacity: 0; }

        .modal-card.wide { max-width: 800px; }
        
        .onb-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; width: 100%; box-sizing: border-box; }
        .onb-list { display: flex; flex-direction: column; gap: 10px; margin-top: 15px; }
        .onb-item { 
          display: flex; justify-content: space-between; align-items: center; 
          padding: 14px; background: rgba(255, 255, 255, 0.02); 
          border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 16px;
          transition: 0.3s;
        }
        .onb-item-left { display: flex; align-items: center; gap: 12px; }
        .onb-icon-static {
          width: 32px; height: 32px; background: rgba(80, 200, 255, 0.05);
          border: 1px solid rgba(80, 200, 255, 0.1); border-radius: 8px;
          display: grid; place-items: center; color: #50c8ff; font-size: 0.9rem;
        }
        .onb-icon-static.variant-teal { background: rgba(20, 184, 166, 0.05); border-color: rgba(20, 184, 166, 0.1); color: #14b8a6; }
        
        .onb-title { font-weight: 800; font-size: 0.95rem; color: #fff; }
        .onb-sub { font-size: 0.75rem; color: var(--text-dim); margin-top: 2px; }
        .sub-note { margin-top: 15px; font-size: 0.75rem; color: #50c8ff; font-style: italic; background: rgba(80, 200, 255, 0.05); padding: 10px; border-radius: 10px; }
        .empty-mini { padding: 20px; text-align: center; color: var(--text-dim); font-size: 0.85rem; font-style: italic; }

        @media (max-width: 768px) {
          .onb-grid { grid-template-columns: 1fr; gap: 15px; }
        }
        @media (max-width: 480px) {
          .onb-card { padding: 15px; border-radius: 18px; }
          .onb-item { padding: 10px; }
          .onb-icon-static { width: 28px; height: 28px; font-size: 0.8rem; }
        }
      `}</style>
    </div >
  );
};

export default HrAdminDashboard;
