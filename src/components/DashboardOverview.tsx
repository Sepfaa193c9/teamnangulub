import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  Camera, 
  Coins, 
  AlertTriangle, 
  ShieldCheck, 
  Bell,
  ArrowUpRight,
  Car,
  Clock
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { Violation } from "../types";

interface DashboardOverviewProps {
  violations: Violation[];
  onViewViolation: (violation: Violation) => void;
  onNavigateToTab: (tab: string) => void;
}

export default function DashboardOverview({ 
  violations, 
  onViewViolation,
  onNavigateToTab 
}: DashboardOverviewProps) {
  
  // Local active real-time ticker
  const [liveAlerts, setLiveAlerts] = useState<Array<{ id: string; text: string; time: string }>>([
    { id: "1", text: "Pelanggaran Helm terdeteksi di Kamera 01 - Bundaran HI", time: "Baru saja" },
    { id: "2", text: "Pelanggaran Kecepatan (132 km/h) terdeteksi di Kamera 02 - Layang Casablanka", time: "2 mnt lalu" },
    { id: "3", text: "Daihatsu Xenia AD 8452 CB menerobos lampu merah di Simpang Harmoni", time: "5 mnt lalu" },
  ]);

  // Clock functionality
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getTimeZoneString = () => {
    const offset = currentTime.getTimezoneOffset() / -60;
    if (offset === 7) return "WIB";
    if (offset === 8) return "WITA";
    if (offset === 9) return "WIT";
    return `UTC${offset >= 0 ? '+' : ''}${offset}`; // Fallback
  };

  // Simulate real-time alerts popping up
  useEffect(() => {
    const alertTexts = [
      "Pelanggaran Helm: B 4821 SX di Kamera 01 - Bundaran HI",
      "Mobil Toyota Fortuner B 1088 TQA terdeteksi melaju di atas batas kecepatan (132 km/jam)",
      "Pengemudi Honda Civic memegang HP di Gatot Subroto",
      "Truk melanggar jam operasional ganjil-genap di Kuningan",
      "Melanggar Markah Jalan: Motor Honda Beat B 1234 SMN di Bundaran HI",
    ];

    const interval = setInterval(() => {
      const randomText = alertTexts[Math.floor(Math.random() * alertTexts.length)];
      const newAlert = {
        id: Date.now().toString(),
        text: randomText,
        time: "Baru saja",
      };
      
      setLiveAlerts((prev) => [newAlert, ...prev.slice(0, 4)]);
    }, 12000); // add alert every 12 seconds

    return () => clearInterval(interval);
  }, []);

  // Compute stats
  const totalViolations = violations.length + 112; // Base offset for realistic scale
  const activeCameras = "4 / 5";
  
  const totalFineValue = violations.reduce((acc, v) => acc + v.fineAmount, 0) + 42500000; // Base offset
  const lunasCount = violations.filter(v => v.status === "Lunas").length + 72;
  const totalWithBase = violations.length + 98;
  const resolutionRate = ((lunasCount / totalWithBase) * 100).toFixed(1);

  // Hourly statistics data for area chart
  const hourlyData = [
    { jam: "06:00", pelanggaran: 12 },
    { jam: "08:00", pelanggaran: 38 },
    { jam: "10:00", pelanggaran: 25 },
    { jam: "12:00", pelanggaran: 18 },
    { jam: "14:00", pelanggaran: 22 },
    { jam: "16:00", pelanggaran: 30 },
    { jam: "18:00", pelanggaran: 42 },
    { jam: "20:00", pelanggaran: 28 },
    { jam: "22:00", pelanggaran: 15 },
  ];

  // Category statistics data for bar chart
  const categoryData = [
    { kategori: "Tanpa Helm", jumlah: 45 },
    { kategori: "Lampu Merah", jumlah: 28 },
    { kategori: "Kecepatan", jumlah: 35 },
    { kategori: "HP / Gadget", jumlah: 19 },
    { kategori: "Markah Jalan", jumlah: 22 },
  ];

  // Status breakdown for Pie chart
  const pieData = [
    { name: "Lunas", value: lunasCount },
    { name: "Belum Bayar", value: violations.filter(v => v.status === "Belum Bayar").length + 22 },
    { name: "Banding", value: violations.filter(v => v.status === "Proses Banding").length + 4 },
  ];

  const COLORS = ["#3b82f6", "#ef4444", "#f59e0b"];

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-8" id="dashboard-tab">
      
      {/* Title & System Brief */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-cyan/10 pb-5">
        <div>
          <h2 className="font-display font-semibold text-2xl text-white tracking-wide">
            DASHBOARD
          </h2>
          <p className="text-sm text-gray-400 mt-1 font-sans">
            Sistem Pemantauan & Penegakan Hukum Lalu Lintas Elektronik Real-time
          </p>
        </div>
        <div className="flex items-center gap-3 bg-brand-slate/40 border border-brand-cyan/20 rounded-lg px-4 py-2 text-xs font-mono text-brand-cyan">
          <Clock size={14} className="animate-spin text-brand-cyan" />
          <span>WAKTU LOKAL: {currentTime.toLocaleTimeString("id-ID")} {getTimeZoneString()}</span>
        </div>
      </div>

      {/* Real-time Ticket Alert Ticker */}
      <div className="bg-brand-slate/30 border border-brand-cyan/15 rounded-lg px-4 py-3 flex items-center gap-3 overflow-hidden glow-border-subtle">
        <div className="flex items-center gap-2 text-brand-cyan font-mono text-xs font-semibold shrink-0 border-r border-brand-cyan/20 pr-3">
          <Bell size={14} className="animate-bounce" />
          <span>LIVE FEEDS:</span>
        </div>
        <div className="flex-1 overflow-hidden relative h-5">
          <div className="absolute inset-0 flex items-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={liveAlerts[0]?.id}
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -15, opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="text-xs text-gray-300 font-mono truncate"
              >
                {liveAlerts[0]?.text} <span className="text-brand-cyan">({liveAlerts[0]?.time})</span>
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
        <button 
          onClick={() => onNavigateToTab("cctv")}
          className="text-xs text-brand-cyan hover:underline hover:text-white flex items-center gap-1 font-mono shrink-0 pl-2"
        >
          Monitor <ArrowUpRight size={12} />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Total Violations */}
        <motion.div 
          whileHover={{ y: -4 }}
          id="card-violations"
          className="bg-brand-slate/30 border border-brand-cyan/10 hover:border-brand-cyan/30 rounded-xl p-5 relative overflow-hidden transition-all duration-300 grid-bg"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-cyan/5 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">Total Pelanggaran</span>
            <AlertTriangle className="text-brand-cyan" size={20} />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-display font-bold text-white">{totalViolations}</span>
            <span className="text-xs text-emerald-400 font-mono flex items-center">
              +12% <TrendingUp size={12} className="ml-1" />
            </span>
          </div>
          <p className="text-[10px] text-gray-500 font-mono mt-2">Berdasarkan kamera deteksi aktif</p>
        </motion.div>

        {/* Card 2: Active CCTV */}
        <motion.div 
          whileHover={{ y: -4 }}
          id="card-cctv"
          className="bg-brand-slate/30 border border-brand-cyan/10 hover:border-brand-cyan/30 rounded-xl p-5 relative overflow-hidden transition-all duration-300 grid-bg"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-cyan/5 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">Kamera ETLE Aktif</span>
            <Camera className="text-brand-cyan" size={20} />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-display font-bold text-white">{activeCameras}</span>
            <span className="text-xs text-brand-cyan font-mono">1 Pemeliharaan</span>
          </div>
          <p className="text-[10px] text-gray-500 font-mono mt-2">Sinkronisasi satelit terjamin</p>
        </motion.div>

        {/* Card 3: Fine Value Generated */}
        <motion.div 
          whileHover={{ y: -4 }}
          id="card-fine"
          className="bg-brand-slate/30 border border-brand-cyan/10 hover:border-brand-cyan/30 rounded-xl p-5 relative overflow-hidden transition-all duration-300 grid-bg"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-cyan/5 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">Estimasi Nominal Denda</span>
            <Coins className="text-brand-cyan" size={20} />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-display font-bold text-white truncate max-w-full">
              {formatRupiah(totalFineValue)}
            </span>
          </div>
          <p className="text-[10px] text-gray-500 font-mono mt-2">Sesuai UU No. 22 Tahun 2009</p>
        </motion.div>

        {/* Card 4: Resolution Rate */}
        <motion.div 
          whileHover={{ y: -4 }}
          id="card-resolution"
          className="bg-brand-slate/30 border border-brand-cyan/10 hover:border-brand-cyan/30 rounded-xl p-5 relative overflow-hidden transition-all duration-300 grid-bg"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-cyan/5 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">Penyelesaian Tilang</span>
            <ShieldCheck className="text-brand-cyan" size={20} />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-display font-bold text-white">{resolutionRate}%</span>
            <span className="text-xs text-brand-cyan font-mono">{lunasCount} Lunas</span>
          </div>
          <p className="text-[10px] text-gray-500 font-mono mt-2">Pembayaran BRIVA & Bank rekanan</p>
        </motion.div>

      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Hourly Infractions (Area Chart) */}
        <div className="bg-brand-slate/20 border border-brand-cyan/10 rounded-xl p-5 lg:col-span-2">
          <h3 className="font-display font-medium text-sm text-white uppercase tracking-wider mb-5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse" />
            Fluktuasi Pelanggaran Jam Kerja (Hari Ini)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPelanggaran" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(59, 130, 246, 0.05)" />
                <XAxis dataKey="jam" stroke="#94a3b8" fontSize={10} fontFamily="monospace" />
                <YAxis stroke="#94a3b8" fontSize={10} fontFamily="monospace" />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#1e293b", borderColor: "rgba(59, 130, 246, 0.25)", borderRadius: "8px" }}
                  labelStyle={{ color: "#fff", fontFamily: "monospace", fontSize: "11px" }}
                  itemStyle={{ color: "#3b82f6", fontSize: "12px" }}
                />
                <Area type="monotone" dataKey="pelanggaran" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorPelanggaran)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Category Pie Chart */}
        <div className="bg-brand-slate/20 border border-brand-cyan/10 rounded-xl p-5">
          <h3 className="font-display font-medium text-sm text-white uppercase tracking-wider mb-5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse" />
            Status Penyelesaian Tilang
          </h3>
          <div className="h-44 flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", borderColor: "rgba(59, 130, 246, 0.25)", borderRadius: "8px" }}
                  itemStyle={{ fontSize: "11px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Pie Chart Legend */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-brand-cyan/10 text-center font-mono text-[10px]">
            {pieData.map((item, index) => (
              <div key={item.name} className="flex flex-col items-center">
                <span className="font-semibold" style={{ color: COLORS[index] }}>{item.name}</span>
                <span className="text-white mt-1 text-xs">{item.value} kasus</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Bar Chart violation category & Recent Violations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 3: Category Bar Chart */}
        <div className="bg-brand-slate/20 border border-brand-cyan/10 rounded-xl p-5 lg:col-span-1">
          <h3 className="font-display font-medium text-sm text-white uppercase tracking-wider mb-5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse" />
            Jenis Pelanggaran Terbanyak
          </h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(59, 130, 246, 0.05)" />
                <XAxis type="number" stroke="#94a3b8" fontSize={9} fontFamily="monospace" />
                <YAxis dataKey="kategori" type="category" stroke="#94a3b8" fontSize={9} width={80} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", borderColor: "rgba(59, 130, 246, 0.25)", borderRadius: "8px" }}
                  itemStyle={{ color: "#3b82f6", fontSize: "11px" }}
                />
                <Bar dataKey="jumlah" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#3b82f6" : "#2563eb"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Section 4: Recent registered tickets */}
        <div className="bg-brand-slate/20 border border-brand-cyan/10 rounded-xl p-5 lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="font-display font-medium text-sm text-white uppercase tracking-wider mb-5 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse" />
                Registrasi Tilang ETLE Terbaru
              </span>
              <button 
                onClick={() => onNavigateToTab("violations")}
                className="text-xs text-brand-cyan hover:underline font-mono"
              >
                Lihat Semua ({violations.length})
              </button>
            </h3>
            
            <div className="space-y-3">
              {violations.slice(0, 3).map((v) => (
                <div 
                  key={v.id}
                  id={`recent-violation-${v.id}`}
                  onClick={() => onViewViolation(v)}
                  className="p-3.5 bg-brand-slate/30 border border-brand-cyan/5 hover:border-brand-cyan/25 rounded-lg flex items-center justify-between gap-4 cursor-pointer transition-all duration-200 hover:bg-brand-slate/40 group"
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className="p-2.5 bg-brand-slate rounded border border-brand-cyan/10 text-gray-400 group-hover:text-brand-cyan group-hover:border-brand-cyan/20 shrink-0">
                      <Car size={16} />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-white">{v.licensePlate}</span>
                        <span className="text-[10px] text-gray-500 font-mono">({v.vehicleModel})</span>
                      </div>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{v.violationType}</p>
                    </div>
                  </div>
                  
                  <div className="text-right shrink-0">
                    <span className="font-mono text-xs text-brand-cyan font-medium block">{formatRupiah(v.fineAmount)}</span>
                    <span className={`inline-block text-[9px] font-mono px-1.5 py-0.5 rounded mt-1 ${
                      v.status === "Lunas" 
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                        : v.status === "Belum Bayar"
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}>
                      {v.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-brand-cyan/10 flex items-center justify-between text-xs text-gray-500 font-mono">
            <span>Sinkronisasi Polantas RI</span>
            <span>Online • 100% Secure</span>
          </div>
        </div>

      </div>

    </div>
  );
}
