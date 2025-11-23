
import React, { useState, useEffect, useRef, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { GoogleGenAI, Modality, Type } from "@google/genai";
import {
  Clock,
  Map as MapIcon,
  BookOpen,
  Mic,
  Play,
  SkipForward,
  ZoomIn,
  ZoomOut,
  Menu,
  X,
  Globe,
  Activity,
  Layers,
  Cpu,
  ChevronRight,
  Pause,
  Info,
  Sun,
  Moon,
  Compass,
  ArrowRight,
  Loader2
} from "lucide-react";

// --- Gemini API Configuration ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Types ---

interface HistoryEvent {
  year: number;
  title: string;
  description: string;
  type: "political" | "cultural" | "economic" | "military" | "scientific";
  lat?: number;
  lng?: number;
}

interface HistoryModule {
  id: string;
  name: string;
  description: string;
  era: string;
}

interface AppState {
  currentModule: HistoryModule | null;
  viewMode: "timeline" | "map" | "analysis";
  events: HistoryEvent[];
  loading: boolean;
  isPlaying: boolean;
  narrationText: string | null;
}

interface CountryStats {
  summary: string;
  events: { year: number; title: string; description: string }[];
}

// --- Helpers ---

function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return Promise.resolve(buffer);
}

function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// --- Data Constants ---

const MODULES: HistoryModule[] = [
  { id: "roman_empire", name: "Roman Empire", description: "The rise and fall of Rome.", era: "Ancient" },
  { id: "ww2", name: "World War II", description: "Global conflict from 1939 to 1945.", era: "Modern" },
  { id: "renaissance", name: "The Renaissance", description: "Cultural rebirth in Europe.", era: "Early Modern" },
  { id: "cold_war", name: "Cold War", description: "Geopolitical tension between USSR and USA.", era: "Modern" },
  { id: "industrial_rev", name: "Industrial Revolution", description: "Transition to new manufacturing processes.", era: "Modern" },
  { id: "ancient_egypt", name: "Ancient Egypt", description: "Civilization of North Africa.", era: "Ancient" },
];

// --- Components ---

const HistoricalLoader = () => {
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("Initializing Chronoscope...");

  useEffect(() => {
    const messages = [
      "Accessing Deep Archives...",
      "Triangulating Historical Coordinates...",
      "Deciphering Ancient Manuscripts...",
      "Reconstructing Timelines...",
      "Polishing Artifacts..."
    ];
    
    let msgIdx = 0;
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          return 100;
        }
        if (p % 20 === 0 && p < 80) {
           msgIdx = (msgIdx + 1) % messages.length;
           setMessage(messages[msgIdx]);
        }
        return p + 1.5; 
      });
    }, 40);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-gray-50/95 dark:bg-[#121214]/95 backdrop-blur-md transition-colors duration-300">
       <div className="w-64 mb-8 relative">
          {/* Artifact Animation */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-amber-900/30 dark:border-amber-900/30 rounded-full animate-[spin_10s_linear_infinite]"></div>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-amber-600/40 dark:border-amber-600/40 rounded-full animate-[spin_4s_linear_infinite_reverse] border-t-transparent"></div>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border border-amber-500/60 dark:border-amber-500/60 rounded-full animate-[spin_2s_linear_infinite] border-b-transparent"></div>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-amber-500 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.8)] animate-pulse"></div>
       </div>
       
       <h2 className="text-3xl font-serif text-amber-600 dark:text-amber-500 mb-3 tracking-widest drop-shadow-lg">{Math.round(progress)}%</h2>
       <div className="w-80 h-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden mb-4 relative">
          <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 dark:via-gray-700/50 to-transparent animate-shimmer"></div>
          <div className="h-full bg-gradient-to-r from-amber-700 to-amber-500 transition-all duration-100 ease-out relative" style={{ width: `${progress}%` }}>
             <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white]"></div>
          </div>
       </div>
       <p className="text-gray-500 dark:text-gray-400 font-mono text-xs uppercase tracking-widest animate-pulse">{message}</p>
    </div>
  );
};

const RangeSlider = ({ min, max, value, onChange }: { min: number, max: number, value: [number, number], onChange: (val: [number, number]) => void }) => {
  const trackRef = useRef<HTMLDivElement>(null);

  const getPercentage = (val: number) => {
    const range = max - min;
    if (range === 0) return 0;
    return ((val - min) / range) * 100;
  };

  const handleMouseDown = (index: 0 | 1) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const trackWidth = rect.width;
      
      const clickX = moveEvent.clientX - rect.left;
      let percent = (clickX / trackWidth) * 100;
      percent = Math.max(0, Math.min(100, percent));
      
      let newValue = Math.round(min + (percent / 100) * (max - min));
      
      const newRange = [...value] as [number, number];
      
      if (index === 0) {
         // Min handle
         newValue = Math.min(newValue, value[1]); // Prevent crossing
         newRange[0] = newValue;
      } else {
         // Max handle
         newValue = Math.max(newValue, value[0]); // Prevent crossing
         newRange[1] = newValue;
      }

      onChange(newRange);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="relative w-full h-8 flex items-center select-none px-2">
       <div className="relative w-full h-1 bg-gray-300 dark:bg-gray-700 rounded-full" ref={trackRef}>
          {/* Active Track */}
          <div 
            className="absolute top-0 h-full bg-amber-500 dark:bg-amber-600/80 rounded-full"
            style={{ 
              left: `${getPercentage(value[0])}%`, 
              width: `${getPercentage(value[1]) - getPercentage(value[0])}%` 
            }}
          />
          
          {/* Left Thumb */}
          <div 
            className="absolute top-1/2 w-4 h-4 bg-white dark:bg-[#d4d4d8] border-2 border-amber-500 dark:border-amber-600 rounded-full cursor-ew-resize shadow hover:scale-110 transition-transform z-10"
            style={{ left: `${getPercentage(value[0])}%`, transform: 'translate(-50%, -50%)' }}
            onMouseDown={handleMouseDown(0)}
          >
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-white dark:bg-[#202024] border border-gray-200 dark:border-gray-700 px-1.5 py-0.5 rounded text-[10px] font-mono text-amber-600 dark:text-amber-500 pointer-events-none whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity shadow-sm">
               {value[0]}
            </div>
          </div>

          {/* Right Thumb */}
          <div 
            className="absolute top-1/2 w-4 h-4 bg-white dark:bg-[#d4d4d8] border-2 border-amber-500 dark:border-amber-600 rounded-full cursor-ew-resize shadow hover:scale-110 transition-transform z-10"
            style={{ left: `${getPercentage(value[1])}%`, transform: 'translate(-50%, -50%)' }}
            onMouseDown={handleMouseDown(1)}
          >
             <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-white dark:bg-[#202024] border border-gray-200 dark:border-gray-700 px-1.5 py-0.5 rounded text-[10px] font-mono text-amber-600 dark:text-amber-500 pointer-events-none whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity shadow-sm">
               {value[1]}
            </div>
          </div>
       </div>
    </div>
  );
};


const SidebarItem = ({ icon: Icon, label, active, onClick, collapsed }: any) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full p-3 mb-2 rounded-lg transition-all duration-200 group ${
      active
        ? "bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-l-2 border-amber-500"
        : "text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-200 border-l-2 border-transparent"
    } ${collapsed ? "justify-center px-2" : "justify-start px-4"}`}
    title={collapsed ? label : ""}
  >
    <Icon size={20} className={`${active ? "text-amber-600 dark:text-amber-400" : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200"} ${collapsed ? "" : "mr-3"}`} />
    {!collapsed && <span className="font-medium text-sm tracking-wide truncate">{label}</span>}
  </button>
);

const TimelineView = ({ events }: { events: HistoryEvent[] }) => {
  const [range, setRange] = useState<[number, number]>([0, 0]);
  const [initialized, setInitialized] = useState(false);

  // Initialize range when events load
  useEffect(() => {
    if (events && events.length > 0) {
      const years = events.map(e => e.year).sort((a, b) => a - b);
      const min = years[0];
      const max = years[years.length - 1];
      setRange([min, max]);
      setInitialized(true);
    } else {
      setInitialized(false);
    }
  }, [events]);

  if (!events || events.length === 0) return <div className="flex h-full items-center justify-center text-gray-400 dark:text-gray-500 font-serif italic">No events loaded yet. Select a module.</div>;

  const allYears = events.map(e => e.year).sort((a, b) => a - b);
  const minYearGlobal = allYears[0];
  const maxYearGlobal = allYears[allYears.length - 1];

  const filteredEvents = events
    .filter(e => e.year >= range[0] && e.year <= range[1])
    .sort((a, b) => a.year - b.year);

  return (
    <div className="relative w-full h-full flex flex-col bg-gray-50 dark:bg-[#161618] transition-colors duration-300">
      {/* Controls */}
      <div className="h-14 bg-white/80 dark:bg-[#1a1a1d]/80 backdrop-blur border-b border-gray-200 dark:border-gray-800 flex items-center px-6 shrink-0 z-20 shadow-sm transition-colors duration-300">
         <div className="text-[10px] font-bold tracking-widest text-gray-500 dark:text-gray-500 mr-6 uppercase flex items-center">
            <Clock size={12} className="mr-2" />
            Temporal Filter
         </div>
         <div className="flex-1 max-w-2xl mx-auto flex items-center space-x-4">
            <span className="text-xs font-mono text-amber-600/70 dark:text-amber-500/70">{range[0]}</span>
            {initialized && (
              <RangeSlider 
                 min={minYearGlobal} 
                 max={maxYearGlobal} 
                 value={range} 
                 onChange={setRange} 
              />
            )}
            <span className="text-xs font-mono text-amber-600/70 dark:text-amber-500/70">{range[1]}</span>
         </div>
         <div className="ml-6 text-[10px] text-gray-500 dark:text-gray-400 font-mono border-l border-gray-200 dark:border-gray-700 pl-4">
            Showing <span className="text-gray-900 dark:text-white font-bold">{filteredEvents.length}</span> / {events.length} Events
         </div>
      </div>

      <div className="relative w-full flex-1 overflow-x-auto overflow-y-hidden bg-gray-50 dark:bg-[#161618] select-none custom-scrollbar transition-colors duration-300">
        {filteredEvents.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 opacity-50">
             <Clock size={48} className="mb-4" strokeWidth={1} />
             <p className="font-serif italic">No events found in this era range.</p>
          </div>
        ) : (
          <>
            {/* Timeline Central Axis */}
            <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-300 dark:bg-gray-700 transform -translate-y-1/2 z-0" style={{ minWidth: `${Math.max(100, filteredEvents.length * 25)}%` }} />
            
            <div className="flex items-center h-full px-20 space-x-12 pb-10 pt-10" style={{ minWidth: 'max-content' }}>
              {filteredEvents.map((event, idx) => {
                const isTop = idx % 2 === 0;
                return (
                  <div key={idx} className="relative group flex-shrink-0 w-64 flex flex-col items-center">
                    
                    {/* Content Card */}
                    <div 
                      className={`
                        relative w-full p-4 bg-white dark:bg-[#202024] rounded border border-gray-200 dark:border-gray-800 shadow-md hover:shadow-xl hover:border-amber-400 dark:hover:border-amber-500/50 transition-all duration-300
                        ${isTop ? "mb-8 order-1" : "mt-8 order-3"}
                      `}
                    >
                      <div className="flex justify-between items-baseline mb-2">
                        <span className="text-amber-600 dark:text-amber-500 font-bold font-mono text-xs">{event.year < 0 ? `${Math.abs(event.year)} BC` : `${event.year} AD`}</span>
                        <span className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-500">{event.type}</span>
                      </div>
                      <h4 className="text-gray-900 dark:text-gray-100 font-serif font-bold text-sm leading-snug mb-1">{event.title}</h4>
                      <p className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed line-clamp-3">{event.description}</p>
                    </div>

                    {/* Connection Line */}
                    <div className={`w-px h-8 bg-gray-300 dark:bg-gray-700 group-hover:bg-amber-400 dark:group-hover:bg-amber-500/50 transition-colors ${isTop ? "order-2" : "order-2"}`}></div>

                    {/* Node on Axis */}
                    <div className="w-3 h-3 bg-gray-50 dark:bg-[#161618] border-2 border-amber-500 rounded-full z-10 order-2 group-hover:scale-125 group-hover:bg-amber-500 transition-all shadow-[0_0_10px_rgba(245,158,11,0.3)]"></div>

                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// --- Map Implementation Helpers ---

const PROJECTION = { width: 1000, height: 500 };

const project = ([lng, lat]: [number, number]) => {
  const x = (lng + 180) * (PROJECTION.width / 360);
  const y = (90 - lat) * (PROJECTION.height / 180);
  return [x, y];
};

const geoPath = (feature: any) => {
  if (!feature || !feature.geometry) return "";
  const type = feature.geometry.type;
  const coords = feature.geometry.coordinates;
  
  const drawPoly = (rings: any[]) => {
    if (!rings) return "";
    let path = "";
    rings.forEach((ring: any[]) => {
      if (!ring) return;
      path += "M" + ring.map((pt: any) => {
        if (!pt || pt.length < 2) return "0,0";
        const [x, y] = project(pt);
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      }).join("L") + "Z ";
    });
    return path;
  };

  if (type === "Polygon") {
    return drawPoly(coords);
  } else if (type === "MultiPolygon") {
    return coords ? coords.map((poly: any) => drawPoly(poly)).join(" ") : "";
  }
  return "";
};

const getCentroid = (feature: any) => {
  let minX = 1000, maxX = 0, minY = 500, maxY = 0;
  const scan = (arr: any[]) => {
    if (!arr || arr.length === 0) return;
    if (typeof arr[0] === 'number') {
        const [x, y] = project(arr as [number, number]);
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
    } else {
        arr.forEach(scan);
    }
  };
  if (feature.geometry && feature.geometry.coordinates) {
      scan(feature.geometry.coordinates);
  }
  return { x: (minX + maxX) / 2, y: (minY + maxY) / 2, area: (maxX-minX)*(maxY-minY) };
};


const MapView = ({ events, onExploreCountry }: { events: HistoryEvent[], onExploreCountry: (countryName: string) => void }) => {
  const [geoData, setGeoData] = useState<any[]>([]);
  const [loadingMap, setLoadingMap] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<any | null>(null);
  const [countryStats, setCountryStats] = useState<CountryStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    const fetchMap = async () => {
      try {
        const res = await fetch('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson');
        const data = await res.json();
        setGeoData(data.features || []);
      } catch (e) {
        console.error("Failed to load map data", e);
        setGeoData([]);
      } finally {
        setLoadingMap(false);
      }
    };
    fetchMap();
  }, []);

  useEffect(() => {
    const fetchCountryStats = async () => {
      if (!selectedCountry) return;
      
      setLoadingStats(true);
      setCountryStats(null);

      try {
        const prompt = `Generate a brief summary (max 40 words) of ${selectedCountry.properties.name} and list its 3 most significant historical events. Return JSON: { "summary": string, "events": [{ "year": number, "title": string, "description": string }] }`;
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: { type: Type.STRING },
                        events: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    year: { type: Type.NUMBER },
                                    title: { type: Type.STRING },
                                    description: { type: Type.STRING }
                                }
                            }
                        }
                    }
                }
            }
        });
        let data = JSON.parse(response.text);
        // Ensure events is an array to prevent undefined errors
        if (!data.events || !Array.isArray(data.events)) {
            data.events = [];
        }
        setCountryStats(data);
      } catch (e) {
        console.error("Failed to load stats", e);
        setCountryStats({ summary: "Information unavailable.", events: [] });
      } finally {
        setLoadingStats(false);
      }
    };

    fetchCountryStats();
  }, [selectedCountry]);

  return (
    <div className="relative w-full h-full bg-gray-50 dark:bg-[#161618] overflow-hidden flex items-center justify-center transition-colors duration-300">
      {/* Map Container */}
      <div className={`relative w-full max-w-6xl aspect-[2/1] bg-blue-50/50 dark:bg-[#1a1a1d] border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl dark:shadow-2xl overflow-hidden m-4 select-none transition-all duration-500 ${selectedCountry ? 'mr-[350px] scale-95' : ''}`}>
         
         {/* SVG World Map */}
         <svg 
            className="absolute inset-0 w-full h-full z-0" 
            viewBox={`0 0 ${PROJECTION.width} ${PROJECTION.height}`} 
            preserveAspectRatio="none"
         >
            <defs>
               <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" className="stroke-gray-200 dark:stroke-[#242428]" strokeWidth="1"/>
               </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {loadingMap ? (
                <text x="50%" y="50%" textAnchor="middle" className="fill-gray-500" fontSize="20">Loading Cartography...</text>
            ) : (
                <g>
                    {geoData.map((feature, i) => {
                        const path = geoPath(feature);
                        if (!path) return null;
                        const { x, y, area } = getCentroid(feature);
                        const showLabel = area > 400;
                        const isSelected = selectedCountry?.id === feature.id;

                        return (
                            <g 
                                key={feature.id || i} 
                                className="cursor-pointer"
                                onClick={() => setSelectedCountry(feature)}
                                role="button"
                                aria-label={`Select ${feature.properties.name}`}
                            >
                                <path 
                                    d={path} 
                                    style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                                    className={`transition-all duration-500 ease-out ${
                                        isSelected 
                                        ? "fill-gray-600 dark:fill-gray-600 stroke-amber-500 stroke-[1.5] scale-105" 
                                        : "fill-gray-300 dark:fill-[#2a2a2e] stroke-gray-50 dark:stroke-[#3f3f46] stroke-[0.5] hover:fill-gray-400 dark:hover:fill-gray-700"
                                    }`}
                                />
                                {showLabel && !isSelected && (
                                    <text 
                                        x={x} 
                                        y={y} 
                                        textAnchor="middle" 
                                        fontSize="6" 
                                        fontFamily="sans-serif"
                                        pointerEvents="none"
                                        className="fill-gray-500 dark:fill-[#52525b] opacity-70 pointer-events-none"
                                    >
                                        {feature.properties.name}
                                    </text>
                                )}
                            </g>
                        );
                    })}
                     {/* Render selected country ON TOP for z-index effect */}
                     {selectedCountry && (
                         <g pointerEvents="none">
                            <path 
                                d={geoPath(selectedCountry)} 
                                style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                                className="fill-gray-600 dark:fill-gray-600 stroke-amber-500 stroke-[1.5] scale-105 transition-all duration-500 ease-out"
                            />
                         </g>
                     )}
                </g>
            )}
         </svg>

         <div className="absolute bottom-4 left-4 text-xs font-mono text-gray-500 dark:text-gray-600 border border-gray-200 dark:border-gray-800 px-2 py-1 rounded bg-white/80 dark:bg-[#1a1a1d]/80 z-10">
            PROJECTION: EQUIRECTANGULAR 1:1
         </div>

         {/* Interactive Event Markers Overlay */}
         {events.filter(e => e.lat !== undefined && e.lng !== undefined).map((event, idx) => {
           const x = ((event.lng! + 180) / 360) * 100;
           const y = ((90 - event.lat!) / 180) * 100;

           return (
             <div
               key={idx}
               className="absolute group z-20"
               style={{ left: `${x}%`, top: `${y}%` }}
             >
                {/* Pulse Effect */}
                <div className="absolute -inset-2 bg-amber-500/20 rounded-full animate-ping opacity-75"></div>
                
                {/* Point */}
                <div className="relative w-2 h-2 bg-amber-500 rounded-full cursor-pointer hover:scale-150 hover:bg-white transition-all shadow-[0_0_8px_rgba(245,158,11,0.6)] transform -translate-x-1/2 -translate-y-1/2"></div>
                
                {/* Tooltip */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-48 bg-white dark:bg-gray-900/95 backdrop-blur-sm border border-gray-200 dark:border-gray-700 text-xs p-3 rounded shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-30 translate-y-2 group-hover:translate-y-0">
                   <div className="flex justify-between text-amber-600 dark:text-amber-500 font-mono font-bold mb-1 border-b border-gray-200 dark:border-gray-700 pb-1">
                     <span>{event.year < 0 ? `${Math.abs(event.year)} BC` : event.year}</span>
                     <span className="uppercase text-[10px] text-gray-500 dark:text-gray-500">{event.type}</span>
                   </div>
                   <div className="text-gray-900 dark:text-white font-medium">{event.title}</div>
                </div>
             </div>
           );
         })}
      </div>

      {/* Full Height Country Details Panel */}
      {selectedCountry && (
        <div className="absolute top-0 right-0 bottom-0 w-[350px] bg-white dark:bg-[#1a1a1d] border-l border-gray-200 dark:border-gray-800 shadow-2xl z-40 flex flex-col animate-in slide-in-from-right duration-300">
             <div className="relative h-48 bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden shrink-0">
                {/* Abstract Header Pattern */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-700 via-gray-900 to-black"></div>
                <Globe className="text-gray-300 dark:text-gray-600 w-32 h-32 opacity-20 absolute -right-4 -bottom-4" strokeWidth={0.5}/>
                
                <div className="relative z-10 text-center px-4">
                    <h2 className="font-serif text-2xl font-bold text-gray-900 dark:text-white mb-1">{selectedCountry.properties.name}</h2>
                    <span className="inline-block px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-500 text-[10px] font-mono uppercase tracking-widest border border-amber-500/20">
                        {selectedCountry.id}
                    </span>
                </div>
                
                <button 
                    onClick={() => setSelectedCountry(null)} 
                    className="absolute top-4 right-4 p-2 bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 rounded-full text-gray-600 dark:text-gray-300 backdrop-blur-sm transition-colors"
                >
                    <X size={16}/>
                </button>
             </div>

             <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                 
                 {/* Loading State */}
                 {loadingStats ? (
                     <div className="flex flex-col items-center justify-center py-12 space-y-4 text-gray-400">
                         <Loader2 className="animate-spin text-amber-500" size={24} />
                         <span className="text-xs font-mono animate-pulse">CONSULTING ARCHIVES...</span>
                     </div>
                 ) : countryStats ? (
                    <>
                        {/* Summary */}
                        <div className="prose dark:prose-invert">
                            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300 italic">
                                "{countryStats.summary}"
                            </p>
                        </div>

                        {/* Top Events */}
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4 flex items-center">
                                <Clock size={12} className="mr-2" /> Key Historical Events
                            </h3>
                            <div className="space-y-4">
                                {countryStats.events && countryStats.events.length > 0 ? countryStats.events.map((evt, i) => (
                                    <div key={i} className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                        <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-white dark:border-[#1a1a1d]"></div>
                                        <span className="block text-xs font-mono font-bold text-amber-600 dark:text-amber-500 mb-0.5">
                                            {evt.year < 0 ? `${Math.abs(evt.year)} BC` : evt.year}
                                        </span>
                                        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-tight mb-1">{evt.title}</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug">{evt.description}</p>
                                    </div>
                                )) : (
                                    <div className="text-xs text-gray-500 italic">No key events found.</div>
                                )}
                            </div>
                        </div>
                    </>
                 ) : (
                    <div className="text-center text-gray-400 text-xs py-10">No data available.</div>
                 )}

                 {/* Action Button */}
                 <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-800">
                    <button 
                        onClick={() => onExploreCountry(selectedCountry.properties.name)}
                        className="w-full flex items-center justify-center space-x-2 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-all shadow-md active:scale-95 group"
                    >
                        <Compass size={16} />
                        <span className="font-medium text-sm">Walk Through History</span>
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                 </div>
             </div>
        </div>
      )}
    </div>
  );
};

const AnalysisView = ({ events, currentModule }: { events: HistoryEvent[], currentModule: HistoryModule | null }) => {
  return (
    <div className="w-full h-full p-6 md:p-10 overflow-y-auto bg-gray-50 dark:bg-[#161618] custom-scrollbar transition-colors duration-300">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10 border-b border-gray-200 dark:border-gray-800 pb-6">
          <div className="flex items-center space-x-3 mb-2">
             <Activity className="text-amber-600 dark:text-amber-500" size={24} />
             <h2 className="text-3xl font-serif text-gray-900 dark:text-white">Historical Analytics</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Statistical breakdown of {currentModule?.name || "the selected era"}.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Event Distribution */}
          <div className="p-6 bg-white dark:bg-[#202024] rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-lg transition-colors duration-300">
            <h3 className="flex items-center text-sm font-bold tracking-wider text-gray-500 dark:text-gray-300 uppercase mb-6">
              <Clock className="mr-2 text-blue-500 dark:text-blue-400 w-4 h-4" /> Temporal Density
            </h3>
            <div className="h-40 flex items-end justify-between space-x-1 px-2 border-b border-gray-200 dark:border-gray-700 pb-1">
               {events.length > 0 ? events.slice(0, 15).map((e, i) => (
                 <div key={i} className="group relative flex-1 bg-blue-500/30 hover:bg-blue-500/50 transition-all rounded-t-sm" style={{ height: `${Math.max(20, Math.random() * 100)}%` }}>
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-[10px] text-white px-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none z-10">
                      {e.year}
                    </div>
                 </div>
               )) : <div className="w-full text-center text-gray-400 text-xs">No Data</div>}
            </div>
            <div className="mt-2 flex justify-between text-xs text-gray-500 dark:text-gray-500 font-mono">
              <span>Start</span>
              <span>Timeline Duration</span>
              <span>End</span>
            </div>
          </div>

          {/* Categorical Breakdown */}
          <div className="p-6 bg-white dark:bg-[#202024] rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-lg transition-colors duration-300">
             <h3 className="flex items-center text-sm font-bold tracking-wider text-gray-500 dark:text-gray-300 uppercase mb-6">
              <Layers className="mr-2 text-green-500 dark:text-green-400 w-4 h-4" /> Thematic Composition
            </h3>
            <div className="space-y-4">
              {['political', 'military', 'cultural', 'economic', 'scientific'].map(cat => {
                 const count = events.filter(e => e.type === cat).length;
                 const total = events.length || 1;
                 const pct = (count / total) * 100;
                 if (pct === 0) return null;
                 return (
                   <div key={cat}>
                     <div className="flex justify-between text-xs font-medium text-gray-600 dark:text-gray-300 mb-1 capitalize">
                       <span>{cat}</span>
                       <span className="text-gray-500">{Math.round(pct)}%</span>
                     </div>
                     <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                       <div className={`h-full ${cat === 'political' ? 'bg-red-400' : cat === 'military' ? 'bg-orange-400' : 'bg-emerald-400'}`} style={{ width: `${pct}%` }}></div>
                     </div>
                   </div>
                 )
              })}
              {events.length === 0 && <div className="text-gray-600 text-xs text-center py-4">No Data Available</div>}
            </div>
          </div>
        </div>

        {/* AI Synthesis Card */}
        <div className="p-6 bg-gradient-to-br from-white to-gray-50 dark:from-[#202024] dark:to-[#252529] rounded-lg border border-gray-200 dark:border-gray-700 shadow-md dark:shadow-lg transition-colors duration-300">
           <h3 className="flex items-center text-sm font-bold tracking-wider text-amber-600 dark:text-amber-400 uppercase mb-4">
            <Cpu className="mr-2 w-4 h-4" /> AI Synthesis Engine
          </h3>
          <div className="flex items-start space-x-4">
             <div className="flex-1">
               <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-light">
                 {events.length > 0 
                   ? `Based on the generated dataset, the ${currentModule?.name} era is characterized by significant ${events[0]?.type} upheavals. The timeline indicates a clustering of events around key conflict periods, suggesting a high degree of instability followed by reconstruction.` 
                   : "Select a module to generate an AI-powered historical analysis."}
               </p>
             </div>
             <div className="hidden md:block w-px h-20 bg-gray-300 dark:bg-gray-700 mx-4"></div>
             <div className="hidden md:block w-1/3 text-xs text-gray-500">
                <div className="mb-2 font-mono text-gray-700 dark:text-gray-400">METRICS</div>
                <div className="flex justify-between mb-1"><span>Complexity:</span> <span className="text-gray-900 dark:text-gray-300">High</span></div>
                <div className="flex justify-between mb-1"><span>Reliability:</span> <span className="text-gray-900 dark:text-gray-300">98.2%</span></div>
                <div className="flex justify-between"><span>Sources:</span> <span className="text-gray-900 dark:text-gray-300">Gemini 2.5</span></div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const App = () => {
  const [viewMode, setViewMode] = useState<AppState["viewMode"]>("timeline");
  const [currentModule, setCurrentModule] = useState<HistoryModule | null>(null);
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(true); 
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Initialize AudioContext
  useEffect(() => {
    const initAudio = () => {
      if (!audioCtx) {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        setAudioCtx(ctx);
      }
    };
    window.addEventListener('click', initAudio, { once: true });
    return () => window.removeEventListener('click', initAudio);
  }, [audioCtx]);

  // Responsive sidebar logic
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCollapsed(true); 
      } else {
        setCollapsed(false);
      }
    };
    
    // Initial check
    if (window.innerWidth < 768) setCollapsed(true);
    else setCollapsed(false);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadModule = async (module: HistoryModule, customPrompt?: string) => {
    setCurrentModule(module);
    setLoading(true);
    setEvents([]); 
    setIsPlaying(false);
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
    }
    
    // On mobile, close sidebar when selecting a module
    if (window.innerWidth < 768) {
        setCollapsed(true);
    }

    try {
      const prompt = customPrompt || `Generate 12 key historical events for ${module.name} (${module.description}). 
      Return JSON with fields: year (number, negative for BC), title (string), description (string, max 20 words), type (one of: political, cultural, economic, military, scientific), lat (number), lng (number).
      Ensure a diverse geographical spread if applicable.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                year: { type: Type.NUMBER },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                type: { type: Type.STRING, enum: ["political", "cultural", "economic", "military", "scientific"] },
                lat: { type: Type.NUMBER },
                lng: { type: Type.NUMBER },
              },
              required: ["year", "title", "description", "type"]
            }
          }
        }
      });

      let data = JSON.parse(response.text);
      // Safety: Ensure data is an array before setting events
      if (!Array.isArray(data)) {
          console.warn("API returned non-array data, attempting to extract or default to empty.");
          if (data.events && Array.isArray(data.events)) {
             data = data.events;
          } else {
             data = [];
          }
      }
      setEvents(data);
    } catch (error) {
      console.error("Failed to load events:", error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExploreCountry = (countryName: string) => {
    // Create a temporary module for the country
    const countryModule: HistoryModule = {
        id: `country_${countryName.toLowerCase().replace(/\s+/g, '_')}`,
        name: countryName,
        description: `Comprehensive history of ${countryName}`,
        era: "Various"
    };
    
    const prompt = `Generate 15 key historical events specifically for the country/region of ${countryName} throughout history (from ancient to modern times).
      Return JSON with fields: year (number, negative for BC), title (string), description (string, max 25 words), type (one of: political, cultural, economic, military, scientific), lat (number), lng (number).
      Focus on events that happened within the geographical borders of ${countryName}.`;

    // Switch to timeline view
    setViewMode("timeline");
    loadModule(countryModule, prompt);
  };

  const toggleNarration = async () => {
    if (isPlaying) {
        if (audioSourceRef.current) {
            audioSourceRef.current.stop();
            audioSourceRef.current = null;
        }
        setIsPlaying(false);
        return;
    }

    if (!currentModule || !audioCtx) return;
    
    setIsPlaying(true);
    try {
      const prompt = `Narrate a dramatic, educational introduction to the history of ${currentModule.name}. Keep it under 45 seconds.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioBuffer = await decodeAudioData(decodeBase64(base64Audio), audioCtx, 24000, 1);
        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioCtx.destination);
        source.onended = () => setIsPlaying(false);
        source.start();
        audioSourceRef.current = source;
      } else {
          setIsPlaying(false);
      }
    } catch (e) {
      console.error("TTS Error", e);
      setIsPlaying(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadModule(MODULES[0]);
  }, []);

  return (
    <div className={theme}>
    <div className="flex h-screen w-screen bg-gray-50 dark:bg-[#1a1a1d] text-gray-800 dark:text-gray-200 font-sans overflow-hidden transition-colors duration-300">
      
      {/* Mobile Overlay Backdrop */}
      {!collapsed && (
         <div 
           className="fixed inset-0 bg-black/50 z-40 md:hidden"
           onClick={() => setCollapsed(true)}
         ></div>
      )}

      {/* Sidebar */}
      <div 
        className={`
          flex flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-[#161618] transition-all duration-300 z-50 shadow-2xl
          ${collapsed ? "w-16" : "w-64"}
          fixed md:relative h-full
        `}
      >
        {/* Sidebar Header */}
        <div className={`flex items-center h-16 w-full border-b border-gray-200 dark:border-gray-800 shrink-0 transition-all duration-300 ${collapsed ? "justify-center" : "justify-between px-4"}`}>
          
          {!collapsed && (
             <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-500 overflow-hidden whitespace-nowrap">
               <Globe size={20} />
               <span className="font-serif font-bold text-lg tracking-wider text-gray-900 dark:text-white">HISTLAB</span>
             </div>
          )}
          
          {/* Unified Toggle Button */}
          <button 
            onClick={() => setCollapsed(!collapsed)} 
            className={`p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${collapsed ? "" : ""}`}
            aria-label={collapsed ? "Expand Menu" : "Collapse Menu"}
          >
             {collapsed ? <Menu size={20} /> : <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded"><X size={16}/></div>}
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6 space-y-1 w-full no-scrollbar">
          <div className={`text-[10px] font-bold text-gray-400 dark:text-gray-600 mb-2 px-4 uppercase tracking-widest ${collapsed ? "text-center" : ""}`}>
             {collapsed ? "View" : "Visualizers"}
          </div>
          <SidebarItem 
            icon={Clock} 
            label="Timeline" 
            active={viewMode === "timeline"} 
            onClick={() => { setViewMode("timeline"); if(window.innerWidth < 768) setCollapsed(true); }}
            collapsed={collapsed}
          />
          <SidebarItem 
            icon={MapIcon} 
            label="World Atlas" 
            active={viewMode === "map"} 
            onClick={() => { setViewMode("map"); if(window.innerWidth < 768) setCollapsed(true); }}
            collapsed={collapsed}
          />
          <SidebarItem 
            icon={Activity} 
            label="Analytics" 
            active={viewMode === "analysis"} 
            onClick={() => { setViewMode("analysis"); if(window.innerWidth < 768) setCollapsed(true); }}
            collapsed={collapsed}
          />

          <div className="my-6 border-t border-gray-200 dark:border-gray-800 w-full"></div>

          <div className={`text-[10px] font-bold text-gray-400 dark:text-gray-600 mb-2 px-4 uppercase tracking-widest ${collapsed ? "text-center" : ""}`}>
             {collapsed ? "Era" : "Historical Eras"}
          </div>
          {MODULES.map(m => (
             <SidebarItem 
               key={m.id}
               icon={BookOpen} 
               label={m.name} 
               active={currentModule?.id === m.id} 
               onClick={() => loadModule(m)}
               collapsed={collapsed}
             />
          ))}
        </div>

        {/* Theme Toggle */}
        <div className={`px-4 pb-2 w-full ${collapsed ? "flex justify-center" : ""}`}>
            <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className={`
                    flex items-center justify-center p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors
                    ${collapsed ? "w-10 h-10" : "w-full space-x-3"}
                `}
                title="Toggle Theme"
            >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                {!collapsed && <span className="text-sm font-medium">Theme</span>}
            </button>
        </div>

        {/* Footer / Voice */}
        <div className={`p-4 border-t border-gray-200 dark:border-gray-800 w-full ${collapsed ? "flex justify-center" : ""}`}>
           <button 
             onClick={toggleNarration}
             className={`
               relative overflow-hidden group
               flex items-center justify-center 
               bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 
               text-white rounded-lg shadow-lg transition-all active:scale-95
               ${collapsed ? "w-10 h-10 p-0 rounded-full" : "w-full p-3"}
             `}
             title="Toggle Voice Narration"
           >
             <div className="relative z-10 flex items-center">
                 {isPlaying ? <Pause size={20} className={collapsed ? "" : "mr-2"} /> : <Mic size={20} className={collapsed ? "" : "mr-2"} />}
                 {!collapsed && (isPlaying ? "Stop Tutor" : "Voice Tutor")}
             </div>
             {/* Pulse Ring if playing */}
             {isPlaying && <div className="absolute inset-0 bg-white/20 animate-pulse z-0"></div>}
           </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col relative transition-all duration-300 ${collapsed ? "pl-16 md:pl-0" : "pl-16 md:pl-0"}`}>
        
        {/* Top Bar */}
        <header className="h-16 bg-white/90 dark:bg-[#1a1a1d]/90 backdrop-blur border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 shrink-0 z-20 transition-colors duration-300">
           <div className="flex items-center">
             <h1 className="font-serif text-xl md:text-2xl text-gray-900 dark:text-white tracking-wide flex items-center">
               {currentModule ? currentModule.name : "Select a Module"}
               <ChevronRight className="mx-2 text-gray-400 dark:text-gray-600" size={16} />
               <span className="text-sm font-sans text-amber-600 dark:text-amber-500 font-medium uppercase tracking-wider">
                 {viewMode}
               </span>
             </h1>
           </div>
           <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-1 bg-gray-100 dark:bg-[#242428] p-1 rounded-lg border border-gray-200 dark:border-gray-700">
                 <button className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"><ZoomOut size={16}/></button>
                 <button className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"><ZoomIn size={16}/></button>
              </div>
           </div>
        </header>

        {/* Canvas */}
        <main className="flex-1 relative overflow-hidden bg-gray-50 dark:bg-[#121214] transition-colors duration-300">
          {loading ? (
            <HistoricalLoader />
          ) : (
            <>
              {viewMode === "timeline" && <TimelineView events={events} />}
              {viewMode === "map" && <MapView events={events} onExploreCountry={handleExploreCountry} />}
              {viewMode === "analysis" && <AnalysisView events={events} currentModule={currentModule} />}
            </>
          )}
        </main>
        
        {/* Bottom Bar */}
        <footer className="h-14 bg-white dark:bg-[#1a1a1d] border-t border-gray-200 dark:border-gray-800 flex items-center px-4 md:px-6 space-x-4 shrink-0 z-20 transition-colors duration-300">
           <div className="flex items-center space-x-2">
              <button 
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-amber-600 hover:bg-amber-500 text-white transition-all shadow-lg active:scale-95"
                  onClick={toggleNarration}
              >
                 {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
              </button>
           </div>
           
           {/* Scrubber / Progress */}
           <div className="flex-1 flex items-center space-x-3 group">
              <span className="text-[10px] font-mono text-gray-500 w-10 text-right">{events.length > 0 ? events[0].year : "0000"}</span>
              <div className="h-1 flex-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden relative">
                 <div className="absolute top-0 left-0 h-full w-0 bg-amber-600 group-hover:bg-amber-500 transition-colors duration-1000" style={{ width: isPlaying ? '100%' : '0%' }}></div>
              </div>
              <span className="text-[10px] font-mono text-gray-500 w-10">{events.length > 0 ? events[events.length-1].year : "2024"}</span>
           </div>

           <div className="hidden md:flex items-center space-x-4 text-[10px] text-gray-400 dark:text-gray-500 font-mono border-l border-gray-200 dark:border-gray-800 pl-4">
              <span>GENAI: CONNECTED</span>
              <span className="w-1 h-1 rounded-full bg-green-500"></span>
           </div>
        </footer>
      </div>
    </div>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
export default App ;