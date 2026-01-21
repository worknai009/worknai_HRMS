// frontend/src/services/api.js
import axios from "axios";
import { getApiBaseUrl, getClientTimeZone } from "../utils/env";

const API = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000,
});

/* ================= HELPERS ================= */
const isPublicPath = (pathname = "") => {
  const p = String(pathname || "").toLowerCase();
  return (
    p.includes("login") ||
    p.includes("register") ||
    p.includes("partner-with-us") ||
    p.includes("unauthorized")
  );
};

export const clearAuthStorage = () => {
  localStorage.removeItem("user");
  localStorage.removeItem("token");

  localStorage.removeItem("ctx");
  localStorage.removeItem("company");
  localStorage.removeItem("selectedCompany");

  window.localStorage.setItem("logout_event", Date.now().toString());
};

export const getApiErrorMessage = (err, fallback = "Something went wrong") => {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    fallback
  );
};

/* ================= REQUEST INTERCEPTOR ================= */
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;

    config.headers["x-timezone"] = getClientTimeZone();
    config.headers["x-client"] = "web";

    return config;
  },
  (error) => Promise.reject(error)
);

/* ================= RESPONSE INTERCEPTOR ================= */
API.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    const currentPath = window.location.pathname || "";

    // ✅ 403 auto redirect OFF (dashboard fallback support)
    if (status === 403) return Promise.reject(err);

    if (status === 401) {
      if (!isPublicPath(currentPath)) {
        clearAuthStorage();
        window.location.href = "/";
      }
    }

    return Promise.reject(err);
  }
);

/* ================= EXPORTED FUNCTIONS ================= */

// --- Auth ---
export const loginUser = (data) => API.post("/auth/login", data);

export const registerEmployee = (formData) =>
  API.post("/auth/register", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const getActiveCompanies = () => API.get("/auth/companies");

// Inquiry (Partner-with-us)
export const submitInquiry = (data) => API.post("/auth/inquiry", data);
export const getInquiries = (query = "") => API.get(`/superadmin/inquiries${query}`);
export const deleteInquiry = (id) => API.delete(`/superadmin/inquiry/${id}`);
export const approveInquiry = (id) => API.post(`/superadmin/approve-inquiry`, { inquiryId: id });

// --- Tasks ---
export const assignTask = (formData) =>
  API.post("/tasks/assign", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const getMyTasks = (query = "") => API.get(`/tasks/my-tasks${query}`);
export const getAllTasks = (query = "") => API.get(`/tasks/all${query}`);

export const updateTaskStatus = (taskId, status) =>
  API.put(`/tasks/update-status/${taskId}`, { status });

export const submitTask = (taskId, formData) =>
  API.put(`/tasks/complete/${taskId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const reviewTask = (taskId, data) => API.put(`/tasks/review/${taskId}`, data);

export const getDownloadUrl = (taskId, fileUrl) => {
  const base = API.defaults.baseURL;
  return `${base}/tasks/download/${taskId}?url=${encodeURIComponent(fileUrl)}`;
};

/* =========================
   ✅ RECRUITMENT (UPDATED)
========================= */

// --- Public (Careers) ---
export const publicGetJobs = (query = "") => API.get(`/recruitment/public/jobs${query}`);
export const publicGetJob = (id) => API.get(`/recruitment/public/job/${id}`);

export const publicApplyToJob = (formData) =>
  API.post("/recruitment/public/apply", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const checkApplicationStatus = (data) =>
  API.post("/recruitment/public/check-status", data);

// --- HR Jobs CRUD ---
export const getJobs = (query = "") => API.get(`/recruitment/jobs${query}`);
export const createJob = (data) => API.post("/recruitment/job", data);
export const updateJob = (id, data) => API.put(`/recruitment/job/${id}`, data);
export const deleteJob = (id) => API.delete(`/recruitment/job/${id}`);

// --- HR Applications CRUD ---
export const getApplications = (query = "") => API.get(`/recruitment/applications${query}`);
export const updateApplicationStage = (id, stage) =>
  API.put(`/recruitment/application/${id}/stage`, { stage });
export const deleteApplication = (id) => API.delete(`/recruitment/application/${id}`);

// ✅ Offline Hiring (NO employee auto-create)
export const hireApplicant = (appId) => API.post(`/recruitment/hire/${appId}`);

// --- HR Interviews CRUD ---
export const getInterviews = (query = "") => API.get(`/recruitment/interviews${query}`);
export const scheduleInterview = (data) => API.post("/recruitment/interview", data);
export const updateInterview = (id, data) => API.put(`/recruitment/interview/${id}`, data);
export const deleteInterview = (id) => API.delete(`/recruitment/interview/${id}`);

// --- HR Candidates (Derived from Applications) ---
export const getCandidates = (query = "") => API.get(`/recruitment/candidates${query}`);
export const getCandidate = (id) => API.get(`/recruitment/candidate/${encodeURIComponent(id)}`);

// ✅ HR Add Candidate = Create Application manually (optional resume)
export const addCandidate = (formData) =>
  API.post("/recruitment/candidate", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const deleteCandidate = (id) =>
  API.delete(`/recruitment/candidate/${encodeURIComponent(id)}`);

/* =========================
   ✅ ONBOARDING (FIXED to MATCH BACKEND ROUTES)
   Backend:
   - GET/POST   /onboarding/templates
   - GET/POST   /onboarding/assignments
   - GET        /onboarding/my
   - PATCH      /onboarding/my/item   (body: {itemId/idx, status/done, comment})
========================= */

export const getTemplates = () => API.get("/onboarding/templates");

export const createTemplate = (data) =>
  API.post("/onboarding/templates", data).catch((err) => {
    // backward compatibility (older frontend/backends)
    const st = err?.response?.status;
    if (st === 404 || st === 405) return API.post("/onboarding/template", data);
    throw err;
  });

export const getAssignments = () => API.get("/onboarding/assignments");

export const assignOnboarding = (data) =>
  API.post("/onboarding/assignments", data).catch((err) => {
    const st = err?.response?.status;
    if (st === 404 || st === 405) return API.post("/onboarding/assignment", data);
    throw err;
  });

export const getMyOnboarding = () => API.get("/onboarding/my");

export const updateOnboardingItem = (itemId, data = {}) => {
  const payload = { ...(data || {}), itemId };
  return API.patch("/onboarding/my/item", payload).catch((err) => {
    const st = err?.response?.status;
    // fallback old route if exists somewhere
    if (st === 404 || st === 405) {
      return API.put(`/onboarding/my/item/${itemId}/done`, data);
    }
    throw err;
  });
};

/* =========================
   ✅ LEAVES (PAID / UNPAID / WFH ONLY)
========================= */
export const getMyLeaves = () => API.get("/leaves/my");
export const getEmployeeLeaves = (userId) => API.get(`/leaves/employee/${userId}`);
export const applyLeave = (data) => API.post("/leaves/apply", data);

// --- Attendance ---
export const punchIn = (data) => API.post("/attendance/punch-in", data);
export const punchOut = (data) => API.post("/attendance/punch-out", data);

export const getMyHistory = () => API.get("/attendance/history");
export const getUserHistory = (userId) => API.get(`/attendance/history/${userId}`);
export const getStats = () => API.get("/attendance/stats");

// --- HR Management ---
export const getAllEmployees = () => API.get("/company/employees");
export const getAllAttendance = () => API.get("/attendance/all");

// --- File Download Helper ---
export const downloadFile = async (url, filename) => {
  try {
    const isAbs = /^https?:\/\//i.test(url);
    const token = localStorage.getItem("token");

    const client = isAbs ? axios : API;
    const response = await client.get(url, {
      responseType: "blob",
      ...(isAbs && token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
    });

    const href = window.URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = href;
    link.setAttribute("download", filename || "file");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(href);
  } catch (error) {
    console.error("Download failed", error);
    alert(getApiErrorMessage(error, "Download failed."));
  }
};

export default API;
