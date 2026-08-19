export class Time {
    #deltaTime = 0;
    #timeFrameStarted = 0;
    #sceneLoadedTime;

    constructor() {}

    static maxDeltaTime = 100;

    deltaTime() {
        return this.#deltaTime / 1000;
    }

    frameCheck() {
        const now = performance.now();
        let rawDelta = now - this.#timeFrameStarted;

        this.#deltaTime = Math.min(rawDelta, Time.maxDeltaTime);

        this.#timeFrameStarted = now;
    }

    sceneLoaded() {
        this.#sceneLoadedTime = performance.now();
    }

    timeAfterSceneLoaded() {
        return performance.now() - this.#sceneLoadedTime;
    }
}

/**
 * ReadOblyTime class. You can use it in GameObject to get some time utils
 * @class ReadOnlyTime
 */


export class ReadOnlyTime {
    #time;

    constructor(time) {
        this.#time = time;
    }

    /**
     * Returns time in seconds between last iteration of game loop and current moment
     * @returns {Number}
     */

    deltaTime() {
        return this.#time.deltaTime();
    }

    /**
     * Returns time in seconds after moment of scene loaded
     * @returns {Number}
     */

    timeAfterSceneLoaded() {
        return this.#time.timeAfterSceneLoaded();
    }
}
