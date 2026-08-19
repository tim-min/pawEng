import { Module } from "../../../entities/module.js";

/**
 * Text module. Use it in GameObject or UiObject to create text
 * @class Text
 */

export class Text extends Module {
    #font
    #text
    #size

    /**
     * 
     * @param {string} text - Your text
     * if not provided uses default 'Text'
     * @param {string} font - Text font
     * if not provided uses default '24px Arial'
     * @param {Number} size - Text size
     * if not provided uses defaul 2
     */
    
    constructor(text='Text', font='24px Arial', size=2) {
        super();
        
        this.#text = text;
        this.#font = font;
        this.#size = size; // Размер у текста также в у.е (100 у.е = вся длина холста в пикс)
    }

    onRender(renderer) {
        renderer.drawText(this.owner, this.#font, this.#text, this.#size);
    }

    /**
     * Sets new text
     */

    set text(newText) {
        if (typeof newText != "string") throw Error("You can set only 'string' into text field of module Text");

        this.#text = newText;
    }

    /**
     * Sets new font
     */

    set font(newFont) {
        if (typeof newFont != "string") throw Error("You can set only 'string' into font field of module Text");
    }

    /**
     * Sets new size
     */

    set size(newSize) {
        if (!(typeof newSize === 'number' && Number.isFinite(newSize))) throw Error("You can set only float size for Text");

        this.#size = newSize;
    }
}
