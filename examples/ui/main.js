import * as paw from '../../pawEng.js'
import HeaderText, { GreenButton } from './mainUi.js'


function greenClicked() {
    alert("GREEENS");
}

(async () => {
    const game = new paw.Game(16/9);
    await game.init();

    let menu = game.createScene("menu");

    let gameName = new HeaderText(new paw.Vector(50 + 10, 0), 0, new paw.Vector(5, 5));
    gameName.getModule(paw.Text).text = "Hello world";
    gameName.getModule(paw.Text).size = 10;
    menu.addGameObject(gameName);

    let greenButton = new GreenButton(new paw.Vector(50+10, 30), 30, new paw.Vector(5, 5), greenClicked);
    menu.addGameObject(greenButton);

    game.loadScene("menu");
})();