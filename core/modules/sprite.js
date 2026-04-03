import { Module } from "../gameObject.js";


export class Sprite extends Module {
    #img
    #currentFrame
    #imgSize
    #imgLoaded=false
    #rows
    #columns
    #frameWidth
    #frameHeight

    constructor(src, columns, rows) {
        super();
        
        this.#img = new Image();
        this.#img.src = src;

        this.#currentFrame = {
            x: 0,
            y: 0,
        }

        this.#img.onload = () => {
            this.#imgLoaded = true;
            this.#frameWidth = this.#img.width / this.#columns;
            this.#frameHeight = this.#img.height / this.#rows;
        }

        this.#rows = rows
        this.#columns = columns
    }

    setCurrentFrame(x, y) {
        this.#currentFrame.x = x;
        this.#currentFrame.y = y;
    }

    get currentFrame() {
        return this.#currentFrame
    }

    onRender(renderer) {
        if (!this.#imgLoaded) return;

        renderer.drawImage(this.owner, this.#img, this.#currentFrame.x * this.#frameWidth, this.#currentFrame.y * this.#frameHeight, this.#frameWidth, this.#frameHeight)
    }
}
