import { Vector } from '../math/index.js';
import { GameObject } from '../entities/gameObject.js';
import { Camera } from "../modules/main/camera.js";
import { UiObject } from '../entities/uiObject.js';

export class RendererQueue {
    #objects;

    constructor() {
        this.#objects = [];
    }

    push(object) {
        if (!(object instanceof GameObject)) {
            throw new TypeError("You can only add game objects that inherit from GameObject");
        }

        let ind = this.#objects.findIndex(x => x.renderLayer < object.renderLayer);

        if (ind === -1) {
            this.#objects.push(object);
        } else {
            this.#objects.splice(ind, 0, object);
        }
    }

    pop() {
        if (this.#objects.length == 0) return null;

        let result = this.#objects[this.#objects.length-1];
        this.#objects.splice(this.#objects.length-1, 1);

        return result;
    }

    getSortedArray() {
        return this.#objects;
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

    constructor(cvs, startWidth, startHeight, worldHeight = 100) {
        this.#cvs = cvs;
        this.#ctx = cvs.getContext('2d');

        this.resizeCanvas(startWidth, startHeight);

        this.#worldHeight = worldHeight;
        this.#worldWidth = worldHeight * (this.#cvs.width / this.#cvs.height);
    }

    resizeCanvas(width, height) {
        // Увеличиваем холст во столько раз сколько плотность пикселей на экране пользователя
        const cvsToScale = window.devicePixelRatio || 1;
        this.#cvs.width = width * cvsToScale;
        this.#cvs.height = height * cvsToScale;

        // Сжимаем реальный размер окна обратно
        this.#cvs.style.width = width + "px";
        this.#cvs.style.height = height + "px";

        this.#ctx.scale(cvsToScale, cvsToScale); 
        this.#ctx.save();
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
        this.resizeCanvas(newWidth, newHeight);

        // Считаем новую компоненту длины экрана по принципу: 1 текущая высота экрана в пикселях = this.worldHeight => 1 текующая длина = this.worldHeight * (длина/высота)
        this.#worldWidth = this.#worldHeight * (newWidth / newHeight)
    }

    get scale() {
        // Текущее отношение (сколько пикселей реального холста в 1 единице координатной системы)
        return this.#cvs.width / this.#worldWidth / (window.devicePixelRatio || 1)
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

        // Если нет активной камеры, либо если нужны координаты в пространстве ui, принимаем за камеру центр мира (0, 0)
        if (this.#workingCamera == null || uiSpace == true) return new Vector(vector.x * this.scale, vector.y * this.scale);

        return this.#workingCamera.getModule(Camera).worldToScreenPosition(vector, this.scale, this.worldSize);
    }

    worldToScreenSize(vector, uiSpace=false) {
        if (this.#workingCamera == null || uiSpace == true) return new Vector(vector.x * this.scale, vector.y * this.scale);

        return this.#workingCamera.getModule(Camera).worldToScreenSize(vector, this.scale);
    }

    worldToScreenCoord(coord, uiSpace=false) {
        if (this.#workingCamera == null || uiSpace == true) return coord * this.scale;

        return this.#workingCamera.getModule(Camera).worldToScreenCoord(coord, this.scale);
    }

    worldToScreenRotation(deg, uiSpace=false) {
        if (this.#workingCamera == null || uiSpace == true) return deg * Math.PI/180;

        return this.#workingCamera.getModule(Camera).worldToScreenRotation(deg) * Math.PI/180;
    }

    translateCtx(screenPos) {
        this.#ctx.translate(screenPos.x, screenPos.y);
    }

    rotateCtx(angle) {
        this.#ctx.rotate(angle);
    }

    getObjectTransform(gameObject, uiSpace) {
        const screenPos  = this.worldToScreenPosition(gameObject.worldPosition, uiSpace);
        const screenSize = this.worldToScreenSize(gameObject.worldSize, uiSpace);
        const screenRotation = this.worldToScreenRotation(gameObject.worldRotation, uiSpace);

        return [screenPos, screenSize, screenRotation];
    }

    setDottedLine(hatchLen=10, spaceLen=5, lineWidth=3, color='white') {
        this.#ctx.setLineDash([hatchLen, spaceLen]); 
        this.#ctx.lineWidth = lineWidth;
        this.#ctx.strokeStyle = color;
    }


    drawRect(gameObject, color, fill=true, dotted=false, uiSpace=false) {
        this.#ctx.save()
        this.#ctx.fillStyle = color;
        this.#ctx.strokeStyle = color;

        if (dotted) this.setDottedLine(color=color);

        const [screenPos, screenSize, screenRotation] = this.getObjectTransform(gameObject, uiSpace);

        this.#ctx.translate(screenPos.x, screenPos.y);
        this.#ctx.rotate(screenRotation);
        
        if (fill) this.#ctx.fillRect(-screenSize.x/2, -screenSize.y/2, screenSize.x, screenSize.y);
        else this.#ctx.strokeRect(-screenSize.x/2, -screenSize.y/2, screenSize.x, screenSize.y);
        
        this.#ctx.restore();
    }

    drawEllipse(gameObject, color, startAngle=0, endAngle=360, uiSpace=false) {
        const [screenPos, screenSize, screenRotation] = this.getObjectTransform(gameObject, uiSpace);

        this.#ctx.beginPath();
        this.#ctx.ellipse(screenPos.x, screenPos.y, screenSize.x, screenSize.y, screenRotation, startAngle*Math.PI/180, endAngle*Math.PI/180);
        this.#ctx.fillStyle = color;
        this.#ctx.fill();
        this.#ctx.strokeStyle = color;
        this.#ctx.stroke();
    }

    drawImage(gameObject, img, uiSpace=false) {
        this.#ctx.save()

        const [screenPos, screenSize, screenRotation] = this.getObjectTransform(gameObject, uiSpace);

        this.#ctx.translate(screenPos.x, screenPos.y);
        this.#ctx.rotate(screenRotation);
        this.#ctx.drawImage(img, -screenSize.x/2, -screenSize.y/2, screenSize.x, screenSize.y);
        this.#ctx.restore();
    }

    drawImage(gameObject, img, sx, sy, sw, sh, uiSpace=false) {
        this.#ctx.save()

        const [screenPos, screenSize, screenRotation] = this.getObjectTransform(gameObject, uiSpace);

        this.#ctx.translate(screenPos.x, screenPos.y);
        this.#ctx.rotate(screenRotation);
        this.#ctx.drawImage(img, sx, sy, sw, sh, -screenSize.x/2, -screenSize.y/2, screenSize.x, screenSize.y);
        this.#ctx.restore();
    }

    drawText(gameObject, font, text, size, uiSpace=false) {
        const [screenPos, screenSize, screenRotation] = this.getObjectTransform(gameObject, uiSpace);

        this.#ctx.font = font;

        // Актуальный размер шрифта в пикселях 
        const match = this.#ctx.font.match(/([\d.]+)px/);
        const currentFontSize = match ? parseFloat(match[1]) : 0;

        // Считаем на сколько его нужно увеличить относительно заданного размера в уе
        const screenFontSize = this.worldToScreenCoord(size); // Размер из уе в пиксели
        const scale = screenFontSize / currentFontSize;

        
        const textHeight = this.#ctx.measureText(text).fontBoundingBoxAscent + this.#ctx.measureText(text).fontBoundingBoxDescent;

        this.#ctx.save();
        this.#ctx.scale(scale, scale);

        this.#ctx.translate(screenPos.x / scale, screenPos.y / scale + textHeight);
        this.#ctx.textAlign = "center";
        this.#ctx.textBaseline = "middle";
        this.#ctx.rotate(screenRotation);

        this.#ctx.fillStyle = "white";
        this.#ctx.fillText(text, 0, 0);
        this.#ctx.restore();
    }

    clearAll() {
        if (this.#workingCamera == null) this.#ctx.fillStyle = "purple";
        else this.#ctx.fillStyle = this.#workingCamera.getModule(Camera).background_color;

        this.#ctx.fillRect(0, 0, this.worldSize.x*this.scale, this.worldSize.y*this.scale);
    }
}

