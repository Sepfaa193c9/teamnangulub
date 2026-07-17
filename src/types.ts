export interface Violation {
  id: string; // Ticket Reference Number (e.g., ETLE-2026-9871)
  licensePlate: string; // Plat Nomor (e.g., B 1234 ABC)
  vehicleType: "Mobil" | "Motor" | "Truk" | "Bus";
  vehicleModel: string; // e.g., Toyota Avanza, Honda Beat
  violationType: string; // e.g., Tidak Pakai Helm, Menerobos Lampu Merah
  location: string; // e.g., Persimpangan Bundaran HI
  timestamp: string; // Date and time
  fineAmount: number; // in Rupiah (e.g., 250000)
  status: "Belum Bayar" | "Proses Banding" | "Lunas";
  imageUrl?: string; // Optional URL or base64 of vehicle capture
  ownerName?: string; // Optional owner name
  speedKmh?: number; // Optional speed reading
}

export interface CctvCamera {
  id: string;
  name: string;
  location: string;
  lat: number;
  lng: number;
  status: "Aktif" | "Gangguan" | "Pemeliharaan";
  ipAddress: string;
  violationsCount24h: number;
  feedType: "helmet" | "speed" | "phone" | "red_light" | "normal";
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: string;
}

export interface AnalysisResult {
  vehicleType: string;
  licensePlate: string;
  violations: Array<{
    name: string;
    pasal: string;
    fineAmount: number;
    confidence: number;
  }>;
  overallConfidence: number;
  boundingBoxes?: Array<{
    label: string;
    box: [number, number, number, number]; // [yMin, xMin, yMax, xMax]
  }>;
  visualDescription: string;
  isOffline?: boolean;
}
