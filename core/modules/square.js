import { Module } from "../gameObject.js";
import { Event } from "../game.js";


export class Square extends Module {
    #color
    constructor(color='blue') {
        super();
        this.color = color;
    }

    get color() {
        return this.#color;
    }

    set color(color) {
        if (!(typeof color === "string")) throw TypeError("Color must be string in Square.color");
        this.#color = color;
    }

    onRender(renderer) {
        renderer.drawRect(this.owner, this.#color);
    }
}
