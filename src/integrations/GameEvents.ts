/**
 * This file can be used to define standardized event types and data structures
 * that are passed between the game and the AI plugin.
 *
 * For example, if the AI needs to trigger a specific game action.
 */

export enum AIPluginEvent {
    DialogueStart = 'ai:dialogue-start',
    DialogueEnd = 'ai:dialogue-end',
    AudioStart = 'ai:audio-start',
    AudioEnd = 'ai:audio-end',
}

export interface DialogueEventData {
    entityId: string;
    text: string;
}
