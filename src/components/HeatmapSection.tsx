import { useState, useMemo, useEffect } from "react";
import { motion } from "motion/react";
import { Map as MapIcon, AlertTriangle, Info, MapPin, Camera } from "lucide-react";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface HeatmapData {
  id: string;
  name: string;
  lat: number;
  lng: number;
  intensity: number; // 0-100
  activeViolations: number;
}

const HEATMAP_LOCATIONS: HeatmapData[] = [
  { id: "L01", name: "Simpang Sudirman", lat: -6.2146, lng: 106.8229, intensity: 85, activeViolations: 124 },
  { id: "L02", name: "Bundaran HI", lat: -6.1950, lng: 106.8230, intensity: 92, activeViolations: 215 },
  { id: "L03", name: "Gatot Subroto", lat: -6.2300, lng: 106.8200, intensity: 65, activeViolations: 78 },
  { id: "L04", name: "Tomang Raya", lat: -6.1770, lng: 106.7900, intensity: 45, activeViolations: 34 },
  { id: "L05", name: "Kuningan", lat: -6.2250, lng: 106.8320, intensity: 75, activeViolations: 92 },
  { id: "L06", name: "Pondok Indah", lat: -6.2800, lng: 106.7800, intensity: 30, activeViolations: 15 },
  { id: "L07", name: "Kelapa Gading", lat: -6.1600, lng: 106.9000, intensity: 55, activeViolations: 45 },
  { id: "L08", name: "Harmoni", lat: -6.1630, lng: 106.8200, intensity: 60, activeViolations: 62 },
  { id: "L09", name: "Cawang", lat: -6.2400, lng: 106.8700, intensity: 80, activeViolations: 110 },
  { id: "L10", name: "Slipi", lat: -6.1950, lng: 106.7950, intensity: 40, activeViolations: 28 },
];

import { INITIAL_CAMERAS } from "../data";

interface HeatmapSectionProps {
  onNavigateToTab?: (tab: string, payload?: any) => void;
}

export default function HeatmapSection({ onNavigateToTab }: HeatmapSectionProps) {
  const [selectedLocation, setSelectedLocation] = useState<HeatmapData | null>(null);

  const getIntensityColor = (intensity: number) => {
    if (intensity > 80) return "rgba(239, 68, 68, 1)"; // Red
    if (intensity > 50) return "rgba(245, 158, 11, 1)"; // Amber
    return "rgba(59, 130, 246, 1)"; // Blue
  };

  const getIntensityGlow = (intensity: number) => {
    if (intensity > 80) return "rgba(239, 68, 68, 0.5)"; // Red
    if (intensity > 50) return "rgba(245, 158, 11, 0.5)"; // Amber
    return "rgba(59, 130, 246, 0.5)"; // Blue
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <MapIcon className="text-brand-cyan" size={24} />
            Heatmap Pelanggaran
          </h2>
          <p className="text-sm text-slate-400 mt-1 font-mono">
            Peta sebaran intensitas pelanggaran lalu lintas (Real-time)
          </p>
        </div>

        <div className="flex gap-4">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
            <span className="text-slate-400">Rendah</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>
            <span className="text-slate-400">Sedang</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
            <span className="text-slate-400">Tinggi</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Heatmap Map Area */}
        <div className="lg:col-span-2 bg-brand-slate/40 border border-brand-cyan/20 rounded-xl p-4 relative overflow-hidden h-[500px]">
          <div className="relative w-full h-full border border-brand-cyan/10 rounded-lg overflow-hidden bg-brand-dark/50">
            <MapContainer 
              center={[-6.2088, 106.8456]} 
              zoom={12} 
              style={{ height: '100%', width: '100%', background: '#0f172a' }}
              zoomControl={false}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              />
              {HEATMAP_LOCATIONS.map((loc) => (
                <CircleMarker
                  key={loc.id}
                  center={[loc.lat, loc.lng]}
                  radius={loc.intensity / 4}
                  fillColor={getIntensityColor(loc.intensity)}
                  color={getIntensityColor(loc.intensity)}
                  weight={1}
                  opacity={0.8}
                  fillOpacity={0.6}
                  eventHandlers={{
                    click: () => setSelectedLocation(loc),
                  }}
                >
                  <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                    <div className="font-mono text-xs">
                      <strong>{loc.name}</strong><br/>
                      Intensitas: {loc.intensity}%
                    </div>
                  </Tooltip>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Selected Location Details */}
        <div className="bg-brand-slate/40 border border-brand-cyan/20 rounded-xl p-6 flex flex-col">
          <h3 className="font-display font-semibold text-white border-b border-brand-cyan/10 pb-4 mb-4 flex items-center gap-2">
            <Info className="text-brand-cyan" size={18} />
            Detail Lokasi
          </h3>

          {selectedLocation ? (
            <div className="space-y-6 flex-1">
              <div>
                <div className="text-xs font-mono text-slate-400 mb-1">NAMA TITIK</div>
                <div className="text-lg font-bold text-white flex items-center gap-2">
                  <MapPin size={16} className="text-brand-cyan" />
                  {selectedLocation.name}
                </div>
              </div>

              <div>
                <div className="text-xs font-mono text-slate-400 mb-1">INTENSITAS PELANGGARAN</div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-brand-dark rounded-full overflow-hidden border border-brand-cyan/10">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${selectedLocation.intensity}%` }}
                      className="h-full"
                      style={{ backgroundColor: getIntensityColor(selectedLocation.intensity) }}
                    />
                  </div>
                  <span className="font-mono text-sm font-bold" style={{ color: getIntensityColor(selectedLocation.intensity) }}>
                    {selectedLocation.intensity}%
                  </span>
                </div>
              </div>

              <div className="bg-brand-dark/50 p-4 rounded-lg border border-brand-cyan/10">
                <div className="text-xs font-mono text-slate-400 mb-2">PELANGGARAN AKTIF HARI INI</div>
                <div className="text-3xl font-display font-bold text-white flex items-center gap-2">
                  <AlertTriangle size={24} style={{ color: getIntensityColor(selectedLocation.intensity) }} />
                  {selectedLocation.activeViolations}
                  <span className="text-sm font-normal text-slate-400 font-sans ml-1">kasus</span>
                </div>
              </div>

              <div className="pt-4 mt-auto border-t border-brand-cyan/10">
                <button 
                  onClick={() => {
                    const match = INITIAL_CAMERAS.find(c => c.name.toLowerCase().includes(selectedLocation.name.toLowerCase()) || c.location.toLowerCase().includes(selectedLocation.name.toLowerCase()));
                    onNavigateToTab?.("cctv", match ? match.id : undefined);
                  }}
                  className="w-full py-2.5 bg-brand-cyan/10 hover:bg-brand-cyan/20 text-brand-cyan font-mono text-sm rounded-lg border border-brand-cyan/30 transition-colors flex items-center justify-center gap-2"
                >
                  <Camera size={16} />
                  Lihat Kamera (CCTV)
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 opacity-60">
              <MapIcon size={48} className="mb-4" />
              <p className="font-mono text-sm text-center">Pilih titik pada peta untuk<br/>melihat detail data.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
