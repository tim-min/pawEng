import { Vector } from "./vector.js";
import { Camera, GameObject } from './gameObject.js';

export class RendererQueue {
    #objects;

    constructor() {
        this.#objects = [];
    }

    push(object) {
        if (!(object instanceof GameObject)) {
            throw new TypeError("You can only add game objects that inherit from GameObject");
        }

        // if (this.#objects.length == 0) {
        //     this.#objects.push(object);
        //     return;
        // }

        // for (let x=0; x<this.#objects.length; x++) {
        //     if (x == this.#objects.length-1) {
        //         this.#objects.push(object);
        //         break;
        //     }

        //     if (this.#objects[x+1].renderLayer >= object.renderLayer) {
        //         this.#objects.splice(x+1, 0, object);
        //         break;
        //     }
        // }

        this.#objects.push(object);
    }

    minRenderLayerObjectId() {
        let result = 0;

        for (let x=0; x<this.#objects.length; x++) {
            if (this.#objects[x].renderLayer < this.#objects[result].renderLayer) result = x;
        }

        return result;
    }

    pop() {
        if (this.#objects.length == 0) return null;

        let nextId = this.minRenderLayerObjectId();
        let nextObject = this.#objects[nextId];
        this.#objects.splice(nextId, 1);

        return nextObject;
    }

    clear() {
        this.#objects = [];
    }
}

export class Renderer {
    // Отвечает за рендеринг, хранит в себе активную камеру
    #cvs
    #ctx
    #worldWidth
    #worldHeight
    #workingCamera;
    #mapNet = null;

    constructor(cvs, worldHeight = 100) {
        this.#cvs = cvs;
        this.#ctx = cvs.getContext('2d');
        this.#worldHeight = worldHeight
        this.#worldWidth = worldHeight * (cvs.width / cvs.height)
    }

    set mapNet(mapNet) {
        this.#mapNet = mapNet;
    }

    linkCamera(newCamera) {
        // Устанавливает текущую активную камеру. По текущей камере можно определять положение объекта в пространстве в пикселях для рендера, его размер в пикселях
        this.#workingCamera = newCamera;
    }

    unlinkCamera() {
        this.#workingCamera = null;
    }

    resize(newWidth, newHeight) { // Обязательная обработка ресайза окна
        this.#cvs.width = newWidth
        this.#cvs.height = newHeight
        this.#ctx = this.#cvs.getContext('2d')

        // Считаем новую компоненту длины экрана по принципу: 1 текущая высота экрана в пикселях = this.worldHeight => 1 текующая длина = this.worldHeight * (длина/высота)
        this.#worldWidth = this.#worldHeight * (newWidth / newHeight)
    }

    get scale() {
        // Текущее отношение (сколько пикселей реального холста в 1 единице координатной системы)
        return this.#cvs.width / this.#worldWidth
    }

    get worldSize() {
        // Размер мира в условных единицах
        return new Vector(this.#worldWidth, this.#worldHeight);
    }

    get screenSize() {
        return new Vector(this.#cvs.width, this.#cvs.height);
    }

    get workingCamera() {
        return this.#workingCamera;
    }

    screenToWorld(vector) {
        return new Vector(vector.x/this.scale, vector.y/this.scale);
    }

    worldToScreenPosition(vector, uiSpace = false) {
        // Отображение вектора условных единиц в вектор пикселей (положение в пространстве)

        // const s = this.scale;
        // return new Vector(vector.x * s, vector.y * s)


        // Если нет активной камеры, либо если нужны координаты в пространстве ui, принимаем за камеру центр мира (0, 0)
        if (this.#workingCamera == null || uiSpace == true) return new Vector(vector.x * this.scale, vector.y * this.scale);

        return this.#workingCamera.getModule(Camera).worldToScreenPosition(vector, this.scale, this.worldSize);
    }

    worldToScreenSize(vector, uiSpace=false) {
        if (this.#workingCamera == null || uiSpace == true) return new Vector(vector.x * this.scale, vector.y * this.scale);

        return this.#workingCamera.getModule(Camera).worldToScreenSize(vector, this.scale);
    }

    worldToScreenRotation(deg, uiSpace=false) {
        if (this.#workingCamera == null || uiSpace == true) return deg * Math.PI/180;

        return this.#workingCamera.getModule(Camera).worldToScreenRotation(deg) * Math.PI/180;
    }

    // drawRect(position, size, color, uiSpace=false) {
    //     this.#ctx.fillStyle = color;

    //     const screenPos  = this.worldToScreen(position, uiSpace);
    //     const screenSize = new Vector(size.x * this.scale, size.y * this.scale);

    //     this.#ctx.fillRect(screenPos.x, screenPos.y, screenSize.x, screenSize.y);
    // }

    translateCtx(screenPos) {
        this.#ctx.translate(screenPos.x, screenPos.y);
    }

    rotateCtx(angle) {
        this.#ctx.rotate(angle);
    }

    drawRect(gameObject, color, uiSpace=false) {
        this.#ctx.save()
        this.#ctx.fillStyle = color;

        const screenPos  = this.worldToScreenPosition(gameObject.worldPosition, uiSpace);
        const screenSize = this.worldToScreenSize(gameObject.worldSize, uiSpace);
        const screenRotation = this.worldToScreenRotation(gameObject.worldRotation, uiSpace);

        this.#ctx.translate(screenPos.x, screenPos.y);
        this.#ctx.rotate(screenRotation);
        this.#ctx.fillRect(-screenSize.x/2, -screenSize.y/2, screenSize.x, screenSize.y);
        this.#ctx.restore();
    }

    drawEllipse(gameObject, color, startAngle=0, endAngle=360, uiSpace=false) {
        const screenPos  = this.worldToScreenPosition(gameObject.worldPosition, uiSpace);
        const screenSize = this.worldToScreenSize(gameObject.worldSize, uiSpace);
        const screenRotation = this.worldToScreenRotation(gameObject.worldRotation, uiSpace);

        this.#ctx.beginPath();
        this.#ctx.ellipse(screenPos.x, screenPos.y, screenSize.x, screenSize.y, screenRotation, startAngle*Math.PI/180, endAngle*Math.PI/180);
        this.#ctx.fillStyle = color;
        this.#ctx.fill();
        this.#ctx.strokeStyle = color;
        this.#ctx.stroke();
    }

    drawImage(gameObject, img, uiSpace=false) {
        this.#ctx.save()

        const screenPos  = this.worldToScreenPosition(gameObject.worldPosition, uiSpace);
        const screenSize = this.worldToScreenSize(gameObject.worldSize, uiSpace);
        const screenRotation = this.worldToScreenRotation(gameObject.worldRotation, uiSpace);

        this.#ctx.translate(screenPos.x, screenPos.y);
        this.#ctx.rotate(screenRotation);
        this.#ctx.drawImage(img, -screenSize.x/2, -screenSize.y/2, screenSize.x, screenSize.y);
        this.#ctx.restore();
    }

    drawImage(gameObject, img, sx, sy, sw, sh, uiSpace=false) {
        this.#ctx.save()

        const screenPos  = this.worldToScreenPosition(gameObject.worldPosition, uiSpace);
        const screenSize = this.worldToScreenSize(gameObject.worldSize, uiSpace);
        const screenRotation = this.worldToScreenRotation(gameObject.worldRotation, uiSpace);

        this.#ctx.translate(screenPos.x, screenPos.y);
        this.#ctx.rotate(screenRotation);
        this.#ctx.drawImage(img, sx, sy, sw, sh, -screenSize.x/2, -screenSize.y/2, screenSize.x, screenSize.y);
        this.#ctx.restore();
    }

    clearAll() {
        if (this.#workingCamera == null) this.#ctx.fillStyle = "purple";
        else this.#ctx.fillStyle = this.#workingCamera.getModule(Camera).background_color;

        this.#ctx.fillRect(0, 0, this.worldSize.x*this.scale, this.worldSize.y*this.scale);
    }
}

export class RendererWorker {
    // Специальный воркер рендера, который по сути является прокси классом для предоставления безопасного доступа только к определенным методам.
    // Также обладает методами для обеспечения временного доступа к себе

    #originalRenderer;
    #uiSpace;

    constructor(original, uiSpace=false) {
        this.#originalRenderer = original;
        this.#uiSpace = uiSpace;
    }

    destroy() {
        this.#originalRenderer = null;
    }

    isAlive() {
        return this.#originalRenderer != null;
    }

    // drawRect(position, size, color) {
    //     if (!this.isAlive()) throw Error("Renderer worker is no longer available. You can use renderer only in GameObject.onRender()")
    //     this.#originalRenderer.drawRect(position, size, color, this.#uiSpace);
    // }

    drawRect(gameObject, color) {
        if (!this.isAlive()) throw Error("Renderer worker is no longer available. You can use renderer only in GameObject.onRender()")
        this.#originalRenderer.drawRect(gameObject, color, this.#uiSpace);
    }

    drawEllipse(gameObject, color, startAngle=0, endAngle=360) {
        if (!this.isAlive()) throw Error("Renderer worker is no longer available. You can use renderer only in GameObject.onRender()")
        this.#originalRenderer.drawEllipse(gameObject, color, startAngle, endAngle, this.#uiSpace);
    }

    drawImage(gameObject, img) {
        if (!this.isAlive()) throw Error("Renderer worker is no longer available. You can use renderer only in GameObject.onRender()")
        this.#originalRenderer.drawImage(gameObject, img, this.#uiSpace);
    }

    drawImage(gameObject, img, sx, sy, sw, sh) {
        if (!this.isAlive()) throw Error("Renderer worker is no longer available. You can use renderer only in GameObject.onRender()")
        this.#originalRenderer.drawImage(gameObject, img, sx, sy, sw, sh, this.#uiSpace);
    }
}
