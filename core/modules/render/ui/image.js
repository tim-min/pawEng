import { Module } from "../../../entities/module.js";

/**
 * Image rendering module. Use it in GameObject or UiObject to draw an image
 * @class ImageRenderer
 */

export class ImageRenderer extends Module {
    #img

    /**
     * 
     * @param {string} src - source of your image 
     */
    constructor(src) {
        super();
        
        this.#img = new Image();
        this.#img.src = src;
    }

    onRender(renderer) {
        renderer.drawImage(this.owner, this.#img);
    }
}
