import { useEffect, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";

const defaultCenter = {
  lat: 3.139,
  lng: 101.6869,
};

const pinIcon = L.divIcon({
  className: "",
  html: '<span style="display:block;width:18px;height:18px;border-radius:9999px;background:#047857;border:3px solid white;box-shadow:0 4px 14px rgba(15,23,42,0.35);"></span>',
  iconAnchor: [9, 9],
});

const formatCoordinate = (value) => Number(value).toFixed(5);

function MapClickHandler({ onChange }) {
  useMapEvents({
    click(event) {
      onChange({
        lat: event.latlng.lat,
        lng: event.latlng.lng,
      });
    },
  });

  return null;
}

function MapCenter({ location }) {
  const map = useMap();

  useEffect(() => {
    if (location) {
      map.setView([location.lat, location.lng], Math.max(map.getZoom(), 15));
    }
  }, [location, map]);

  return null;
}

function CommunityLocationPicker({
  disabled = false,
  location,
  onChange,
  onMessage,
}) {
  const [locating, setLocating] = useState(false);
  const center = location || defaultCenter;

  const useCurrentLocation = () => {
    onMessage("");

    if (!navigator.geolocation) {
      onMessage("Your browser does not support current location.");
      return;
    }

    setLocating(true);
    onMessage("Finding your current location...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocating(false);
        onMessage("");
      },
      (error) => {
        const denied = error.code === error.PERMISSION_DENIED;
        onMessage(
          denied
            ? "Location permission was denied. You can still create the community without GPS."
            : "Could not get your current location. You can still place the pin manually."
        );
        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 60000,
        timeout: 10000,
      }
    );
  };

  return (
    <div className="grid gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-black text-slate-800">
            Optional location pin
          </p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
            This pin helps identify the community location. It does not verify
            residency.
          </p>
        </div>
        <button
          className="self-start rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-bold text-emerald-800 shadow-sm transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
          disabled={disabled || locating}
          onClick={useCurrentLocation}
        >
          {locating ? "Finding location..." : "Use my current location"}
        </button>
      </div>

      <div className="h-64 overflow-hidden rounded-2xl border border-stone-200 bg-white sm:h-72">
        <MapContainer
          center={[center.lat, center.lng]}
          className="h-full w-full"
          scrollWheelZoom={false}
          zoom={location ? 15 : 12}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {!disabled && <MapClickHandler onChange={onChange} />}
          {location && (
            <>
              <MapCenter location={location} />
              <Marker
                icon={pinIcon}
                position={[location.lat, location.lng]}
              />
            </>
          )}
        </MapContainer>
      </div>

      <p className="text-xs font-semibold text-slate-500">
        {location
          ? `Selected: ${formatCoordinate(location.lat)}, ${formatCoordinate(
              location.lng
            )}`
          : "No location selected yet."}
      </p>
    </div>
  );
}

export default CommunityLocationPicker;
