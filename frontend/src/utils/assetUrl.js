// frontend/src/utils/assetUrl.js
import API from "../services/api";

/**
 * Try to detect backend origin from axios baseURL.
 * Example baseURL: http://localhost:5000/api  -> origin: http://localhost:5000
 */
export const getApiOrigin = () => {
  try {
    const base = API?.defaults?.baseURL || "";

    // 1. If absolute URL, extract origin
    if (base.startsWith("http")) {
      const url = new URL(base);
      return url.origin;
    }

    // 2. If valid environment variable present, use it
    const envUrl =
      process.env.REACT_APP_SERVER_URL || process.env.REACT_APP_BACKEND_URL;
    if (envUrl && envUrl.startsWith("http")) {
      return envUrl.replace(/\/+$/, "");
    }

    // 3. Fallback for Localhost Development
    // If we are on localhost and using relative paths, assume backend is on port 5000
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      return "http://localhost:5000";
    }

    // 4. Production / Relative Proxy
    return "";
  } catch {
    return "http://localhost:5000";
  }
};

export const getAssetUrl = (path) => {
  if (!path) return null;
  if (typeof path !== "string") return null;
  if (path.startsWith("http")) return path;

  const origin = getApiOrigin();
  const clean = path.replace(/\\/g, "/").replace(/^\/+/, "");
  return `${origin}/${clean}`;
};
