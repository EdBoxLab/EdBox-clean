import { GoogleGenAI, Type } from "@google/genai";
import { SyntaxNode, PhoneticsAnalysis, SemanticGraph, TranslationResult } from "../types";

const MODEL_FAST = "gemini-2.5-flash";

// Helper to initialize AI client safely within function scope
// This prevents "process is not defined" errors at module load time
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Analyzes the syntax of a sentence and returns a hierarchical tree structure.
 */
export const analyzeSyntax = async (text: string): Promise<SyntaxNode> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: `Analyze the syntactic structure of this sentence: "${text}". Return a hierarchical JSON tree representing the constituency parse (or dependency structure converted to a tree).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Grammatical category (S, NP, VP) or the word itself" },
            attributes: { 
              type: Type.OBJECT,
              properties: {
                pos: { type: Type.STRING, description: "Part of speech tag" }
              }
            },
            children: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    children: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: {type:Type.STRING} } } }
                }
              }
            }
          },
          required: ["name"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return result as SyntaxNode;
  } catch (error) {
    console.error("Syntax Analysis Error:", error);
    return { name: "Error", children: [{ name: "Could not parse syntax" }] };
  }
};

/**
 * Analyzes phonetics, returning IPA and articulation details.
 */
export const analyzePhonetics = async (text: string): Promise<PhoneticsAnalysis> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: `Provide a phonetic analysis of: "${text}". Convert to Broad IPA, and list the segments with their articulatory descriptions.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ipa: { type: Type.STRING, description: "The full IPA transcription" },
            stressPattern: { type: Type.STRING, description: "Description of the stress pattern" },
            segments: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  symbol: { type: Type.STRING },
                  description: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ["consonant", "vowel", "other"] },
                  duration: { type: Type.NUMBER, description: "Estimated duration in ms for visualization" }
                },
                required: ["symbol", "description", "type"]
              }
            }
          },
          required: ["ipa", "segments"]
        }
      }
    });
    
    return JSON.parse(response.text || "{}") as PhoneticsAnalysis;
  } catch (error) {
    console.error("Phonetics Analysis Error:", error);
    return { ipa: "/erər/", segments: [], stressPattern: "none" };
  }
};

/**
 * extract semantic relationships for a graph visualization.
 */
export const analyzeSemantics = async (text: string): Promise<SemanticGraph> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: `Analyze the semantics of: "${text}". Identify key entities/concepts (nodes) and their semantic relationships (links).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nodes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  label: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ["entity", "concept", "attribute"] },
                  value: { type: Type.NUMBER }
                },
                required: ["id", "label", "type", "value"]
              }
            },
            links: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  source: { type: Type.STRING, description: "Must match a node id" },
                  target: { type: Type.STRING, description: "Must match a node id" },
                  relation: { type: Type.STRING }
                },
                required: ["source", "target", "relation"]
              }
            }
          },
          required: ["nodes", "links"]
        }
      }
    });
    
    return JSON.parse(response.text || "{}") as SemanticGraph;
  } catch (error) {
    console.error("Semantic Analysis Error:", error);
    return { nodes: [], links: [] };
  }
};

/**
 * Translates text and provides alignment.
 */
export const translateText = async (text: string, targetLang: string): Promise<TranslationResult> => {
    try {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: MODEL_FAST,
        contents: `Translate "${text}" into ${targetLang}. Provide word-by-word alignment where possible.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              original: { type: Type.STRING },
              translated: { type: Type.STRING },
              targetLanguage: { type: Type.STRING },
              alignment: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    originalWord: { type: Type.STRING },
                    translatedWord: { type: Type.STRING },
                    confidence: { type: Type.NUMBER }
                  },
                  required: ["originalWord", "translatedWord"]
                }
              }
            },
            required: ["translated", "alignment"]
          }
        }
      });
      
      return JSON.parse(response.text || "{}") as TranslationResult;
    } catch (error) {
      console.error("Translation Error:", error);
      return { original: text, translated: "Error", targetLanguage: targetLang, alignment: [] };
    }
  };
