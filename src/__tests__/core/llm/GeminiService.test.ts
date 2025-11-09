import { GeminiService } from '../../../core/llm/GeminiService';
import { GoogleGenAI } from '@google/genai';

// Mock the entire @google/genai library
const mockGenerateContent = jest.fn();

jest.mock('@google/genai', () => ({
    GoogleGenAI: jest.fn(() => ({
        models: {
            generateContent: mockGenerateContent,
        },
    })),
}));

const MockedGoogleGenAI = GoogleGenAI as jest.Mock;

describe('GeminiService', () => {
    const apiKey = 'test-api-key';
    let geminiService: GeminiService;

    beforeEach(() => {
        // Clear all mocks before each test
        MockedGoogleGenAI.mockClear();
        mockGenerateContent.mockClear();
    });

    it('should initialize with API key as an object', () => {
        geminiService = new GeminiService(apiKey, 'some-model');
        expect(MockedGoogleGenAI).toHaveBeenCalledWith({ apiKey });
    });

    describe('model name resolution', () => {
        beforeEach(() => {
            mockGenerateContent.mockResolvedValue({ candidates: [{ content: { parts: [{ text: 'ok' }] } }] });
        });
        
        it('should use model name provided in constructor', async () => {
            const modelName = 'test-model-via-constructor';
            geminiService = new GeminiService(apiKey, modelName);
            await geminiService.generateText('prompt');
            expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({ model: modelName }));
        });

        it('should use model name from environment variable if not provided in constructor', async () => {
            // This test relies on jest.config.js `setupFiles: ['dotenv/config']` to load the .env file.
            // The log output from this test should match the model in your .env file.
            const expectedModel = process.env.GEMINI_MODEL_NAME || 'gemini-1.5-flash';
            geminiService = new GeminiService(apiKey); // No model name passed to constructor
            await geminiService.generateText('prompt');
            expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({ model: expectedModel }));
        });

        it('should use default model name if no other model is provided', async () => {
            // Temporarily unset the environment variable to test the default fallback
            const originalEnv = process.env.GEMINI_MODEL_NAME;
            delete process.env.GEMINI_MODEL_NAME;

            geminiService = new GeminiService(apiKey);
            await geminiService.generateText('prompt');
            expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({ model: 'gemini-1.5-flash' }));
            
            // Restore env var
            if (originalEnv) {
                process.env.GEMINI_MODEL_NAME = originalEnv;
            }
        });
    });


    it('should generate text successfully', async () => {
        geminiService = new GeminiService(apiKey);
        const mockText = 'Hello, world!';
        mockGenerateContent.mockResolvedValue({
            candidates: [{ content: { parts: [{ text: mockText }] } }]
        });

        const prompt = 'test prompt';
        const result = await geminiService.generateText(prompt);
        
        expect(result).toBe(mockText);
        expect(mockGenerateContent).toHaveBeenCalledTimes(1);
        expect(mockGenerateContent).toHaveBeenCalledWith({
            model: expect.any(String),
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });
    });

    describe('when handling errors', () => {
        let consoleErrorSpy: jest.SpyInstance;

        beforeEach(() => {
            consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            geminiService = new GeminiService(apiKey);
        });

        afterEach(() => {
            consoleErrorSpy.mockRestore();
        });

        it('should return null on API error', async () => {
            mockGenerateContent.mockRejectedValue(new Error('API failure'));

            const result = await geminiService.generateText('test prompt');
            expect(result).toBeNull();
            expect(consoleErrorSpy).toHaveBeenCalled();
        });

        it('should return null if response has no text', async () => {
            mockGenerateContent.mockResolvedValue({
                candidates: [] // e.g. content filtered
            });

            const result = await geminiService.generateText('test prompt');
            expect(result).toBeNull();
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining("No text generated from Gemini API or invalid response structure."), expect.any(String));
        });
    });
});
