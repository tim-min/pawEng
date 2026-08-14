// Зоны. Функции на поле, которые могут описать какую-либо область. Может быть окружностью, областью, 
// заключенной внутри квадрата и вообще любым замкнутым пространством. 
// Используются для подсчета коллизий, кликов и т.п

import { Vector } from "./vector.js";


// Обозначим типы зон для того чтобы не нагружать движок проверкой каждой зоны на объекте при любом действии.

let ZONE_TYPES = {
   _count: 1,
   CLICK: 0
}

export function registerZoneType(name) {
    if (ZONE_TYPES[name] !== undefined) throw new Error(`Zone type with name '${name}' already exists`);

    ZONE_TYPES[name] = ZONE_TYPES._count;
    ZONE_TYPES._count += 1;
}

export function getZoneTypes() {
    const ztCopy = { ...ZONE_TYPES };
    delete ztCopy._count;
    return ztCopy;
}

export class Zone {
    #triggerFunction;
    #triggerFunctionArgs;

    constructor(triggerFunction=(()=>1), triggerFunctionArgs=[]) {
        this.checkTriggerFunction(triggerFunction);
        this.#triggerFunction = triggerFunction;
        this.#triggerFunctionArgs = triggerFunctionArgs;
    }

    checkTriggerFunction(triggerFunction) {
        if (typeof triggerFunction != "function") throw Error("You can only set object which type is 'function' as zone trigger function");
    }

    changeTriggerFunction(newTriggerFunction) {
        this.checkTriggerFunction(newTriggerFunction);
    }

    checkVector(vector) {
        if (!(vector instanceof Vector)) throw Error("You can only user vector which is instance of paw.Vector inside Zone class");
    }

    containsPoint(currentCenter, point, callTriggerFunction=false) {}

    callTriggerFunction() {
        this.#triggerFunction(...this.#triggerFunctionArgs);
    }
}

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
}

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