import * as paw from '../../pawEng.js'

export default class Field extends paw.GameObject {
    constructor(position, rotation, scale, color) {
        super(position, rotation, scale);
        this.color = color;
        this.square = this.addModule(new paw.Square(color));
    }

    start() {
        this.transform.size = this.gameContext.worldSize;
        this.transform.position.x = this.gameContext.worldSize.x/2;
        this.transform.position.y = this.gameContext.worldSize.y/2;
    }
}