/**
 * Event system main class. Use it to create your own events.
 * @class Event
 */

export class Event {
    #creator;

    /**
     * 
     * @param {GameObject} creator - GameObject which initiated event
     */

    constructor(creator) {
        // Ивент обязательно должен знать о своём создателе. Все ивенты работают в первую очередь с теми, кто их создал
        this.#creator = creator;
    }

    /**
     * Event function. Runs after game loop. You can work with scene and object initiator here
     * @overload
     * @param {Scene} scene 
     */

    run(scene) {
        // Тут прописывается функционал ивента. Также обязательно принимаем ссылку на сцену, которая обрабатывает этот ивент, иначе какой тогда смысл?
    }

    get creator() {
        return this.#creator;
    }
}