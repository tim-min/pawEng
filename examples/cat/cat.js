import * as paw from '../../pawEng.js'


export default class Cat extends paw.GameObject {
    constructor(position, rotation, scale) {
        super(position, rotation, scale);

        // Задаем модуль анимации и модуль камеры
        this.animator = this.addModule(new paw.Animator());
        this.cameraModule = this.addModule(new paw.Camera("green"));
        
        // Устанавливаем модуль спрайтов, сразу явно задаем общее кол-во кадров, кол-во столбцов и строк
        this.totalFrames = 5;
        this.columns = 4;
        this.rows = 2
        this.sprite = this.addModule(new paw.Sprite('cat.png', this.columns, this.rows));

        // Задаем поля, которые пригодятся в работе с аниматором
        this.currentFrame = 0 // Текущий кадр
        this.frameStep = 1 // Шаг для переключения кадров

        // Задаем поля для работы объекта, в данном случае направление по x, y и скорость
        this.xDir = 1;
        this.yDir = -1;
        this.speed = 10;
    }

    setupIdleAnim() {
    	// Создаем анимацию покоя. 

        let idleAnim = this.animator.addAnimation("idle");

        idleAnim.addState(100, function() { // Добавляем функцию состояния. Будет выполняться на 100мс анимации
            this.currentFrame = this.currentFrame + this.frameStep;

            // Если выходим за границы доступных кадров, меняем шаг в обратную сторону
            if (this.currentFrame == -1 || this.currentFrame == 5) {this.frameStep *= -1; this.currentFrame+=this.frameStep;}

            // Считаем координаты следующего фрейма и устанавливаем его в sprite

            let nextFrame = {
                x: this.currentFrame%this.columns,
                y: Math.floor(this.currentFrame/this.columns)
            }

            this.sprite.setCurrentFrame(nextFrame.x, nextFrame.y);
        }.bind(this));
    }

    start() {
    	// Функция выполняется при загрузке объекта на сцене

    	// Создаем анимацию покоя и сразу запускаем её
        this.setupIdleAnim();
        this.animator.play("idle");
    }

    loop() {
    	// Выполняется каждую итерацию игрового цикла

    	// Двигаем объект согласно текущим направлениям
        this.transform.position.add(new paw.Vector(this.xDir * this.speed * this.time.deltaTime(), this.yDir * this.speed * this.time.deltaTime()));

        // Обозначаем условную область за которую не может выйти объект, в данном случае её размерами будут размеры окна
        if (this.transform.position.x > (this.gameContext.worldSize.x - this.worldSize.x/2) || this.transform.position.x < this.worldSize.x/2) {
            this.xDir *= -1;

        }
        if (this.transform.position.y > (this.gameContext.worldSize.y - this.worldSize.y/2) || this.transform.position.y < this.worldSize.y/2) {
            this.yDir *= -1;
        }
    }

}