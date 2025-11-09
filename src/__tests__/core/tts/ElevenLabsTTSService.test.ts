import { ElevenLabsTTSService } from '../../../core/tts/ElevenLabsTTSService';
import fetch from 'cross-fetch';

jest.mock('cross-fetch');

const mockedFetch = fetch as jest.Mock;

describe('ElevenLabsTTSService', () => {
    const apiKey = 'test-elevenlabs-key';
    let ttsService: ElevenLabsTTSService;
    const originalEnv = process.env;

    beforeEach(() => {
        mockedFetch.mockClear();
        jest.resetModules(); // Necessary to re-evaluate process.env in the module
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('should throw an error if API key is not provided', () => {
        expect(() => new ElevenLabsTTSService('')).toThrow('ElevenLabs API key is required.');
    });

    it('should use the default model ID if none is provided', async () => {
        ttsService = new ElevenLabsTTSService(apiKey);
        mockedFetch.mockResolvedValueOnce({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) });
        await ttsService.generateSpeech('Hello');
        const requestBody = JSON.parse(mockedFetch.mock.calls[0][1].body);
        expect(requestBody.model_id).toBe('eleven_multilingual_v2');
    });

    it('should use the model ID from environment variable if provided', async () => {
        process.env.ELEVENLABS_MODEL_ID = 'env-var-model';
        ttsService = new ElevenLabsTTSService(apiKey);
        mockedFetch.mockResolvedValueOnce({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) });
        await ttsService.generateSpeech('Hello');
        const requestBody = JSON.parse(mockedFetch.mock.calls[0][1].body);
        expect(requestBody.model_id).toBe('env-var-model');
    });

    it('should use the model ID from constructor argument, prioritizing it over environment variable', async () => {
        process.env.ELEVENLABS_MODEL_ID = 'env-var-model';
        ttsService = new ElevenLabsTTSService(apiKey, 'constructor-model');
        mockedFetch.mockResolvedValueOnce({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) });
        await ttsService.generateSpeech('Hello');
        const requestBody = JSON.parse(mockedFetch.mock.calls[0][1].body);
        expect(requestBody.model_id).toBe('constructor-model');
    });

    it('should generate speech successfully', async () => {
        ttsService = new ElevenLabsTTSService(apiKey);
        const mockAudioData = new ArrayBuffer(8);
        mockedFetch.mockResolvedValueOnce({
            ok: true,
            arrayBuffer: () => Promise.resolve(mockAudioData),
        });

        const result = await ttsService.generateSpeech('Hello');
        expect(result).toBe(mockAudioData);
        expect(mockedFetch).toHaveBeenCalledTimes(1);
        expect(mockedFetch).toHaveBeenCalledWith(
            expect.stringContaining('https://api.elevenlabs.io/v1/text-to-speech/'),
            expect.objectContaining({
                headers: expect.objectContaining({
                    'xi-api-key': apiKey,
                }),
            })
        );
    });

    describe('when handling errors', () => {
        let consoleErrorSpy: jest.SpyInstance;

        beforeEach(() => {
            ttsService = new ElevenLabsTTSService(apiKey);
            // Suppress console.error for these specific tests
            consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        });

        afterEach(() => {
            // Restore console.error
            consoleErrorSpy.mockRestore();
        });

        it('should return null on API error', async () => {
            mockedFetch.mockResolvedValueOnce({
                ok: false,
                status: 401,
                text: () => Promise.resolve('Unauthorized'),
            });
    
            const result = await ttsService.generateSpeech('Hello');
            expect(result).toBeNull();
        });
    
        it('should return null on network error', async () => {
            mockedFetch.mockRejectedValueOnce(new Error('Network failure'));
            const result = await ttsService.generateSpeech('Hello');
            expect(result).toBeNull();
        });
    });
});
