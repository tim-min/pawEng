import * as paw from '../../pawEng.js'
import Cat from './cat.js'
import Field from './field.js'


(async () => {
    const game = new paw.Game(16/9);
    await game.init();

    let cat = new Cat(new paw.Vector(50, 50), 0, new paw.Vector(20, 20));
    let field = new Field(new paw.Vector(50, 50), 0, new paw.Vector(200, 100), "darkgreen");

    let firstScene = game.createScene("first");
    firstScene.addGameObject(field);
    firstScene.addGameObject(cat);

    game.setCamera(cat);

    game.loadScene("first");
})();