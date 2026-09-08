import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, X, Loader2, ExternalLink, Send } from 'lucide-react';

export default function LocationShareModal({ onSendLocation, onClose }) {
  const [loading, setLoading] = useState(true);
  const [coords, setCoords] = useState(null);
  const [address, setAddress] = useState('');
  const [placeName, setPlaceName] = useState('Current Location');
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    fetchCurrentLocation();
  }, []);

  const fetchCurrentLocation = () => {
    setLoading(true);
    setErrorMsg(null);
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        setCoords({ lat, lng, accuracy: Math.round(pos.coords.accuracy) });
        setAddress(`Lat: ${lat}, Lng: ${lng}`);
        setLoading(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        // Fallback default coordinates so user can still share location
        const defaultLat = 17.3850;
        const defaultLng = 78.4867;
        setCoords({ lat: defaultLat, lng: defaultLng, accuracy: 100 });
        setAddress(`Hyderabad, Telangana (${defaultLat}, ${defaultLng})`);
        setErrorMsg('Could not detect exact GPS position. Using approximate location.');
        setLoading(false);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleSend = () => {
    if (!coords) return;
    onSendLocation({
      latitude: coords.lat,
      longitude: coords.lng,
      address: address || `Lat: ${coords.lat}, Lng: ${coords.lng}`,
      name: placeName || 'Shared Location'
    });
    onClose();
  };

  const presets = [
    { label: '📍 Current Location', name: 'My Current Location' },
    { label: '🏢 Office / Work', name: 'Office / Work' },
    { label: '🏠 Home', name: 'Home' },
    { label: '⚛️ Quantum Physics Lab', name: 'Quantum Core Facility' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 select-none">
      <div className="bg-wa-surface border border-wa-border max-w-md w-full rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col">
        {/* Header */}
        <div className="h-14 px-4 bg-wa-panel border-b border-wa-border flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-quantum-cyan/20 border border-quantum-cyan/40 flex items-center justify-center text-quantum-cyan">
              <MapPin className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">Share Location</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-wa-hover text-wa-textSecondary hover:text-white rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 text-xs">
          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center text-wa-textSecondary space-y-2">
              <Loader2 className="w-7 h-7 text-quantum-cyan animate-spin" />
              <p className="text-white font-medium">Acquiring GPS coordinates...</p>
            </div>
          ) : (
            <>
              {errorMsg && (
                <div className="p-2.5 bg-amber-950/40 border border-amber-500/40 rounded-xl text-amber-200 text-[11px]">
                  ⚠️ {errorMsg}
                </div>
              )}

              {/* Map Preview Card */}
              {coords && (
                <div className="relative rounded-xl overflow-hidden border border-wa-border bg-wa-panel h-36 flex flex-col items-center justify-center text-center p-3 group">
                  <div className="absolute inset-0 bg-gradient-to-b from-blue-950/40 to-slate-950/80 pointer-events-none" />
                  <MapPin className="w-10 h-10 text-red-500 drop-shadow-lg mb-1 animate-bounce" />
                  <span className="font-bold text-white text-xs z-10">{placeName}</span>
                  <span className="text-[11px] text-wa-textSecondary z-10 font-mono mt-0.5">{address}</span>

                  <a
                    href={`https://www.google.com/maps?q=${coords.lat},${coords.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 text-[10px] text-quantum-cyan hover:underline z-10 flex items-center gap-1 font-semibold"
                  >
                    <span>Preview in Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Presets */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-wa-textSecondary font-semibold uppercase tracking-wider block">
                  Quick Location Label
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {presets.map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPlaceName(p.name)}
                      className={`p-2 rounded-lg border text-left text-xs transition ${
                        placeName === p.name
                          ? 'bg-quantum-cyan/20 border-quantum-cyan text-white font-semibold'
                          : 'bg-wa-panel border-wa-border text-wa-textSecondary hover:text-white hover:bg-wa-hover'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Label & Address */}
              <div className="space-y-2">
                <div>
                  <label className="text-[11px] text-wa-textSecondary font-semibold block mb-1">
                    Location Name
                  </label>
                  <input
                    type="text"
                    value={placeName}
                    onChange={(e) => setPlaceName(e.target.value)}
                    placeholder="e.g. My Current Location"
                    className="w-full bg-wa-panel border border-wa-border rounded-lg px-3 py-2 text-white placeholder-wa-textSecondary focus:outline-none focus:border-wa-green text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-wa-textSecondary font-semibold block mb-1">
                    Address / Note
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Street name or Landmark"
                    className="w-full bg-wa-panel border border-wa-border rounded-lg px-3 py-2 text-white placeholder-wa-textSecondary focus:outline-none focus:border-wa-green text-xs"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-wa-panel border-t border-wa-border flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={fetchCurrentLocation}
            disabled={loading}
            className="px-3 py-2 bg-wa-surface hover:bg-wa-hover text-white text-xs font-semibold rounded-lg border border-wa-border transition flex items-center gap-1.5"
          >
            <Navigation className="w-3.5 h-3.5 text-quantum-cyan" />
            <span>Re-locate</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 bg-wa-surface hover:bg-wa-hover text-wa-textSecondary hover:text-white text-xs font-semibold rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={loading || !coords}
              className="px-4 py-2 bg-wa-green hover:bg-wa-greenHover text-white text-xs font-bold rounded-lg transition shadow flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Location</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

