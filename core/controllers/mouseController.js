import { Vector } from "../math/vector.js";

/**
 * Mouse controller class. Uses to work with mouse events
 * @class MouseController
 */


export class MouseController {
    #app
    #mouseClickFunctions

    constructor(app) {
        this.#app = app;
        this.#mouseClickFunctions = [];

        app.canvas.addEventListener("mousedown", this.mouseClickEvent.bind(this));
    }

    assertIsFunction(object, errorText) {
        if (!(typeof object === "function")) throw new TypeError(errorText);
    }

    mouseClickEvent(event) {
        const cvsWindow = this.#app.canvas.getBoundingClientRect();

        const x = event.clientX - cvsWindow.left;
        const y = event.clientY - cvsWindow.top;

        let worldPos = this.#app.renderer.screenToWorld(new Vector(x, y));

        this.#mouseClickFunctions.forEach(func => {
            func(worldPos);
        });
    }

    /**
     * Binds new function that will be called after mouse click event. Function must take {Vector} worldPos argument 
     * @param {Function} func
     */

    bindMouseClickFunction(func) {
        this.assertIsFunction(func, "Argument func must be a function in KeyController.bindMouseClickFunction(func)");

        const funcIndex = this.#mouseClickFunctions.indexOf(func);
        if (funcIndex !== -1) return;

        this.#mouseClickFunctions.push(func);
    }

    /**
     * Unbinds binded function by link
     * @param {Function} func 
     */

    unbindMouseClickFunction(func) {
        this.assertIsFunction(func, "Argument func must be a function in KeyController.unbindMouseClickFunction(func)");

        const funcIndex = this.#mouseClickFunctions.indexOf(func);

        if (funcIndex !== -1) {
            this.#mouseClickFunctions.splice(funcIndex, 1);
        }
    }
}