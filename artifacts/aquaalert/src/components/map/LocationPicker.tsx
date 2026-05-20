import { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";

// Fix leaflet default icon issue in react
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationPickerProps {
  position: [number, number] | null;
  onChange: (pos: [number, number]) => void;
}

function LocationMarker({ position, onChange }: LocationPickerProps) {
  useMapEvents({
    click(e) {
      onChange([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position === null ? null : (
    <Marker position={position} />
  );
}

export default function LocationPicker({ position, onChange }: LocationPickerProps) {
  const center: [number, number] = [19.076, 72.877]; // Mumbai

  return (
    <div className="h-[300px] w-full rounded-md overflow-hidden border border-slate-800">
      <MapContainer 
        center={position || center} 
        zoom={12} 
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <LocationMarker position={position} onChange={onChange} />
      </MapContainer>
    </div>
  );
}
