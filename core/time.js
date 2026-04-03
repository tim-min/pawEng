export class Time {
    #deltaTime = 0;
    #timeFrameStarted = 0;
    #sceneLoadedTime;

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



export class ReadOnlyTime {
    #time;

    constructor(time) {
        this.#time = time;
    }

    deltaTime() {
        return this.#time.deltaTime();
    }

    timeAfterSceneLoaded() {
        return this.#time.timeAfterSceneLoaded();
    }
}
