import { AIManager } from '../AIManager';
import { MockGameAdapter } from './mocks/MockGameAdapter';
import { GeminiService } from '../core/llm/GeminiService';
import { ElevenLabsTTSService } from '../core/tts/ElevenLabsTTSService';

// Mock the services to prevent actual API calls
jest.mock('../core/llm/GeminiService');
jest.mock('../core/tts/ElevenLabsTTSService');

const MockedGeminiService = GeminiService as jest.MockedClass<typeof GeminiService>;
const MockedElevenLabsTTSService = ElevenLabsTTSService as jest.MockedClass<typeof ElevenLabsTTSService>;

describe('AIManager', () => {
    let adapter: MockGameAdapter;
    let aiManager: AIManager;
    const options = {
        geminiApiKey: 'fake-gemini-key',
        elevenLabsApiKey: 'fake-elevenlabs-key',
        geminiModelName: 'test-model-from-options',
    };

    beforeEach(() => {
        // Clear all mocks before each test. This resets call history and instances.
        MockedGeminiService.mockClear();
        MockedElevenLabsTTSService.mockClear();

        adapter = new MockGameAdapter();
        // A new AIManager is created for each test, which in turn creates new mock instances of our services.
        aiManager = new AIManager(adapter, options);
    });

    it('should initialize services with API keys and model name from options', () => {
        // The constructor is called in `beforeEach`, so we can assert it was called correctly.
        expect(MockedGeminiService).toHaveBeenCalledWith(options.geminiApiKey, options.geminiModelName);
        expect(MockedElevenLabsTTSService).toHaveBeenCalledWith(options.elevenLabsApiKey);
    });

    it('should generate NPC dialogue, show text, and play audio', async () => {
        const entityId = 'npc-1';
        const dialogueText = 'Greetings, traveler.';
        const audioData = new ArrayBuffer(128);

        // Get the mock instances created for this specific test run
        const llmServiceInstance = MockedGeminiService.mock.instances[0] as jest.Mocked<GeminiService>;
        const ttsServiceInstance = MockedElevenLabsTTSService.mock.instances[0] as jest.Mocked<ElevenLabsTTSService>;

        // Define mock behavior on the instances
        llmServiceInstance.generateText = jest.fn().mockResolvedValue(dialogueText);
        ttsServiceInstance.generateSpeech = jest.fn().mockResolvedValue(audioData);

        await aiManager.generateNpcDialogue(entityId);

        // 1. Check if game state was fetched
        expect(adapter.getEntityState).toHaveBeenCalledWith(entityId);
        expect(adapter.getPlayerState).toHaveBeenCalled();
        expect(adapter.getGameState).toHaveBeenCalled();

        // 2. Check if LLM was called with a constructed prompt
        expect(llmServiceInstance.generateText).toHaveBeenCalledTimes(1);
        expect(llmServiceInstance.generateText).toHaveBeenCalledWith(expect.stringContaining('You are Mysterious Old Man'));
        expect(llmServiceInstance.generateText).toHaveBeenCalledWith(expect.stringContaining('talking to a player named Eldrin'));

        // 3. Check if dialogue was shown in UI
        expect(adapter.showDialogue).toHaveBeenCalledWith(dialogueText, { entityId });

        // 4. Check if TTS was called
        expect(ttsServiceInstance.generateSpeech).toHaveBeenCalledWith(dialogueText);

        // 5. Check if audio was played
        expect(adapter.playAudio).toHaveBeenCalledWith(audioData, { entityId });
    });

    describe('when handling service failures', () => {
        let consoleErrorSpy: jest.SpyInstance;

        beforeEach(() => {
            // Suppress console.error for these specific tests
            consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        });

        afterEach(() => {
            // Restore console.error
            consoleErrorSpy.mockRestore();
        });

        it('should show fallback dialogue if LLM fails', async () => {
            const entityId = 'npc-1';
            
            const llmServiceInstance = MockedGeminiService.mock.instances[0] as jest.Mocked<GeminiService>;
            const ttsServiceInstance = MockedElevenLabsTTSService.mock.instances[0] as jest.Mocked<ElevenLabsTTSService>;
            
            // Mock the LLM to fail (return null)
            llmServiceInstance.generateText = jest.fn().mockResolvedValue(null);
            // We still need to mock the generateSpeech method on the instance, even if we don't expect it to be called.
            ttsServiceInstance.generateSpeech = jest.fn();
    
            await aiManager.generateNpcDialogue(entityId);
    
            expect(adapter.showDialogue).toHaveBeenCalledWith("...", { entityId });
            expect(ttsServiceInstance.generateSpeech).not.toHaveBeenCalled();
            expect(adapter.playAudio).not.toHaveBeenCalled();
        });
    
        it('should still show dialogue even if TTS fails', async () => {
            const entityId = 'npc-1';
            const dialogueText = 'My voice is gone, but my words remain.';
            
            const llmServiceInstance = MockedGeminiService.mock.instances[0] as jest.Mocked<GeminiService>;
            const ttsServiceInstance = MockedElevenLabsTTSService.mock.instances[0] as jest.Mocked<ElevenLabsTTSService>;
    
            llmServiceInstance.generateText = jest.fn().mockResolvedValue(dialogueText);
            // Mock TTS to fail (return null)
            ttsServiceInstance.generateSpeech = jest.fn().mockResolvedValue(null);
    
            await aiManager.generateNpcDialogue(entityId);
    
            expect(adapter.showDialogue).toHaveBeenCalledWith(dialogueText, { entityId });
            expect(adapter.playAudio).not.toHaveBeenCalled();
        });
    });
});
