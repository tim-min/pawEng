/**
 * @file Game. Основной класс, управляет игровым циклом, сценами
 * @author tim-min
 * @version 1.5.0
 * @license GPL-3.0-or-later
*/


import * as utils from './utils/index.js';
import * as controllers from './controllers/mouseController.js';
import { Renderer } from "./render/renderer.js";
import { Scene } from "./scene.js";
import { App } from './app.js';

/**
 * Main engine class. Use it to init your game and work with other systems
 * @class Game
 */

export class Game {
    #windowRatio
    #app
    #scenes
    #activeScene;
    #eventQueue;
    #time;
    #readOnlyTime;
    #renderer;
    #animationFrameId = null;
    #resizeHandler = null;
    #mouseController = null;

    /**
     * 
     * @param {Number} windowRatio - aspect ratio of the game window (e.g., 16/9).
     * @param {function(new:Renderer)} renderer - the renderer class to instantiate.
     * if not provided, uses the default Renderer class.
     */

    constructor(windowRatio, renderer=Renderer) {
        this.#windowRatio = windowRatio;
        this.#app = null;

        this.#eventQueue = null;

        this.#scenes = [];
        this.#activeScene = null;

        this.#renderer = renderer;
    }

    /**
     * Inits game
     */

    async init() {
        this.stop();

        if (this.#resizeHandler) {
            window.removeEventListener('resize', this.#resizeHandler);
            this.#resizeHandler = null;
        }

        // Инициализация
        await this.#initCvs();

        // Создаем очередь событий. Будем очищать её при каждой смене сцены
        this.#eventQueue = new utils.EventQueue();

        // Создаем объект отвечающий за время
        this.#time = new utils.time.Time();
        this.#readOnlyTime = new utils.time.ReadOnlyTime(this.#time);

        // Запуск игрового цикла
        this.#animationFrameId = requestAnimationFrame(() => this.#gameLoop());

        // Инициализация контроллера нажатий
        this.#mouseController = new controllers.MouseController(this.#app);
    }

    #getCvsSize() {
        // Ищем подходящие размеры окна под нужное соотношкеие сторон

        let width = window.innerWidth;
        let height = window.innerHeight;

        if (width / height > this.#windowRatio) width = height * this.#windowRatio;
        else height = width / this.#windowRatio;

        return [width, height];
    }

    async #initCvs() {
        const [width, height] = this.#getCvsSize();

        this.#app = new App(width, height, this.#renderer, this.#windowRatio);

        let gameContainer = document.getElementById('game-container');
        if (!gameContainer) {
            gameContainer = document.createElement('div');
            gameContainer.id = 'game-container';
            document.body.appendChild(gameContainer);
        }

        gameContainer.appendChild(this.#app.canvas);

        const styleTag = document.createElement('style');
        styleTag.innerHTML = `
        html, body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            width: 100%;
            height: 100%;
        }
        body {
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
            cursor: default;
        }
        #game-container {
            width: 100vw;
            height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            overflow: hidden;
        }
        canvas {
            display: block;
        }
    `;
        document.head.appendChild(styleTag);

        // Обработка ресайза окна
        
        if (this.#resizeHandler) {
            window.removeEventListener('resize', this.#resizeHandler);
        }

        this.#resizeHandler = () => {
            const [newWidth, newHeight] = this.#getCvsSize();
            this.#app.renderer.resize(newWidth, newHeight);
        };

        window.addEventListener('resize', this.#resizeHandler);
    }

    #gameLoop() {
        // Основной игровой цикл. Игра идёт, если есть загруженная сцена
        if (this.#activeScene == null || this.#activeScene === undefined) return;
        if (!this.#activeScene.isLoaded) return;

        this.#time.frameCheck();

        // Первым делом обрабатываем отложенные события, которые накопились за прошлую итерацию, затем снова выполняем loop активной сцены
        this.#processEvents();
        this.#activeScene?.loop();

        // Сохраняем ID текущего цикла
        this.#animationFrameId = requestAnimationFrame(() => this.#gameLoop());
    }

    stop() {
        if (this.#animationFrameId !== null) {
            cancelAnimationFrame(this.#animationFrameId);
            this.#animationFrameId = null;
        }
    }

    /**
     * Stops all work
     */

    destroy() {
        this.stop();
        if (this.#resizeHandler) {
            window.removeEventListener('resize', this.#resizeHandler);
            this.#resizeHandler = null;
        }
        this.#app?.destroy();
        this.#activeScene = null;
        this.#scenes = [];
        this.#eventQueue = null;
    }

    #processEvents() {
        // Функция обработки накопленных событий. Достаем следующий, выполняем Event.run. Обязательно передаем активную сцену.
        // Зачастую отложенные события или создают/инициализируют новый объект/модуль, для этого бывает нужна ссылка на объект сцены

        let event = this.#eventQueue.pop();

        while (event != null) {
            event.run(this.#activeScene);
            event = this.#eventQueue.pop();
        }
    }

    /**
     * Creates a new scene
     * @param {string} name - The name of your new scene
     * @returns {Scene} Created scene object
     */

    createScene(name) {
        let scene = new Scene(name);
        this.#scenes.push(scene);

        return scene;
    }

    /**
     * Loads existing scene
     * @param {string} name - The name of your created scene, that you want to load
     */

    async loadScene(name) {
        // Загружаем новую активную сцену по её имени. Предполагается, что сначала создали сцену (createScene), а уже потом можно её загрузить, 
        // не принципиально, есть на ней объекты или нет

        let foundScene = this.#scenes.find(scene => scene.name === name);
        if (foundScene === undefined) throw new Error(`Can not find any scenes with name [{name}]`);

        if (this.#activeScene !== null) {
            this.#activeScene.onUnLoad();
            this.#app.renderer.unlinkCamera();
        }

        this.#activeScene = foundScene;

        // Обязательно ждём, пока на сцене загрузятся все объекты. Сцена также должна знать об очереди событий
        await this.#activeScene.onLoad(this.#eventQueue, this.#app, this.#readOnlyTime);

        this.#mouseController.bindMouseClickFunction(this.#activeScene.mouseClickedAt.bind(this.#activeScene));

        // Отмечаем время, в которое загрузилась сцена
        this.#time.sceneLoaded();
    }

    /**
     * Returns active scene
     * @returns {Scene}
     */

    get activeScene() {
        return this.#activeScene;
    }

    setCamera(cameraObject) {
        console.log("WARNING: setCamera moved to scene, use scene.setCamera(cameraObject) to link new camera to each scene instead")
    }

    /**
     * Returns active mouse controller
     * @returns {MouseController}
     */

    get mouseController() {
        return this.#mouseController;
    }
}