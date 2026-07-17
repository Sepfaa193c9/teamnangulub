import { useState } from "react";
import { 
  Search, 
  Car, 
  User, 
  ShieldCheck, 
  RefreshCw,
  HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function PlateSearchSection() {
  // License Plate Search Tool states
  const [plateQuery, setPlateQuery] = useState("");
  const [frameQuery, setFrameQuery] = useState("");
  const [engineQuery, setEngineQuery] = useState("");
  const [plateResult, setPlateResult] = useState<any | null>(null);
  const [isSearchingPlate, setIsSearchingPlate] = useState(false);

  // Mock license plate database query
  const handlePlateSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plateQuery.trim() && !frameQuery.trim() && !engineQuery.trim()) return;

    setIsSearchingPlate(true);
    setPlateResult(null);

    // Simulate database scan
    await new Promise(resolve => setTimeout(resolve, 1200));

    const cleanPlate = plateQuery.toUpperCase().replace(/\s+/g, "");
    
    // Default mocks or custom plate lookup
    let result = {
      plate: plateQuery.toUpperCase() || "B 1234 ABC",
      owner: "Yanto Hermawan",
      vehicle: "Honda HR-V 1.5 SE (Putih)",
      year: 2022,
      taxStatus: "Aktif (Hingga 12-10-2026)",
      activeTicketsCount: 0,
      finePending: 0,
    };

    if (cleanPlate.includes("1234")) {
      result = {
        plate: "B 1234 SMN",
        owner: "Budi Santoso",
        vehicle: "Honda Beat FI (Hitam)",
        year: 2019,
        taxStatus: "Aktif (Hingga 05-04-2027)",
        activeTicketsCount: 1,
        finePending: 250000,
      };
    } else if (cleanPlate.includes("1088")) {
      result = {
        plate: "B 1088 TQA",
        owner: "PT Sinar Sejahtera",
        vehicle: "Toyota Fortuner 2.8 VRZ (Hitam)",
        year: 2024,
        taxStatus: "Aktif (Hingga 08-08-2029)",
        activeTicketsCount: 0,
        finePending: 0,
      };
    } else if (cleanPlate.includes("1422")) {
      result = {
        plate: "F 1422 RX",
        owner: "Ahmad Rifai",
        vehicle: "Honda Civic Turbo Sedan (Merah)",
        year: 2021,
        taxStatus: "TERLAMBAT PAJAK (Hingga 14-02-2025)",
        activeTicketsCount: 1,
        finePending: 750000,
      };
    } else if (cleanPlate.includes("8452")) {
      result = {
        plate: "AD 8452 CB",
        owner: "Siti Rahmawati",
        vehicle: "Daihatsu Xenia (Silver)",
        year: 2018,
        taxStatus: "Aktif (Hingga 22-09-2026)",
        activeTicketsCount: 1,
        finePending: 500000,
      };
    }

    setPlateResult(result);
    setIsSearchingPlate(false);
  };

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto" id="calculator-tab">
      
      {/* Title */}
      <div className="border-b border-brand-cyan/10 pb-5 text-center">
        <h2 className="font-display font-semibold text-2xl text-white tracking-wide">
          Pengecekan Data Pelanggaran ETLE
        </h2>
        <p className="text-sm text-gray-400 mt-2 max-w-xl mx-auto">
          Cek status pelanggaran lalu lintas (ETLE) berdasarkan Plat Nomor, Nomor Rangka, atau Nomor Mesin.
        </p>
      </div>

      <div className="bg-brand-slate/20 border border-brand-cyan/10 rounded-xl p-8 space-y-6">
        <form onSubmit={handlePlateSearch} className="space-y-4 max-w-md mx-auto">
          <input
            type="text"
            placeholder="No Plat Kendaraan"
            value={plateQuery}
            onChange={(e) => setPlateQuery(e.target.value)}
            className="w-full bg-brand-dark border border-brand-cyan/30 focus:border-brand-cyan rounded-full py-3.5 px-6 text-sm text-center text-white placeholder-gray-400 focus:outline-none transition-all"
          />
          <input
            type="text"
            placeholder="No Rangka Kendaraan"
            value={frameQuery}
            onChange={(e) => setFrameQuery(e.target.value)}
            className="w-full bg-brand-dark border border-brand-cyan/30 focus:border-brand-cyan rounded-full py-3.5 px-6 text-sm text-center text-white placeholder-gray-400 focus:outline-none transition-all"
          />
          <input
            type="text"
            placeholder="No Mesin Kendaraan"
            value={engineQuery}
            onChange={(e) => setEngineQuery(e.target.value)}
            className="w-full bg-brand-dark border border-brand-cyan/30 focus:border-brand-cyan rounded-full py-3.5 px-6 text-sm text-center text-white placeholder-gray-400 focus:outline-none transition-all"
          />
          <button
            type="submit"
            disabled={isSearchingPlate}
            id="btn-search-plate-number"
            className="w-full bg-[#1A56DB] hover:bg-blue-700 text-white py-3.5 rounded-full text-base font-semibold tracking-wide transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 mt-6"
          >
            {isSearchingPlate ? (
              <>
                <RefreshCw size={18} className="animate-spin" /> Sedang Memproses...
              </>
            ) : (
              "Cek Data"
            )}
          </button>
        </form>

        {/* Result Display HUD */}
        <AnimatePresence>
          {plateResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-brand-dark border border-brand-cyan/25 rounded-xl p-6 space-y-4 text-sm max-w-md mx-auto mt-6"
            >
              <div className="border-b border-brand-cyan/10 pb-3 text-center">
                <span className="font-mono text-[10px] text-gray-500 uppercase tracking-widest block">SAMSAT RI ONLINE RECORD</span>
                <span className="font-mono text-xl font-bold text-white bg-brand-cyan/5 border border-brand-cyan/15 px-4 py-1.5 rounded inline-block mt-2">
                  {plateResult.plate}
                </span>
              </div>

              <div className="space-y-3 font-sans pt-2">
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-mono text-xs uppercase">Pemilik Terdaftar</span>
                  <span className="text-white font-medium flex items-center gap-1.5">
                    <User size={14} className="text-gray-500" /> {plateResult.owner}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-mono text-xs uppercase">Detail Kendaraan</span>
                  <span className="text-white">{plateResult.vehicle}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-mono text-xs uppercase">Tahun Pembuatan</span>
                  <span className="text-white font-mono">{plateResult.year}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-mono text-xs uppercase">Status Pajak STNK</span>
                  <span className={plateResult.taxStatus.includes("TERLAMBAT") ? "text-rose-400 font-semibold" : "text-emerald-400"}>
                    {plateResult.taxStatus}
                  </span>
                </div>

                <div className="border-t border-brand-cyan/10 pt-4 flex justify-between items-center mt-4">
                  <span className="text-gray-500 font-mono text-xs uppercase">Denda Tilang ETLE</span>
                  <span className={`font-mono text-base font-bold ${plateResult.activeTicketsCount > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                    {plateResult.activeTicketsCount > 0 ? formatRupiah(plateResult.finePending) : "Nihil (Bebas Tilang)"}
                  </span>
                </div>

              </div>

              <div className="border-t border-brand-cyan/10 pt-3 flex items-center justify-center gap-1.5 text-[10px] text-emerald-400 font-mono uppercase bg-emerald-500/5 py-2 rounded mt-2">
                <ShieldCheck size={14} /> RECORD TELAH TEROTENTIKASI
              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Law Advice Info Banner */}
      <div className="p-6 bg-brand-cyan/5 border border-brand-cyan/15 rounded-xl space-y-3 max-w-3xl mx-auto">
        <h4 className="font-display font-semibold text-white text-sm flex items-center gap-2">
          <HelpCircle size={16} className="text-brand-cyan" /> Informasi Prosedur Tilang ETLE
        </h4>
        <p className="text-xs text-gray-400 leading-relaxed">
          Jika kendaraan Anda terekam melakukan pelanggaran, Korlantas Polri akan mengirimkan surat konfirmasi resmi ke alamat pemilik yang terdaftar dalam Samsat. Pemilik wajib melakukan konfirmasi via web atau pos dalam tenggat waktu 8 hari untuk menghindari pemblokiran STNK.
        </p>
      </div>

    </div>
  );
}
