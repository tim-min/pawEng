import { EventQueue } from "../utils/eventQueue.js";
import { Event } from "../event.js";
import { Vector } from "../math/vector.js";
import { ReadOnlyTime } from "../utils/time.js";
import { GameContext } from '../utils/gameContext.js';
import { getZoneTypes, Zone } from './zones/index.js';
import { Module } from './module.js';
import { RendererWorker } from "../render/rendererWorker.js";

class ObjectDestroyEvent extends Event {
    constructor(creator) {
        super(creator);
    }

    run(scene) {
        scene.removeGameObject(this.creator);
    }
}

class ModuleStartEvent extends Event { // Ивент для старта модуля. Модули подключаются во время работы игрового объекта, поэтому важно начинать их работу не сразу, а в следующую итерацию игрового цикла
    constructor(creator, module) {
        super(creator);
        this.module = module;
    }

    run(scene) {
        this.module.start()
    }
}

/**
 * Game object class
 * @class GameObject
 */

export class GameObject {
    #eventQueue;
    #modules;
    #time;
    #gameContext;
    #parent;
    #children;
    #renderLayer
    #oldTransform
    #oldWorldPosition
    #_initState
    #isActive = true
    #zones;

    /**
     * 
     * @param {Vector} position - object position (Optional)
     * if not provided uses default (0, 0) position
     * @param {Number} rotation - Object rotation (Optional)
     * if not provided uses default 0
     * @param {Vector} size - Object size (Optional)
     * if not provided uses default (0.01, 0.01) size
     * @param {Vector} scale - Object scale (Optional)
     * if not provided uses default (1, 1) scale 
     */

    constructor(position=new Vector(0, 0), rotation=0, size = new Vector(0.01, 0.01), scale=new Vector(1, 1)) {
        this.transform = {
            position: position,
            rotation: rotation,
            scale: scale,
            size: size
        }

        this.#oldWorldPosition = this.worldPosition;

        this.#modules = [];

        // Родители и дети используются только как система контейренов
        this.#parent = null;
        this.#children = [];

        this.#renderLayer = 0;

        this.#zones = new Map();
    }

    /**
     * Makes object be active or not. If object not active, it will not participate in game loop
     * @param {boolean} isActive 
     */

    setActive(isActive) {
        this.#isActive = isActive;
    }

    /**
     * Indicates if object is active or not
     */

    get isActive() {
        return this.#isActive;
    }

    /**
     * Indicates if object changed its position after last game loop iteration or not
     * @returns {boolean}
     */

    isPositionChanged() {
        if (this.#oldWorldPosition == undefined) return false;
        return (this.#oldWorldPosition.x != this.worldPosition.x || this.#oldWorldPosition.y != this.worldPosition.y);
    }

    get oldWorldPosition() {
        return this.#oldWorldPosition;
    }

    /**
     * Sets new render layer id
     * @param {Number} layerId - layer id. The smaller the number, the earlier object will be rendered
     */

    set renderLayer(layerId) {
        if (!Number.isInteger(layerId)) throw TypeError("layerId in GameObject.renderLayer must be integer");

        this.#renderLayer = layerId;
    }
    
    /**
     * Returns current render layer
     */

    get renderLayer() {
        return this.#renderLayer;
    }

    /**
     * Returns object world position. World position means position of game object according to all parents positions
     * @returns {Vector}
     */

    get worldPosition() { // Позиция объекта в мире (позиция родителя + собственная позиция)
        if (this.#parent == null) return this.transform.position.copy();
        
        let result = this.#parent.worldPosition;
        result.add(this.transform.position);

        return result;
    }

    /**
     * Returns object world scale. World scale means scale of game object according to all parents scales
     * @returns {Vector}
     */

    get worldScale() {
        if (this.#parent == null) return this.transform.scale.copy();

        let result = this.#parent.worldScale;
        result.x *= this.transform.scale.x;
        result.y *= this.transform.scale.y;

        return result;  
    }

    /**
     * Returns object world size. World position means size of game object according to all parents scales and objects own scale
     * @returns {Vector}
     */

    get worldSize() {
        if (this.#parent == null) return new Vector(this.transform.size.x*this.transform.scale.x, this.transform.size.y*this.transform.scale.y);

        let result = this.#parent.worldSize;

        result.x *= this.transform.scale.x;
        result.y *= this.transform.scale.y;

        return result;
    }

    /**
     * Returns object world rotation. World rotation means rotation of game object according to all parents rotations
     * @returns {Number}
     */

    get worldRotation() {
        if (this.#parent == null) return this.transform.rotation;

        let result = this.#parent.worldRotation;
        result += this.transform.rotation;

        return result;
    }

    /**
     * Returns array of object children
     * @returns {Array}
     */

    get children() { // Возвращает копию списка детей
        return this.#children.slice();
    }

    /**
     * Returns object parent
     * @returns {GameObject}
     */

    get parent() {
        return this.#parent;
    }

    _attachParent(parent) { // Использовать только во внутренней логике, вспомогательный метод для приклепления родителя объекту
        this.#parent = parent;
    }

    _detachParent() { // Использовать только во внутренней логике, вспомогательный метод для удаления родителя у объекта
        this.#parent = null;
    }

    /**
     * Sets new parent
     * @param {GameObject} parent
     */

    setParent(parent) { // Устанавливем родятеля объекту
        if (this.#parent == parent) return;

        if (this.#parent !== null) {
            this.#parent.removeChild(this);
        }

        parent.addChild(this);
    }

    /**
     * Adds new child
     * @param {GameObject} gameObject 
     */

    addChild(gameObject) { // Добавляем объекту ребёнка
        if (!(gameObject instanceof GameObject)) throw TypeError("You can only add child that is inherit of GameObject at GameObject.addChild");
        if (gameObject == this) throw Error("You are trying to add the same object at GameObject.addChild");
        if (this.isDescendantOf(gameObject)) throw Error("gameObject is descendant of gameObject that you are trying to add in GameObject.addChild. Cyclic parent-child relationship!");

        this.#children.push(gameObject);

        // Обновляем координаты дочернего объекта, чтобы он не улетел дальше относительно координат родителя, затем привязываем родителя
        gameObject.transform.position = new Vector(gameObject.worldPosition.x - this.worldPosition.x, gameObject.worldPosition.y - this.worldPosition.y);
        gameObject._attachParent(this);
    }

    /**
     * Removes existing child by link
     * @param {GameObject} child
     */

    removeChild(child) { // Удаление дочернего объекта. По объекту
        if (!(child instanceof GameObject)) throw TypeError("Argument of GameObject.removeChild(child) child must be GameObject as GameObject that is child that should be removed");

        const index = this.#children.indexOf(child); // Ищем объект
        if (index == -1) return;

        child.transform.position = child.worldPosition; // Обновляем его координаты, чтобы он не улетел куда-то, а остался на том же месте
        child._detachParent(); // Открепляем родителя

        this.#children.splice(index, 1); // Удаляем из списка
            
    }

    /**
     * Removes existing child by index
     * @param {Number} index  
     */

    removeChildAt(index) { // Удаление дочернего объекта. По индексу
        if (!Number.isInteger(index)) throw TypeError("Argument index in GameObject.removeChildAt(index) must be integer");

        if (index > this.#children.length-1 || index < 0) return;

        let child = this.#children[index];

        child.transform.position = child.worldPosition; // Обновляем его координаты, чтобы он не улетел куда-то, а остался на том же месте
        child._detachParent(); // Открепляем родителя

        this.#children.splice(index, 1); // Удаляем из списка 
    }

    /**
     * Removes all children
     */

    clearChildren() { // Удаляет всех детей
        this.#children.slice().forEach(child => {
            this.removeChild(child);
        });
    }

    /**
     * Indicates if object is descendant of gameObject
     * @param {GameObject} gameObject
     */

    isDescendantOf(gameObject) { // Проверка, является ли объект потомком объекта
        let current = this.parent;

        while (current) {
            if (current == gameObject) return true;
            current = current.parent;
        }

        return false;
    }

    /**
     * Called when the object is initialized and added to the game loop
     * Override this method to implement custom logic
     */

    start() {
        // Вызывается при инициализации объекта, как только он встраивается в игровой цикл
    }

    /**
     * Calles every game loop iteration if object is active and added to the active scene
     * Override it to implement custom logic
     */

    loop() {
        // Вызывается каждую итерацию игрового цикла
    }

    /**
     * Calles when object removed from active scene if object is active
     * Override it to implement custom logic
     */

    onDestroy() {
        // Вызывается при удалении объекта из игрового цикла
    }

    /**
     * Removes object from scene. After destroying, onDestroy() method will be called
     */

    destroy() {
        // Если хотим удалить элемент, кладём ивент удаления в очередь ивентов, которую затем обработает Game
        this.createEvent(new ObjectDestroyEvent(this));
    }

    /**
     * Adds new module
     * @param {Module} module 
     * @returns {Module} - added module
     */

    addModule(module) {
        if (!(module instanceof Module)) throw TypeError("You can only add inherit of [Module]");
        this.#modules.forEach(_module => {
            if (module.constructor === _module.constructor) throw Error('You are trying to add module that already exists in GameObject');
        });
        
        module.owner = this;
        this.#modules.push(module);

        try {
            this.createEvent(new ModuleStartEvent(this, module));
        } catch {
            // Сцена ещё не загружена, можно не создавать ивент со стартом модуля
        }

        return module;
    }          
                 
    setEventQueue(eventQueue) {
        if (!(eventQueue instanceof EventQueue)) throw TypeError("eventQeueue of GameObject.setEventQueue must be inherit of [EventQueue]");

        this.#eventQueue = eventQueue;
    }

    setTimeObject(time) {
        if (!(time instanceof ReadOnlyTime)) throw TypeError("time object must be inherit of ReadOnlyTime in GameObject.setTimeObject");

        this.#time = time;
    }

    /**
     * Returns object to work with time utils
     * @returns {ReadOnlyTime}
     */

    get time() {
        return this.#time;
    }
    
    /**
     * Creates new event that will be proccesed after game loop iteration
     * @param {Event} event 
     */

    createEvent(event) {
        if (this.#eventQueue == null || this.#eventQueue === undefined) throw Error("You can not create events until scene did not initialized GameObject");
        if (!(event instanceof Event)) throw TypeError("You may only create events that are inherit of [Event] in GameObject.createEvent");

        this.#eventQueue.push(event);
    }

    startModules() {
        this.#modules.forEach(module => {
            module.start();
        });
    }


    proccessModules() {
        this.#modules.forEach(module => {
            if (module.isActive) module.loop();
        });
    }

    loopAll() {
        this.worldPosition.copyTo(this.#oldWorldPosition); // Сохраняем текущую позицию в мире как старую
        this.proccessModules();
        this.loop();
    }

    /**
     * Returns existing module by its type
     * @param {typeof Module} type 
     * @returns {Module}
     */

    getModule(type) {
        return this.#modules.find(m => m instanceof type);
    }

    set gameContext(_gameContext) {
        if (!(_gameContext instanceof GameContext)) throw TypeError("GameContext must be inherit of paw.GameContext");

        this.#gameContext = _gameContext;
    }

    get gameContext() {
        return this.#gameContext;
    }

    renderAll(renderer) { // Метод запускает событие onRender у всех привязанных модулей, передавая renderer
        this.#modules.forEach(module => {
            if (module.isActive) module.onRender(renderer);
        });

        this.onRender(renderer);
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

    onSceneCanceled() {
        // Вызывается когда сцена на котором находится объект перестает быть активной
    }

    _sceneCanceled() {
        // Сбрасываем состояние объекта до состояния при инициализации если сцена перестает быть активной

        this.onSceneCanceled();

        this.#modules.forEach(module => {
            module.onSceneCanceled();
        });
    }

    /**
     * Returns array of all active zones by type
     * @param {Number} zoneType 
     * @returns {Array}
     */

    getZones(zoneType) {
        let zones = this.#zones.get(zoneType);
        return (zones != undefined) ? zones : [];
    }

    /**
     * Adds new zone
     * @param {Number} zoneType 
     * @param {Zone} zone 
     */

    addZone(zoneType, zone) {
        if (!(zone instanceof Zone)) throw Error("You can only add object as zone if it is instance of paw.Zone");

        const currentZoneTypes = getZoneTypes();

        if (!Object.entries(currentZoneTypes).map(([key, value]) => value).includes(zoneType)) throw Error("You are trying to add new zone with a type that you did not register, use paw.registerZoneType");

        if (this.#zones.get(zoneType) == undefined)
            this.#zones.set(zoneType, [zone]);
        else {
            this.#zones.get(zoneType).add(zone);
        }
    }
}

