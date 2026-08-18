import { Module } from "../../../gameObject.js";
import { getZoneTypes, SquareZone } from "../../../zones.js";
import { Vector } from "../../../math/vector.js";


export class Button extends Module {
    #zone
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

    changeSize(newSize) {
        this.checkSize(newSize);
        this.#zone.changeSize(newSize.x, newSize.y);
    }

    setTriggerFunc(func, args) {
        this.#zone.changeTriggerFunction(func, args);
    }
}
