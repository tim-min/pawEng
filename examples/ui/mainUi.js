import * as paw from '../../pawEng.js'


export default class HeaderText extends paw.UiObject {
    constructor(position, rotation, scale) {
        super(position, rotation, scale);

        this.textModule = this.addModule(new paw.Text());
    }
}
