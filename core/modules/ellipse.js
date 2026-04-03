import { Module } from "../gameObject.js";
import { Event } from "../game.js";


export class Ellipse extends Module {
    #color
    constructor(color='blue', startAngle=0, endAngle=360) {
        super();
        this.#color = color;
        this.startAngle = startAngle;
        this.endAngle = endAngle;
    }

    get color() {
        return this.#color;
    }

    set color(color) {
        if (!(typeof color === "string")) throw TypeError("Color must be string in Square.color");
        this.#color = color;
    }

    onRender(renderer) {
        renderer.drawEllipse(this.owner, this.#color, this.startAngle, this.endAngle);
    }
}
