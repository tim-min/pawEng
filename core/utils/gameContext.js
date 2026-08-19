 /**
 * GameContext class. Proxy-App, provides secure access for some App utils
 * @class GameContext
 */

export class GameContext {
    #app

    constructor(app) {
        this.#app = app;
    }

    /**
     * Returns world size vector. World size means width and height of game window in game points
     * @returns {Vector}
     */

    get worldSize() {
        return this.#app.renderer.worldSize;
    }
}