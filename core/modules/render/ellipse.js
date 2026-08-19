import { Module } from "../../entities/module.js";
import { Event } from "../../event.js";

/**
 * Ellipse module. Use it in GameObject or UiObject to create ellipse
 * @class Ellipse
 */

export class Ellipse extends Module {
    #color

    /**
     * 
     * @param {string} color - Ellipse color
     * if not provided uses default 'blue' color
     * @param {Number} startAngle 
     * @param {Number} endAngle 
     */

    constructor(color='blue', startAngle=0, endAngle=360) {
        super();
        this.#color = color;
        this.startAngle = startAngle;
        this.endAngle = endAngle;
    }

    /**
     * Returns current color
     */

    get color() {
        return this.#color;
    }

    /**
     * Sets new color
     */

    set color(color) {
        if (!(typeof color === "string")) throw TypeError("Color must be string in Square.color");
        this.#color = color;
    }

    onRender(renderer) {
        renderer.drawEllipse(this.owner, this.#color, this.startAngle, this.endAngle);
    }
}
