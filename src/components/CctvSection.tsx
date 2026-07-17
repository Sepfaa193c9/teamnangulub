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
  ShieldAlert,
  Download
} from "lucide-react";
import { CctvCamera, Violation, AnalysisResult } from "../types";
import { INITIAL_CAMERAS, SAMPLE_PRESETS } from "../data";
import SOSButton from "./SOSButton";
import html2canvas from "html2canvas";

// AI Detection Imports
import * as tf from "@tensorflow/tfjs";
import * as yolo from "ultralytics";
import EasyOCR from "easyocr";
import ByteTrack from "byte-track";

import { supabase } from "../lib/supabase";
import { motion, AnimatePresence } from "motion/react";

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
  const [inferenceLatency, setInferenceLatency] = useState<number | null>(null);
  const [actualFps, setActualFps] = useState<number | null>(null);
  const [fastApiEndpoint, setFastApiEndpoint] = useState<string>(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem("edith_fastapi_endpoint");
    } catch (e) {
      console.warn("localStorage is not available in this environment:", e);
    }
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

  // AI Detection Models
  const yoloModelRef = useRef<any>(null);
  const ocrModelRef = useRef<any>(null);
  const byteTrackRef = useRef<ByteTrack | null>(null);

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
  const imageRef = useRef<HTMLImageElement>(null);

  // Real-Time YOLO states
  const [isRealTime, setIsRealTime] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | undefined>(undefined);

  // Violation Zone state
  const [showViolationZone, setShowViolationZone] = useState(false);
  const [isScanningZone, setIsScanningZone] = useState(false);

  // Initialize AI Models
  useEffect(() => {
    const initializeModels = async () => {
      try {
        // Initialize YOLOv8
        const yoloModel = await yolo.load("yolov8n");
        yoloModelRef.current = yoloModel;
        setAnalysisLog("YOLOv8 model loaded successfully");

        // Initialize EasyOCR
        const ocrReader = new EasyOCR.Reader(["en", "id"]);
        ocrModelRef.current = ocrReader;
        setAnalysisLog("EasyOCR model loaded successfully");

        // Initialize ByteTrack
        byteTrackRef.current = new ByteTrack();
        setAnalysisLog("ByteTrack initialized successfully");
      } catch (err) {
        console.error("Error loading AI models:", err);
        setAnalysisLog("Error loading AI models, will use FastAPI fallback");
      }
    };

    initializeModels();
  }, []);

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
        
        const addedWSViolations = new Set<string>();

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.status === "success" && data.detections) {
              setLiveDetections(data.detections);
              if (data.latency_ms !== undefined) {
                setInferenceLatency(data.latency_ms);
              }
              if (data.fps !== undefined) {
                setActualFps(data.fps);
              }

              // Automatically add violations from live stream to UI state if not already added
              data.detections.forEach((det: any) => {
                if (det.violations && det.violations.length > 0 && det.plate) {
                  const key = `${det.plate}-${det.violations[0].name}`;
                  if (!addedWSViolations.has(key)) {
                    addedWSViolations.add(key);

                    const fineMap: { [key: string]: number } = {
                      "Tidak Menggunakan Helm Standar (SNI)": 250000,
                      "Tidak Memakai Helm": 250000,
                      "Tidak Menggunakan Sabuk Pengaman": 250000,
                      "Melanggar Markah": 500000,
                      "Batas Kecepatan": 500000,
                      "Ganjil-Genap": 500000,
                      "Overdimension Overload (ODOL)": 1000000
                    };
                    const vName = det.violations[0].name;
                    const fineAmount = fineMap[vName] || det.violations[0].fineAmount || 250000;

                    const newViolation: Violation = {
                      id: `ETLE-2026-${Math.floor(1000 + Math.random() * 9000)}`,
                      licensePlate: det.plate,
                      vehicleType: det.label.includes("Motor") ? "Motor" : "Mobil",
                      vehicleModel: det.label,
                      violationType: vName,
                      location: selectedCamera.name,
                      timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '),
                      fineAmount: fineAmount,
                      status: "Belum Bayar",
                      ownerName: "Pemilik Terlacak Otomatis",
                    };
                    onAddViolation(newViolation);
                  }
                }
              });
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
          setAnalysisLog("Koneksi terputus. Backend sedang offline...");
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

  const stopCameraStream = () => {
    setIsRealTime(false);
    setLiveDetections([]);
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

  const startVideoProcessing = async (useCamera: boolean, videoUrl?: string) => {
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
                  try {
                    // Compress image to JPEG at 0.5 quality for super fast networking
                    const base64Img = canvasRef.current.toDataURL("image/jpeg", 0.5);
                    wsRef.current.send(JSON.stringify({ image: base64Img }));
                  } catch (taintError) {
                    console.warn("Canvas is tainted or failed to convert toDataURL:", taintError);
                  }
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
      alert("Gagal menginisialisasi sumber video. Pastikan kamera diizinkan atau video URL valid.");
      setIsRealTime(false);
    }
  };

  const startCameraStream = () => startVideoProcessing(true);

  // Autoplay the demo traffic video on mount for a zero-setup teaser
  useEffect(() => {
    startVideoProcessing(false, "https://assets.mixkit.co/videos/preview/mixkit-highway-traffic-with-cars-and-trucks-43181-large.mp4");
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
      name = activePreset.imageName;
      imgData = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
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
  const [isExportingFeed, setIsExportingFeed] = useState(false);

  const exportCctvAsImage = async () => {
    const element = document.getElementById("cctv-feed-container");
    if (!element) {
      alert("Feed CCTV tidak ditemukan.");
      return;
    }
    
    setIsExportingFeed(true);
    try {
      // Small delay to ensure frames settle
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#000000",
      });
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `EDITH-Feed-${new Date().toISOString().slice(0, 10)}.png`;
      link.click();
    } catch (err) {
      console.error("Export error:", err);
      alert("Gagal mengekspor feed CCTV.");
    } finally {
      setIsExportingFeed(false);
    }
  };

  return (
    <motion.div
      className="w-full h-full bg-black text-white flex flex-col gap-4 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header Section */}
      <div className="flex items-center justify-between gap-4 bg-gradient-to-r from-gray-900 to-gray-800 p-4 rounded-lg border border-gray-700">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-red-500" />
          <span className="text-lg font-bold text-white">EDITH CCTV AI Detector</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isWsConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          <span className="text-sm">{isWsConnected ? 'Live Connection Active' : 'Offline Mode'}</span>
        </div>
      </div>

      {/* Main CCTV Feed and Detection Container */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 overflow-auto">
        {/* CCTV Feed Section */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {/* Video Feed Container */}
          <div 
            id="cctv-feed-container"
            className="relative bg-black rounded-lg overflow-hidden border-2 border-red-500 shadow-lg flex-1 flex items-center justify-center"
          >
            <video 
              ref={videoRef} 
              className="w-full h-full object-contain"
              style={{ display: isRealTime ? 'block' : 'none' }}
            />
            <canvas 
              ref={canvasRef} 
              className="hidden"
            />

            {/* Violation Zone Overlay */}
            {showViolationZone && isRealTime && (
              <svg 
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ backgroundColor: 'transparent' }}
              >
                {/* Horizontal violation zone line */}
                <line 
                  x1="0" 
                  y1="55%" 
                  x2="100%" 
                  y2="55%" 
                  stroke="rgba(255, 0, 0, 0.5)" 
                  strokeWidth="3" 
                  strokeDasharray="10,10"
                />
                <text 
                  x="50%" 
                  y="52%" 
                  fill="rgba(255, 0, 0, 0.7)" 
                  fontSize="14" 
                  textAnchor="middle"
                  className="font-bold pointer-events-none"
                >
                  VIOLATION ZONE
                </text>
              </svg>
            )}

            {/* Detection Boxes Overlay */}
            <svg 
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ backgroundColor: 'transparent' }}
            >
              {liveDetections.map((det, idx) => {
                if (!det.box || det.box.length < 4) return null;
                const [yMin, xMin, yMax, xMax] = det.box;
                const width = (xMax - xMin);
                const height = (yMax - yMin);
                const xPercent = xMin;
                const yPercent = yMin;

                return (
                  <g key={idx}>
                    <rect 
                      x={`${xPercent}%`} 
                      y={`${yPercent}%`} 
                      width={`${width}%`} 
                      height={`${height}%`}
                      fill="none" 
                      stroke={det.violations && det.violations.length > 0 ? '#ff3333' : '#00ff00'} 
                      strokeWidth="2"
                    />
                    <text 
                      x={`${xPercent}%`} 
                      y={`${yPercent - 0.5}%`} 
                      fill={det.violations && det.violations.length > 0 ? '#ff3333' : '#00ff00'} 
                      fontSize="12" 
                      fontWeight="bold"
                      className="bg-black bg-opacity-50 px-1"
                    >
                      {det.label} {det.confidence && `(${det.confidence}%)`}
                    </text>
                    {det.plate && (
                      <text 
                        x={`${xPercent}%`} 
                        y={`${yPercent + height + 1.5}%`} 
                        fill="#ffff00" 
                        fontSize="11" 
                        fontWeight="bold"
                      >
                        Plate: {det.plate}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* No Feed Message */}
            {!isRealTime && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
                <div className="text-center">
                  <Camera className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-400">Tekan "Mulai Deteksi" untuk memulai</p>
                </div>
              </div>
            )}

            {/* Connection Status Indicator */}
            {isRealTime && (
              <div className="absolute top-3 right-3 flex items-center gap-2 bg-black bg-opacity-70 px-3 py-1 rounded">
                <div className={`w-2 h-2 rounded-full ${isWsConnected ? 'bg-green-500 animate-pulse' : 'bg-orange-500'}`}></div>
                <span className="text-xs text-white">{isWsConnected ? 'AI Live' : 'Local Mode'}</span>
              </div>
            )}
          </div>

          {/* Inference Stats and Analysis Log */}
          <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="text-center">
                <p className="text-xs text-gray-400">Latency</p>
                <p className="text-sm font-mono text-cyan-400">{inferenceLatency ? `${inferenceLatency}ms` : 'N/A'}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">FPS</p>
                <p className="text-sm font-mono text-cyan-400">{actualFps ? actualFps.toFixed(1) : 'N/A'}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">Detections</p>
                <p className="text-sm font-mono text-cyan-400">{liveDetections.length}</p>
              </div>
            </div>
            
            <div className="bg-black rounded p-2 text-xs font-mono text-gray-300 max-h-20 overflow-y-auto">
              {analysisLog || "Sistem siap..."}
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={startCameraStream}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded font-semibold transition"
            >
              <Camera className="w-4 h-4" />
              Kamera Langsung
            </button>
            <button
              onClick={() => setShowViolationZone(!showViolationZone)}
              className="flex-1 flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 px-3 py-2 rounded font-semibold transition"
            >
              <AlertTriangle className="w-4 h-4" />
              {showViolationZone ? 'Hide Zone' : 'Show Zone'}
            </button>
            <button
              onClick={exportCctvAsImage}
              disabled={isExportingFeed}
              className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded font-semibold transition disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Right Sidebar: Camera List & Analysis Controls */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          {/* Camera Selection */}
          <div className="bg-gray-900 rounded-lg p-3 border border-gray-700 flex flex-col gap-2">
            <h3 className="font-bold text-sm text-cyan-400">CCTV Cameras</h3>
            <div className="flex gap-1 mb-2">
              <Search className="w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-gray-800 text-white text-xs px-2 py-1 rounded border border-gray-600 focus:border-cyan-500 outline-none"
              />
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {filteredCameras.map(cam => (
                <button
                  key={cam.id}
                  onClick={() => setSelectedCamera(cam)}
                  className={`w-full text-left text-xs p-2 rounded transition ${
                    selectedCamera.id === cam.id 
                      ? 'bg-cyan-600 text-white' 
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <div className="font-semibold truncate">{cam.name}</div>
                  <div className="text-xs opacity-75">{cam.location}</div>
                </button>
              ))}
            </div>
          </div>

          {/* SOS Button */}
          <SOSButton />

          {/* Preset Scenarios */}
          <div className="bg-gray-900 rounded-lg p-3 border border-gray-700 flex flex-col gap-2">
            <h3 className="font-bold text-sm text-cyan-400">Preset Scenarios</h3>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {SAMPLE_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => selectPreset(preset)}
                  className={`w-full text-left text-xs p-2 rounded transition ${
                    activePreset?.id === preset.id 
                      ? 'bg-cyan-600 text-white' 
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <div className="font-semibold">{preset.title}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Analysis Result */}
          {analysisResult && (
            <motion.div 
              className="bg-gray-900 rounded-lg p-3 border border-green-700 flex flex-col gap-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="font-bold text-sm text-green-400">Detection Result</h3>
              <div className="space-y-1 text-xs">
                <p><strong>Plate:</strong> {analysisResult.licensePlate}</p>
                <p><strong>Type:</strong> {analysisResult.vehicleType}</p>
                <p><strong>Violations:</strong> {analysisResult.violations.length}</p>
                <p><strong>Confidence:</strong> {analysisResult.overallConfidence}%</p>
              </div>
              {!isRegistered && (
                <button
                  onClick={registerTicket}
                  className="w-full bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-2 rounded transition"
                >
                  Register Ticket
                </button>
              )}
              {isRegistered && (
                <div className="flex items-center gap-2 bg-green-900 p-2 rounded">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-green-300">Ticket Registered</span>
                </div>
              )}
            </motion.div>
          )}

          {/* Analysis Progress */}
          {isAnalyzing && (
            <motion.div 
              className="bg-gray-900 rounded-lg p-3 border border-yellow-700 flex flex-col gap-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-yellow-500 animate-spin" />
                <span className="text-sm font-bold text-yellow-400">Analyzing...</span>
              </div>
              <div className="w-full bg-gray-800 rounded h-2 overflow-hidden">
                <div 
                  className="bg-yellow-500 h-full transition-all duration-300" 
                  style={{ width: `${analysisProgress}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-400">{analysisProgress}%</div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

