import { Module } from "../../entities/module.js";
import { Event } from "../../event.js";

/**
 * Square module. You can add it to your GameObject or UiObject to draw a square
 * @class Square
 */

export class Square extends Module {
    #color

    /**
     * 
     * @param {string} color - Color of square
     * if not provided, uses default 'blue' color
     */
    constructor(color='blue') {
        super();
        this.color = color;
    }

    /**
     * returns current color
     */

    get color() {
        return this.#color;
    }

    /**
     * Set new color
     */

    set color(color) {
        if (!(typeof color === "string")) throw TypeError("Color must be string in Square.color");
        this.#color = color;
    }

    onRender(renderer) {
        renderer.drawRect(this.owner, this.#color);
    }
}
