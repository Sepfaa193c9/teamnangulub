import { useState, useRef, useEffect } from "react";
import { 
  Camera, 
  Search, 
  Play, 
  RefreshCw, 
  Upload, 
  Cpu, 
  AlertTriangle, 
  CheckCircle,
  FileText,
  Scan,
  Sparkles,
  ChevronRight,
  ShieldAlert
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CctvCamera, Violation, AnalysisResult } from "../types";
import { INITIAL_CAMERAS, SAMPLE_PRESETS } from "../data";
import SOSButton from "./SOSButton";

import { supabase } from "../lib/supabase";

interface CctvSectionProps {
  onAddViolation: (violation: Violation) => void;
  initialCameraId?: string | null;
}

export default function CctvSection({ onAddViolation, initialCameraId }: CctvSectionProps) {
  const [cameras, setCameras] = useState<CctvCamera[]>(INITIAL_CAMERAS);
  const [selectedCamera, setSelectedCamera] = useState<CctvCamera>(
    initialCameraId 
      ? INITIAL_CAMERAS.find(c => c.id === initialCameraId) || INITIAL_CAMERAS[0] 
      : INITIAL_CAMERAS[0]
  );
  
  // WebSocket Integration State
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [wsClient, setWsClient] = useState<WebSocket | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [liveDetections, setLiveDetections] = useState<any[]>([]);
  const [fastApiEndpoint, setFastApiEndpoint] = useState<string>(() => {
    const saved = localStorage.getItem("edith_fastapi_endpoint");
    if (saved) return saved;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return `${protocol}//localhost:8000`;
    }
    // Fallback: If deployed, try to use the same host or default to railway style URL format
    return `${protocol}//${window.location.host}`;
  });
  
  const [searchQuery, setSearchQuery] = useState("");

  // Update selectedCamera if initialCameraId changes
  useEffect(() => {
    if (initialCameraId) {
      const camera = INITIAL_CAMERAS.find(c => c.id === initialCameraId);
      if (camera) {
        setSelectedCamera(camera);
      }
    }
  }, [initialCameraId]);

  // AI Analysis states
  const [activePreset, setActivePreset] = useState<any>(null);
  const [uploadedImageBase64, setUploadedImageBase64] = useState<string | null>(null);
  const [uploadedImageName, setUploadedImageName] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisLog, setAnalysisLog] = useState("");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [yoloBoxes, setYoloBoxes] = useState<any[]>([]);
  const [isRegistered, setIsRegistered] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Real-Time YOLO states
  const [isRealTime, setIsRealTime] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | undefined>(undefined);
  const simulatedVehiclesRef = useRef<any[]>([]);

  // Violation Zone state
  const [showViolationZone, setShowViolationZone] = useState(false);
  const [isScanningZone, setIsScanningZone] = useState(false);

  useEffect(() => {
    // Connect to actual FastAPI YOLOv8 stream socket
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;
    
    const connectWs = () => {
      try {
        // Build URL: make sure it has /ws/detect path
        const wsUrl = fastApiEndpoint.endsWith("/") 
          ? `${fastApiEndpoint}ws/detect` 
          : `${fastApiEndpoint}/ws/detect`;
          
        console.log(`Connecting to EDITH Engine at: ${wsUrl}`);
        setAnalysisLog(`Menghubungkan ke EDITH Engine: ${wsUrl}...`);
        
        ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          setIsWsConnected(true);
          setWsClient(ws);
          wsRef.current = ws;
          setAnalysisLog("Koneksi EDITH AI Engine aktif! Menunggu umpan video...");
          console.log("WebSocket connected successfully to FastAPI AI Engine");
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.status === "success" && data.detections) {
              setLiveDetections(data.detections);
            }
          } catch (err) {
            setAnalysisLog(`Telemetry: ${event.data.substring(0, 50)}`);
          }
        };
  
        ws.onclose = () => {
          setIsWsConnected(false);
          setWsClient(null);
          wsRef.current = null;
          setLiveDetections([]);
          setAnalysisLog("Koneksi terputus. Menggunakan simulasi lokal...");
          // Try to reconnect after 5 seconds
          reconnectTimeout = setTimeout(connectWs, 5000);
        };
        
        ws.onerror = () => {
          console.warn("FastAPI WebSocket error. Make sure FastAPI server is running on", fastApiEndpoint);
          setAnalysisLog("Gagal terhubung ke AI Engine. Pastikan backend diaktifkan.");
        };
      } catch (err) {
        console.error("WebSocket error:", err);
      }
    };

    connectWs();

    return () => {
      stopCameraStream();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) {
        ws.close();
      }
    };
  }, [fastApiEndpoint]);

  // Local high-fidelity perspective traffic simulation when WebSocket is offline
  const updateSimulatedDetections = () => {
    let vehicles = [...simulatedVehiclesRef.current];

    const leftLanes = [
      { startX: 47, startY: 25, endX: 20, endY: 100, isDownward: true },
      { startX: 42, startY: 25, endX: 5, endY: 100, isDownward: true },
      { startX: 36, startY: 25, endX: -15, endY: 100, isDownward: true }
    ];

    const rightLanes = [
      { startX: 62, startY: 100, endX: 53, endY: 25, isDownward: false },
      { startX: 80, startY: 100, endX: 58, endY: 25, isDownward: false },
      { startX: 105, startY: 100, endX: 64, endY: 25, isDownward: false }
    ];
    
    // Spawn new vehicle if needed (maintain up to 5 vehicles on screen)
    if (vehicles.length < 5 && Math.random() < 0.12) {
      const isLeft = Math.random() < 0.65; // Slightly more traffic on left lanes
      const laneIndex = Math.floor(Math.random() * 3);
      const lane = isLeft ? leftLanes[laneIndex] : rightLanes[laneIndex];
      
      const rand = Math.random();
      let label = "Mobil";
      let model = "Avanza";
      let baseW = 11;
      let baseH = 8.5;
      let minW = 1.2;
      let minH = 0.9;
      
      if (rand < 0.5) {
        label = "Mobil";
        const carModels = ["Avanza", "Brio", "Innova", "Pajero", "Sigra", "Yaris"];
        model = carModels[Math.floor(Math.random() * carModels.length)];
        baseW = 11;
        baseH = 8.5;
        minW = 1.2;
        minH = 0.9;
      } else if (rand < 0.8) {
        label = "Motor";
        const motorcycleModels = ["NMAX", "Beat", "PCX", "Vespa"];
        model = motorcycleModels[Math.floor(Math.random() * motorcycleModels.length)];
        baseW = 5;
        baseH = 5.5;
        minW = 0.6;
        minH = 0.7;
      } else if (rand < 0.92) {
        label = "Truk";
        const truckModels = ["Hino", "Fuso", "Isusu"];
        model = truckModels[Math.floor(Math.random() * truckModels.length)];
        baseW = 16;
        baseH = 13;
        minW = 1.8;
        minH = 1.4;
      } else {
        label = "Bus";
        const busModels = ["Scania", "Mercedes"];
        model = busModels[Math.floor(Math.random() * busModels.length)];
        baseW = 16;
        baseH = 13;
        minW = 1.8;
        minH = 1.4;
      }
      
      const prefixes = ["B", "D", "F", "L", "H", "AB", "DK", "N"];
      const suffixLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      const num = Math.floor(Math.random() * 8999) + 1000;
      const s1 = suffixLetters[Math.floor(Math.random() * 26)];
      const s2 = suffixLetters[Math.floor(Math.random() * 26)];
      const plateValue = `${prefix} ${num} ${s1}${s2}`;

      // Check for potential violations (15% chance)
      let violationsList: any[] = [];
      const hasViolationChance = Math.random() < 0.15;
      if (hasViolationChance) {
        if (label === "Motor") {
          violationsList = [{ name: "Tidak Memakai Helm" }];
        } else if (label === "Mobil") {
          const types = ["Melanggar Markah", "Batas Kecepatan", "Ganjil-Genap"];
          violationsList = [{ name: types[Math.floor(Math.random() * types.length)] }];
        } else {
          violationsList = [{ name: "Overdimension Overload (ODOL)" }];
        }
      }

      vehicles.push({
        id: Date.now() + Math.random(),
        label: `${label} (${model})`,
        vehicleType: label,
        confidence: Math.floor(92 + Math.random() * 7),
        plate: Math.random() < 0.95 ? plateValue : undefined,
        lane,
        progress: 0,
        progressSpeed: 0.012 + Math.random() * 0.016, // Smoother and dynamic speed
        baseW,
        baseH,
        minW,
        minH,
        violations: violationsList,
        addedToViolation: false
      });
    }

    const activeVehicles: any[] = [];
    vehicles.forEach(v => {
      v.progress += v.progressSpeed;

      // Calculate position based on progress
      const x = v.lane.startX + v.progress * (v.lane.endX - v.lane.startX);
      const y = v.lane.startY + v.progress * (v.lane.endY - v.lane.startY);

      // Clamp y positioning
      const scaleY = Math.max(0.05, Math.min(1.0, (y - 25) / 75));

      // 3D road perspective scaling of bounding boxes
      const width = v.minW + scaleY * (v.baseW - v.minW);
      const height = v.minH + scaleY * (v.baseH - v.minH);

      // Trigger ETLE violation callback exactly once when crossing the zone
      // Downward cars cross when y > 55. Upward cars cross when they have progressed slightly (e.g. progress > 0.25 and y > 55)
      const isCrossingZone = v.lane.isDownward 
        ? (y > 55)
        : (v.progress > 0.25 && y > 55);

      if (v.violations && v.violations.length > 0 && !v.addedToViolation && isCrossingZone) {
        v.addedToViolation = true;
        const fineMap: { [key: string]: number } = {
          "Tidak Memakai Helm": 250000,
          "Melanggar Markah": 500000,
          "Batas Kecepatan": 500000,
          "Ganjil-Genap": 500000,
          "Overdimension Overload (ODOL)": 1000000
        };
        
        const vName = v.violations[0].name;
        const fineAmount = fineMap[vName] || 250000;
        
        const newViolation: Violation = {
          id: `ETLE-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          licensePlate: v.plate || "B 9999 XX",
          vehicleType: v.vehicleType === "Motor" ? "Motor" : "Mobil",
          vehicleModel: v.label,
          violationType: vName,
          location: selectedCamera.name,
          timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '),
          fineAmount: fineAmount,
          status: "Belum Bayar",
          ownerName: "Pemilik Terlacak Otomatis",
        };
        
        onAddViolation(newViolation);
      }

      // Keep only vehicles that have not completed their journey
      if (v.progress < 1.0) {
        const xMin = Math.max(0, x - width / 2);
        const xMax = Math.min(100, x + width / 2);
        const yMin = Math.max(0, y - height / 2);
        const yMax = Math.min(100, y + height / 2);

        activeVehicles.push({
          ...v,
          box: [yMin, xMin, yMax, xMax]
        });
      }
    });

    simulatedVehiclesRef.current = activeVehicles;

    const mapped = activeVehicles.map(v => ({
      box: v.box,
      label: v.label,
      confidence: v.confidence,
      plate: v.plate,
      violations: v.violations
    }));

    setLiveDetections(mapped);
  };

  const stopCameraStream = () => {
    setIsRealTime(false);
    setLiveDetections([]);
    simulatedVehiclesRef.current = [];
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    if (videoRef.current) {
      if (videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      if (videoRef.current.src) {
        try {
          URL.revokeObjectURL(videoRef.current.src);
        } catch (e) {}
        videoRef.current.removeAttribute('src');
        videoRef.current.load();
      }
    }
  };

  const startVideoProcessing = async (useCamera: boolean, file?: File, videoUrl?: string) => {
    stopCameraStream();
    setIsRealTime(true);
    setUploadedImageBase64(null);
    setActivePreset(null);
    
    try {
      if (useCamera) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.src = "";
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } else if (file) {
        const fileUrl = URL.createObjectURL(file);
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          videoRef.current.src = fileUrl;
          videoRef.current.loop = true;
          videoRef.current.play().catch(err => console.error("Error playing video:", err));
        }
      } else if (videoUrl) {
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          videoRef.current.src = videoUrl;
          videoRef.current.loop = true;
          videoRef.current.muted = true;
          videoRef.current.play().catch(err => console.error("Error playing video url:", err));
        }
      } else {
        return;
      }
      
      let lastSentTime = 0;
      const captureAndSendFrame = async () => {
        if (videoRef.current && canvasRef.current) {
          const video = videoRef.current;
          if (video.readyState >= 2 && video.videoWidth > 0) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
              canvasRef.current.width = video.videoWidth;
              canvasRef.current.height = video.videoHeight;
              
              // Draw the real video frame
              ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
              
              // Throttle to 10 frames per second (100ms) to maximize performance and save CPU
              const now = Date.now();
              if (now - lastSentTime > 100) {
                if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                  // Compress image to JPEG at 0.5 quality for super fast networking
                  const base64Img = canvasRef.current.toDataURL("image/jpeg", 0.5);
                  wsRef.current.send(JSON.stringify({ image: base64Img }));
                  lastSentTime = now;
                } else {
                  // WS is offline, execute offline-first high-fidelity 3D traffic simulator
                  updateSimulatedDetections();
                  lastSentTime = now;
                }
              }
            }
          }
        }
        requestRef.current = requestAnimationFrame(captureAndSendFrame);
      };
      
      captureAndSendFrame();
      
    } catch (err) {
      console.error("Video processing error:", err);
      alert("Gagal menginisialisasi sumber video. Pastikan kamera diizinkan atau file video valid.");
      setIsRealTime(false);
    }
  };

  const startCameraStream = () => startVideoProcessing(true);

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      startVideoProcessing(false, file);
    }
  };

  // Autoplay the demo traffic video on mount for a zero-setup teaser
  useEffect(() => {
    startVideoProcessing(false, undefined, "https://assets.mixkit.co/videos/preview/mixkit-highway-traffic-with-cars-and-trucks-43181-large.mp4");
    setShowViolationZone(true);
    
    return () => {
      stopCameraStream();
    };
  }, []);

  // Filtered cameras list
  const filteredCameras = cameras.filter(cam => 
    cam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cam.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Simulated analysis sequence
  const startAnalysis = async () => {
    let imgData = "";
    let name = "";
    
    if (uploadedImageBase64) {
      imgData = uploadedImageBase64;
      name = uploadedImageName;
    } else if (activePreset) {
      // Find preset image and fetch as base64 or pass name for server to mock
      name = activePreset.imageName;
      // Convert preset image to base64 if needed, but since it's an external url, 
      // let's pass a placeholder or we can use our preloaded base64 mock.
      // For presets, our backend server already has smart mocking based on imageName.
      // To bypass CORS or direct base64 download, we'll pass a mock base64
      imgData = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="; // 1x1 black pixel base64
    } else {
      alert("Silakan unggah gambar atau pilih skenario preset terlebih dahulu!");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);
    setYoloBoxes([]);
    setIsRegistered(false);
    setAnalysisProgress(5);
    setAnalysisLog("Menghubungkan ke satelit pengawas EDITH-03...");

    try {
      if (imageRef.current) {
        setAnalysisLog("Mengirim gambar ke FastAPI Engine (YOLOv8 + ByteTrack)...");
        setAnalysisProgress(30);
        await new Promise(resolve => setTimeout(resolve, 800));
        setAnalysisProgress(60);
      } else {
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      setAnalysisProgress(80);
      setAnalysisLog("Memverifikasi pasal pelanggaran via EDITH Core...");

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: imgData.replace(/^data:image\/\w+;base64,/, ""),
          imageName: name,
        }),
      });

      const data = await response.json();
      setAnalysisProgress(100);
      setAnalysisLog("Analisis taktis selesai!");
      
      setAnalysisResult(data);
    } catch (err: any) {
      console.error(err);
      setAnalysisProgress(100);
      setAnalysisLog("Gagal menganalisis. Menggunakan mesin analitik luring...");
      setAnalysisResult({
        vehicleType: "Kendaraan Bermotor",
        licensePlate: "B 1234 SMN",
        violations: [
          { name: "Tidak Mengenakan Helm", pasal: "Pasal 291 ayat (1)", fineAmount: 250000, confidence: 95 }
        ],
        overallConfidence: 90,
        visualDescription: "Deteksi luring mendeteksi pelanggaran keselamatan dasar lalu lintas.",
        boundingBoxes: yoloBoxes
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle local file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedImageName(file.name);
      setActivePreset(null);
      setAnalysisResult(null);
      setIsRegistered(false);

      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const selectPreset = (preset: any) => {
    setActivePreset(preset);
    setUploadedImageBase64(null);
    setUploadedImageName("");
    setAnalysisResult(null);
    setIsRegistered(false);
    stopCameraStream();
  };

  // Register detected violation as a real ticket
  const registerTicket = () => {
    if (!analysisResult) return;

    // Create a new Violation object
    const newViolation: Violation = {
      id: `ETLE-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      licensePlate: analysisResult.licensePlate || "B 9999 XX",
      vehicleType: analysisResult.vehicleType.includes("Motor") ? "Motor" : "Mobil",
      vehicleModel: analysisResult.vehicleType,
      violationType: analysisResult.violations.map(v => v.name).join(", ") || "Pelanggaran Lalu Lintas",
      location: selectedCamera.name,
      timestamp: new Date().toISOString().slice(0, 19),
      fineAmount: analysisResult.violations.reduce((sum, v) => sum + v.fineAmount, 0) || 250000,
      status: "Belum Bayar",
      ownerName: "Nama Pemilik Belum Teridentifikasi",
    };

    onAddViolation(newViolation);
    setIsRegistered(true);
  };

  // Clean upload
  const clearUpload = () => {
    setUploadedImageBase64(null);
    setUploadedImageName("");
    setActivePreset(null);
    setAnalysisResult(null);
    setIsRegistered(false);
    stopCameraStream();
  };

  return (
    <div className="space-y-8" id="cctv-tab">
      
      {/* Title */}
      <div className="border-b border-brand-cyan/10 pb-5">
        <h2 className="font-display font-semibold text-2xl text-white tracking-wide">
          MONITOR CCTV & ANALISIS DETEKSI AI
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Pantau CCTV lalu lintas secara real-time dan analisis foto pelanggaran menggunakan mesin kognitif EDITH
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Camera List */}
        <div className="bg-brand-slate/20 border border-brand-cyan/10 rounded-xl p-5 flex flex-col h-[750px]">
          <h3 className="font-display font-medium text-sm text-white uppercase tracking-wider mb-4">
            Daftar Kamera Pengawas
          </h3>

          {/* Search bar */}
          <div className="relative mb-4">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <Search size={15} />
            </span>
            <input
              type="text"
              placeholder="Cari kamera atau lokasi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-brand-dark/80 border border-brand-cyan/10 hover:border-brand-cyan/25 focus:border-brand-cyan/40 rounded-lg py-2 pl-9 pr-4 text-xs font-sans text-white focus:outline-none placeholder-gray-500 transition-colors"
            />
          </div>

          {/* Camera Grid/List */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {filteredCameras.length > 0 ? (
              filteredCameras.map((cam) => {
                const isSelected = selectedCamera.id === cam.id;
                return (
                  <div
                    key={cam.id}
                    id={`camera-list-item-${cam.id}`}
                    onClick={() => {
                      setSelectedCamera(cam);
                      clearUpload();
                    }}
                    className={`p-3.5 rounded-lg border cursor-pointer transition-all duration-200 flex flex-col justify-between hover:bg-brand-slate/30 group ${
                      isSelected 
                        ? "bg-brand-cyan/5 border-brand-cyan/30 shadow-sm" 
                        : "bg-brand-dark/40 border-brand-cyan/5"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            cam.status === "Aktif" 
                              ? "bg-emerald-500" 
                              : cam.status === "Pemeliharaan" 
                              ? "bg-amber-500" 
                              : "bg-rose-500"
                          }`} />
                          <h4 className="font-display font-medium text-xs text-white truncate">{cam.name}</h4>
                        </div>
                        <p className="text-[10px] text-gray-500 font-mono mt-1 truncate">{cam.location}</p>
                      </div>
                      <span className="text-[9px] font-mono text-gray-500 border border-brand-cyan/15 px-1 rounded bg-brand-slate/50">
                        {cam.id}
                      </span>
                    </div>

                    <div className="mt-3.5 pt-2.5 border-t border-brand-cyan/5 flex items-center justify-between text-[10px] font-mono text-gray-400">
                      <span>IP: {cam.ipAddress}</span>
                      <span className="text-brand-cyan">{cam.violationsCount24h} Pelanggaran/24j</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 font-mono text-xs text-gray-500">
                Kamera tidak ditemukan.
              </div>
            )}
          </div>
        </div>

        {/* Right Columns: CCTV Screen & AI Analyzer */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Stark HUD Live Feed Screen */}
          <div className="bg-brand-dark border-2 border-brand-cyan/25 rounded-xl overflow-hidden relative shadow-lg">
            
            {/* Top HUD bar */}
            <div className="bg-brand-slate/80 border-b border-brand-cyan/20 px-4 py-2.5 flex items-center justify-between text-xs font-mono text-brand-cyan">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 font-bold">
                  <span className="w-2 h-2 bg-rose-600 rounded-full animate-ping" />
                  <span className="text-rose-500 font-bold">REC</span>
                </span>
                <span className="text-gray-400 font-medium">|</span>
                <span>NODE: {selectedCamera.id}</span>
                <span className="text-gray-400 font-medium">|</span>
                <span className="text-white font-medium">{selectedCamera.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500">FPS: 30.0</span>
                <span className="text-emerald-400">SECURE LINK</span>
              </div>
            </div>

            {/* Simulated Stream Scene inside HUD */}
            <div className="h-96 relative bg-slate-900 flex items-center justify-center overflow-hidden">
              
              {/* Scan Line effect */}
              <div className="absolute inset-0 bg-grid pointer-events-none grid-bg opacity-30" />
              <div className="absolute top-0 left-0 w-full h-1 bg-brand-cyan/35 scan-line shadow-sm pointer-events-none" />

              {/* Stark Reticle / Corner overlays */}
              <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-brand-cyan" />
              <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-brand-cyan" />
              <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-brand-cyan" />
              <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-brand-cyan" />

              {/* CCTV Video / Image Source */}
              <div className="absolute inset-0 flex items-center justify-center">
                {isRealTime ? (
                  <div className="w-full h-full relative">
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      playsInline
                      muted
                    />
                    <canvas
                      ref={canvasRef}
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    />
                    
                    {/* Render live YOLO detections overlaid on the video frame */}
                    {liveDetections.map((det, index) => {
                      const [yMin, xMin, yMax, xMax] = det.box;
                      const hasViolation = det.violations && det.violations.length > 0;
                      return (
                        <div 
                          key={index}
                          className={`absolute border-2 ${hasViolation ? 'border-rose-500 bg-rose-500/10' : 'border-brand-cyan bg-brand-cyan/10'} flex flex-col justify-between pointer-events-none`}
                          style={{
                            top: `${yMin}%`,
                            left: `${xMin}%`,
                            width: `${xMax - xMin}%`,
                            height: `${yMax - yMin}%`
                          }}
                        >
                          <div className="flex flex-col">
                            <span className={`${hasViolation ? 'bg-rose-500 text-white' : 'bg-brand-cyan text-brand-dark'} font-mono text-[9px] px-1 py-0.5 max-w-max font-bold`}>
                              {det.label} ({det.confidence}%)
                            </span>
                            {det.plate && (
                              <span className="bg-brand-dark text-brand-cyan font-mono text-[9px] px-1 py-0.5 max-w-max border border-brand-cyan/20">
                                PLAT: {det.plate}
                              </span>
                            )}
                            {hasViolation && det.violations.map((v: any, vi: number) => (
                              <span key={vi} className="bg-rose-600 text-white font-mono text-[8px] px-1 py-0.2 max-w-max animate-pulse">
                                TILANG: {v.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : uploadedImageBase64 || activePreset ? (
                  <div className="w-full h-full relative">
                    <img 
                      ref={imageRef}
                      crossOrigin="anonymous"
                      src={uploadedImageBase64 || activePreset.imageUrl} 
                      alt="CCTV Capture" 
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Render AI Bounding boxes if analyzed */}
                    {analysisResult && !isAnalyzing && (
                      <div className="absolute inset-0 pointer-events-none">
                        {analysisResult.boundingBoxes?.map((bb: any, index: number) => {
                          const [yMin, xMin, yMax, xMax] = bb.box;
                          return (
                            <div 
                              key={index}
                              className="absolute border-2 border-rose-500 bg-rose-500/10 flex flex-col justify-between"
                              style={{
                                top: `${yMin}%`,
                                left: `${xMin}%`,
                                width: `${xMax - xMin}%`,
                                height: `${yMax - yMin}%`
                              }}
                            >
                              <span className="bg-rose-500 text-white font-mono text-[9px] px-1 py-0.5 max-w-max">
                                {bb.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full relative">
                    <iframe
                      src={`https://www.youtube.com/embed?listType=search&list=Live+Traffic+CCTV+${encodeURIComponent(selectedCamera.location)}&autoplay=1&mute=1&controls=0&loop=1`}
                      title="Real-time CCTV Feed"
                      className="w-full h-full object-cover opacity-80"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                    <div className="absolute inset-0 pointer-events-none border-[3px] border-transparent" />
                  </div>
                )}
              </div>

              {/* Violation Zone Overlay */}
              <AnimatePresence>
                {isScanningZone ? (
                  <motion.div
                    key="scanning"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 pointer-events-none z-20 flex flex-col items-center justify-center bg-brand-dark/40 overflow-hidden"
                  >
                    <motion.div 
                      className="w-full h-1 bg-brand-cyan shadow-[0_0_20px_rgba(34,211,238,1)] absolute"
                      animate={{ top: ["0%", "100%", "0%"] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                    <div className="text-brand-cyan font-mono text-xs font-bold tracking-widest bg-brand-dark/80 px-3 py-1.5 rounded border border-brand-cyan/50 animate-pulse">
                      MENGKALIBRASI ZONA JALAN...
                    </div>
                  </motion.div>
                ) : showViolationZone && (
                  <motion.div
                    key="zone"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center"
                  >
                    <svg width="100%" height="100%" className="absolute inset-0">
                      <polygon 
                        points="15%,90% 85%,90% 65%,40% 35%,40%" 
                        fill="rgba(225, 29, 72, 0.2)" 
                        stroke="rgba(225, 29, 72, 0.8)" 
                        strokeWidth="2" 
                        strokeDasharray="6 4"
                      />
                      <circle cx="15%" cy="90%" r="4" fill="rgba(225, 29, 72, 1)" />
                      <circle cx="85%" cy="90%" r="4" fill="rgba(225, 29, 72, 1)" />
                      <circle cx="65%" cy="40%" r="4" fill="rgba(225, 29, 72, 1)" />
                      <circle cx="35%" cy="40%" r="4" fill="rgba(225, 29, 72, 1)" />
                    </svg>
                    <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-rose-500 font-mono text-[10px] font-bold tracking-widest bg-brand-dark/80 px-2 py-1 rounded border border-rose-500/50">
                      ZONA PELANGGARAN AKTIF
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Compass / Hud Telemetry Overlay */}
              <div className="absolute left-6 top-1/2 -translate-y-1/2 font-mono text-[9px] text-brand-cyan space-y-1.5 hidden sm:block opacity-75">
                <div>ALT: 18.4m</div>
                <div>AZIMUTH: 312°</div>
                <div>TILT: -14.2°</div>
                <div>RANGE: 45m</div>
              </div>

              <div className="absolute right-6 top-1/2 -translate-y-1/2 font-mono text-[9px] text-brand-cyan text-right space-y-1.5 hidden sm:block opacity-75">
                <div>LAT: {selectedCamera.lat}</div>
                <div>LNG: {selectedCamera.lng}</div>
                <div>SATELLITE: STARK-03</div>
                <div>LUX: 3400</div>
              </div>
            </div>

            {/* Bottom HUD info */}
            <div className="bg-brand-slate/40 border-t border-brand-cyan/15 px-4 py-2 flex items-center justify-between text-[11px] font-mono text-gray-400">
              <span className="flex items-center gap-1.5">
                <Scan size={12} className="text-brand-cyan" /> 
                MODE DETEKSI: <span className="text-brand-cyan font-semibold">{isRealTime ? "LIVE STREAM FASTAPI" : "OTOMATIS (FASTAPI)"}</span>
              </span>
              <span>{isRealTime ? "STREAM AKTIF" : "SINKRONISASI AKTIF"}</span>
            </div>
          </div>
          
          {/* Real-Time Camera & Violation Zone Buttons */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="file"
              ref={videoFileInputRef}
              onChange={handleVideoFileChange}
              accept="video/*"
              className="hidden"
            />
            
            <button
              onClick={isRealTime ? stopCameraStream : startCameraStream}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg border text-xs sm:text-sm font-display font-medium tracking-wide transition-all ${
                isRealTime
                  ? "bg-rose-500/10 border-rose-500/50 text-rose-500 hover:bg-rose-500/20"
                  : "bg-brand-cyan/10 border-brand-cyan/30 text-brand-cyan hover:bg-brand-cyan/20"
              }`}
            >
              {isRealTime ? (
                <>
                  <AlertTriangle size={18} />
                  HENTIKAN STREAM CCTV
                </>
              ) : (
                <>
                  <Camera size={18} />
                  SIMULASI KAMERA (WEBCAM)
                </>
              )}
            </button>

            <button
              onClick={() => videoFileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan hover:bg-brand-cyan/20 text-xs sm:text-sm font-display font-medium tracking-wide transition-all"
            >
              <Upload size={18} />
              UNGGAH FILE VIDEO (.MP4)
            </button>

            <button
              onClick={() => {
                if (showViolationZone) {
                  setShowViolationZone(false);
                } else {
                  setIsScanningZone(true);
                  setTimeout(() => {
                    setIsScanningZone(false);
                    setShowViolationZone(true);
                  }, 2000);
                }
              }}
              disabled={isScanningZone}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg border text-xs sm:text-sm font-display font-medium tracking-wide transition-all ${
                showViolationZone
                  ? "bg-brand-cyan border-brand-cyan text-brand-dark"
                  : isScanningZone
                  ? "bg-brand-cyan/30 border-brand-cyan/50 text-brand-cyan animate-pulse"
                  : "bg-brand-cyan/10 border-brand-cyan/30 text-brand-cyan hover:bg-brand-cyan/20"
              }`}
            >
              <Scan size={18} />
              {isScanningZone ? "MENDETEKSI ZONA JALAN..." : showViolationZone ? "SEMBUNYIKAN ZONA" : "ZONA PELANGGARAN"}
            </button>
          </div>

          {/* AI Tactical Analysis Controller */}
          <div className="bg-brand-slate/20 border border-brand-cyan/10 rounded-xl p-6 space-y-6">
            
            {/* FastAPI Engine Endpoint Configuration (for Railway or local development) */}
            <div className="p-4 bg-brand-dark/55 border border-brand-cyan/15 rounded-xl space-y-3 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-xs font-display font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isWsConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)]'}`} />
                  EDITH AI ENGINE GATEWAY
                </span>
                <span className={`text-[10px] font-mono font-bold ${isWsConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isWsConnected ? 'TERKONEKSI' : 'TERPUTUS / LURING'}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-sans leading-relaxed">
                Konfigurasikan gerbang AI untuk pemantauan live streaming CCTV YOLOv8 + ByteTrack + EasyOCR. Dukung alamat Railway atau URL server luring.
              </p>
              <div className="flex gap-2 items-center">
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest shrink-0">ENDPOINT:</span>
                <input
                  type="text"
                  value={fastApiEndpoint}
                  onChange={(e) => {
                    setFastApiEndpoint(e.target.value);
                    localStorage.setItem("edith_fastapi_endpoint", e.target.value);
                  }}
                  placeholder="http://localhost:8000 atau wss://yolov8-production.up.railway.app"
                  className="flex-1 bg-brand-dark border border-brand-cyan/15 hover:border-brand-cyan/30 focus:border-brand-cyan/50 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none placeholder-gray-600 transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
              <div>
                <h3 className="font-display font-semibold text-white text-base flex items-center gap-2">
                  <Sparkles size={18} className="text-brand-cyan" /> 
                  Try EDITH
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Uji kecerdasan buatan dengan memilih skenario pelanggaran atau unggah gambar sendiri.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  id="btn-upload-file"
                  className="bg-brand-dark border border-brand-cyan/25 hover:bg-brand-slate/50 text-brand-cyan px-4 py-2 rounded-lg text-xs font-mono flex items-center gap-2 focus:outline-none transition-all cursor-pointer"
                >
                  <Upload size={14} /> UNGGAH GAMBAR
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </div>

            {/* Presets Grid */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">Skenario Preset Pelanggaran</span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {SAMPLE_PRESETS.map((preset) => {
                  const isSelected = activePreset?.id === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => selectPreset(preset)}
                      className={`p-3 text-left rounded-lg border text-xs font-sans transition-all duration-200 focus:outline-none flex flex-col justify-between h-20 ${
                        isSelected 
                          ? "bg-brand-cyan/10 border-brand-cyan/40 text-brand-cyan glow-border-subtle" 
                          : "bg-brand-dark/40 border-brand-cyan/5 text-gray-400 hover:border-brand-cyan/15 hover:text-white"
                      }`}
                    >
                      <span className="font-medium truncate block w-full">{preset.name}</span>
                      <span className="text-[9px] text-gray-500 uppercase font-mono mt-1 block">Tipe: {preset.type}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Trigger Button & Progress Bar */}
            <div className="pt-4 border-t border-brand-cyan/10 space-y-4">
              
              <AnimatePresence>
                {isAnalyzing && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-2"
                  >
                    <div className="flex justify-between text-xs font-mono text-brand-cyan">
                      <span>{analysisLog}</span>
                      <span>{analysisProgress}%</span>
                    </div>
                    <div className="w-full bg-brand-dark/80 h-2 rounded-full overflow-hidden border border-brand-cyan/10">
                      <motion.div 
                        className="bg-brand-cyan h-full"
                        style={{ width: `${analysisProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {!isAnalyzing && (
                <button
                  onClick={startAnalysis}
                  disabled={!activePreset && !uploadedImageBase64}
                  id="btn-trigger-ai-analysis"
                  className={`w-full py-4 rounded-xl font-display font-bold text-sm tracking-widest transition-all duration-300 flex items-center justify-center gap-3 border ${
                    activePreset || uploadedImageBase64
                      ? "bg-brand-cyan/10 border-brand-cyan text-brand-cyan hover:bg-brand-cyan/15 cursor-pointer hover:shadow-[0_0_20px_rgba(0,240,255,0.2)]"
                      : "bg-brand-slate/40 border-brand-cyan/5 text-gray-600 cursor-not-allowed"
                  }`}
                >
                  <Cpu size={18} className={activePreset || uploadedImageBase64 ? "animate-spin text-brand-cyan" : ""} />
                  MULAILAH ANALISIS TAKTIS EDITH
                </button>
              )}
            </div>

            {/* Analysis Result Report HUD */}
            <AnimatePresence>
              {analysisResult && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-brand-dark/90 border border-brand-cyan/30 rounded-lg p-5 mt-5 space-y-4 glow-border"
                >
                  <div className="flex items-center justify-between border-b border-brand-cyan/10 pb-3">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="text-rose-500" size={20} />
                      <h4 className="font-display font-bold text-white uppercase tracking-wider text-sm">
                        Laporan Analisis Taktis ETLE
                      </h4>
                    </div>
                    <span className="font-mono text-xs text-brand-cyan bg-brand-cyan/5 border border-brand-cyan/20 px-2 py-0.5 rounded">
                      AKURASI: {analysisResult.overallConfidence}%
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                    
                    <div className="space-y-3">
                      <div>
                        <span className="text-gray-500 font-mono text-[10px] uppercase block">Tipe Kendaraan</span>
                        <span className="text-white font-medium text-sm mt-0.5 block">{analysisResult.vehicleType}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 font-mono text-[10px] uppercase block">Hasil Deteksi Plat Nomor</span>
                        <span className="text-brand-cyan font-mono font-bold text-sm bg-brand-cyan/5 border border-brand-cyan/15 px-2 py-1 rounded inline-block mt-1">
                          {analysisResult.licensePlate || "TIDAK TERDETEKSI"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <span className="text-gray-500 font-mono text-[10px] uppercase block">Analisis Deskripsi Visual</span>
                        <p className="text-gray-300 leading-relaxed mt-1 text-xs">
                          {analysisResult.visualDescription}
                        </p>
                      </div>
                    </div>

                  </div>

                  {/* Violations Array list */}
                  <div className="border-t border-brand-cyan/10 pt-4 space-y-3">
                    <span className="text-gray-500 font-mono text-[10px] uppercase tracking-wider block">Pelanggaran yang Teridentifikasi</span>
                    
                    {analysisResult.violations && analysisResult.violations.length > 0 ? (
                      <div className="space-y-2">
                        {analysisResult.violations.map((v, i) => (
                          <div 
                            key={i}
                            className="p-3.5 bg-rose-500/5 border border-rose-500/25 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <AlertTriangle size={14} className="text-rose-500" />
                                <span className="font-semibold text-rose-400">{v.name}</span>
                              </div>
                              <p className="text-gray-500 text-[10px] font-mono mt-0.5">Rujukan: {v.pasal}</p>
                            </div>
                            <div className="text-left sm:text-right">
                              <span className="font-mono text-white block">
                                Denda: {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v.fineAmount)}
                              </span>
                              <span className="text-[10px] text-gray-500 font-mono">Kepercayaan: {v.confidence}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg text-emerald-400 font-mono flex items-center gap-2 text-xs">
                        <CheckCircle size={14} /> Tidak ada pelanggaran lalu lintas yang terdeteksi. Aman untuk melintas.
                      </div>
                    )}
                  </div>

                  {/* Operational Registration Trigger */}
                  {analysisResult.violations && analysisResult.violations.length > 0 && (
                    <div className="border-t border-brand-cyan/10 pt-4 flex justify-between items-center gap-4">
                      {uploadedImageBase64 && (
                        <button 
                          onClick={clearUpload}
                          className="text-xs text-gray-400 hover:text-white font-mono"
                        >
                          Hapus Gambar
                        </button>
                      )}
                      
                      {isRegistered ? (
                        <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg px-4 py-2 text-xs font-semibold font-mono flex items-center gap-2 w-full justify-center">
                          <CheckCircle size={15} /> TIKET TILANG BERHASIL DIDAFTARKAN KE POLDA METRO JAYA
                        </div>
                      ) : (
                        <button
                          onClick={registerTicket}
                          id="btn-register-ticket-etle"
                          className="w-full sm:w-auto ml-auto bg-brand-cyan text-brand-dark px-6 py-2.5 rounded-lg font-display font-bold text-xs tracking-wider hover:bg-white transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)] flex items-center gap-2 justify-center cursor-pointer"
                        >
                          <FileText size={14} /> DAFTARKAN SEBAGAI TILANG RESMI (ETLE)
                        </button>
                      )}
                    </div>
                  )}

                </motion.div>
              )}
            </AnimatePresence>

          </div>

        </div>

      </div>

      <SOSButton defaultLocation={selectedCamera?.location || ""} />
    </div>
  );
}
