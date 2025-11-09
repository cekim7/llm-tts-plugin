import fetch from 'cross-fetch';

export class ElevenLabsTTSService {
    private apiKey: string;
    private voiceId = '21m00Tcm4TlvDq8ikWAM'; // A default voice ID, e.g., "Rachel"
    private modelId: string;

    constructor(apiKey: string, modelId?: string) {
        if (!apiKey) {
            throw new Error("ElevenLabs API key is required.");
        }
        this.apiKey = apiKey;
        // Priority: provided modelId > environment variable > new default
        this.modelId = modelId || process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2';
    }

    public async generateSpeech(text: string): Promise<ArrayBuffer | null> {
        console.log(`Requesting TTS from ElevenLabs for: "${text}"`);

        const url = `https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}`;
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Accept': 'audio/mpeg',
                    'Content-Type': 'application/json',
                    'xi-api-key': this.apiKey,
                },
                body: JSON.stringify({
                    text: text,
                    model_id: this.modelId,
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.5,
                    },
                }),
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
            }

            const audioData = await response.arrayBuffer();
            return audioData;

        } catch (error) {
            console.error("Error calling ElevenLabs TTS API:", error);
            return null;
        }
    }
}
