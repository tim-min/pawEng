import { Module } from "../../gameObject.js";


export class Text extends Module {
    #font
    #text
    #size

    constructor(text='Text', font='24px Arial', size=2) {
        super();
        
        this.#text = text;
        this.#font = font;
        this.#size = size; // Размер у текста также в у.е (100 у.е = вся длина холста в пикс)
    }

    onRender(renderer) {
        renderer.drawText(this.owner, this.#font, this.#text, this.#size);
    }

    set text(newText) {
        if (typeof newText != "string") throw Error("You can set only 'string' into text field of module Text");

        this.#text = newText;
    }

    set font(newFont) {
        if (typeof newFont != "string") throw Error("You can set only 'string' into font field of module Text");
    }

    set size(newSize) {
        if (!(typeof newSize === 'number' && Number.isFinite(newSize))) throw Error("You can set only float size for Text");

        this.#size = newSize;
    }
}
