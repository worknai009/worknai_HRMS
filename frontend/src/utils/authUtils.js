// frontend/src/utils/authUtils.js

export const safeJsonParse = (v) => {
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
};

// lightweight JWT payload decode (no extra lib)
export const parseJwtPayload = (token) => {
  try {
    const base64Url = token?.split(".")?.[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
};

export const isTokenExpired = (token) => {
  const payload = parseJwtPayload(token);
  if (!payload?.exp) return false; // if backend doesn't send exp, assume valid
  return Date.now() >= payload.exp * 1000;
};

// Canonical role labels for UI + routes
export const normalizeRole = (role = "") => {
  const r = String(role || "").trim();
  if (!r) return "";

  const low = r.toLowerCase();

  if (low === "companyowner" || low === "companyadmin" || low === "company-admin") return "CompanyAdmin";
  if (low === "hr" || low === "hradmin" || low === "admin") return "Admin";
  if (low === "employee") return "Employee";
  if (low === "superadmin" || low === "super-admin") return "SuperAdmin";

  // fallback: keep original label
  return r;
};

export const buildUserFromToken = (token, fallback = {}) => {
  const payload = parseJwtPayload(token);
  if (!payload) return fallback;

  const roleRaw = payload.role || payload.userRole || payload.type;
  const out = { ...fallback };

  // common ids
  out._id = out._id || payload.userId || payload.id || payload.sub;
  out.id = out.id || payload.userId || payload.id || payload.sub;

  // common identity fields
  out.email = out.email || payload.email;
  out.name = out.name || payload.name;

  // tenant info (if backend provides)
  out.companyId = out.companyId || payload.companyId || payload.tenantId;

  // normalized role
  out.role = normalizeRole(out.role || roleRaw);

  return out;
};
