/**
 * Vector class
 * @class Vector
 */

export class Vector {
    #x;
    #y;

    /**
     * 
     * @param {Number} x 
     * @param {Number} y 
     */

    constructor (x, y) {
        this.#x = x;
        this.#y = y;
    }

    /**
     * Sums other vector
     * @param {Vector} other 
     */

    add (other) {
        if (!(other instanceof Vector)) 
            throw new TypeError("Argument 'other' must be instance of Vector");

        this.#x += other.x;
        this.#y += other.y;
    }

    /**
     * Returns distance to other vector
     * @param {Vector} other 
     * @returns  {Number}
     */

    distance (other) {
        if (!(other instanceof Vector)) 
            throw new TypeError("Argument 'other' must be instance of Vector");

        const dx = this.#x - other.x;
        const dy = this.#y - other.y;
        
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Returns vector values in array
     * @returns { x: Number, y: Number }
     */

    values() { return { x: this.#x, y: this.#y }; }

    /**
     * Returns copy
     * @returns {Vector}
     */

    copy() {
        return new Vector(this.#x, this.#y);
    }

    /**
     * Copies vector to other vector
     * @param {Vector} destination 
     */

    copyTo(destination) {
        if (!(destination instanceof Vector)) throw new TypeError("Argument 'destination' must be instance of Vector");

        destination.x = this.#x;
        destination.y = this.#y;
    }

    /**
     * Gets vector x
     */

    get x() { return this.#x; }

    /**
     * Gets vector y
     */

    get y() { return this.#y; }

    /**
     * Sets new x
     */

    set x(newX) { this.#x = newX; }

    /**
     * Sets new y
     */

    set y(newY) { this.#y = newY; }
}