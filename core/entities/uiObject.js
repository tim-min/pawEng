import { GameObject } from "./gameObject.js";
import { Vector } from "../math/vector.js";

/**
 * Ui object class
 * @class UiObject
 */

export class UiObject extends GameObject{

    /**
     * 
     * @param {Vector} position - object position (Optional).
     * If not provided uses default (0, 0) position.
     * @param {Number} rotation - object rotation (Optional).
     * If not provided uses default 0 value.
     * @param {Vector} size - object size (Optional).
     * If not provided uses default (0.01, 0.01) size.
     * @param {Vector} scale - object scale (Optional).
     * If not provided uses default (1, 1) scale 
     */

    constructor(position=new Vector(0, 0), rotation=0, size = new Vector(0.01, 0.01), scale=new Vector(1, 1)) {
        super(position, rotation, size, scale);
    }
}