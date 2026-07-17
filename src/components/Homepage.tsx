import { useState, useEffect } from "react";
import { Phone, ArrowRight, Activity, Camera, Car, ShieldAlert, Instagram, Twitter, Youtube, MapPin, Clock, FileText, AlertTriangle, Video, Wallet } from "lucide-react";
import { Violation } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface HomepageProps {
  violations: Violation[];
  onNavigateToTab: (tab: string) => void;
}

export default function Homepage({ violations, onNavigateToTab }: HomepageProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const totalViolations = violations.length;
  
  const violationCounts = violations.reduce((acc, curr) => {
    acc[curr.violationType] = (acc[curr.violationType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topViolation = Object.entries(violationCounts).sort((a, b) => b[1] - a[1])[0];
  
  const highSpeedViolations = violations.filter(v => v.speedKmh && v.speedKmh > 80).length;
  
  const unpaidFinesTotal = violations.filter(v => v.status === "Belum Bayar").reduce((sum, v) => sum + v.fineAmount, 0);

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const dataCards = [
    {
      id: "total_violations",
      title: "Total Pelanggaran Terdeteksi",
      value: totalViolations.toString() + " Kasus",
      subtitle: "Sejak sistem diaktifkan",
      icon: <FileText size={48} className="text-brand-cyan/60 group-hover:text-brand-cyan transition-colors" />,
      tab: "violations"
    },
    {
      id: "top_violation",
      title: "Kategori Pelanggaran Terbanyak",
      value: topViolation ? topViolation[0] : "Belum Ada Data",
      subtitle: topViolation ? `${topViolation[1]} kasus tercatat` : "-",
      icon: <AlertTriangle size={48} className="text-brand-cyan/60 group-hover:text-brand-cyan transition-colors" />,
      tab: "dashboard"
    },
    {
      id: "high_speed",
      title: "Pelanggaran Batas Kecepatan",
      value: highSpeedViolations.toString() + " Kendaraan",
      subtitle: "> 80 km/jam pada zona pantauan",
      icon: <Car size={48} className="text-brand-cyan/60 group-hover:text-brand-cyan transition-colors" />,
      tab: "dashboard"
    },
    {
      id: "unpaid_fines",
      title: "Potensi Denda Tertunda",
      value: formatRupiah(unpaidFinesTotal),
      subtitle: "Status: Belum Bayar",
      icon: <Wallet size={48} className="text-brand-cyan/60 group-hover:text-brand-cyan transition-colors" />,
      tab: "violations"
    },
    {
      id: "active_cameras",
      title: "Kamera CCTV Aktif",
      value: "45 Unit",
      subtitle: "Memantau arus lalu lintas",
      icon: <Video size={48} className="text-brand-cyan/60 group-hover:text-brand-cyan transition-colors" />,
      tab: "cctv"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % dataCards.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [dataCards.length]);

  return (
    <div className="relative min-h-[calc(100vh-8rem)] flex flex-col">
      {/* Full Homepage Background Image with Fade to Bottom */}
      <div className="absolute inset-x-0 -top-6 sm:-top-8 h-[70vh] z-0 pointer-events-none -mx-6 sm:-mx-8">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=2070&auto=format&fit=crop')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.6
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/20 via-brand-dark/60 to-brand-dark" />
      </div>

      <div className="relative z-10 flex flex-col flex-1">
        {/* 1. Tagline Section */}
        <section className="bg-brand-slate/20 backdrop-blur-sm border border-brand-cyan/20 rounded-2xl p-8 mb-8 text-center relative overflow-hidden mt-4 shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-cyan/10 rounded-full blur-[80px]" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-full max-w-[380px] h-24 flex items-center justify-center mb-6 overflow-hidden">
              <img 
                src="/logo_edith.png" 
                alt="EDITH Logo" 
                className="w-full h-full object-contain"
                style={{ filter: 'invert(1) hue-rotate(180deg)', mixBlendMode: 'screen' }}
                referrerPolicy="no-referrer"
              />
            </div>
            <p className="text-xl md:text-2xl font-sans text-brand-cyan max-w-3xl mx-auto italic font-bold drop-shadow-md">
              Your friendly neighborhood traffic hub, Securing the streets whatever it takes.
            </p>
          </div>
        </section>

        {/* 2. About EDITH Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-brand-dark/80 border border-brand-cyan/10 p-6 rounded-xl hover:border-brand-cyan/30 transition-colors">
          <h3 className="font-display font-semibold text-white text-lg mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-brand-cyan rounded-full" />
            Latar Belakang
          </h3>
          <p className="text-sm text-gray-400 font-sans leading-relaxed text-justify">
            EDITH (Electronic Detection & Intelligent Traffic Hub) dikembangkan untuk menjawab tantangan tata tertib lalu lintas perkotaan yang semakin dinamis. Sebagai bentuk dukungan terhadap modernisasi pelayanan masyarakat, sistem ini memadukan teknologi pengenalan visual dengan pemrosesan data terpadu guna menghadirkan pemantauan jalan raya yang senantiasa siaga setiap saat.
          </p>
        </div>

        <div className="bg-brand-dark/80 border border-brand-cyan/10 p-6 rounded-xl hover:border-brand-cyan/30 transition-colors">
          <h3 className="font-display font-semibold text-white text-lg mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-brand-cyan rounded-full" />
            Keahlian & Pencapaian
          </h3>
          <p className="text-sm text-gray-400 font-sans leading-relaxed text-justify">
            EDITH mengedepankan keandalan sistem pengenalan pelat nomor kendaraan secara otomatis serta kemampuan mendeteksi berbagai situasi berkendara. Sistem ini telah teruji mampu beroperasi dengan baik dalam ragam kondisi cuaca, serta berperan aktif dalam membantu menekan potensi pelanggaran maupun kecelakaan lalu lintas di berbagai titik pengawasan.
          </p>
        </div>

        <div className="bg-brand-dark/80 border border-brand-cyan/10 p-6 rounded-xl hover:border-brand-cyan/30 transition-colors">
          <h3 className="font-display font-semibold text-white text-lg mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-brand-cyan rounded-full" />
            Misi & Nilai Inti
          </h3>
          <p className="text-sm text-gray-400 font-sans leading-relaxed text-justify">
            Bagi EDITH, keselamatan dan kenyamanan pengguna jalan adalah prioritas yang paling utama. EDITH senantiasa berkomitmen untuk mewujudkan ekosistem transportasi yang lebih tertib dan aman melalui penerapan teknologi yang menjunjung tinggi prinsip keadilan serta transparansi, guna mendukung pemberian pelayanan terbaik kepada masyarakat luas.
          </p>
        </div>
      </section>

      {/* 3. Informasi Singkat */}
      <section className="mb-12">
        <h2 className="font-display font-semibold text-white text-xl mb-4 border-b border-brand-cyan/10 pb-2">
          Data Statistik Sistem EDITH
        </h2>
        <div className="relative overflow-hidden w-full">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={currentSlide}
              initial={{ x: 1000, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -1000, opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {[0, 1, 2].map((offset) => {
                const item = dataCards[(currentSlide + offset) % dataCards.length];
                return (
                  <div 
                    key={`${currentSlide}-${item.id}`} 
                    onClick={() => onNavigateToTab(item.tab)}
                    className="bg-brand-slate rounded-xl overflow-hidden shadow-lg border border-brand-cyan/20 flex flex-col h-[280px] cursor-pointer hover:border-brand-cyan transition-colors group"
                  >
                    <div className="h-32 w-full bg-brand-dark/50 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-brand-cyan/5 group-hover:bg-brand-cyan/10 transition-colors z-10" />
                      <div className="relative z-20 transition-transform transform group-hover:scale-110">
                        {item.icon}
                      </div>
                    </div>
                    <div className="p-5 flex flex-col flex-1 bg-brand-slate relative z-20">
                      <h3 className="font-sans text-gray-400 font-medium text-xs mb-1 uppercase tracking-wider">
                        {item.title}
                      </h3>
                      <div className="font-display text-2xl text-white font-bold mb-1">
                        {item.value}
                      </div>
                      <div className="flex items-center text-brand-cyan text-sm mt-auto">
                        <Activity size={14} className="mr-1.5" />
                        {item.subtitle}
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
        
        {/* Pagination Dots */}
        <div className="flex justify-center mt-6 gap-2">
          {dataCards.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 rounded-full transition-all ${
                currentSlide === idx ? "bg-brand-cyan w-6" : "bg-brand-cyan/30 hover:bg-brand-cyan/50 w-2"
              }`}
            />
          ))}
        </div>
      </section>

      {/* Flex spacer to push footer down */}
      <div className="flex-1" />

      {/* 6. Footer */}
      <footer className="mt-8 bg-brand-slate/20 border-t border-brand-cyan/20 pt-8 pb-6 px-6 rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-8 border-b border-brand-cyan/10 pb-8">
          {/* Informasi Kontak & Alamat */}
          <div className="md:col-span-6 lg:col-span-3">
            <h4 className="font-display font-semibold text-white text-sm mb-4 tracking-wider">INFORMASI KONTAK</h4>
            <p className="text-sm font-bold text-brand-cyan mb-1">Tim Nangulub</p>
            <p className="text-xs text-gray-400 font-sans mb-3 leading-relaxed">
              Jl. Bulungan Blok C No.1, RT.11/RW.7, Kramat Pela, Kec. Kby. Baru, Kota Jakarta Selatan, Daerah Khusus Ibukota Jakarta 12130
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Phone size={14} className="text-brand-cyan" />
              <span>Hubungi Kami: 0858-9264-7286</span>
            </div>
          </div>

          {/* Navigasi Tambahan */}
          <div className="md:col-span-6 lg:col-span-3">
            <h4 className="font-display font-semibold text-white text-sm mb-4 tracking-wider">TAUTAN CEPAT</h4>
            <ul className="space-y-2 text-xs font-sans text-gray-400">
              <li><button onClick={() => onNavigateToTab("dashboard")} className="hover:text-brand-cyan transition-colors">Dashboard Utama</button></li>
              <li><button onClick={() => onNavigateToTab("cctv")} className="hover:text-brand-cyan transition-colors">Monitor CCTV</button></li>
              <li><button className="hover:text-brand-cyan transition-colors">Profil Instansi</button></li>
              <li><button className="hover:text-brand-cyan transition-colors">PPID & Layanan Publikasi</button></li>
            </ul>
          </div>

          {/* 5. Media Sosial & Supported By */}
          <div className="md:col-span-12 lg:col-span-6">
            <h4 className="font-display font-semibold text-white text-sm mb-4 tracking-wider">SOCIAL MEDIA</h4>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-brand-dark/50 border border-brand-cyan/20 flex items-center justify-center text-gray-400 hover:bg-brand-cyan/10 hover:text-brand-cyan hover:border-brand-cyan/50 transition-all">
                <Instagram size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-brand-dark/50 border border-brand-cyan/20 flex items-center justify-center text-gray-400 hover:bg-brand-cyan/10 hover:text-brand-cyan hover:border-brand-cyan/50 transition-all">
                <Twitter size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-brand-dark/50 border border-brand-cyan/20 flex items-center justify-center text-gray-400 hover:bg-brand-cyan/10 hover:text-brand-cyan hover:border-brand-cyan/50 transition-all">
                <Youtube size={18} />
              </a>
            </div>
            
            <h4 className="font-display font-semibold text-white text-sm mt-8 mb-4 tracking-wider">SUPPORTED BY</h4>
            <div className="inline-flex flex-wrap items-center gap-4 bg-white/5 p-3 rounded-lg border border-brand-cyan/10">
              <img src="/Logo%20President%20University.jpg" alt="President University" className="h-12 w-auto object-contain drop-shadow-sm bg-white/90 rounded p-1" />
              <img src="/Logo%20Fablab%20JABABEKA.jpg" alt="FABLAB" className="h-12 w-auto object-contain drop-shadow-sm bg-white/90 rounded p-1" />
              <img src="/Logo%20Dishub.jpg" alt="Dishub" className="h-12 w-auto object-contain drop-shadow-sm bg-white/90 rounded p-1" />
              <img src="/Logo%20Kemenko.jpg" alt="Kemenko Perekonomian" className="h-12 w-auto object-contain drop-shadow-sm bg-white/90 rounded p-1" />
            </div>
          </div>
        </div>

        {/* Hak Cipta & Statistik */}
        <div className="flex flex-col md:flex-row justify-between items-center text-xs font-mono text-gray-500">
          <p>© {new Date().getFullYear()} EDITH Traffic System. All rights reserved.</p>
        </div>
      </footer>
      </div>
    </div>
  );
}
