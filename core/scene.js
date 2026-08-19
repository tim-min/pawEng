import { GameObject } from "./entities/gameObject.js";
import { Camera } from "./modules/main/camera.js";
import { UiObject } from "./entities/uiObject.js";
import { GameContext } from './utils/gameContext.js';
import { App } from './app.js';
import { RendererQueue } from "./render/renderer.js";
import { Vector } from './math/vector.js';
import { getZoneTypes } from "./entities/zones/index.js";
import { MapNet } from "./utils/mapNet.js";

// Сцена. Собирает в себе GameObject'ы. Встраивается в игровой цикл и встраивает туда все свои GameObject'ы
export class Scene {
    #name;
    #gameObjects;
    #app;
    #eventQueue;
    #time;
    #isLoaded;
    #gameContext;
    #rendererQueue;
    #uiRendererQueue;
    #mapNet;
    #activeCamera;

    constructor(name) {
        this.#name = name;
        this.#gameObjects = [];
        this.#rendererQueue = new RendererQueue();
        this.#uiRendererQueue = new RendererQueue();

        this.#mapNet = new MapNet();
    }

    #assertIsVector(obj) {
        if (!(obj instanceof Vector)) {
            throw new TypeError(`${obj} object is not paw.Vector`);
        }
    }

    #assertIsGameObject(obj) {
        if (!(obj instanceof GameObject)) {
            throw new TypeError("You can only add game objects that inherit from GameObject");
        }
    }

    /**
     * Returns array of game objects near by given point.
     * @param {Vector} position - Point
     * @param {Number} radiusX - Radius by X (in MapNet cells count)
     * @param {Number} radiusY - Radius by Y (in MapNet cells count)
     * @returns {Array} - Array of game objects, except UiObjects.
     */

    getObjectsNearby(position, radiusX=1, radiusY=1) {
        this.#assertIsVector(position);

        return this.#mapNet.getObjectsNearby(position, radiusX, radiusY);
    }

    /**
     * Indicates whether scene is active
     * @returns {boolean} - Returns 'true' if scene is active and 'false' if not
     */

    get isLoaded() {
        return this.#isLoaded;
    }

    /**
     * Scene name
     * @returns {string} - Returns scene name
     */

    get name() {
        return this.#name;
    }

    /**
     * Game objects in scene
     * @returns {Array} - Returns array of all GameObjects and UiObjects in scene
     */

    get gameObjects() {
        return this.#gameObjects;
    }

    async loop() { // Цикл сцены. Выполняем циклы всех игровых объектов, отдаем workerы и прочее
        if (!this.#isLoaded) throw Error("Scene is not loaded yet");

        this.#app.renderer.clearAll(); // Очищаем весь экран для рендера

        await this.#gameObjects.forEach(gameObject => {
            if (!gameObject.isActive) return;

            gameObject.loopAll();
            if (!(gameObject instanceof UiObject)) this.#mapNet.updateObject(gameObject);
        });

        this.updateRendererQueue();
        await this.renderObjects();
        await this.renderUiObjects();
    }

    updateRendererQueue() {
        this.#rendererQueue.clear();

        let cellsInScreenX = Math.ceil(this.#app.renderer.screenSize.x / (this.#mapNet.cellSize * this.#app.renderer.scale));
        let cellsInScreenY = Math.ceil(this.#app.renderer.screenSize.y / (this.#mapNet.cellSize * this.#app.renderer.scale));

        let cameraPos = this.#app.renderer.workingCamera != null ? this.#app.renderer.workingCamera.worldPosition : new Vector(0, 0);
        let objectsToRender = this.getObjectsNearby(cameraPos, cellsInScreenX, cellsInScreenY);

        objectsToRender.forEach(gameObject => {
            if (!gameObject.isActive) return;

            this.#setObjectToRenderQueue(gameObject);
        });
    }

    #setObjectToRenderQueue(object) {
        this.#rendererQueue.push(object);
    }

    #setObjectToUiRenderQueue(object) {
        this.#uiRendererQueue.push(object);
    }

    renderObjects() {

        let objects = this.#rendererQueue.getSortedArray();

        for (let x=0; x<objects.length; x++)
            this.renderGameObject(objects[x]);
    }

    renderUiObjects() {
        let objects = this.#uiRendererQueue.getSortedArray();

        for (let x=0; x<objects.length; x++) {
            this.renderGameObject(objects[x]);
        }
    }

    async renderGameObject(gameObject) { // Тут отдаем объекту прокси-рендерер и затем удаляем чтобы объект не смог использовать его после сохранения
        let worker;

        // Создаётся 2 отдельных worker'а для рендера объекта для того чтобы вызовы рендера у ui объектов и у обычных объектов были одинаковые, 
        // тут мы просто сами ставим флажок "isUiSpace" в worker'е (см. app)

        if (gameObject instanceof UiObject) {
            worker = this.#app.getUiRendererWorker();
        } else {
            worker = this.#app.getRendererWorker();
        }

        await gameObject.renderAll(worker);
        worker.destroy();
    }

    /**
     * Adds new GameObject in scene
     * @param {GameObject|UiObject} gameObject
     */

    addGameObject(gameObject) {
        this.#assertIsGameObject(gameObject); 

        if (this.#gameObjects.find(m => m === gameObject)) throw Error("You are trying to add GameObject that is already in scene");

        this.#gameObjects.push(gameObject);

        if (gameObject instanceof UiObject)
             this.#setObjectToUiRenderQueue(gameObject);

        if (!this.#isLoaded) return;

        gameObject.setEventQueue(this.#eventQueue);
        gameObject.setTimeObject(this.#time);
        gameObject.gameContext = this.#gameContext;
        gameObject.start();
        gameObject.startModules();
    }

    /**
     * Use it to clear scene. Removes all GameObjects and UiObjects
     */

    clear() {
        this.#gameObjects.forEach(gameObject => {
            gameObject.onDestroy();
        });

        this.#gameObjects = [];
    }

    checkClickOnUiObjects(position) {
        let objects = this.#uiRendererQueue.getSortedArray();

        for (let x=objects.length-1; x>-1; x--) {
            let gameObject = objects[x];

            let clickZones = gameObject.getZones(getZoneTypes().CLICK);
            let isClicked = false;

            clickZones.forEach(zone => {
                let result = zone.containsPoint(gameObject.worldPosition, position, true);
                if (result) isClicked = true;
            });

            if (isClicked) break;
        }
    }

    mouseClickedAt(position) {
        // For Ui objects only:
        this.checkClickOnUiObjects(position);
    }

    /**
     * Removes existing game object or ui object from scene
     * @param {GameObject|UiObject} gameObject - object that you want to remove
     */

    removeGameObject(gameObject) {
        this.#assertIsGameObject(gameObject); 

        let objectIndex = this.#gameObjects.indexOf(gameObject);

        if (objectIndex != -1) {
            gameObject.onDestroy();
            this.#gameObjects.splice(objectIndex, 1);
        }
    }

    async onLoad(eventQueue, app, time) {
        this.setApp(app);
        this.#eventQueue = eventQueue;
        this.#time = time;

        this.#gameObjects.forEach(gameObject => {
            gameObject.setEventQueue(eventQueue);
            gameObject.setTimeObject(time);
            gameObject.gameContext = this.#gameContext;
            gameObject.start();
            gameObject.startModules();
        });

        if (this.#activeCamera != undefined && this.#activeCamera != null)
            this.#app.renderer.linkCamera(this.#activeCamera);

        this.#isLoaded = true;
    }

    onUnLoad() {
        this.#gameObjects.forEach(gameObject => {
            gameObject._sceneCanceled();
        });
    }

    // Устанавливаем app, чтобы давать доступ к нему игровым объектам

    setApp(app) {
        if (!(app instanceof App)) throw TypeError("You can only set app that is inherit of App");
        this.#app = app;
        this.#gameContext = new GameContext(this.#app); // Безопасный прокси-app только с необходимыми полями которые могут понадобиться gameObject
        this.#app.renderer.mapNet = this.#mapNet; // Устанавливаем рендереру текующую сетку объектов
    }

    get app() {
        return this.#app;
    }

    /**
     * Sets active camera. If another camera already set, it will be replaced.
     * @param {GameObject} cameraObject - GameObject with active 'Camera' module.
     */

    setCamera(cameraObject) {
        if (!(cameraObject instanceof GameObject)) throw new Error("Camera object must be instance of paw.GameObject");
        if (cameraObject.getModule(Camera) == undefined) throw new Error("Camera object mus contain Camera module");

        this.#activeCamera = cameraObject;
        
        if (this.#isLoaded) 
            this.#app.renderer.linkCamera(cameraObject);
    }

    /**
     * Use it to get active camera object
     * @returns {GameObject}
     */

    get activeCamera() {
        return this.#activeCamera;
    }

    get gameContext() {
        return this.#gameContext;
    }
}