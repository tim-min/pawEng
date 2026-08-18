export class Vector {
    #x;
    #y;
    constructor (x, y) {
        this.#x = x;
        this.#y = y;
    }

    add (other) {
        if (!(other instanceof Vector)) 
            throw new TypeError("Argument 'other' must be instance of Vector");

        let other_values = other.values();

        this.#x += other_values[0];
        this.#y += other_values[1];
    }

    distance (other) {
        if (!(other instanceof Vector)) 
            throw new TypeError("Argument 'other' must be instance of Vector");

        return sqrt(abs(this.x-other.x)+abs(this.y-other.y));
    }

    values() {
        return [this.#x, this.#y];
    }

    copy() {
        return new Vector(this.#x, this.#y);
    }

    copyTo(destination) {
        if (!(destination instanceof Vector)) throw new TypeError("Argument 'destination' must be instance of Vector");

        destination.x = this.#x;
        destination.y = this.#y;
    }

    get x() {
        return this.#x;
    }

    get y() {
        return this.#y;
    }

    set x(newX) {
        this.#x = newX;
    }

    set y(newY) {
        this.#y = newY;
    }
}