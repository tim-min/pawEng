import { Module } from "../gameObject.js";


export class ImageRenderer extends Module {
    #img

    constructor(src) {
        super();
        
        this.#img = new Image();
        this.#img.src = src;
    }

    onRender(renderer) {
        renderer.drawImage(this.owner, this.#img);
    }
}
