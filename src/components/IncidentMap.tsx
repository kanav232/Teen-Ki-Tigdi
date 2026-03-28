'use client';


import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';

import 'leaflet/dist/leaflet.css';
import { Incident } from '@/lib/types';
import L from 'leaflet';

// Fix for default marker icons in Next.js/Leaflet
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});


interface IncidentMapProps {
  incidents: Incident[];
  selectedIncident?: Incident | null;
}

function MapController({ selectedIncident }: { selectedIncident?: Incident | null }) {
  const map = useMap();

  useEffect(() => {
    if (selectedIncident && selectedIncident.coordinates) {
      map.flyTo(
        [selectedIncident.coordinates.lat, selectedIncident.coordinates.lng],
        15,
        {
          duration: 1.5
        }
      );
    }
  }, [selectedIncident, map]);

  return null;
}

export default function IncidentMap({ incidents, selectedIncident }: IncidentMapProps) {
  // Default center (New Delhi, India)
  const defaultCenter: [number, number] = [28.6139, 77.2090];

  return (
    <MapContainer
      center={defaultCenter}
      zoom={12}
      style={{ height: '100%', width: '100%', borderRadius: '0.5rem', minHeight: '400px' }}
      className="z-0"
    >
      <MapController selectedIncident={selectedIncident} />
      <TileLayer
        attribution='&copy; Google Maps'
        url="http://mt0.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
      />
      {incidents.map((incident) => (
        incident.coordinates && (
          <Marker
            key={incident.id}
            position={[incident.coordinates.lat, incident.coordinates.lng]}
            icon={icon}
          >
            <Popup>
              <div className="p-1 min-w-[200px]">
                <h3 className="font-bold text-sm mb-1">{incident.type}</h3>
                <p className="text-xs text-gray-600 mb-2">{incident.location}</p>
                <div className="text-xs mb-2 max-h-[150px] overflow-y-auto pr-1 whitespace-pre-wrap">{incident.summary}</div>
                <div className="flex justify-between items-center border-t pt-2 mt-1">
                  <span className="text-xs font-semibold">Confidence: {incident.confidence}%</span>
                </div>
              </div>
            </Popup>
          </Marker>
        )
      ))}
    </MapContainer>
  );
}
