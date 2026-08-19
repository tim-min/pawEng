import { Zone } from '../zone.js';

export class CircleZone extends Zone {
    #radius;

    constructor(radius, triggerFunction=(()=>1), triggerFunctionArgs=[]) {
        super(triggerFunction, triggerFunctionArgs);
        this.#radius = radius;
    }

    containsPoint(currentCenter, point, callTriggerFunction=false) {
        this.checkVector(point);
        this.checkVector(currentCenter);

        let result = ((point.x - currentCenter.x)**2 + (point.y - currentCenter.y)**2) <= this.#radius**2;
        console.log(result)

        if (result && callTriggerFunction)
            this.callTriggerFunction();
        
        return result;
    }
}