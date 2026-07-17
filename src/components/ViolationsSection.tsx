import { useState } from "react";
import { 
  FileText, 
  Search, 
  Trash2, 
  CheckCircle, 
  CreditCard, 
  Clock, 
  User, 
  MapPin, 
  AlertTriangle,
  Printer,
  ChevronRight,
  ShieldCheck,
  X,
  Download
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Violation } from "../types";
import html2canvas from "html2canvas";

interface ViolationsSectionProps {
  violations: Violation[];
  onRemoveViolation: (id: string) => void;
  onUpdateViolationStatus: (id: string, status: "Belum Bayar" | "Proses Banding" | "Lunas") => void;
  selectedViolation: Violation | null;
  setSelectedViolation: (violation: Violation | null) => void;
}

export default function ViolationsSection({ 
  violations, 
  onRemoveViolation, 
  onUpdateViolationStatus,
  selectedViolation,
  setSelectedViolation
}: ViolationsSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("All");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [filterViolation, setFilterViolation] = useState<string>("All");

  // Simulated billing states
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Filter list
  const filteredViolations = violations.filter(v => {
    const matchesSearch = v.licensePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.violationType.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === "All" || v.vehicleType === filterType;
    const matchesStatus = filterStatus === "All" || v.status === filterStatus;
    const matchesViolation = filterViolation === "All" || v.violationType.toLowerCase().includes(filterViolation.toLowerCase());

    return matchesSearch && matchesType && matchesStatus && matchesViolation;
  });

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(amount);
  };

  const [isExporting, setIsExporting] = useState(false);

  const exportAsImage = async (elementId: string, filename: string) => {
    const element = document.getElementById(elementId);
    if (!element) {
      alert("Elemen dokumen tidak ditemukan.");
      return;
    }
    
    setIsExporting(true);
    try {
      // Small delay to ensure any layout settles
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#060813", // Deep brand dark slate background for premium look
        scale: 2, // High resolution
        logging: false,
      });
      
      const image = canvas.toDataURL("image/png", 1.0);
      const link = document.createElement("a");
      link.download = filename;
      link.href = image;
      link.click();
    } catch (error) {
      console.error("Error exporting image:", error);
      alert("Gagal mengekspor berkas gambar. Silakan coba lagi.");
    } finally {
      setIsExporting(false);
    }
  };

  const handlePaySimulate = async () => {
    if (!selectedViolation) return;
    setIsPaying(true);
    setPaymentSuccess(false);

    // Simulate payment process delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    onUpdateViolationStatus(selectedViolation.id, "Lunas");
    setIsPaying(false);
    setPaymentSuccess(true);

    // Update current detail view locally
    setSelectedViolation({
      ...selectedViolation,
      status: "Lunas",
    });
  };

  return (
    <div className="space-y-8" id="violations-tab">
      
      {/* Title */}
      <div className="border-b border-brand-cyan/10 pb-5">
        <h2 className="font-display font-semibold text-2xl text-white tracking-wide">
          REGISTRY LAPORAN TILANG ELEKTRONIK
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Kumpulan berkas pelanggaran lalu lintas terintegrasi yang tercatat oleh kamera pengawas ETLE.
        </p>
      </div>

      {/* Filter and search controls */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-brand-slate/20 border border-brand-cyan/10 p-5 rounded-xl">
        
        {/* Search */}
        <div className="md:col-span-2 relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Cari Plat Nomor, Kode Tilang, atau jenis pelanggaran..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-brand-dark/80 border border-brand-cyan/10 hover:border-brand-cyan/25 focus:border-brand-cyan/40 rounded-lg py-2.5 pl-10 pr-4 text-xs font-sans text-white focus:outline-none transition-colors"
          />
        </div>

        {/* Vehicle Type Filter */}
        <div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full bg-brand-dark/80 border border-brand-cyan/10 hover:border-brand-cyan/25 focus:border-brand-cyan/40 rounded-lg py-2.5 px-3 text-xs font-sans text-white focus:outline-none transition-colors"
          >
            <option value="All">Semua Tipe Kendaraan</option>
            <option value="Mobil">Mobil</option>
            <option value="Motor">Sepeda Motor</option>
            <option value="Truk">Truk</option>
          </select>
        </div>

        {/* Ticket Status Filter */}
        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full bg-brand-dark/80 border border-brand-cyan/10 hover:border-brand-cyan/25 focus:border-brand-cyan/40 rounded-lg py-2.5 px-3 text-xs font-sans text-white focus:outline-none transition-colors"
          >
            <option value="All">Semua Status Tilang</option>
            <option value="Belum Bayar">Belum Bayar</option>
            <option value="Lunas">Lunas</option>
            <option value="Proses Banding">Proses Banding</option>
          </select>
        </div>

        {/* Violation Type Filter */}
        <div>
          <select
            value={filterViolation}
            onChange={(e) => setFilterViolation(e.target.value)}
            className="w-full bg-brand-dark/80 border border-brand-cyan/10 hover:border-brand-cyan/25 focus:border-brand-cyan/40 rounded-lg py-2.5 px-3 text-xs font-sans text-white focus:outline-none transition-colors"
          >
            <option value="All">Semua Jenis Pelanggaran</option>
            <option value="Helm">Tidak Pakai Helm</option>
            <option value="Kecepatan">Batas Kecepatan</option>
            <option value="Lampu Merah">Lampu Merah</option>
            <option value="Telepon">Main HP/Telepon</option>
            <option value="Markah">Markah Jalan</option>
          </select>
        </div>

      </div>

      {/* Main Grid/Table Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Registered Tickets List Table */}
        <div className="lg:col-span-2 bg-brand-slate/20 border border-brand-cyan/10 rounded-xl overflow-hidden flex flex-col justify-between">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              
              {/* Table Head */}
              <thead>
                <tr className="border-b border-brand-cyan/15 bg-brand-dark/50 text-gray-400 font-mono text-[10px] uppercase tracking-wider">
                  <th className="p-4">Kode Tilang</th>
                  <th className="p-4">Plat Nomor</th>
                  <th className="p-4">Pelanggaran</th>
                  <th className="p-4 text-right">Denda</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Aksi</th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-brand-cyan/5">
                {filteredViolations.length > 0 ? (
                  filteredViolations.map((v) => (
                    <tr 
                      key={v.id}
                      onClick={() => {
                        setSelectedViolation(v);
                        setPaymentSuccess(false);
                      }}
                      className={`hover:bg-brand-cyan/5 cursor-pointer transition-colors ${
                        selectedViolation?.id === v.id ? "bg-brand-cyan/5" : ""
                      }`}
                    >
                      {/* Ticket ID */}
                      <td className="p-4 font-mono font-medium text-white">{v.id}</td>
                      
                      {/* License Plate */}
                      <td className="p-4">
                        <span className="font-mono bg-brand-cyan/10 border border-brand-cyan/15 text-brand-cyan px-2 py-0.5 rounded font-bold">
                          {v.licensePlate}
                        </span>
                        <span className="text-[10px] text-gray-500 font-sans block mt-1">{v.vehicleModel}</span>
                      </td>

                      {/* Violation description */}
                      <td className="p-4 text-gray-300 max-w-xs truncate">
                        {v.violationType}
                        <span className="text-[10px] text-gray-500 font-mono block mt-0.5">{v.location}</span>
                      </td>

                      {/* Fine Amount */}
                      <td className="p-4 text-right font-mono font-semibold text-brand-cyan">
                        {formatRupiah(v.fineAmount)}
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <span className={`inline-block text-[9px] font-mono px-2 py-0.5 rounded-full ${
                          v.status === "Lunas" 
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                            : v.status === "Belum Bayar"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}>
                          {v.status}
                        </span>
                      </td>

                      {/* Delete simulated action */}
                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            if (confirm(`Hapus berkas tilang ${v.id}?`)) {
                              onRemoveViolation(v.id);
                              if (selectedViolation?.id === v.id) {
                                setSelectedViolation(null);
                              }
                            }
                          }}
                          className="text-gray-500 hover:text-rose-500 p-1.5 focus:outline-none transition-colors"
                          title="Hapus laporan"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>

                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500 font-mono">
                      Tidak ada laporan tilang terdaftar yang memenuhi kriteria.
                    </td>
                  </tr>
                )}
              </tbody>

            </table>
          </div>

          <div className="p-4 bg-brand-dark/40 border-t border-brand-cyan/10 font-mono text-[10px] text-gray-500 flex justify-between items-center">
            <span>Total Berkas: {filteredViolations.length}</span>
            <span>POLRI ETLE SYSTEM INTEGRATION</span>
          </div>
        </div>

        {/* Right: Detailed Ticket HUD view */}
        <div>
          <AnimatePresence mode="wait">
            {selectedViolation ? (
              <motion.div
                key={selectedViolation.id}
                id={`ticket-card-${selectedViolation.id}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-brand-dark border-2 border-brand-cyan/20 rounded-xl overflow-hidden p-6 space-y-6 relative glow-border-subtle"
              >
                
                {/* Close Button on detail */}
                <button
                  onClick={() => setSelectedViolation(null)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white focus:outline-none"
                >
                  <X size={16} />
                </button>

                {/* Header Ticket HUD */}
                <div className="border-b border-brand-cyan/10 pb-4">
                  <div className="text-[9px] font-mono text-brand-cyan tracking-widest uppercase">
                    BERKAS RESMI ETLE KORLANTAS
                  </div>
                  <h3 className="font-display font-bold text-lg text-white mt-1 flex items-center gap-2">
                    <FileText size={18} className="text-brand-cyan" /> 
                    {selectedViolation.id}
                  </h3>
                </div>

                {/* Info List */}
                <div className="space-y-4 text-xs font-sans">
                  
                  {/* Status Indicator inside ticket */}
                  <div className={`p-3 rounded-lg flex items-center justify-between ${
                    selectedViolation.status === "Lunas" 
                      ? "bg-emerald-500/5 border border-emerald-500/20 text-emerald-400" 
                      : selectedViolation.status === "Belum Bayar"
                      ? "bg-rose-500/5 border border-rose-500/20 text-rose-400"
                      : "bg-amber-500/5 border border-amber-500/20 text-amber-400"
                  }`}>
                    <span className="font-mono text-[10px] uppercase">STATUS PEMBAYARAN:</span>
                    <span className="font-bold font-mono text-sm">{selectedViolation.status}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] font-mono text-gray-500 uppercase block">PLAT NOMOR</span>
                      <span className="text-white font-mono font-bold text-sm block mt-1">
                        {selectedViolation.licensePlate}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-gray-500 uppercase block">TIPE KENDARAAN</span>
                      <span className="text-white block mt-1">{selectedViolation.vehicleType}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-gray-500 uppercase block">MODEL KENDARAAN</span>
                      <span className="text-white block mt-1">{selectedViolation.vehicleModel}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-gray-500 uppercase block">NAMA PEMILIK</span>
                      <span className="text-white font-medium block mt-1 flex items-center gap-1">
                        <User size={12} className="text-gray-400" /> {selectedViolation.ownerName || "Budi Santoso"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 border-t border-brand-cyan/5 pt-3">
                    <span className="text-[10px] font-mono text-gray-500 uppercase block">LOKASI PENANGKAPAN</span>
                    <p className="text-white flex items-center gap-1.5 mt-1">
                      <MapPin size={12} className="text-brand-cyan" /> {selectedViolation.location}
                    </p>
                  </div>

                  <div className="space-y-1 border-t border-brand-cyan/5 pt-3">
                    <span className="text-[10px] font-mono text-gray-500 uppercase block">JENIS PELANGGARAN</span>
                    <p className="text-gray-300 leading-relaxed font-sans text-xs flex items-start gap-1.5 mt-1">
                      <AlertTriangle size={12} className="text-rose-500 shrink-0 mt-0.5" /> 
                      {selectedViolation.violationType}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-brand-cyan/5 pt-3">
                    <div>
                      <span className="text-[10px] font-mono text-gray-500 uppercase block">WAKTU DETEKSI</span>
                      <p className="text-gray-300 flex items-center gap-1 mt-1 font-mono text-[11px]">
                        <Clock size={12} className="text-gray-500" /> {new Date(selectedViolation.timestamp).toLocaleString("id-ID")}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-gray-500 uppercase block">NOMINAL DENDA</span>
                      <span className="text-brand-cyan font-mono font-bold text-sm block mt-1">
                        {formatRupiah(selectedViolation.fineAmount)}
                      </span>
                    </div>
                  </div>

                </div>

                {/* Operations Actions & simulated payment */}
                <div className="border-t border-brand-cyan/10 pt-5 space-y-3">
                  
                  {selectedViolation.status !== "Lunas" && (
                    <button
                      onClick={handlePaySimulate}
                      disabled={isPaying}
                      id="btn-simulate-payment"
                      className="w-full bg-brand-cyan text-brand-dark py-2.5 rounded-lg font-display font-bold text-xs tracking-wider hover:bg-white transition-all shadow-[0_0_12px_rgba(0,240,255,0.25)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 focus:outline-none"
                    >
                      <CreditCard size={14} className={isPaying ? "animate-pulse" : ""} />
                      {isPaying ? "MEMPROSES PEMBAYARAN..." : "SIMULASIKAN BAYAR (BRIVA)"}
                    </button>
                  )}

                  {paymentSuccess && (
                    <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg p-3 text-center text-xs font-mono font-semibold flex items-center gap-2 justify-center">
                      <ShieldCheck size={16} /> PEMBAYARAN BERHASIL DIVALIDASI!
                    </div>
                  )}

                  {/* Print, Export and Banding */}
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => alert(`Mencetak dokumen Tilang Resmi untuk ${selectedViolation.id}. Cetakan dikirim ke Printer Polantas...`)}
                        className="flex-1 bg-brand-slate/40 border border-brand-cyan/15 hover:bg-brand-slate text-gray-300 py-2 rounded-lg text-xs font-mono flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <Printer size={13} /> CETAK
                      </button>
                      
                      <button
                        onClick={() => exportAsImage(`ticket-card-${selectedViolation.id}`, `ETLE_TICKET_${selectedViolation.id}.png`)}
                        disabled={isExporting}
                        className="flex-1 bg-brand-cyan/10 border border-brand-cyan/25 hover:bg-brand-cyan/20 text-brand-cyan py-2 rounded-lg text-xs font-mono flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Download size={13} /> {isExporting ? "EKSPOR..." : "EKSPOR PNG"}
                      </button>
                    </div>

                    {selectedViolation.status === "Belum Bayar" && (
                      <button
                        onClick={() => {
                          onUpdateViolationStatus(selectedViolation.id, "Proses Banding");
                          setSelectedViolation({
                            ...selectedViolation,
                            status: "Proses Banding",
                          });
                          alert("Pengajuan Banding didaftarkan. Petugas Kepolisian akan meninjau keluhan Anda.");
                        }}
                        className="flex-1 bg-transparent border border-amber-500/25 text-amber-400 hover:bg-amber-500/5 py-2 rounded-lg text-[10px] sm:text-xs font-mono flex items-center justify-center gap-2 transition-all cursor-pointer focus:outline-none"
                      >
                        AJUKAN BANDING
                      </button>
                    )}
                  </div>

                </div>

              </motion.div>
            ) : (
              <div className="bg-brand-slate/10 border border-brand-cyan/5 rounded-xl p-8 text-center h-full flex flex-col justify-center items-center font-mono text-xs text-gray-500">
                <FileText size={32} className="text-gray-600 mb-3" />
                PILIH SALAH SATU TIKET TILANG UNTUK MELIHAT RINCIAN ATAU MELAKUKAN SIMULASI PEMBAYARAN.
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
