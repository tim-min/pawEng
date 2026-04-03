import { Scene } from "./scene.js";
import { GameObject, Camera } from "./gameObject.js";
import { Time, ReadOnlyTime } from './time.js'
import { Renderer, RendererWorker } from "./renderer.js";
import { Vector } from './vector.js';


export class Event {
    #creator;

    constructor(creator) {
        // Ивент обязательно должен знать о своём создателе. Все ивенты работают в первую очередь с теми, кто их создал

        if (!(creator instanceof GameObject)) throw TypeError("Event creator must be inherit of [GameObject]");

        this.#creator = creator;
    }

    run(scene) {
        // Тут прописывается функционал ивента. Также обязательно принимаем ссылку на сцену, которая обрабатывает этот ивент, иначе какой тогда смысл?
    }

    get creator() {
        return this.#creator;
    }
}

export class EventQueue {
    // Очередь событий. Должна обязательно быть на активной сцене для обеспечения взаимодействия объектов со сценой. 
    // Нельзя позволять каждому объекту знать о том, на какой сцене он сейчас находится, поэтому обрабатываем какие-то вещи только через отдельные события, 
    // которые вызываются до циклов объектов

    #events = [];

    push(event) {
        if (!(event instanceof Event)) throw TypeError("Event must be inherit of [Event]");

        this.#events.push(event);
    }

    pop() {
        let event = this.#events[0];
        this.#events.splice(0, 1);

        return event;
    }
}

export class App {
    #canvas
    #ctx
    #renderer

    constructor(width, height, renderer, scale) {
        this.#canvas = document.createElement('canvas');
        this.#canvas.width = width;
        this.#canvas.height = height;

        this.#renderer = new renderer(this.#canvas);
    }

    get canvas() {
        return this.#canvas;
    }

    destroy() {
        this.#canvas.remove();
    }

    getRendererWorker() { // Создание нового прокси-рендерера
        let newWorker = new RendererWorker(this.#renderer);
        return newWorker;
    }

    getUiRendererWorker() {
        let newWorker = new RendererWorker(this.#renderer, true);
        return newWorker;
    }

    get renderer() {
        return this.#renderer;
    }
}

export class GameContext { // Прокси-класс от App. Дает безопасный доступ к основным переменным игрового мира, например размер
    #app

    constructor(app) {
        this.#app = app;
    }

    get worldSize() {
        return this.#app.renderer.worldSize;
    }
}

class MouseController {
    #app
    #mouseClickFunctions

    constructor(app) {
        this.#app = app;
        this.#mouseClickFunctions = [];

        app.canvas.addEventListener("mousedown", this.mouseClickEvent.bind(this));
    }

    assertIsFunction(object, errorText) {
        if (!(typeof object === "function")) throw new TypeError(errorText);
    }

    mouseClickEvent(event) {
        const cvsWindow = this.#app.canvas.getBoundingClientRect();

        const x = event.clientX - cvsWindow.left;
        const y = event.clientY - cvsWindow.top;

        let worldPos = this.#app.renderer.screenToWorld(new Vector(x, y));

        this.#mouseClickFunctions.forEach(func => {
            func(worldPos);
        });
    }

    bindMouseClickFunction(func) {
        this.assertIsFunction(func, "Argument func must be a function in KeyController.bindMouseClickFunction(func)");

        const funcIndex = this.#mouseClickFunctions.indexOf(func);
        if (funcIndex !== -1) return;

        this.#mouseClickFunctions.push(func);
    }

    unbindMouseClickFunction(func) {
        this.assertIsFunction(func, "Argument func must be a function in KeyController.unbindMouseClickFunction(func)");

        const funcIndex = this.#mouseClickFunctions.indexOf(func);

        if (funcIndex !== -1) {
            this.#mouseClickFunctions.splice(funcIndex, 1);
        }
    }
}

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

    constructor(windowRatio, renderer=Renderer) {
        this.#windowRatio = windowRatio;
        this.#app = null;

        this.#eventQueue = null;

        this.#scenes = [];
        this.#activeScene = null;

        this.#renderer = renderer;
    }

    async init() {
        this.stop();

        if (this.#resizeHandler) {
            window.removeEventListener('resize', this.#resizeHandler);
            this.#resizeHandler = null;
        }

        // Инициализация
        await this.#initCvs();

        // Создаем очередь событий. Будем очищать её при каждой смене сцены
        this.#eventQueue = new EventQueue();

        // Создаем объект отвечающий за время
        this.#time = new Time();
        this.#readOnlyTime = new ReadOnlyTime(this.#time);

        // Запуск игрового цикла
        this.#animationFrameId = requestAnimationFrame(() => this.#gameLoop());

        // Инициализация контроллера нажатий
        this.#mouseController = new MouseController(this.#app);
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

    createScene(name) {
        let scene = new Scene(name);
        this.#scenes.push(scene);

        return scene;
    }

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

    setCamera(cameraObject) {
        if (!(cameraObject instanceof GameObject)) throw new Error("Camera object must be instance of paw.GameObject");
        if (cameraObject.getModule(Camera) == undefined) throw new Error("Camera object mus contain Camera module");

        this.#app.renderer.linkCamera(cameraObject);
    }

    get mouseController() {
        return this.#mouseController;
    }
}