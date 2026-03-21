import { useEffect } from "react";
import api from "../services/api";

export default function useLocationTracker() {
  useEffect(() => {
    // Guard for non‑browser environments or missing geolocation
    if (typeof window === "undefined" || !("geolocation" in navigator)) return;

    let watchId;

    const sendLocation = async (position) => {
      try {
        const { latitude, longitude } = position.coords;

        await api.post("/location/", {
          lat: latitude,
          lng: longitude,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        console.error("Failed to send live location", err);
        // Ignore errors so the UI never crashes because of location
      }
    };

    const handleError = (err) => {
      console.warn("Geolocation error", err);
    };

    watchId = navigator.geolocation.watchPosition(sendLocation, handleError, {
      enableHighAccuracy: true,
    });

    return () => {
      try {
        if (watchId != null && "geolocation" in navigator) {
          navigator.geolocation.clearWatch(watchId);
        }
      } catch (err) {
        console.warn("Failed to clear geolocation watch", err);
      }
    };
  }, []);
}