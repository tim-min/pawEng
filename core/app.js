import { Renderer } from "./render/renderer.js";
import { RendererWorker } from "./render/rendererWorker.js";

export class App {
    #canvas
    #ctx
    #renderer

    constructor(width, height, renderer, scale) {
        this.#canvas = document.createElement('canvas');

        this.#renderer = new renderer(this.#canvas, width, height);
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

    getUiRendererWorker() { // Отдельный новый прокси-рендерер для ui объектов
        let newWorker = new RendererWorker(this.#renderer, true);
        return newWorker;
    }

    get renderer() {
        return this.#renderer;
    }
}