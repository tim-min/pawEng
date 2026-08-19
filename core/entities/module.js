/**
 * Module class
 * @class Module
 */

export class Module {
    #owner;
    #isLoaded;
    #_initState;
    #isActive = true;

    constructor() {
    }

    /**
     * Makes module active or not. If module is active it will participate in game loop if modules owner object is active too
     * @param {boolean} isActive 
     */

    setActive(isActive) {
        this.#isActive = isActive;
    }

    /**
     * Indicates if module is active or not
     */

    get isActive() {
        return this.#isActive;
    }

    /**
     * Called when the module is initialized and added to the game loop
     * Override this method to implement custom logic
     */

    start() {}

    /**
     * Calles every game loop iteration if module is active and modules owner object is active too
     * Override it to implement custom logic
     */

    loop() {}

    /**
     * Calles when module removed from owner object or owner object is removed from active scene
     * Override it to implement custom logic
     */

    onDestroy() {}

    remove() {}

    /**
     * Returns object owner
     * @returns {GameObject|UiObject}
     */

    get owner() {
        return this.#owner;
    }

    set owner(owner) {
        this.#owner = owner;
    }

    /**
     * Indicates if module is loaded or not
     */

    get isLoaded() {
        return this.#isLoaded;   
    }

    /**
     * Calls every game loop iteration to procces render logic.
     * Override this method to work with renderer worker and render some staff
     * @param {RendererWorker} renderer 
     */

    onRender(renderer) {

    }

    /**
     * Calls when scene becomes not active
     * Override this method to implement your own logic
     */

    onSceneCanceled() {}
}