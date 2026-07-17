import { useState } from "react";
import Sidebar from "./components/Sidebar";
import DashboardOverview from "./components/DashboardOverview";
import HeatmapSection from "./components/HeatmapSection";
import Homepage from "./components/Homepage";
import CctvSection from "./components/CctvSection";
import ViolationsSection from "./components/ViolationsSection";
import PlateSearchSection from "./components/PlateSearchSection";
import EdithAssistant from "./components/EdithAssistant";
import LoginPage from "./components/LoginPage";
import { Violation } from "./types";
import { INITIAL_VIOLATIONS } from "./data";
import { Shield } from "lucide-react";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("home");
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [violations, setViolations] = useState<Violation[]>(INITIAL_VIOLATIONS);
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);

  const handleNavigateToTab = (tab: string, payload?: any) => {
    setActiveTab(tab);
    if (tab === "cctv" && payload) {
      setSelectedCameraId(payload);
    }
  };

  // Add violation handler (called from CCTV section after AI analysis)
  const handleAddViolation = (newViolation: Violation) => {
    setViolations((prev) => [newViolation, ...prev]);
  };

  // Remove violation handler
  const handleRemoveViolation = (id: string) => {
    setViolations((prev) => prev.filter(v => v.id !== id));
  };

  // Update status handler (e.g. for simulations)
  const handleUpdateViolationStatus = (id: string, status: "Belum Bayar" | "Proses Banding" | "Lunas") => {
    setViolations((prev) => prev.map(v => v.id === id ? { ...v, status } : v));
  };

  const handleViewViolationFromDashboard = (violation: Violation) => {
    setSelectedViolation(violation);
    setActiveTab("violations");
  };

  // Render tab content based on activeTab state
  const renderTabContent = () => {
    switch (activeTab) {
      case "home":
        return <Homepage violations={violations} onNavigateToTab={handleNavigateToTab} />;
      case "dashboard":
        return (
          <DashboardOverview 
            violations={violations} 
            onViewViolation={handleViewViolationFromDashboard}
            onNavigateToTab={handleNavigateToTab}
          />
        );
      case "heatmap":
        return <HeatmapSection onNavigateToTab={handleNavigateToTab} />;
      case "cctv":
        return <CctvSection onAddViolation={handleAddViolation} initialCameraId={selectedCameraId} />;
      case "violations":
        return (
          <ViolationsSection 
            violations={violations} 
            onRemoveViolation={handleRemoveViolation} 
            onUpdateViolationStatus={handleUpdateViolationStatus}
            selectedViolation={selectedViolation}
            setSelectedViolation={setSelectedViolation}
          />
        );
      case "calculator":
        return <PlateSearchSection />;
      case "edith":
        return <EdithAssistant />;
      default:
        return (
          <DashboardOverview 
            violations={violations} 
            onViewViolation={handleViewViolationFromDashboard}
            onNavigateToTab={handleNavigateToTab}
          />
        );
    }
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="min-h-screen bg-brand-dark flex font-sans text-gray-200 antialiased overflow-x-hidden selection:bg-brand-cyan selection:text-brand-dark">
      
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-cyan/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-blue/5 rounded-full blur-[120px]" />
      </div>

      {/* Modern Responsive Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={handleNavigateToTab} 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen} 
      />

      {/* Main Content Area */}
      <div className={`flex-1 min-w-0 flex flex-col min-h-screen relative z-10 transition-all duration-300 ${isSidebarOpen ? 'md:pl-72' : 'pl-0'}`}>
        
        {/* Global Top HUD Header */}
        <header className="h-16 border-b border-brand-cyan/10 px-6 sm:px-8 flex items-center justify-between bg-brand-dark/60 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className="text-slate-400 hover:text-white transition-colors focus:outline-none p-1 rounded-md hover:bg-brand-cyan/10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
            </button>
            <button 
              onClick={() => handleNavigateToTab("home")}
              className="flex items-center gap-2.5 hover:opacity-80 transition-opacity focus:outline-none"
            >
              <div className="w-8 h-8 overflow-hidden flex items-center justify-center md:hidden">
                <img 
                  src="/logo_edith.png" 
                  alt="EDITH Logo" 
                  className="w-full h-full object-contain"
                  style={{ filter: 'invert(1) hue-rotate(180deg)', mixBlendMode: 'screen' }}
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="font-display font-semibold text-sm tracking-widest text-white hidden sm:inline">
                EDITH
              </span>
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Collaborative Logos Badge */}
            <div className="hidden lg:flex items-center gap-2.5 bg-brand-slate/40 border border-brand-cyan/10 rounded-full py-1 px-3 shadow-sm">
              <span className="text-[10px] font-mono text-gray-400 mr-1 font-semibold uppercase tracking-wider">KOLABORASI:</span>
              <img src="/Logo President University.jpg" alt="PresUniv" className="h-6 w-auto object-contain bg-white rounded px-0.5" />
              <img src="/Logo Fablab JABABEKA.jpg" alt="FabLab" className="h-6 w-auto object-contain bg-white rounded px-0.5" />
              <img src="/Logo Dishub.jpg" alt="Dishub" className="h-6 w-auto object-contain bg-white rounded px-0.5" />
              <img src="/Logo Kemenko.jpg" alt="Kemenko" className="h-6 w-auto object-contain bg-white rounded px-0.5" />
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs font-mono bg-brand-slate/40 border border-brand-cyan/15 rounded-full py-1.5 px-3.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              <span className="text-gray-400">STATUS:</span>
              <span className="text-emerald-400 font-bold">EDITH SECURED</span>
            </div>
          </div>
        </header>

        {/* Content Body with scrolling */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          {renderTabContent()}
        </main>
      </div>
    </div>
  );
}
