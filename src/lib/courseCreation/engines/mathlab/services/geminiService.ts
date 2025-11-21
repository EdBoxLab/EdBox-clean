import { GoogleGenAI, Type, Modality } from "@google/genai";
import { REASONING_MODEL, TTS_MODEL } from "../constants";
import { MathSolution, ToolType, Point, GeometryElement } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Robust Regex-based parser for streaming JSON data
const extractPointsFromStream = (text: string): Point[] => {
  const points: Point[] = [];
  // Matches objects containing x and y in any order
  // { ... "x": 1.2 ... "y": 3.4 ... }
  const objectRegex = /\{[^{}]+\}/g;
  const matches = text.match(objectRegex);

  if (!matches) return points;

  for (const match of matches) {
    const xMatch = match.match(/"x"\s*:\s*([-+]?[0-9]*\.?[0-9]+)/);
    const yMatch = match.match(/"y"\s*:\s*([-+]?[0-9]*\.?[0-9]+)/);
    
    if (xMatch && xMatch[1] && yMatch && yMatch[1]) {
      const x = parseFloat(xMatch[1]);
      const y = parseFloat(yMatch[1]);
      if (!isNaN(x) && !isNaN(y)) {
        points.push({ x, y });
      }
    }
  }
  return points;
};

const extractGeometryFromStream = (text: string): GeometryElement[] => {
  const elements: GeometryElement[] = [];
  const startMarker = '"geometryElements"';
  const startIndex = text.indexOf(startMarker);
  
  if (startIndex === -1) return [];
  const searchArea = text.substring(startIndex);
  
  // Regex to find objects with type and params
  const objectRegex = /\{\s*"type"\s*:\s*"([^"]+)"\s*,\s*"params"\s*:\s*\[([\d,\.\s-]+)\]/g;
  
  let match;
  while ((match = objectRegex.exec(searchArea)) !== null) {
    if (match[1] && match[2]) {
      try {
        const params = match[2].split(',')
          .map(n => parseFloat(n.trim()))
          .filter(n => !isNaN(n));
          
        elements.push({
          type: match[1] as any,
          params: params,
          label: "", 
          color: "#4f46e5"
        });
      } catch (e) {
        // Ignore malformed
      }
    }
  }
  return elements;
};

const extractStringFromPartialJson = (jsonStr: string, key: string): string => {
  try {
     // Look for "key": "value"
     const regex = new RegExp(`"${key}"\\s*:\\s*"([^"]*)"?`);
     const match = jsonStr.match(regex);
     return match ? match[1] : "";
  } catch (e) {
    return "";
  }
};

const extractStepsFromPartialJson = (jsonStr: string): string[] => {
    const steps: string[] = [];
    // Find the steps array
    const regex = /"steps"\s*:\s*\[(.*?)\]/s;
    const match = jsonStr.match(regex);
    if (match && match[1]) {
        // Match individual strings inside the array
        const stepRegex = /"([^"]+)"/g;
        let stepMatch;
        while ((stepMatch = stepRegex.exec(match[1])) !== null) {
            steps.push(stepMatch[1]);
        }
    }
    return steps;
}

export const solveMathProblemStream = async (
  problem: string, 
  toolType: ToolType,
  onUpdate: (partial: MathSolution) => void
): Promise<MathSolution> => {
  try {
    let systemContext = "";
    let outputStructureInstructions = "";

    // Tailor the prompt based on the active tool
    switch (toolType) {
      case ToolType.GEOMETRY:
        systemContext = "You are a Geometry Engine. Visualize the user's request using 2D geometric primitives.";
        outputStructureInstructions = `
          MANDATORY: Return 'geometryElements' array.
          - COORDINATE SYSTEM: Cartesian, from -10 to 10 on both axes. Center is (0,0).
          - For circles: type='circle', params=[cx, cy, radius] (radius ~1-5)
          - For lines: type='line', params=[x1, y1, x2, y2]
          - For points: type='point', params=[x, y]
          - For polygons: type='polygon', params=[x1, y1, x2, y2, ...xn, yn]
          
          Example: Draw a square -> params=[-2, -2, 2, -2, 2, 2, -2, 2]
        `;
        break;
      case ToolType.STATISTICS:
        systemContext = "You are a Statistics Lab. Analyze datasets and visualize distributions.";
        outputStructureInstructions = `
          MANDATORY: 
          - If visualizing: Return 'plotData' (array of x,y objects) and set 'plotType'.
          - If Histogram: x = bin start, y = frequency.
          - If calculating (mean, etc): Put result in 'summary'.
        `;
        break;
      case ToolType.GRAPH:
        systemContext = "You are a Graphing Calculator.";
        outputStructureInstructions = `
          MANDATORY: 
          - Generate at least 100 points for 'plotData'.
          - Range: x from -10 to 10 usually.
          - Ensure smooth curves.
        `;
        break;
      default: 
        systemContext = "You are MathStudio, an advanced mathematical reasoning engine.";
        outputStructureInstructions = `
          If the problem implies a function y=f(x), generate 50 points for 'plotData'.
        `;
        break;
    }

    const prompt = `
      ${systemContext}
      Request: "${problem}".

      Return a JSON object with this structure:
      {
        "summary": "Concise answer.",
        "steps": ["Step 1...", "Step 2..."],
        "plotData": [{"x": number, "y": number}], 
        "plotType": "line" | "scatter" | "bar",
        "geometryElements": [{ "type": "string", "params": [numbers], "label": "string", "color": "hex" }],
        "relatedTopics": ["Topic 1", "Topic 2"],
        "axisConfig": { "xMin": -10, "xMax": 10, "yMin": -10, "yMax": 10, "xLabel": "x", "yLabel": "y" }
      }

      ${outputStructureInstructions}
      Output valid JSON.
    `;

    const response = await ai.models.generateContentStream({
      model: REASONING_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            plotType: { type: Type.STRING, enum: ["line", "scatter", "bar"] },
            plotData: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER }
                }
              }
            },
            geometryElements: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, enum: ["circle", "line", "point", "polygon", "text"] },
                  params: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                  label: { type: Type.STRING, nullable: true },
                  color: { type: Type.STRING, nullable: true }
                }
              }
            },
            axisConfig: {
              type: Type.OBJECT,
              properties: {
                xMin: { type: Type.NUMBER },
                xMax: { type: Type.NUMBER },
                yMin: { type: Type.NUMBER },
                yMax: { type: Type.NUMBER },
                xLabel: { type: Type.STRING },
                yLabel: { type: Type.STRING }
              }
            },
            steps: { type: Type.ARRAY, items: { type: Type.STRING } },
            relatedTopics: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          propertyOrdering: ["summary", "plotType", "plotData", "geometryElements", "steps", "relatedTopics", "axisConfig"]
        }
      }
    });

    let fullText = "";
    const currentSolution: MathSolution = {
        originalProblem: problem,
        summary: "Thinking...",
        steps: [],
        plotData: [],
        geometryElements: []
    };

    for await (const chunk of response) {
      const text = chunk.text;
      fullText += text;
      
      // Robust Real-time Extraction
      const points = extractPointsFromStream(fullText);
      const geometry = extractGeometryFromStream(fullText);
      const summary = extractStringFromPartialJson(fullText, "summary");
      const steps = extractStepsFromPartialJson(fullText);
      
      let hasUpdate = false;
      
      // Only update if we have *more* data or new data to avoid jitter
      if (points.length > (currentSolution.plotData?.length || 0)) {
          currentSolution.plotData = points;
          hasUpdate = true;
      }
      if (geometry.length > (currentSolution.geometryElements?.length || 0)) {
          currentSolution.geometryElements = geometry;
          hasUpdate = true;
      }
      if (summary && summary.length > (currentSolution.summary?.length || 0)) {
          currentSolution.summary = summary;
          hasUpdate = true;
      }
      if (steps.length > (currentSolution.steps?.length || 0)) {
          currentSolution.steps = steps;
          hasUpdate = true;
      }

      if (hasUpdate) {
         onUpdate({...currentSolution});
      }
    }

    // Final Parse
    try {
      const finalParsed = JSON.parse(fullText);
      return {
        originalProblem: problem,
        summary: "Detailed Analysis",
        steps: [],
        plotData: [],
        geometryElements: [],
        relatedTopics: [],
        ...finalParsed
      };
    } catch (e) {
      return currentSolution;
    }

  } catch (error) {
    console.error("Error solving problem:", error);
    throw error;
  }
};

export const generateVoiceGuidance = async (text: string): Promise<AudioBuffer | null> => {
  try {
    const response = await ai.models.generateContent({
      model: TTS_MODEL,
      contents: { parts: [{ text }] },
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
    if (!base64Audio) return null;

    const binaryString = atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    return await audioContext.decodeAudioData(bytes.buffer);
  } catch (error) {
    return null;
  }
};

export const playAudioBuffer = (buffer: AudioBuffer) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(0);
};