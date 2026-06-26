import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AnimatePresence } from 'framer-motion';
import EventCard from './EventCard';

// Fix Leaflet's default icon path issues in Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Custom Icon for EcoSense
const customIcon = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  className: 'hue-rotate-[140deg] saturate-200' // Make it emerald green via CSS filter
});

interface CommunityMapProps {
  events: any[];
  onJoinEvent: (id: string) => void;
  joiningId: string | null;
}

export default function CommunityMap({ events, onJoinEvent, joiningId }: CommunityMapProps) {
  const [activeEvent, setActiveEvent] = useState<any | null>(null);

  // Center on Mumbai/Thane by default based on our seed data
  const center: [number, number] = [19.1485, 72.8810];

  return (
    <div className="relative w-full h-[600px] rounded-2xl overflow-hidden border border-slate-700 shadow-2xl">
      <MapContainer 
        center={center} 
        zoom={11} 
        className="w-full h-full z-0"
        zoomControl={false}
      >
        {/* CartoDB Dark Matter tile layer for a premium dark mode look */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <ZoomControl position="bottomright" />

        {events.map((event) => (
          <Marker 
            key={event.id}
            position={[event.latitude, event.longitude]}
            icon={customIcon}
            eventHandlers={{
              click: () => setActiveEvent(event),
            }}
          />
        ))}

        {/* Map Controller to recenter if needed */}
        <MapController center={activeEvent ? [activeEvent.latitude, activeEvent.longitude] : center} />
      </MapContainer>

      {/* Overlay UI elements on top of the map instead of native popups for a premium look */}
      <div className="absolute top-6 left-6 z-[1000] pointer-events-none">
        <AnimatePresence>
          {activeEvent && (
            <EventCard 
              event={activeEvent}
              onJoin={onJoinEvent}
              onClose={() => setActiveEvent(null)}
              joining={joiningId === activeEvent.id}
            />
          )}
        </AnimatePresence>
      </div>
      
      {/* Search or filter could go here */}
      <div className="absolute top-6 right-6 z-[1000]">
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-xl p-3 shadow-lg flex flex-col gap-2">
           <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Impact Network</h4>
           <div className="flex items-center gap-2">
             <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
             <span className="text-sm font-medium text-gray-200">Local Events</span>
           </div>
        </div>
      </div>
    </div>
  );
}

// Component to handle map centering smoothly
function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, map.getZoom(), {
      duration: 1.5,
      easeLinearity: 0.25
    });
  }, [center, map]);
  return null;
}
