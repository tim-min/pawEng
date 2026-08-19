import * as paw from '../../pawEng.js'

function btnClicked(button_color) {
    alert(`${button_color} button clicked!`);
}

(async () => {
    const game = new paw.Game(16/9);
    await game.init();

    let menu = game.createScene("menu");

    let gameName = new paw.entities.UiObject();
    gameName.addModule(new paw.modules.render.UI.Text());
    gameName.getModule(paw.modules.render.UI.Text).text = "Hello world";
    gameName.getModule(paw.modules.render.UI.Text).size = 10;
    menu.addGameObject(gameName);

    let greenButton = new paw.entities.UiObject(new paw.math.Vector(50, 50), new paw.math.Vector(0, 0), new paw.math.Vector(20, 20));
    greenButton.addModule(new paw.modules.render.UI.Button(new paw.math.Vector(20, 20), btnClicked, ['green']));
    greenButton.addModule(new paw.modules.render.Square('green'));
    menu.addGameObject(greenButton);

    let redButton = new paw.entities.UiObject(new paw.math.Vector(50, 50), new paw.math.Vector(0, 0), new paw.math.Vector(10, 10));
    redButton.addModule(new paw.modules.render.UI.Button(new paw.math.Vector(10, 10), btnClicked, ['red']));
    redButton.addModule(new paw.modules.render.Square('red'));
    menu.addGameObject(redButton);


    game.loadScene("menu");

    gameName.transform.position.x = menu.gameContext.worldSize.x/2;
    greenButton.transform.position.x = menu.gameContext.worldSize.x/2;
    redButton.transform.position.x = menu.gameContext.worldSize.x/2;
})();