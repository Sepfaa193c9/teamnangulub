import { useState, useEffect } from "react";
import { AlertTriangle, Shield, Truck, Flame, MapPin, X, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SOSButtonProps {
  defaultLocation?: string;
}

export default function SOSButton({ defaultLocation }: SOSButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "reporting" | "reported">("idle");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const [accidentType, setAccidentType] = useState<string>("");
  const [location, setLocation] = useState<string>("");

  useEffect(() => {
    if (defaultLocation) {
      setLocation(defaultLocation);
    }
  }, [defaultLocation]);

  const toggleService = (service: string) => {
    setSelectedServices(prev => 
      prev.includes(service) 
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  const handleReport = () => {
    if (selectedServices.length === 0) return;
    setStatus("reporting");
    setTimeout(() => {
      setStatus("reported");
      setTimeout(() => {
        setIsOpen(false);
        setStatus("idle");
        setSelectedServices([]);
        setAccidentType("");
      }, 3000);
    }, 2000);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-rose-600 text-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(225,29,72,0.5)] hover:bg-rose-700 hover:scale-110 transition-all z-50 animate-pulse-slow"
        aria-label="Layanan Darurat"
      >
        <AlertTriangle size={28} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-brand-dark border border-brand-cyan/20 rounded-2xl p-6 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative w-full max-w-sm z-10"
            >
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>

              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center border border-rose-500/30 mx-auto mb-4">
                  <AlertTriangle className="text-rose-500" size={32} />
                </div>
                <h3 className="text-xl font-display font-bold text-white mb-1">Layanan Darurat</h3>
                <p className="text-sm font-mono text-slate-400">Pilih layanan darurat yang Anda butuhkan.</p>
              </div>

              {status === "idle" && (
                <div className="space-y-3">
                  <div className="mb-4 space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400 font-mono">Lokasi Kejadian (Auto-fill)</label>
                      <input
                        type="text"
                        placeholder="Menunggu lokasi CCTV..."
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full bg-brand-slate/50 border border-brand-cyan/20 focus:border-brand-cyan/50 rounded-lg p-3 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400 font-mono">Jenis Insiden / Kecelakaan</label>
                      <input
                        type="text"
                        placeholder="Contoh: Kecelakaan Motor, Mobil Terbakar..."
                        value={accidentType}
                        onChange={(e) => setAccidentType(e.target.value)}
                        className="w-full bg-brand-slate/50 border border-brand-cyan/20 focus:border-brand-cyan/50 rounded-lg p-3 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <button
                      onClick={() => toggleService("Polisi")}
                      className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors font-medium border ${selectedServices.includes("Polisi") ? "bg-blue-500/20 border-blue-500 text-white" : "bg-brand-slate border-blue-500/30 hover:border-blue-500/60 text-slate-300"}`}
                    >
                      <div className="flex items-center gap-3">
                        <Shield size={20} className={selectedServices.includes("Polisi") ? "text-blue-400" : "text-slate-400"} />
                        Panggil Polisi
                      </div>
                      {selectedServices.includes("Polisi") && <Check size={18} className="text-blue-400" />}
                    </button>
                    <button
                      onClick={() => toggleService("Ambulan")}
                      className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors font-medium border ${selectedServices.includes("Ambulan") ? "bg-rose-500/20 border-rose-500 text-white" : "bg-brand-slate border-rose-500/30 hover:border-rose-500/60 text-slate-300"}`}
                    >
                      <div className="flex items-center gap-3">
                        <Truck size={20} className={selectedServices.includes("Ambulan") ? "text-rose-400" : "text-slate-400"} />
                        Panggil Ambulan
                      </div>
                      {selectedServices.includes("Ambulan") && <Check size={18} className="text-rose-400" />}
                    </button>
                    <button
                      onClick={() => toggleService("Pemadam Kebakaran")}
                      className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors font-medium border ${selectedServices.includes("Pemadam Kebakaran") ? "bg-amber-500/20 border-amber-500 text-white" : "bg-brand-slate border-amber-500/30 hover:border-amber-500/60 text-slate-300"}`}
                    >
                      <div className="flex items-center gap-3">
                        <Flame size={20} className={selectedServices.includes("Pemadam Kebakaran") ? "text-amber-400" : "text-slate-400"} />
                        Panggil Pemadam Kebakaran
                      </div>
                      {selectedServices.includes("Pemadam Kebakaran") && <Check size={18} className="text-amber-400" />}
                    </button>
                  </div>

                  <button
                    onClick={handleReport}
                    disabled={selectedServices.length === 0}
                    className="w-full mt-4 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-600/50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-lg"
                  >
                    Kirim Laporan
                  </button>

                  <div className="text-xs font-mono text-slate-500 text-center flex justify-center items-center gap-1 mt-4 pt-2 border-t border-brand-cyan/10">
                    <MapPin size={12} />
                    Lokasi Anda akan otomatis terkirim
                  </div>
                </div>
              )}

              {status === "reporting" && (
                <div className="text-center py-8">
                  <div className="w-12 h-12 border-4 border-rose-500/30 border-t-rose-500 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="font-mono text-rose-500 animate-pulse">Menghubungkan ke layanan {selectedServices.join(", ")}...</p>
                  {accidentType && <p className="text-xs text-slate-300 mt-2 font-semibold">Insiden: {accidentType}</p>}
                  <p className="text-xs text-slate-400 mt-2">Mendapatkan koordinat lokasi...</p>
                </div>
              )}

              {status === "reported" && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/50 mx-auto mb-4">
                    <MapPin className="text-emerald-400" size={32} />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-1">Laporan berhasil dikirim</h4>
                  <p className="text-xs text-slate-300 mt-2 font-mono">Layanan: {selectedServices.join(", ")}</p>
                  {location && <p className="text-xs text-slate-300 mt-1 font-mono">Lokasi: {location}</p>}
                  {accidentType && <p className="text-xs text-slate-300 mt-2 font-semibold border border-emerald-500/30 bg-emerald-500/10 p-2 rounded max-w-fit mx-auto">Insiden: {accidentType}</p>}
                  <p className="text-xs text-slate-400 mt-4">Jendela akan tertutup otomatis...</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
