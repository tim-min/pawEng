import * as paw from '../../pawEng.js'


export default class HeaderText extends paw.UiObject {
    constructor(position, rotation, scale) {
        super(position, rotation, scale);

        this.textModule = this.addModule(new paw.Text());
    }

    loop() {
        this.transform.rotation += 5 * this.time.deltaTime();
    }
}

export class GreenButton extends paw.UiObject {
    constructor(position, rotation, scale, onclickfunc) {
        super(position, rotation, scale);

        let clickZone = new paw.CircleZone(10, onclickfunc);
        this.buttonModule = this.addModule(new paw.Button(clickZone));

        this.circle = this.addModule(new paw.Ellipse('green'));
    }
}