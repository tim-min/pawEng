import { Module } from "../../../gameObject.js";
import { getZoneTypes } from "../../../zones.js";


export class Button extends Module {
    #zone;

    constructor(zone) {
        super();
        this.#zone = zone;
    }

    start() {
        if (this.#zone) this.owner.addZone(getZoneTypes().CLICK, this.#zone);
    }
}
