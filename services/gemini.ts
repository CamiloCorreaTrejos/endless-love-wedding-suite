import { GoogleGenAI } from "@google/genai";

// Initialize GoogleGenAI using the environment variable API_KEY directly as a named parameter.
// Fix: Remove 'as string' cast to comply with coding guidelines.
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getWeddingAdvice = async (prompt: string, context?: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `As a professional high-end wedding planner, assist the user with their request. 
    Context: ${context || 'General wedding planning'}. 
    User Request: ${prompt}`,
    config: {
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
      tools: [{ googleSearch: {} }]
    }
  });

  return {
    text: response.text,
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};

export const generateVisionImage = async (prompt: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { text: `A cinematic, elegant high-resolution photo of a wedding theme: ${prompt}. Professional wedding photography style.` }
      ]
    },
    config: {
      imageConfig: {
        aspectRatio: "16:9"
      }
    }
  });

  // Iterate through response parts to locate and extract the image data.
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};