import { Zone } from '../zone.js';

export class SquareZone extends Zone {
    #width;
    #height;

    constructor(width, height, triggerFunction=(()=>1), triggerFunctionArgs=[]) {
        super(triggerFunction, triggerFunctionArgs);
        this.#width = width;
        this.#height = height;
    }

    containsPoint(currentCenter, point, callTriggerFunction=false) {
        this.checkVector(point);
        this.checkVector(currentCenter);

        let result = point.x > (currentCenter.x - this.#width/2) && point.x < (currentCenter.x + this.#width/2) 
                && point.y > (currentCenter.y - this.#height/2) && point.y < (currentCenter.y + this.#height/2);

        if (result && callTriggerFunction) 
            this.callTriggerFunction();

        return result;
    }

    changeSize(newWidth, newHeight) {
        this.#width = newWidth;
        this.#height = newHeight;
    }
}