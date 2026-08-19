import { Event } from '../event.js';

export class EventQueue {
    // Очередь событий. Должна обязательно быть на активной сцене для обеспечения взаимодействия объектов со сценой. 
    // Нельзя позволять каждому объекту знать о том, на какой сцене он сейчас находится, поэтому обрабатываем какие-то вещи только через отдельные события, 
    // которые вызываются до циклов объектов

    #events = [];

    push(event) {
        if (!(event instanceof Event)) throw TypeError("Event must be inherit of [Event]");

        this.#events.push(event);
    }

    pop() {
        let event = this.#events[0];
        this.#events.splice(0, 1);

        return event;
    }
}
