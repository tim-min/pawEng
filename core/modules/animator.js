import { Module } from "../gameObject.js";

class AnimationState { // Структура для хранения этапа анимации. 
    constructor(timePoint, action) {
        if (typeof timePoint !== "number" || timePoint < 0) throw new Error("AnimationState.timePoint must be not negative number");
        if (typeof action !== "function") throw new Error("AnimationState.action must be a function");

        this.timePoint = timePoint; // Точка на временной линии анимации в мс
        this.action = action; // Функция которая должна выполниться
        this.played = false;
    }
}

class Animation { // Анимация. Хранит и проигрывает этапы
    #states;
    #duration;
    #name;
    #timePassed;
    #cyclesToPlay;
    #playInf;

    constructor(name) {
        if (typeof name !== "string") throw new Error("Animation.name must be a string");

        this.#states = [];
        this.#duration = 0;

        this.#cyclesToPlay = 0;
        this.#playInf = false;

        this.#timePassed = 0;

        this.#name = name;
    }

    get name() {
        return this.#name;
    }

    addState(timePoint, action) { // Добавляем новый этап и сразу считаем, не изменилась ли длительность анимации
        let newState = new AnimationState(timePoint, action);
        this.#states.push(newState);

        if (timePoint > this.#duration) this.#duration = timePoint;
    }

    get duration() {
        return this.#duration;
    }

    play(cycles = -1) {
        if (!Number.isInteger(cycles)) throw new Error("cycles at Animation.play(cycles) must be int");

        if (cycles == -1) this.#playInf = true;
        else cyclesToPlay = cycles;

        this._restore();
    }

    stop() {
        this.#cyclesToPlay = 0;
        this.#playInf = false;
    }

    _restore() {
        this.#timePassed = 0;
        this.#states.forEach(state => {state.played = false;});
    }

    playLoop(time) {
        if (this.#playInf || this.#cyclesToPlay > 0) {
            this.#timePassed += time.deltaTime() * 1000;

            this.#states.forEach(state => {
                if (state.played) return;

                if (state.timePoint <= this.#timePassed) {
                    state.played = true;
                    state.action();
                }
            });

            if (this.#states.every(state => (state.played == true))) {
                this.#cyclesToPlay -= 1;
                this._restore();
            }
        }
    }
}

export class Animator extends Module {
    #animations;

    constructor() {
        super();
        this.#animations = [];
    }

    addAnimation(name) {
        let newAnimation = new Animation(name);
        this.#animations.push(newAnimation);

        return newAnimation;
    }

    getAnimation(name) {
        return this.#animations.find(anim => anim.name == name);
    }

    play(name, cycles = -1) {

        this.#animations.find(anim => anim.name == name).play(cycles);
    }

    playOnce(name) {
        this.#animations.find(anim => anim.name == name).play(1);
    }

    stop(name) {
        this.#animations.find(anim => anim.name == name).stop();
    }

    loop() {
        this.#animations.forEach(animation => {
            animation.playLoop(this.owner.time);
        });
    }
}