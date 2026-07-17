import { useState } from "react";
import { Shield, Lock, User, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { supabase } from "../supabaseClient";

interface LoginPageProps {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
      } else {
        onLogin();
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat otentikasi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center font-sans relative overflow-hidden p-4">
      {/* Background ambient elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-brand-cyan/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-brand-blue/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 150 }}
            className="w-full max-w-[320px] h-20 flex items-center justify-center mb-4 overflow-hidden"
          >
            <img 
              src="/logo_edith.png" 
              alt="EDITH Logo" 
              className="w-full h-full object-contain"
              style={{ filter: 'invert(1) hue-rotate(180deg)', mixBlendMode: 'screen' }}
              referrerPolicy="no-referrer"
            />
          </motion.div>
          <p className="text-gray-400 font-mono text-xs tracking-widest uppercase mt-2">Authentication Protocol</p>
        </div>

        <div className="bg-brand-slate/40 backdrop-blur-xl border border-brand-cyan/20 rounded-2xl p-8 shadow-2xl relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[1px] bg-gradient-to-r from-transparent via-brand-cyan to-transparent" />
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg text-center">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-xs font-mono text-gray-400 uppercase tracking-wider ml-1">Email / Operator ID</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="text-brand-cyan/50" size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-brand-dark/50 border border-brand-cyan/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-brand-cyan/50 focus:ring-1 focus:ring-brand-cyan/50 transition-all font-sans"
                  placeholder="Masukkan Email Anda"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-gray-400 uppercase tracking-wider ml-1">Secure Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="text-brand-cyan/50" size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-brand-dark/50 border border-brand-cyan/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-brand-cyan/50 focus:ring-1 focus:ring-brand-cyan/50 transition-all font-sans"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 group mt-4 shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-brand-dark/20 border-t-brand-dark rounded-full animate-spin" />
                  Mengautentikasi...
                </span>
              ) : (
                <>
                  INITIALIZE SYSTEM
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
          
          <div className="mt-8 text-center text-xs text-gray-500 font-mono flex items-center justify-center gap-2">
            <Shield size={12} className="text-brand-cyan/40" />
            <span>ENCRYPTED CONNECTION</span>
          </div>
        </div>

        {/* Institutional Collaboration Logos */}
        <div className="mt-8 text-center">
          <p className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-4">Didukung & Dikembangkan Oleh</p>
          <div className="flex flex-wrap items-center justify-center gap-4 bg-white/5 p-3.5 rounded-2xl border border-brand-cyan/10 backdrop-blur-md max-w-sm mx-auto shadow-lg">
            <img 
              src="/Logo President University.jpg" 
              alt="President University" 
              className="h-9 w-auto object-contain bg-white/95 rounded-lg p-1 hover:scale-105 transition-transform duration-200" 
            />
            <img 
              src="/Logo Fablab JABABEKA.jpg" 
              alt="Fablab Jababeka" 
              className="h-9 w-auto object-contain bg-white/95 rounded-lg p-1 hover:scale-105 transition-transform duration-200" 
            />
            <img 
              src="/Logo Dishub.jpg" 
              alt="Dishub" 
              className="h-9 w-auto object-contain bg-white/95 rounded-lg p-1 hover:scale-105 transition-transform duration-200" 
            />
            <img 
              src="/Logo Kemenko.jpg" 
              alt="Kemenko" 
              className="h-9 w-auto object-contain bg-white/95 rounded-lg p-1 hover:scale-105 transition-transform duration-200" 
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
