import { useState } from "react";
import { 
  Shield, 
  LayoutDashboard, 
  Camera, 
  FileText, 
  Search,
  MessageSquareCode, 
  Cpu, 
  Menu, 
  X,
  Radio,
  Clock,
  Map,
  Home
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  isSidebarOpen, 
  setIsSidebarOpen 
}: SidebarProps) {
  
  const menuItems = [
    { id: "home", label: "Beranda", icon: Home },
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "heatmap", label: "Heatmap Pelanggaran", icon: Map },
    { id: "cctv", label: "Monitor CCTV & AI", icon: Camera },
    { id: "violations", label: "Laporan Tilang", icon: FileText },
    { id: "calculator", label: "Data Pelanggaran ETLE", icon: Search },
    { id: "edith", label: "Asisten EDITH", icon: MessageSquareCode },
  ];

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <>
      {/* Overlay for Mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            id="sidebar-overlay-mobile"
            className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <motion.aside
        id="sidebar-container"
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-brand-dark border-r border-brand-cyan/20 flex flex-col justify-between transition-transform duration-300 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header Logo */}
        <div className="p-5 border-b border-brand-cyan/10">
          <div className="flex items-center justify-between">
            <div className="flex-1 mr-3">
              <div className="relative w-full h-12 overflow-hidden flex items-center justify-center">
                <img 
                  src="/logo_edith.png" 
                  alt="EDITH Logo" 
                  className="w-full h-full object-contain"
                  style={{ filter: 'invert(1) hue-rotate(180deg)', mixBlendMode: 'screen' }}
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white p-1">
              <X size={20} />
            </button>
          </div>
          
          {/* Status Indicator */}
          <div className="mt-3.5 px-2.5 py-1 bg-brand-slate/30 rounded border border-brand-cyan/10 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-brand-cyan rounded-full animate-ping" />
              <span className="text-[9px] font-mono text-slate-400">STATUS SISTEM</span>
            </div>
            <span className="text-[8px] font-mono text-brand-cyan border border-brand-cyan/25 px-1 py-0.5 rounded bg-brand-cyan/5">
              SECURE
            </span>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-item-${item.id}`}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsSidebarOpen(false); // Close on mobile
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg font-sans text-xs tracking-wide transition-all duration-150 border group ${
                  isActive
                    ? "bg-brand-cyan/10 border-brand-cyan/30 text-brand-cyan font-medium"
                    : "bg-transparent border-transparent text-slate-400 hover:bg-brand-slate/40 hover:text-white"
                }`}
              >
                <Icon 
                  size={16} 
                  className={`transition-transform duration-150 group-hover:scale-105 ${
                    isActive ? "text-brand-cyan" : "text-slate-400 group-hover:text-white"
                  }`} 
                />
                <span>{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="ml-auto w-1.5 h-1.5 bg-brand-cyan rounded-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-brand-cyan/10 font-mono text-[9px] text-slate-500 space-y-1 bg-brand-dark/50">
          <div className="pt-2 text-center text-[8px] text-slate-600 border-t border-brand-cyan/5">
            Designed for Indonesian ETLE
          </div>
        </div>
      </motion.aside>
    </>
  );
}
