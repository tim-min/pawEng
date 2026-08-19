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

        let other_values = other.values();

        this.#x += other_values[0];
        this.#y += other_values[1];
    }

    /**
     * Returns distance to other vector
     * @param {Vector} other 
     * @returns  {Number}
     */

    distance (other) {
        if (!(other instanceof Vector)) 
            throw new TypeError("Argument 'other' must be instance of Vector");

        return sqrt(abs(this.x-other.x)+abs(this.y-other.y));
    }

    /**
     * Returns vector values in array
     * @returns {Array}
     */

    values() {
        return [this.#x, this.#y];
    }

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

    get x() {
        return this.#x;
    }

    /**
     * Gets vector y
     */

    get y() {
        return this.#y;
    }

    /**
     * Sets new x
     */

    set x(newX) {
        this.#x = newX;
    }

    /**
     * Sets new y
     */

    set y(newY) {
        this.#y = newY;
    }
}