import { useEffect, useState } from "react";
import { LocateFixed, MapPin, Navigation, Pause } from "lucide-react";

const env = (import.meta as ImportMeta & { env: Record<string, string | undefined> }).env;
const latitude = env.VITE_INITIAL_LATITUDE?.trim();
const longitude = env.VITE_INITIAL_LONGITUDE?.trim();
const LOCATION = latitude && longitude
  && Number.isFinite(Number(latitude)) && Math.abs(Number(latitude)) <= 90
  && Number.isFinite(Number(longitude)) && Math.abs(Number(longitude)) <= 180
  ? { latitude: Number(latitude), longitude: Number(longitude) }
  : null;
const REFRESH_INTERVAL = 3 * 60 * 1000;

export default function SavedLocation() {
  const [showMap, setShowMap] = useState(false);
  const [location, setLocation] = useState(LOCATION);
  const [tracking, setTracking] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!tracking) return;
    let active = true;
    let pending = false;
    let lastSuccess = 0;
    const refresh = () => {
      if (pending || document.hidden) return;
      pending = true;
      setUpdating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!active) return;
          pending = false;
          lastSuccess = Date.now();
          setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
          setLastUpdated(lastSuccess);
          setError("");
          setUpdating(false);
        },
        (failure) => {
          if (!active) return;
          pending = false;
          setUpdating(false);
          setError(failure.code === 1
            ? "Location access is blocked. Allow it in your browser to enable live updates."
            : "Location update unavailable. The last location is shown.");
          if (failure.code === 1) setTracking(false);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
      );
    };
    const onVisible = () => {
      if (!document.hidden && Date.now() - lastSuccess >= REFRESH_INTERVAL) refresh();
    };
    refresh();
    const timer = window.setInterval(refresh, REFRESH_INTERVAL);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      active = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [tracking]);

  const enableUpdates = () => {
    if (!navigator.geolocation || !window.isSecureContext) {
      setError("Live location requires a supported browser and an HTTPS connection.");
      return;
    }
    setError("");
    setTracking(true);
  };
  const coordinates = location ? `${location.latitude.toFixed(7)}, ${location.longitude.toFixed(7)}` : "Enable location to show coordinates";
  const destination = location ? `${location.latitude},${location.longitude}` : "";
  const navigationUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
  const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(destination)}&z=17&output=embed`;
  const live = tracking && lastUpdated !== null && !error && !updating;

  return (
    <section className="card location-card" aria-labelledby="saved-location-title">
      <div className="section-head">
        <span className="eyebrow"><MapPin size={15} /> GPS LOCATION</span>
        <span className={`location-badge${live ? " location-live" : ""}`} role="status">
          {updating ? "Locating…" : live ? "Live" : error ? "Update unavailable" : tracking ? "Connecting…" : "Updates paused"}
        </span>
      </div>
      <div className="location-card-grid">
        <div className="location-card-copy">
          <h2 id="saved-location-title">{live ? "Live location" : "Location"}</h2>
          <p className="location-coordinates">{coordinates}</p>
          <p>{tracking
            ? error ? "Retrying location every 3 minutes." : lastUpdated ? "Updating every 3 minutes while this page is active." : "Waiting for this device’s location…"
            : "Enable live location to update every 3 minutes."}</p>
          <div className="location-actions">
            {location && <a className="primary" href={navigationUrl} target="_blank" rel="noopener noreferrer">
              <Navigation size={16} /> Navigate to this location
            </a>}
            {tracking ? (
              <button className="secondary" onClick={() => { setTracking(false); setUpdating(false); }}><Pause size={16} /> Pause updates</button>
            ) : (
              <button className="secondary" onClick={enableUpdates}><LocateFixed size={16} /> Enable live location</button>
            )}
          </div>
          {lastUpdated && <p className="fine location-note">Last updated {new Date(lastUpdated).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}.</p>}
          {error && <p className="location-error" role="alert">{error}</p>}
        </div>
        <div className="location-map">
          {showMap && location ? (
            <iframe title="Map of your location" src={mapUrl} loading="lazy" referrerPolicy="no-referrer" />
          ) : (
            <button className="location-map-placeholder" disabled={!location} onClick={() => setShowMap(true)}>
              <MapPin size={30} /><span>Show location on map</span><small>{location ? "Opens a Google Maps preview" : "Enable live location to load a map"}</small>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
