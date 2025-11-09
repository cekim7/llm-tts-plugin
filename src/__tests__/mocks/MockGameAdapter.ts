import { GameAdapter } from '../../integrations/GameAdapter';

export class MockGameAdapter implements GameAdapter {
    playAudio = jest.fn().mockResolvedValue(undefined);
    stopAudio = jest.fn();
    showDialogue = jest.fn();
    hideDialogue = jest.fn();

    getGameState = jest.fn().mockResolvedValue({
        location: 'the Whispering Woods',
        timeOfDay: 'dusk',
    });

    getPlayerState = jest.fn().mockResolvedValue({
        name: 'Eldrin',
        level: 5,
        health: 100,
    });

    getEntityState = jest.fn().mockResolvedValue({
        name: 'Mysterious Old Man',
        personality: 'cryptic and wise',
    });
}
