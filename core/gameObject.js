import { EventQueue } from "./game.js";
import { Event } from "./game.js";
import { Vector } from "./vector.js";
import { ReadOnlyTime } from "./time.js";
import {App, GameContext} from './game.js';

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

export class GameObject {
    #eventQueue;
    #modules;
    #time;
    #gameContext;
    #position;
    #rotation;
    #scale;
    #size;
    #parent;
    #children;
    #renderLayer
    #oldTransform
    #oldWorldPosition
    #_initState
    #isActive = true

    constructor(position=new Vector(0, 0), rotation=0, size = new Vector(0.01, 0.01), scale=new Vector(1, 1)) {
        this.#position = position;
        this.#rotation = rotation;
        this.#scale = scale;
        this.#size = size;

        this.transform = {
            position: this.#position,
            rotation: this.#rotation,
            scale: this.#scale,
            size: this.#size
        }

        this.#oldWorldPosition = this.worldPosition;

        this.#modules = [];

        // Родители и дети используются только как система контейренов
        this.#parent = null;
        this.#children = [];

        this.#renderLayer = 0;
    }

    setActive(isActive) {
        this.#isActive = isActive;
    }

    get isActive() {
        return this.#isActive;
    }

    isPositionChanged() {
        if (this.#oldWorldPosition == undefined) return false;
        return (this.#oldWorldPosition.x != this.worldPosition.x || this.#oldWorldPosition.y != this.worldPosition.y);
    }

    // get oldTransform() { // Старый transform с предыдущей итерации loop
    //     return this.#oldTransform;
    // }

    get oldWorldPosition() {
        return this.#oldWorldPosition;
    }

    set renderLayer(layerId) {
        if (!Number.isInteger(layerId)) throw TypeError("layerId in GameObject.renderLayer must be integer");

        this.#renderLayer = layerId;
    }

    get renderLayer() {
        return this.#renderLayer;
    }

    get worldPosition() { // Позиция объекта в мире (позиция родителя + собственная позиция)
        if (this.#parent == null) return this.transform.position.copy();
        
        let result = this.#parent.worldPosition;
        result.add(this.transform.position);

        return result;
    }

    get worldScale() {
        if (this.#parent == null) return this.transform.scale.copy();

        let result = this.#parent.worldScale;
        result.x *= this.transform.scale.x;
        result.y *= this.transform.scale.y;

        return result;
    }

    get worldSize() {
        if (this.#parent == null) return new Vector(this.transform.size.x*this.transform.scale.x, this.transform.size.y*this.transform.scale.y);

        let result = this.#parent.worldSize;

        result.x *= this.transform.scale.x;
        result.y *= this.transform.scale.y;

        return result;
    }

    get worldRotation() {
        if (this.#parent == null) return this.transform.rotation;

        let result = this.#parent.worldRotation;
        result += this.transform.rotation;

        return result;
    }

    get children() { // Возвращает копию списка детей
        return this.#children.slice();
    }

    get parent() {
        return this.#parent;
    }

    _attachParent(parent) { // Использовать только во внутренней логике, вспомогательный метод для приклепления родителя объекту
        this.#parent = parent;
    }

    _detachParent() { // Использовать только во внутренней логике, вспомогательный метод для удаления родителя у объекта
        this.#parent = null;
    }

    setParent(parent) { // Устанавливем родятеля объекту
        if (this.#parent == parent) return;

        if (this.#parent !== null) {
            this.#parent.removeChild(this);
        }

        parent.addChild(this);
    }

    addChild(gameObject) { // Добавляем объекту ребёнка
        if (!(gameObject instanceof GameObject)) throw TypeError("You can only add child that is inherit of GameObject at GameObject.addChild");
        if (gameObject == this) throw Error("You are trying to add the same object at GameObject.addChild");
        if (this.isDescendantOf(gameObject)) throw Error("gameObject is descendant of gameObject that you are trying to add in GameObject.addChild. Cyclic parent-child relationship!");

        this.#children.push(gameObject);

        // Обновляем координаты дочернего объекта, чтобы он не улетел дальше относительно координат родителя, затем привязываем родителя
        gameObject.transform.position = new Vector(gameObject.worldPosition.x - this.worldPosition.x, gameObject.worldPosition.y - this.worldPosition.y);
        gameObject._attachParent(this);
    }

    removeChild(child) { // Удаление дочернего объекта. По объекту
        if (!(child instanceof GameObject)) throw TypeError("Argument of GameObject.removeChild(child) child must be GameObject as GameObject that is child that should be removed");

        const index = this.#children.indexOf(child); // Ищем объект
        if (index == -1) return;

        child.transform.position = child.worldPosition; // Обновляем его координаты, чтобы он не улетел куда-то, а остался на том же месте
        child._detachParent(); // Открепляем родителя

        this.#children.splice(index, 1); // Удаляем из списка
            
    }

    removeChildAt(index) { // Удаление дочернего объекта. По индексу
        if (!Number.isInteger(index)) throw TypeError("Argument index in GameObject.removeChildAt(index) must be integer");

        if (index > this.#children.length-1 || index < 0) return;

        let child = this.#children[index];

        child.transform.position = child.worldPosition; // Обновляем его координаты, чтобы он не улетел куда-то, а остался на том же месте
        child._detachParent(); // Открепляем родителя

        this.#children.splice(index, 1); // Удаляем из списка 
    }

    clearChildren() { // Удаляет всех детей
        this.#children.slice().forEach(child => {
            this.removeChild(child);
        });
    }

    isDescendantOf(gameObject) { // Проверка, является ли объект потомком объекта
        let current = this.parent;

        while (current) {
            if (current == gameObject) return true;
            current = current.parent;
        }

        return false;
    }

    start() {
        // Вызывается при инициализации объекта, как только он встраивается в игровой цикл
    }

    loop() {
        // Вызывается каждую итерацию игрового цикла
    }

    onDestroy() {
        // Вызывается при удалении объекта из игрового цикла
    }

    destroy() {
        // Если хотим удалить элемент, кладём ивент удаления в очередь ивентов, которую затем обработает Game
        
    

        this.createEvent(new ObjectDestroyEvent(this));
    }

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

    get time() {
        return this.#time;
    }

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
        // this.#oldTransform = {
        //     position: this.transform.position.copy(),
        //     rotation: this.transform.rotation.copy(),
        //     scale: this.transform.scale.copy()
        // }
        this.worldPosition.copyTo(this.#oldWorldPosition); // Сохраняем текущую позицию в мире как старую
        //this.#oldWorldPosition = this.worldPosition.copy();
        this.proccessModules();
        this.loop();
    }

    getModule(type) {
        return this.#modules.find(m => m instanceof type);
    }

    set gameContext(_gameContext) { // Сеттер для сцены. App устанавливается каждый раз когда объект добавляется на сцену
        if (!(_gameContext instanceof GameContext)) throw TypeError("GameContext must be inherit of paw.GameContext");

        this.#gameContext = _gameContext;
    }

    get gameContext() {
        return this.#gameContext;
    }

    renderAll(renderer) { // Метод запускает событие onRender у всех привязонных модулей, передавая renderer
        this.#modules.forEach(module => {
            if (module.isActive) module.onRender(renderer);
        });

        this.onRender(renderer);
    }

    onRender(renderer) {

    }

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
}

export class UiObject extends GameObject{
    constructor(position=new Vector(0, 0), rotation=new Vector(0, 0), scale=new Vector(0.01, 0.01)) {
        super(position, rotation, scale);
    }

    onClick() {}
    onHover() {}
    onHold() {}
}

export class Module {
    #owner;
    #isLoaded;
    #_initState;
    #isActive = true;

    constructor() {
    }

    setActive(isActive) {
        this.#isActive = isActive;
    }

    get isActive() {
        return this.#isActive;
    }

    start() {}

    loop() {}

    onDestroy() {}

    remove() {}

    get owner() {
        return this.#owner;
    }

    set owner(owner) {
        if (!(owner instanceof GameObject)) throw TypeError("You can only set object as Module owner if it inherit of GameObject");

        this.#owner = owner;
    }

    get isLoaded() {
        return this.#isLoaded;   
    }

    onRender(renderer) {

    }

    onSceneCanceled() {

    }
}

export class Camera extends Module {
    #zoom;
    #background_color;

    constructor(background_color="white", zoom=1) {
        super();
        this.#zoom = zoom;
        this.#background_color = background_color;
    }

    // worldToScreenPosition(vector, screenScale, worldSize) {
    //     // Переводит позицию из условных единиц в пиксели с учетом позиции камеры

    //     // return new Vector((vector.x - this.owner.transform.position.x + worldSize.x/2) * screenScale, (vector.y - this.owner.transform.position.y + worldSize.y/2) * screenScale);
    //     let result = new Vector((vector.x - this.owner.worldPosition.x + worldSize.x/this.#zoom/2) * screenScale * this.#zoom, (vector.y - this.owner.worldPosition.y + worldSize.y/this.#zoom/2) * screenScale * this.#zoom)
    //     return result;
    // }

    get background_color() {
        return this.#background_color;
    }

    set background_color(background_color) {
        this.#background_color = background_color;
    }

    worldToScreenPosition(vector, screenScale, worldSize) {
        const dx = vector.x - this.owner.worldPosition.x;
        const dy = vector.y - this.owner.worldPosition.y;

        const angle = -this.owner.worldRotation * Math.PI / 180;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        const rotatedX = dx * cos - dy * sin;
        const rotatedY = dx * sin + dy * cos;

        const screenX = (rotatedX + worldSize.x / 2 / this.#zoom) * screenScale * this.#zoom;
        const screenY = (rotatedY + worldSize.y / 2 / this.#zoom) * screenScale * this.#zoom;

        return new Vector(screenX, screenY);
    }

    worldToScreenSize(vector, screenScale) {
        // Переводит размер из условных единиц в пиксели с учетом зума камеры

        return new Vector(vector.x * screenScale * this.#zoom, vector.y * screenScale * this.#zoom);
    }

    worldToScreenRotation(deg) {
        // Считает поворот в градусах с учетом поворота камеры

        return deg - this.owner.worldRotation;
    }
}
