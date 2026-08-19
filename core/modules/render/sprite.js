import { Module } from "../../entities/module.js";

/**
 * Sprite module. Use it in GameObject or UiObject to create sprite
 * @class Sprite
 */


export class Sprite extends Module {
    #img
    #currentFrame
    #imgSize
    #imgLoaded=false
    #rows
    #columns
    #frameWidth
    #frameHeight

    /**
     * 
     * @param {string} src - src of sprite sheet image 
     * @param {Number} columns - sprite sheet columns count 
     * @param {Number} rows - sprite sheet rows count
     */

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

    /**
     * Changes current sprite sheet frame
     * @param {Number} x - Frame column
     * @param {Number} y - Frame row
     */

    setCurrentFrame(x, y) {
        this.#currentFrame.x = x;
        this.#currentFrame.y = y;
    }

    /**
     * Returns current frame
     * @returns { {x: Number, y: Number} } - Current frame coords.
     */

    get currentFrame() {
        return this.#currentFrame
    }

    onRender(renderer) {
        if (!this.#imgLoaded) return;

        renderer.drawImage(this.owner, this.#img, this.#currentFrame.x * this.#frameWidth, this.#currentFrame.y * this.#frameHeight, this.#frameWidth, this.#frameHeight)
    }
}
