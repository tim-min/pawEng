import { Module } from "../../entities/module.js";

/**
 * Animator state class
 * @class AnimationState
 */

class AnimationState { // Структура для хранения этапа анимации. 
    constructor(timePoint, action) {
        if (typeof timePoint !== "number" || timePoint < 0) throw new Error("AnimationState.timePoint must be not negative number");
        if (typeof action !== "function") throw new Error("AnimationState.action must be a function");

        this.timePoint = timePoint; // Точка на временной линии анимации в мс
        this.action = action; // Функция которая должна выполниться
        this.played = false;
    }
}

/**
 * Animation class
 * @class Animation
 */


class Animation { // Анимация. Хранит и проигрывает этапы
    #states;
    #duration;
    #name;
    #timePassed;
    #cyclesToPlay;
    #currentState;
    #playInf;
    #currentStateId;

    constructor(name) {
        if (typeof name !== "string") throw new Error("Animation.name must be a string");

        this.#states = [];
        this.#duration = 0;

        this.#cyclesToPlay = 0;
        this.#playInf = false;

        this.#timePassed = 0;

        this.#name = name;

        this.#currentStateId = 0;
    }

    /**
     * Returns animation name
     */

    get name() {
        return this.#name;
    }

    /**
     * Adds new state to animation
     * @param {Number} timePoint - Animation state point in time line 
     * @param {Function} action - Function that will be called in time point
     */

    addState(timePoint, action) { // Добавляем новый этап и сразу считаем, не изменилась ли длительность анимации
        let newState = new AnimationState(timePoint, action);
        this.#states.push(newState);

        if (timePoint > this.#duration) this.#duration = timePoint;

        this.#states.sort((a, b) => a.timePoint - b.timePoint);
    }

    /**
     * Get animation duration
     */

    get duration() {
        return this.#duration;
    }

    /**
     * Starts playing animation
     * @param {Number} cycles - Play cycles count.
     * If not provided, animation will be playing till you don't stop it
     */

    play(cycles = -1) {
        if (!Number.isInteger(cycles)) throw new Error("cycles at Animation.play(cycles) must be int");


        if (cycles == -1) this.#playInf = true;
        else {
            this.#playInf = false;
            this.#cyclesToPlay = cycles;
        }

        this._restore();
    }

    /**
     * Stops animation
     */

    stop() {
        this.#cyclesToPlay = 0;
        this.#playInf = false;
    }

    _restore() {
        this.#timePassed = 0;
        this.#states.forEach(state => {state.played = false;});
        this.#currentStateId = 0;
    }

    playLoop(time) {
        if (this.#playInf || this.#cyclesToPlay > 0) {
            this.#timePassed += time.deltaTime() * 1000;

            while (this.#currentStateId < this.#states.length && this.#states[this.#currentStateId].timePoint <= this.#timePassed) {
                let state = this.#states[this.#currentStateId];

                state.played = true;
                state.action();
            
                this.#currentStateId++; 
            }

            if (this.#currentStateId >= this.#states.length) {
                this.#cyclesToPlay -= 1;
                this._restore();
            }
        }
    }
}

/**
 * Animator module. Use it in GameObject or UiObject to create states loop and animations
 * @class Animator
 */

export class Animator extends Module {
    #animations;

    constructor() {
        super();
        this.#animations = [];
    }

    /**
     * Creates new animation
     * @param {string} name 
     * @returns {Animation}
     */

    addAnimation(name) {
        let newAnimation = new Animation(name);
        this.#animations.push(newAnimation);

        return newAnimation;
    }

    /**
     * Returns existing animation by name
     * @param {string} name 
     * @returns {Animation}
     */

    getAnimation(name) {
        return this.#animations.find(anim => anim.name == name);
    }

    /**
     * Plays existing animation by name
     * @param {string} name 
     * @param {Number} cycles - Play cycles count.
     * If not provided, animation will be playing till you don't stop it
     */

    play(name, cycles = -1) {

        this.#animations.find(anim => anim.name == name).play(cycles);
    }

    /**
     * Plays animation by name once
     * @param {string} name 
     */

    playOnce(name) {
        this.#animations.find(anim => anim.name == name).play(1);
    }

    /**
     * Stops animation by name
     * @param {string} name 
     */

    stop(name) {
        this.#animations.find(anim => anim.name == name).stop();
    }

    loop() {
        this.#animations.forEach(animation => {
            animation.playLoop(this.owner.time);
        });
    }
}