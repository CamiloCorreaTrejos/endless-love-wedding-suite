import { GoogleGenAI } from "@google/genai";

// Initialize GoogleGenAI using the environment variable GEMINI_API_KEY directly as a named parameter.
const getAI = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const getWeddingAdvice = async (prompt: string, context?: string, history: {role: string, content: string}[] = []) => {
  const ai = getAI();
  
  const formattedHistory = history.map(msg => ({
    role: msg.role === 'ai' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  const currentMessage = {
    role: 'user',
    parts: [{ text: `[DATOS ACTUALES DE LA BODA: ${context || 'Sin datos'}]\n\nPregunta: ${prompt}` }]
  };

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [...formattedHistory, currentMessage],
    config: {
      systemInstruction: "Eres un Wedding Planner de lujo, altamente eficiente, experto y directo. REGLAS ESTRICTAS: 1. NUNCA uses saludos repetitivos ni introducciones (ej. no digas 'Hola', 'Como tu wedding planner', '¡Claro que sí!'). 2. Ve directo al grano y responde la pregunta inmediatamente. 3. Sé conciso, profesional y proactivo. 4. Usa los datos de la boda proporcionados para dar respuestas ultra-personalizadas. 5. Mantén un tono elegante pero muy resolutivo.",
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