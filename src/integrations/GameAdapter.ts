/**
 * The GameAdapter interface is the contract between the AI plugin and the game.
 * The game developer is responsible for creating a concrete implementation of this interface.
 * This allows the AI plugin to remain game-agnostic.
 */
export interface GameAdapter {
    // --- Audio ---
    /**
     * Plays audio data. The game should handle the creation of an audio source
     * and its playback.
     * @param audioData The raw audio data (e.g., from an MP3 file) as an ArrayBuffer.
     * @param options Optional parameters, like which entity is "speaking".
     */
    playAudio(audioData: ArrayBuffer, options?: { entityId?: string }): Promise<void>;

    /**
     * Stops any audio currently playing, potentially scoped to a specific entity.
     * @param entityId The ID of the entity whose audio should be stopped.
     */
    stopAudio(entityId?: string): void;

    // --- UI ---
    /**
     * Displays dialogue text in the game's UI. This could be a chat bubble,
     * a dialogue panel, etc.
     * @param text The text to display.
     * @param options Optional parameters, like which entity is speaking and for how long.
     */
    showDialogue(text: string, options: { entityId: string; duration?: number }): void;

    /**
     * Hides the dialogue UI for a specific entity.
     * @param entityId The ID of the entity whose dialogue should be hidden.
     */
    hideDialogue(entityId: string): void;

    // --- Game State Retrieval ---
    /**
     * Gets the general state of the game world.
     * This is used to provide context to the LLM.
     * @returns A promise that resolves to an object with game state information.
     */
    getGameState(): Promise<{ location: string; timeOfDay: string; [key: string]: any }>;

    /**
     * Gets the state of the current player.
     * This includes inventory, quests, stats, etc., to give the LLM context about the player.
     * @returns A promise that resolves to an object with player state information.
     */
    getPlayerState(): Promise<{ name: string; level: number; [key: string]: any }>;

    /**
     * Gets the state of a specific entity (e.g., an NPC).
     * This could include its name, personality, current status, relationship to the player, etc.
     * @param entityId The unique identifier for the entity.
     * @returns A promise that resolves to an object with the entity's state.
     */
    getEntityState(entityId: string): Promise<{ name: string; personality?: string; [key: string]: any }>;
}
