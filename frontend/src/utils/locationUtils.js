/**
 * High-Accuracy Location Fetcher
 * Returns a Promise that resolves with { lat, lng, accuracy } or rejects with error.
 */
export const getHighAccuracyLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }

    const options = {
      enableHighAccuracy: true, // Key for "High Level"
      timeout: 10000,           // Wait 10s max
      maximumAge: 0             // Do not use cached position
    };

    const success = (pos) => {
      const { latitude, longitude, accuracy } = pos.coords;
      resolve({
        lat: latitude,
        lng: longitude,
        accuracy: accuracy // useful to show user "Accurate to 15 meters"
      });
    };

    const error = (err) => {
      let msg = "Location error";
      switch (err.code) {
        case err.PERMISSION_DENIED:
          msg = "User denied the request for Geolocation.";
          break;
        case err.POSITION_UNAVAILABLE:
          msg = "Location information is unavailable.";
          break;
        case err.TIMEOUT:
          msg = "The request to get user location timed out.";
          break;
        default:
          msg = "An unknown error occurred.";
      }
      reject(new Error(msg));
    };

    navigator.geolocation.getCurrentPosition(success, error, options);
  });
};