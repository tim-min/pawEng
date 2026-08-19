import { Module } from "../../entities/module.js";
import { Vector } from '../../math/vector.js';

/**
 * Camera module. Use it in GameObject to create new camera
 * @class Camera
 */

export class Camera extends Module {
    #zoom;
    #background_color;

    /**
     * 
     * @param {string} background_color - Background color
     * if not provided, uses default 'white' color
     * @param {Number} zoom - Camera zoom.
     * If not provided, will be default 1 
     */
    constructor(background_color="white", zoom=1) {
        super();
        this.#zoom = zoom;
        this.#background_color = background_color;
    }

    /**
     * Returns current bg color
     */

    get background_color() {
        return this.#background_color;
    }

    /**
     * Sets new bg color
     */

    set background_color(background_color) {
        this.#background_color = background_color;
    }

    worldToScreenCoord(coord, screenScale) {
        return coord * screenScale * this.#zoom;
    }

    worldToScreenPosition(vector, screenScale, worldSize) {
        const dx = vector.x - this.owner.worldPosition.x;
        const dy = vector.y - this.owner.worldPosition.y;

        const angle = -this.owner.worldRotation * Math.PI / 180;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        const rotatedX = dx * cos - dy * sin;
        const rotatedY = dx * sin + dy * cos;

        const screenX = (rotatedX + worldSize.x / 2 / this.#zoom) * screenScale * this.#zoom;
        const screenY = (rotatedY + worldSize.y / 2 / this.#zoom) * screenScale * this.#zoom;

        return new Vector(screenX, screenY);
    }

    worldToScreenSize(vector, screenScale) {
        // Переводит размер из условных единиц в пиксели с учетом зума камеры

        return new Vector(vector.x * screenScale * this.#zoom, vector.y * screenScale * this.#zoom);
    }

    worldToScreenRotation(deg) {
        // Считает поворот в градусах с учетом поворота камеры

        return deg - this.owner.worldRotation;
    }
}
