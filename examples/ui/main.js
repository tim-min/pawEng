import * as paw from '../../pawEng.js'

function btnClicked(button_color) {
    alert(`${button_color} button clicked!`);
}

(async () => {
    const game = new paw.Game(16/9);
    await game.init();

    let menu = game.createScene("menu");

    let gameName = new paw.UiObject();
    gameName.addModule(new paw.Text());
    gameName.getModule(paw.Text).text = "Hello world";
    gameName.getModule(paw.Text).size = 10;
    menu.addGameObject(gameName);

    let greenButton = new paw.UiObject(new paw.Vector(50, 50), new paw.Vector(0, 0), new paw.Vector(20, 20));
    greenButton.addModule(new paw.Button(new paw.Vector(20, 20), btnClicked, ['green']));
    greenButton.addModule(new paw.Square('green'));
    menu.addGameObject(greenButton);

    let redButton = new paw.UiObject(new paw.Vector(50, 50), new paw.Vector(0, 0), new paw.Vector(10, 10));
    redButton.addModule(new paw.Button(new paw.Vector(10, 10), btnClicked, ['red']));
    redButton.addModule(new paw.Square('red'));
    menu.addGameObject(redButton);


    game.loadScene("menu");

    gameName.transform.position.x = menu.gameContext.worldSize.x/2;
    greenButton.transform.position.x = menu.gameContext.worldSize.x/2;
    redButton.transform.position.x = menu.gameContext.worldSize.x/2;
})();