import { GoogleGenAI } from "@google/genai";

export class GeminiService {
    private genAI: GoogleGenAI;
    private modelName: string;

    constructor(apiKey: string, modelName?: string) {
        this.genAI = new GoogleGenAI({ apiKey });
        // Priority: provided modelName > environment variable > default
        this.modelName = modelName || process.env.GEMINI_MODEL_NAME || "gemini-1.5-flash";
    }

    public async generateText(prompt: string): Promise<string | null> {
        console.log(`Sending prompt to Gemini using model ${this.modelName}...`);
        
        try {
            const result = await this.genAI.models.generateContent({
                model: this.modelName,
                contents: [{ role: "user", parts: [{ text: prompt }] }],
            });

            // The `response` property does not exist on the result of `generateContent`.
            // We need to parse the candidates to get the text.
            const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (text) {
                return text;
            } else {
                // The SDK might return a response with no text if content is blocked or structure is unexpected.
                console.error("No text generated from Gemini API or invalid response structure. Response:", JSON.stringify(result, null, 2));
                return null;
            }

        } catch (error) {
            console.error("Error calling Gemini API:", error);
            return null;
        }
    }
}
