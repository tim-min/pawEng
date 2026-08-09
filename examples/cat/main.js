import * as paw from '../../pawEng.js'
import Cat from './cat.js'
import Field from './field.js'


(async () => {
    const game = new paw.Game(16/9);
    await game.init();

    let cat = new Cat(new paw.Vector(50, 50), 0, new paw.Vector(20, 20));
    let field = new Field(new paw.Vector(50, 50), 0, new paw.Vector(200, 100), "darkgreen");

    let catScene2 = new Cat(new paw.Vector(50, 50), 0, new paw.Vector(40, 40));
    let catScene2Camera =  new Cat(new paw.Vector(50, 50), 0, new paw.Vector(20, 20));
    let fieldScene2 = new Field(new paw.Vector(50, 50), 0, new paw.Vector(200, 100), "red");

    let firstScene = game.createScene("first");
    let secondScene = game.createScene("second");

    firstScene.addGameObject(field);
    firstScene.addGameObject(cat);

    secondScene.addGameObject(fieldScene2);
    secondScene.addGameObject(catScene2);
    secondScene.addGameObject(catScene2Camera);

    // game.setCamera(cat); MOVED TO SCENE
    firstScene.setCamera(cat);
    secondScene.setCamera(catScene2Camera);

    game.loadScene("first");

    setTimeout(() => {
        game.loadScene("second");
    }, 2000)
})();