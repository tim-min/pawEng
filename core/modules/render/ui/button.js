import { Module } from "../../../entities/module.js";
import { SquareZone } from "../../../entities/zones/types/index.js";
import { getZoneTypes } from "../../../entities/zones/main.js";
import { Vector } from "../../../math/vector.js";
import { Zone } from "../../../entities/zones/zone.js";

/**
 * Button module. Use it to add click zone to your GameObject or UiObject
 * @class Button
 */

export class Button extends Module {
    #zone

    /**
     * 
     * @param {Vector|{x: Number, y: Number}} size - Size of click zone (required).
     * @param {Function} triggerFunc - Function that will be called if player clicks button (optional).
     * @param {Array} triggerFuncArgs - Array of arguments of triggerFunc (optional). 
     */
    constructor(size, triggerFunc=(()=>(1)), triggerFuncArgs=[]) {
        super();
        this.checkSize(size);
        this.#zone = new SquareZone(size.x, size.y, triggerFunc, triggerFuncArgs);
    }

    checkSize(size) {
        if (!(size instanceof Vector)) throw Error("Size must be a Vector");
    }

    start() {
        if (this.#zone) this.owner.addZone(getZoneTypes().CLICK, this.#zone);
    }

    /**
     * Changes click zone size
     * @param {Vector|{x: Number, y: Number}} newSize
     */

    changeSize(newSize) {
        this.checkSize(newSize);
        this.#zone.changeSize(newSize.x, newSize.y);
    }

    /**
     * Sets new function that will be called after click
     * @param {Function} func 
     * @param {Array} args - new function args (optional). 
     */

    setTriggerFunc(func, args=[]) {
        this.#zone.changeTriggerFunction(func, args);
    }
}
