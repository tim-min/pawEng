// Зоны. Функции на поле, которые могут описать какую-либо область. Может быть окружностью, областью, 
// заключенной внутри квадрата и вообще любым замкнутым пространством. 
// Используются для подсчета коллизий, кликов и т.п

import { Vector } from "../../math/vector.js";

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

    changeTriggerFunction(newTriggerFunction, newArgs) {
        this.checkTriggerFunction(newTriggerFunction);
        this.#triggerFunction = newTriggerFunction;
        this.#triggerFunctionArgs = newArgs;
    }

    checkVector(vector) {
        if (!(vector instanceof Vector)) throw Error("You can only user vector which is instance of paw.Vector inside Zone class");
    }

    containsPoint(currentCenter, point, callTriggerFunction=false) {}

    callTriggerFunction() {
        this.#triggerFunction(...this.#triggerFunctionArgs);
    }
}