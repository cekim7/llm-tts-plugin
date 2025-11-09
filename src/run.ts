/**
 * =====================================================================================
 * E2E (End-to-End) Test Runner
 * =====================================================================================
 * This script is designed for manually running an end-to-end test of the AI plugin.
 * Unlike the Jest tests (`npm run test`), this script makes REAL API calls to Google
 * Gemini and ElevenLabs using the API keys in your `.env` file.
 *
 * It will:
 * 1. Generate a line of dialogue using the Gemini LLM.
 * 2. Print the generated text to the console.
 * 3. Generate an audio file for that dialogue using ElevenLabs TTS.
 * 4. Save the audio as `output.mp3` in the `game-ai-plugin` directory.
 * 5. Attempt to play the audio file using your system's default audio player.
 *
 * TO RUN THIS SCRIPT:
 * 1. Make sure you have a `.env` file in the `game-ai-plugin` directory with your
 *    `GEMINI_API_KEY` and `ELEVENLABS_API_KEY`.
 * 2. Run the following command from the root of the project:
 *    npm run test:e2e
 * =====================================================================================
 */
import * as dotenv from 'dotenv';
import * as fs from 'fs/promises';
import * as path from 'path';
import { AIManager } from './AIManager';
import { GameAdapter } from './integrations/GameAdapter';

// Using require for play-sound as it may not have up-to-date type definitions.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const player = require('play-sound')({});

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { GEMINI_API_KEY, ELEVENLABS_API_KEY, GEMINI_MODEL_NAME, ELEVENLABS_MODEL_ID } = process.env;

if (!GEMINI_API_KEY || !ELEVENLABS_API_KEY) {
    throw new Error("Please provide GEMINI_API_KEY and ELEVENLABS_API_KEY in a .env file.");
}

/**
 * A simple adapter for this test script.
 */
class TestRunnerAdapter implements GameAdapter {
    async playAudio(audioData: ArrayBuffer, options?: { entityId?: string }): Promise<void> {
        const outputPath = path.resolve(__dirname, '../output.mp3');
        console.log(`\nSaving audio to: ${outputPath}`);
        await fs.writeFile(outputPath, Buffer.from(audioData));
        console.log('Audio saved successfully. Now attempting to play...');

        return new Promise((resolve) => {
            player.play(outputPath, (err: any) => {
                if (err) {
                    console.error(
                        "Could not play audio. Please ensure you have a compatible audio player installed and in your PATH (e.g., 'mpg123', 'afplay', 'mplayer'). Error:",
                        err
                    );
                    // We resolve anyway because audio playback is not a critical failure for this test script.
                } else {
                    console.log('Playback finished.');
                }
                resolve();
            });
        });
    }

    stopAudio(entityId?: string): void {
        console.log(`(Adapter) Stop audio for ${entityId}`);
    }

    showDialogue(text: string, options: { entityId: string; duration?: number }): void {
        console.log(`\n[DIALOGUE for ${options.entityId}]`);
        console.log(`> ${text}`);
    }

    hideDialogue(entityId: string): void {
        console.log(`(Adapter) Hide dialogue for ${entityId}`);
    }

    getGameState(): Promise<{ location: string; timeOfDay: string; }> {
        return Promise.resolve({
            location: 'a tavern full of adventurers',
            timeOfDay: 'evening',
        });
    }

    getPlayerState(): Promise<{ name: string; level: number; }> {
        return Promise.resolve({
            name: 'Cek',
            level: 10,
        });
    }

    getEntityState(entityId: string): Promise<{ name: string; personality: string; }> {
        return Promise.resolve({
            name: 'a grizzled bartender',
            personality: 'gruff on the outside but with a heart of gold',
        });
    }
}

async function main() {
    console.log('--- Starting AI Plugin E2E Test ---');

    const adapter = new TestRunnerAdapter();
    const aiManager = new AIManager(adapter, {
        geminiApiKey: GEMINI_API_KEY as string,
        elevenLabsApiKey: ELEVENLABS_API_KEY as string,
        geminiModelName: GEMINI_MODEL_NAME,
        elevenLabsModelId: ELEVENLABS_MODEL_ID,
    });

    await aiManager.generateNpcDialogue('bartender-1');

    console.log('\n--- Test Finished ---');
}

main().catch(error => {
    console.error('Test failed with an error:', error);
    process.exit(1);
});
