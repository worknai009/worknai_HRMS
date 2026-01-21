// frontend/src/utils/helpers.js
import { getServerBaseUrl } from "./env";

/**
 * Optimized Image URL Generator for SaaS
 * Handles: Local paths, external URLs, and dynamic server addresses
 */
export const getImageUrl = (path) => {
  if (!path) return "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";

  if (path.startsWith("http") || path.startsWith("data:")) return path;

  const normalizedPath = path.replace(/\\/g, "/").replace(/^\/+/, "");

  const BASE_URL = getServerBaseUrl(); // ✅ no "/api"
  return `${String(BASE_URL).replace(/\/+$/, "")}/${normalizedPath}`;
};
