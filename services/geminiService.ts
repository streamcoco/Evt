
import { GoogleGenAI, Type } from "@google/genai";
import { Note, MacroNutrients, Category, Task, StudyTask, Flashcard, Challenge, Habit, DailyStats, HealthData, UserProfile, Reward, SkillMilestone, WorkoutRoutine } from "../types";

// Lazy initialization to avoid top-level crash
const getAi = () => new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL_NAME = "gemini-3-flash-preview";
const SEARCH_MODEL = "gemini-3-flash-preview"; 

// --- Existing Functions (Kept same) ---
export const summarizeNote = async (content: string): Promise<string> => {
  try {
    const ai = getAi();
    const prompt = `Resume esto en una frase accionable (Markdown):\n${content}`;
    const response = await ai.models.generateContent({ model: MODEL_NAME, contents: prompt });
    return response.text || "Sin resumen.";
  } catch (error) { return "Error al resumir."; }
};

export const chatWithBrain = async (query: string, context: any, history: any[]): Promise<string> => {
  try {
    const ai = getAi();
    const systemInstruction = `Eres el "Gestor del Segundo Cerebro". Sé conciso y directo.`;
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [...history.slice(-6).map((h: any) => ({ role: h.role, parts: [{ text: h.text }] })), { role: 'user', parts: [{ text: query }] }],
      config: { systemInstruction }
    });
    return response.text || "Sin respuesta.";
  } catch (error) { return "Error de conexión."; }
};

export const autoCategorizeNote = async (content: string): Promise<Category> => {
  try {
    const ai = getAi();
    const prompt = `Clasifica: Proyectos, Áreas, Recursos, Archivos, Bandeja de Entrada.\nTexto: "${content.substring(0, 500)}"`;
    const response = await ai.models.generateContent({ model: MODEL_NAME, contents: prompt });
    const text = response.text?.trim() || '';
    if (text.includes('Proyectos')) return Category.PROJECTS;
    if (text.includes('Áreas')) return Category.AREAS;
    if (text.includes('Recursos')) return Category.RESOURCES;
    if (text.includes('Archivos')) return Category.ARCHIVES;
    return Category.INBOX;
  } catch (e) { return Category.INBOX; }
};

export const suggestEmoji = async (text: string): Promise<string> => {
    try {
        const ai = getAi();
        const prompt = `Sugiere un SOLO emoji para: "${text}". Responde solo con el emoji.`;
        const response = await ai.models.generateContent({ model: MODEL_NAME, contents: prompt });
        return response.text?.trim().substring(0, 2) || '📝';
    } catch(e) { return '📝'; }
}

export const analyzeFoodImage = async (base64Image: string): Promise<{ name: string, macros: MacroNutrients }> => {
  try {
    const ai = getAi();
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
    const prompt = `Analiza imagen. JSON: { "name": "...", "macros": { "calories": 0, "protein": 0, "carbs": 0, "fat": 0 } }`;
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts: [{ inlineData: { data: cleanBase64, mimeType: 'image/jpeg' } }, { text: prompt }] },
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}');
  } catch (e) { return { name: "Error", macros: { calories: 0, protein: 0, carbs: 0, fat: 0 } }; }
};

export const estimateNutritionFromText = async (query: string): Promise<{ name: string, macros: MacroNutrients }> => {
  try {
    const ai = getAi();
    const prompt = `JSON nutricional para: "${query}". { "name": "...", "macros": { "calories": 0, "protein": 0, "carbs": 0, "fat": 0 } }`;
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return { name: query, macros: { calories: 0, protein: 0, carbs: 0, fat: 0 } };
  }
};

export const estimateActivityCalories = async (query: string, weight: number): Promise<{ calories: number, duration: number, type: string }> => {
    try {
        const ai = getAi();
        const prompt = `Calcula calorías para persona ${weight}kg: "${query}". JSON: { "calories": number, "duration": number, "type": "string" }`;
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || '{ "calories": 100, "duration": 30, "type": "Ejercicio" }');
    } catch (e) {
        return { calories: 150, duration: 30, type: "Actividad (Estimada)" };
    }
}

export const suggestMetadata = async (content: string): Promise<{ tags: string[] }> => {
  try {
    const ai = getAi();
    const prompt = `Sugiere 3 tags para: "${content.substring(0, 100)}". JSON: { "tags": ["tag1"] }`;
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{ "tags": [] }');
  } catch (e) { return { tags: [] }; }
};

export const generateStudyPlan = async (topic: string, examDate: string): Promise<StudyTask[]> => {
  try {
    const ai = getAi();
    const prompt = `Plan estudio para "${topic}" examen el ${examDate}. JSON Array: [ { "description": "...", "suggestedDate": "YYYY-MM-DD" } ]`;
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    const rawTasks = JSON.parse(response.text || '[]');
    return rawTasks.map((t: any) => ({ ...t, id: crypto.randomUUID(), addedToDaily: false }));
  } catch (e) { return []; }
};

export const generateFlashcards = async (topic: string, quantity: number = 5): Promise<Omit<Flashcard, 'id' | 'deckId' | 'nextReview' | 'interval' | 'easeFactor'>[]> => {
  try {
    const ai = getAi();
    const prompt = `Genera ${quantity} flashcards sobre: "${topic}". JSON Array: [ { "front": "Pregunta", "back": "Respuesta" } ]`;
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '[]');
  } catch (e) { return []; }
};

export const generateChallenges = async (userGoals: string): Promise<Omit<Challenge, 'id' | 'completed' | 'deadline'>[]> => {
  try {
    const ai = getAi();
    const prompt = `3 desafíos cortos basados en: "${userGoals}". JSON Array: [ { "title": "...", "description": "...", "type": "health|learning|general", "durationDays": 1, "rewardCredits": 100 } ]`;
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '[]');
  } catch (e) { return []; }
};

export const getFinancialBriefing = async (interests: string): Promise<{ summary: string, sentiment: 'bullish' | 'bearish' | 'neutral' }> => {
  try {
    const ai = getAi();
    const prompt = `Noticias financieras breves sobre: ${interests}. JSON: { "summary": "...", "sentiment": "neutral" }`;
    const response = await ai.models.generateContent({
      model: SEARCH_MODEL,
      contents: prompt,
      config: { tools: [{ googleSearch: {} }], responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{"summary": "Error", "sentiment": "neutral"}');
  } catch (e) { return { summary: "Error de red.", sentiment: "neutral" }; }
};

export const askStudySource = async (query: string, sourceContent: string): Promise<string> => {
    try {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `Contexto: ${sourceContent.substring(0, 10000)}. Pregunta: ${query}`,
        });
        return response.text || "Sin respuesta.";
    } catch (e) { return "Error."; }
}

export const generateSkillPlan = async (skillName: string, level: number = 1): Promise<SkillMilestone[]> => {
  try {
    const ai = getAi();
    const prompt = `Plan aprendizaje "${skillName}" nivel ${level}. 5 pasos. JSON Array: [ { "label": "...", "xpValue": 100 } ]`;
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '[]');
  } catch (e) { return []; }
};

export const generateSkillChallenge = async (skillName: string, level: number): Promise<string> => {
  try {
    const ai = getAi();
    const response = await ai.models.generateContent({ model: MODEL_NAME, contents: `Desafío corto para practicar ${skillName} nivel ${level}.` });
    return response.text || "Practica 15 min.";
  } catch (e) { return "Practica 15 min."; }
};

// --- UPDATED: WORKOUT GENERATION (JSON STRUCTURED) ---
export const generateWorkoutPreview = async (goal: string, equipment: string, experience: string, time: string): Promise<string> => {
    return "Función deprecada. Use generateWorkoutRoutine.";
};

export const generateWorkoutRoutine = async (goal: string, equipment: string, experience: string, time: string): Promise<WorkoutRoutine> => {
    try {
        const ai = getAi();
        const prompt = `
        Actúa como Entrenador Personal experto en biomecánica y fisiología.
        Genera una rutina DETALLADA de 1 sesión en formato JSON.
        
        Parámetros:
        - Objetivo: ${goal}
        - Equipo: ${equipment}
        - Nivel: ${experience}
        - Duración: ${time}
        
        Esquema JSON requerido:
        {
          "title": "Nombre de la rutina (ej: Torso Fuerza)",
          "scientificSummary": "Explicación breve de 2 lineas de por qué funciona fisiológicamente.",
          "warmup": ["ejercicio 1", "ejercicio 2"],
          "exercises": [
             { "name": "Nombre Ejercicio", "sets": 3, "reps": "8-12", "notes": "Tip técnico breve" }
          ],
          "cooldown": ["ejercicio 1", "ejercicio 2"]
        }
        `;

        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        
        const raw = JSON.parse(response.text || '{}');
        
        // Sanitize and add IDs
        return {
            title: raw.title || "Rutina Generada",
            scientificSummary: raw.scientificSummary || "Rutina optimizada.",
            warmup: raw.warmup || [],
            cooldown: raw.cooldown || [],
            createdAt: Date.now(),
            exercises: (raw.exercises || []).map((e: any) => ({
                id: crypto.randomUUID(),
                name: e.name,
                sets: e.sets || 3,
                reps: e.reps || "10",
                notes: e.notes || "",
                completedSets: 0
            }))
        };
    } catch(e) {
        console.error("AI Error:", e);
        throw new Error("Fallo en la generación IA");
    }
}

// --- REWARD PRICING ---
export const calculateRewardCost = async (rewardName: string, userGoals: string): Promise<{ cost: number, rationale: string, icon: string }> => {
  try {
    const ai = getAi();
    const prompt = `Valora en créditos (100-5000) este deseo: "${rewardName}". Usuario quiere: "${userGoals}". Si es contraproducente (ej: comida basura), precio MUY alto. Si es bueno, precio moderado.
    JSON: { "cost": number, "rationale": "breve razon", "icon": "emoji" }`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    return JSON.parse(response.text || '{ "cost": 500, "rationale": "Estándar", "icon": "🎁" }');
  } catch (e) {
    return { cost: 500, rationale: "Error IA, precio base.", icon: "🎁" };
  }
};

// --- CHECK SPECIAL OFFERS (DEFLATION LOGIC) ---
export const checkSpecialOffers = async (profile: UserProfile, availableRewards: Reward[]): Promise<string[]> => {
    try {
        const ai = getAi();
        const itemNames = availableRewards.map(r => r.id).join(', ');
        const prompt = `
        Usuario inactivo. Perfil: "${profile.goals}". Inventario: ${Object.keys(profile.inventory).join(',')}.
        Items disponibles (IDs): ${itemNames}.
        Selecciona 2 IDs de items para poner en "Oferta Especial" para motivarlo a volver.
        JSON: { "discountedIds": ["id1", "id2"] }
        `;

        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        const result = JSON.parse(response.text || '{ "discountedIds": [] }');
        return result.discountedIds || [];
    } catch(e) { return []; }
}
