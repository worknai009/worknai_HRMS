/**
 * Optimized Image URL Generator for SaaS
 * Handles: Local paths, external URLs, and dynamic server addresses
 */
export const getImageUrl = (path) => {
  // 1. Agar path khali hai toh premium professional placeholder dein
  if (!path) return "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"; 

  // 2. Agar path pehle se full URL hai (Google Auth / External / Base64)
  if (path.startsWith('http') || path.startsWith('data:')) {
      return path;
  }

  // 3. Clean path logic (Double slashes aur Backslashes fix karna)
  // Windows paths (\) ko standard web paths (/) mein badle
  const normalizedPath = path.replace(/\\/g, '/').replace(/^\/+/, '');

  // 4. Dynamic API URL Selection
  // SaaS best practice: Localhost ki jagah base URL context se lein
  const BASE_URL = process.env.REACT_APP_API_URL || window.location.origin;

  // Final path return karein bina kisi double slash ki galti ke
  return `${BASE_URL}/${normalizedPath}`;
};
