import { GameAdapter } from './integrations/GameAdapter';
import { GeminiService } from './core/llm/GeminiService';
import { ElevenLabsTTSService } from './core/tts/ElevenLabsTTSService';

export interface AIManagerOptions {
    geminiApiKey: string;
    elevenLabsApiKey: string;
    geminiModelName?: string;
    elevenLabsModelId?: string;
}

export class AIManager {
    private adapter: GameAdapter;
    private llmService: GeminiService;
    private ttsService: ElevenLabsTTSService;

    constructor(adapter: GameAdapter, options: AIManagerOptions) {
        this.adapter = adapter;
        this.llmService = new GeminiService(options.geminiApiKey, options.geminiModelName);
        this.ttsService = new ElevenLabsTTSService(options.elevenLabsApiKey, options.elevenLabsModelId);
        console.log('AIManager initialized.');
    }

    public async generateNpcDialogue(entityId: string, playerContextOverrides?: any): Promise<void> {
        console.log(`Generating dialogue for entity: ${entityId}`);
        try {
            // 1. Get game state from adapter
            const npcState = await this.adapter.getEntityState(entityId);
            const playerState = await this.adapter.getPlayerState();
            const gameState = await this.adapter.getGameState();

            // 2. Construct a prompt for the LLM
            const prompt = `
                You are ${npcState.name}, a character in a fantasy RPG.
                Your personality is: ${npcState.personality || 'a mysterious stranger'}.
                You are talking to a player named ${playerState.name}.
                The player's level is ${playerState.level}.
                Current situation: You are at ${gameState.location}, and it is ${gameState.timeOfDay}.
                
                Based on this, generate a single, short, engaging line of dialogue for the player. Be creative.`;

            // 3. Generate text with LLM
            const dialogueText = await this.llmService.generateText(prompt);
            if (!dialogueText) {
                throw new Error('Failed to generate dialogue text.');
            }

            // 4. Show dialogue in UI immediately
            this.adapter.showDialogue(dialogueText, { entityId });

            // 5. Generate audio with TTS in parallel
            const audioData = await this.ttsService.generateSpeech(dialogueText);
            if (!audioData) {
                // Non-critical error, dialogue is already visible
                console.error('Failed to generate audio.');
                return;
            }

            // 6. Play audio via game adapter
            await this.adapter.playAudio(audioData, { entityId });
        } catch (error) {
            console.error(`[AIManager] Error generating dialogue for ${entityId}:`, error);
            this.adapter.showDialogue("...", { entityId }); // Show fallback text
        }
    }
}
