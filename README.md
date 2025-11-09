# AI Plugin for Web Games


## 1. Core Objectives

*   **Modularity:** An independent library that can be developed and versioned separately.
*   **Portability:** Easily integrated into different TypeScript-based game projects with minimal boilerplate.
*   **Functionality:**
    *   Generate dynamic, in-context text using the Google Gemini LLM.
    *   Convert generated text into speech using the ElevenLabs API.
    *   Provide a clear and simple API for game developers.

## 2. Proposed Architecture: The Adapter Pattern

To ensure portability, we will use the **Adapter Pattern**. The AI plugin will define a `GameAdapter` interface. Each game that wants to use the plugin will need to create its own concrete implementation of this interface. This decouples the AI logic from the specific implementation details of any single game.

A simple diagram of the flow:

**[Game Code] <--> [Game-Specific Adapter] <--> [AI Plugin] <--> [Google & ElevenLabs APIs]**

This means the AI Plugin doesn't need to know about `Babylon.js`, `Colyseus`, or any other game-specific technology. It only communicates through the abstract `GameAdapter`.

## 3. Plugin Directory Structure

We will create a new directory `game-ai-plugin` at the project root.

```
game-ai-plugin/
├── package.json         # Project dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── README.md            # This planning document
└── src/
    ├── index.ts         # Main export file, exposes public APIs
    ├── AIManager.ts     # The main facade class the game will interact with
    ├── core/
    │   ├── llm/
    │   │   └── GeminiService.ts   # Handles all communication with Google Gemini API
    │   └── tts/
    │       └── ElevenLabsTTSService.ts # Handles all communication with the ElevenLabs TTS API
    └── integrations/
        ├── GameAdapter.ts   # The crucial interface for the game to implement
        └── GameEvents.ts    # Defines standard events and data structures
```

## 4. Core Components Explained

### `AIManager.ts` (The Facade)
This is the primary entry point for the game. The game will create an instance of `AIManager` and use it to trigger AI functionalities.

*   **Initialization:** `new AIManager(new YourGameAdapter(), { geminiApiKey: '...', elevenLabsApiKey: '...' })`
*   **Example Method:** `async generateNpcDialogue(npcId: string, playerContext: any)`
    *   It will use the `GameAdapter` to get more context about the game state.
    *   It will call `GeminiService` to generate dialogue text.
    *   It will call `ElevenLabsTTSService` to get the audio for the dialogue.
    *   It will use the `GameAdapter` to play the audio and display the text in the game's UI.

### `GameAdapter.ts` (The Bridge)
This `interface` is the contract between the plugin and the game. The game developer must implement it.

```typescript
export interface GameAdapter {
    // --- Audio ---
    playAudio(audioData: ArrayBuffer, options: { entityId?: string }): Promise<void>;
    stopAudio(entityId?: string): void;

    // --- UI ---
    showDialogue(text: string, options: { entityId: string, duration?: number }): void;
    hideDialogue(entityId: string): void;

    // --- Game State ---
    getGameState(): Promise<any>; // General state: player location, time of day, etc.
    getPlayerState(): Promise<any>; // Player-specific state: inventory, quests, health
    getEntityState(entityId: string): Promise<any>; // NPC or monster state
}
```

### `GeminiService.ts` & `ElevenLabsTTSService.ts` (The Workers)
These classes will encapsulate the logic for making API calls to Google Cloud (for Gemini) and ElevenLabs (for TTS). They will handle authentication, request formatting, and response parsing. They will be internal to the plugin and used by the `AIManager`.

## 5. Integration Steps for a Game (Example: `ai-added-t5c`)

1.  **Install Plugin:** In the game's `package.json`, add the plugin as a local dependency: `"game-ai-plugin": "file:../game-ai-plugin"` and run `npm install`.
2.  **Create Adapter:** Create a new file, for example, `src/client/integrations/T5CAdapter.ts`.
    ```typescript
    import { GameAdapter } from 'game-ai-plugin';
    import { GameController } from '../Controllers/GameController';

    export class T5CAdapter implements GameAdapter {
        private game: GameController;

        constructor(game: GameController) {
            this.game = game;
        }

        async playAudio(audioData: ArrayBuffer): Promise<void> {
            // Logic to use this.game.gamescene._sound to play the audio
        }

        showDialogue(text: string, options: { entityId: string }): void {
            // Logic to find the entity by ID and use its nameplateController
            // or the UI's Panel_Dialog to show the text.
        }
        
        // ... implement other methods
    }
    ```
3.  **Initialize AI Manager:** In `ai-added-t5c/src/client/Screens/GameScene.ts` or a similar central location.
    ```typescript
    import { AIManager } from 'game-ai-plugin';
    import { T5CAdapter } from '../integrations/T5CAdapter';

    // In some init method...
    const adapter = new T5CAdapter(this._game);
    this._game.aiManager = new AIManager(adapter, {
        geminiApiKey: "YOUR_GOOGLE_API_KEY",
        elevenLabsApiKey: "YOUR_ELEVENLABS_API_KEY"
    });
    ```
4.  **Use the AI Manager:** In an interaction handler, for example in `Panel_Dialog.ts` when talking to an NPC.
    ```typescript
    // When a player interacts with an NPC...
    this._game.aiManager.generateNpcDialogue(this.currentEntity.sessionId);
    ```
