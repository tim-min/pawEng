import { GameObject, UiObject } from "./gameObject.js";
import { App, GameContext } from './game.js';
import { RendererQueue } from "./renderer.js";
import { Vector } from './vector.js';


class MapNet {
    #cellSize;
    #cells;
    #objects;

    constructor(cellSize=100) {
        this.#cellSize = cellSize;
        this.#cells = new Map(); // Клетка на поле (строка "x, y") : список объектов в этой клетке
        this.#objects = new Map(); // Ссылка на объект : Клетка (структура {x: x, y: y})
    }

    get cellSize() {
        return this.#cellSize;
    }

    #assertIsGameObject(obj) {
        if (!(obj instanceof GameObject)) {
            throw new TypeError("You can only add game objects that inherit from GameObject");
        }
    }

    #assertIsVector(obj) {
        if (!(obj instanceof Vector)) {
            throw new TypeError(`${obj} object is not paw.Vector`);
        }
    }

    calculateCell(position) { // Возвращает координаты клетки на основе позиции
        this.#assertIsVector(position);

        let cell = {
            x: Math.ceil(position.x/this.#cellSize),
            y: Math.ceil(position.y/this.#cellSize)
        }
        return cell;
    }

    calculateObjectCells(gameObject) {
        // Возвращает список всех клеток, в которых находится объект

        let result = [];

        let centralCell = this.calculateCell(gameObject.worldPosition);
        let newCell;

        for (let x=-(Math.ceil(gameObject.worldSize.x/2/this.#cellSize)); x<(Math.ceil(gameObject.worldSize.x/2/this.#cellSize)); x++) {
            for (let y=-(Math.ceil(gameObject.worldSize.y/2/this.#cellSize)); y<(Math.ceil(gameObject.worldSize.y/2/this.#cellSize)); y++) {
                newCell = {
                    x: centralCell.x+x,
                    y: centralCell.y+y,
                }

                result.push(newCell);
            }
        }

        return result;

    }

    getObjectsInCell(cell) { // Возвращает список объектов в клетке
        return this.#cells.get(`${cell.x}, ${cell.y}`);
    }

    updateObject(object) { // Обновляет позицию объекта в сетке
        this.#assertIsGameObject(object);
        if (!object.isPositionChanged() && !(this.#objects.get(object) === undefined)) return; // Если объект не двигался, ничего не делаем
        let objectCells = this.calculateObjectCells(object); // Считаем все клетки, в которых находится объект

        // let cell = this.calculateCell(object.worldPosition); // В какой клетке сейчас находится объект
        // if (this.getObjectsInCell(cell) != undefined && this.getObjectsInCell(cell).includes(object)) return; // Если объект и так уже записан в этой клетке, ничего не делаем

        if (objectCells.every(cell => 
            this.getObjectsInCell(cell) != undefined && this.getObjectsInCell(cell).includes(object)
        )) return; // Если в каждой из клеток объект уже и так записан, то ничего не трогаем

        // let oldCell = this.calculateCell(object.oldWorldPosition); // В какой клетке он находился до изменения движения
        // this.removeObject(oldCell, object); // Удаляем объект из старой клетки

        // let oldCell = this.#objects.get(object);
        // if (oldCell != undefined && oldCell != null) this.removeObject(oldCell, object);

        // Смотрим предыдущие клетки в которые мы записывали объект
        let oldCells = this.#objects.get(object);

        // Если такие есть, то удаляем их них объект
        if (oldCells != undefined) {
            oldCells.forEach(cell => {
                if (cell != null) this.removeObject(cell, object);
            });
        }

        // this.addObject(cell, object);

        // Обновляем список клеток в которых есть объект в #objects и записываем объект в новые клетки в #cells
        this.#objects.set(object, []);
        objectCells.forEach(cell => {
            this.addObject(cell, object);
        });

        // Также обновляем клетки для детей, так как их позиция поменялась в итерацию цикла на момент родителя, 
        // а после выполнения их собственного loop получится так, что они не изменили свою позицию
        object.children.forEach(gameObject => {
            this.updateObject(gameObject);
        });
    }

    getObjectsNearby(position, radiusX=1, radiusY=1) {
        // Возвращает список объектов которые находятся в клетках вокруг заданной позиции с радиусом (в клетках) radiusX, radiusY

        this.#assertIsVector(position);

        let cell = this.calculateCell(position); // Считаем центральную клетку по заданной позиции

        let result = [];

        for (let x=-radiusX; x<radiusX+1; x++) {
            for (let y=-radiusY; y<radiusY+1; y++) {
                let foundObjects = this.#cells.get(`${cell.x+x}, ${cell.y+y}`);
                if (foundObjects == undefined) continue;

                // Записываем только те объекты, которые ещё не были записаны и которые активны
                // Дубликаты могут попадаться в связи с тем, что большой объект может быть одновременно в нескольких клетках

                foundObjects.forEach(gameObject => {if (!result.includes(gameObject) && gameObject.isActive) result.push(gameObject);});
            }
        }

        return result;
    }

    removeObject(cell, object) {
        // Удаляет объект из клетки

        let objects = this.#cells.get(`${cell.x}, ${cell.y}`);
        if (objects == undefined) return;

        this.#cells.set(`${cell.x}, ${cell.y}`, objects.filter( el => el !== object));
        this.#objects.set(object, null);
    }

    addObject(cell, object) {
        // Записывает объект в заданную клетку

        let objectsInCell = this.getObjectsInCell(cell);

        if (objectsInCell == undefined) {
            this.#cells.set(`${cell.x}, ${cell.y}`, [object]);
        } else {
            objectsInCell.push(object);
        }

        // this.#objects.set(object, cell);

        // Также обновляем у объекта список клеток, в которых он находится
        if (this.#objects.get(object) == undefined) this.#objects.set(object, [cell]);
        else this.#objects.get(object).push(cell);
    }
}


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
    #mapNet;

    constructor(name) {
        this.#name = name;
        this.#gameObjects = [];
        this.#rendererQueue = new RendererQueue();

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

    getObjectsNearby(position, radiusX=1, radiusY=1) {
        this.#assertIsVector(position);

        return this.#mapNet.getObjectsNearby(position, radiusX, radiusY);
    }

    get isLoaded() {
        return this.#isLoaded;
    }

    get name() {
        return this.#name;
    }

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
            // this.renderGameObject(gameObject);
            // this.setObjectToRenderQueue(gameObject);
        });

        this.updateRendererQueue();
        await this.renderObjects();
    }

    updateRendererQueue() {
        let cellsInScreenX = Math.ceil(this.#app.renderer.screenSize.x / (this.#mapNet.cellSize * this.#app.renderer.scale));
        let cellsInScreenY = Math.ceil(this.#app.renderer.screenSize.y / (this.#mapNet.cellSize * this.#app.renderer.scale));

        let cameraPos = this.#app.renderer.workingCamera != null ? this.#app.renderer.workingCamera.worldPosition : new Vector(0, 0);
        let objectsToRender = this.getObjectsNearby(cameraPos, cellsInScreenX, cellsInScreenY);

        objectsToRender.forEach(gameObject => {
            if (!gameObject.isActive) return;

            this.setObjectToRenderQueue(gameObject);
        });

        this.#gameObjects.filter( object => object instanceof UiObject).forEach(object => {
            this.setObjectToRenderQueue(object);
        });
    }

    setObjectToRenderQueue(object) {
        this.#rendererQueue.push(object);
    }

    renderObjects() {
        let next = this.#rendererQueue.pop();

        while (next != null) {
            //console.log("Rendering gameObject " + next.renderLayer);
            this.renderGameObject(next);
            next = this.#rendererQueue.pop();
        }
    }

    async renderGameObject(gameObject) { // Тут отдаем объекту прокси-рендерер и затем удаляем чтобы объект не смог использовать его после сохранения
        let worker;

        if (gameObject instanceof UiObject) {
            worker = this.#app.getUiRendererWorker();
        } else {
            worker = this.#app.getRendererWorker();
        }

        await gameObject.renderAll(worker);
        worker.destroy();
    }

    addGameObject(gameObject) {
        this.#assertIsGameObject(gameObject); 

        if (this.#gameObjects.find(m => m === gameObject)) throw Error("You are trying to add GameObject that is already in scene");

        this.#gameObjects.push(gameObject);

        if (!this.#isLoaded) return;

        gameObject.setEventQueue(this.#eventQueue);
        gameObject.setTimeObject(this.#time);
        gameObject.gameContext = this.#gameContext;
        gameObject.start();
        gameObject.startModules();
    }

    clear() {
        this.#gameObjects.forEach(gameObject => {
            gameObject.onDestroy();
        });

        this.#gameObjects = [];
    }

    mouseClickedAt(position) {
        this.#gameObjects.forEach(gameObject => {
            
            if (gameObject instanceof UiObject) {

                if (position.x >= gameObject.worldPosition.x-gameObject.worldSize.x/2 && position.x <= gameObject.worldPosition.x+gameObject.worldSize.x/2 && 
                    position.y >= gameObject.worldPosition.y-gameObject.worldSize.y/2 && position.y <= gameObject.worldPosition.y+gameObject.worldSize.y/2) {
                    gameObject.onClick();
                }

            }

        });
    }

    removeGameObject(gameObject) {
        this.#assertIsGameObject(gameObject); 

        let objectIndex = this.#gameObjects.indexOf(gameObject);

        if (objectIndex != -1) {
            gameObject.onDestroy();
            this.#gameObjects.splice(objectIndex, 1);
        }
    }

    // mouseClickEvent(event) {
    //     const cvsWindow = this.#app.canvas.getBoundingClientRect();

    //     const x = event.clientX - cvsWindow.left;
    //     const y = event.clientY - cvsWindow.top;

    //     let worldPos = this.#app.renderer.screenToWorld(new Vector(x, y));

    //     console.log("Clicked to " + worldPos.x + "," + worldPos.y);
    // }

    async onLoad(eventQueue, app, time) {
        // this.#app = app;
        // this.#gameContext = new GameContext(this.#app);
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

        this.#isLoaded = true;

        // app.canvas.addEventListener("mousedown", this.mouseClickEvent.bind(this));
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

    // set app(app) {
    //     if (!(app instanceof App)) throw TypeError("You can only set app that is inherit of App");
    //     this.#app = app;
    //     this.#gameContext = new GameContext(this.#app); // Безопасный прокси-app только с необходимыми полями которые могут понадобиться gameObject
    // }

    get app() {
        return this.#app;
    }
}