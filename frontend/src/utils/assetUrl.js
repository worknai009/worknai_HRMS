// frontend/src/utils/assetUrl.js
import API from "../services/api";

/**
 * Try to detect backend origin from axios baseURL.
 * Example baseURL: http://localhost:5000/api  -> origin: http://localhost:5000
 */
export const getApiOrigin = () => {
  try {
    const base = API?.defaults?.baseURL || "";
    if (!base) return "http://localhost:5000";
    const url = new URL(base);
    return url.origin;
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
