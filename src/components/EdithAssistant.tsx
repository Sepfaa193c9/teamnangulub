import { useState, useRef, useEffect } from "react";
import { 
  MessageSquareCode, 
  Send, 
  Trash2, 
  Sparkles, 
  Radio, 
  User, 
  Cpu,
  ChevronRight,
  ShieldAlert
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import { ChatMessage } from "../types";

export default function EdithAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "model",
      content: "Halo! Selamat datang di antarmuka **EDITH** (Electronic Detection & Intelligent Traffic Handler).\n\nSaya telah terhubung ke sistem kamera pengawas ETLE Nasional dan database rujukan Undang-Undang No. 22 Tahun 2009 (LLAJ) Indonesia. Silakan tanyakan apa saja terkait aturan lalu lintas, tarif denda tilang elektronik, atau mekanisme sanggah konfirmasi tilang. Ada yang bisa saya bantu hari ini?",
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestionPrompts = [
    "Berapa denda tidak pakai helm?",
    "Apa sanksi menerobos lampu merah?",
    "Bagaimana cara membayar denda ETLE?",
    "Melanggar marka jalan pasal berapa?",
  ];

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Send message to our Express server proxy
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.concat(userMsg),
          userMessage: text,
        }),
      });

      const data = await response.json();
      
      const edithMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "model",
        content: data.reply,
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, edithMsg]);
    } catch (error) {
      console.error("Chat Error:", error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "model",
        content: "Mohon maaf, saat ini sistem sedang mengalami gangguan koneksi. Silakan coba beberapa saat lagi.",
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  const clearChat = () => {
    if (confirm("Apakah Anda yakin ingin menghapus seluruh riwayat percakapan dengan EDITH?")) {
      setMessages([
        {
          id: "welcome",
          role: "model",
          content: "Riwayat komunikasi telah dibersihkan. Saya siap menerima pertanyaan baru dari Anda.",
          timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  };

  return (
    <div className="space-y-8 flex flex-col h-[750px]" id="edith-tab">
      
      {/* Title */}
      <div className="border-b border-brand-cyan/10 pb-5 shrink-0 flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-semibold text-2xl text-white tracking-wide flex items-center gap-2">
            <MessageSquareCode className="text-brand-cyan" />
            ASISTEN KOGNITIF EDITH
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Asisten cerdas taktis berbasis AI dari Team Nangulub untuk bimbingan lalu lintas elektronik Indonesia.
          </p>
        </div>
        
        <button
          onClick={clearChat}
          className="bg-brand-slate/40 border border-brand-cyan/10 hover:border-brand-cyan/35 text-gray-400 hover:text-white p-2.5 rounded-lg text-xs font-mono transition-all focus:outline-none cursor-pointer flex items-center gap-1.5"
          title="Bersihkan Chat"
        >
          <Trash2 size={14} /> <span className="hidden sm:inline">BERSIHKAN</span>
        </button>
      </div>

      {/* Main Chat Box area */}
      <div className="flex-1 bg-brand-slate/15 border-2 border-brand-cyan/15 rounded-xl overflow-hidden flex flex-col justify-between min-h-0 relative shadow-inner">
        
        {/* Radar Telemetry Watermark background */}
        <div className="absolute inset-0 bg-grid pointer-events-none grid-bg opacity-15" />

        {/* Message Feeds Scroll Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 relative min-h-0">
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isEdith = msg.role === "model";
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className={`flex gap-3 max-w-4xl ${isEdith ? "mr-auto" : "ml-auto flex-row-reverse"}`}
                >
                  {/* Sender Avatar */}
                  <div className={`p-2 rounded-lg border h-9 w-9 shrink-0 flex items-center justify-center ${
                    isEdith 
                      ? "bg-brand-cyan/10 border-brand-cyan/35 text-brand-cyan" 
                      : "bg-brand-blue/10 border-brand-blue/35 text-brand-blue"
                  }`}>
                    {isEdith ? <Cpu size={16} /> : <User size={16} />}
                  </div>

                  {/* Bubble content */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-mono text-[9px] text-gray-500">
                      <span>{isEdith ? "EDITH COGNITIVE ENGINE" : "USER ENFORCER"}</span>
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                    </div>

                    <div className={`p-4 rounded-xl text-xs leading-relaxed font-sans border ${
                      isEdith 
                        ? "bg-brand-slate/90 border-brand-cyan/20 text-gray-100 glow-border-subtle" 
                        : "bg-brand-blue/10 border-brand-blue/20 text-blue-100"
                    }`}>
                      <div className="markdown-body prose prose-invert max-w-none prose-xs">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Typing Loading HUD status indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3 mr-auto max-w-md"
            >
              <div className="p-2 rounded-lg border border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan h-9 w-9 flex items-center justify-center animate-pulse">
                <Cpu size={16} />
              </div>
              <div className="space-y-1">
                <span className="font-mono text-[9px] text-brand-cyan animate-pulse">EDITH SEDANG MEMBACA REGISTRASI...</span>
                <div className="p-3 bg-brand-slate/50 border border-brand-cyan/10 rounded-xl flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-brand-cyan rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-brand-cyan rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-brand-cyan rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Dynamic suggestion chips */}
        {messages.length < 3 && (
          <div className="px-6 py-3 border-t border-brand-cyan/10 bg-brand-dark/30 relative shrink-0">
            <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block mb-2">Saran Pertanyaan Taktis</span>
            <div className="flex flex-wrap gap-2">
              {suggestionPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handleSendMessage(prompt)}
                  className="bg-brand-slate/40 border border-brand-cyan/15 hover:border-brand-cyan/35 text-gray-300 hover:text-brand-cyan rounded-full px-3 py-1.5 text-[10px] font-sans transition-all focus:outline-none cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Form Footer */}
        <div className="p-4 border-t border-brand-cyan/15 bg-brand-dark/95 relative shrink-0">
          <form onSubmit={handleFormSubmit} className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Tanyakan EDITH tentang aturan, denda, atau sanggahan tilang..."
              className="flex-1 bg-brand-slate/30 border border-brand-cyan/10 hover:border-brand-cyan/25 focus:border-brand-cyan/40 rounded-xl py-3 px-4 text-xs font-sans text-white focus:outline-none transition-colors placeholder-gray-500"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              id="btn-send-message-edith"
              className={`px-5 rounded-xl border flex items-center justify-center transition-all focus:outline-none ${
                inputValue.trim() && !isLoading
                  ? "bg-brand-cyan/10 border-brand-cyan text-brand-cyan hover:bg-brand-cyan hover:text-brand-dark cursor-pointer shadow-[0_0_10px_rgba(0,240,255,0.2)]"
                  : "bg-brand-slate/40 border-brand-cyan/5 text-gray-600 cursor-not-allowed"
              }`}
            >
              <Send size={15} />
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
