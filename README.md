
---

### pawEng

js 2d web games engine on HTML5 canvas

pawEng можно использовать для создания простых 2д игр на js

Рассмотрим создание игры на примере в examples/cat

---

## Инициализация игры

Первым делом импортируем pawEng

```js
import * as paw from 'awEng.js'
```

Создаем объект game, вызываем метод init. После этого на странице появится окно игры, canvas

```js
(async () => {
    const game = new paw.Game(16/9);
    await game.init();
})();
```

---

Создадим простой объект, поле

Любой игровой объект наследуется от базового класса GameObject
Обязательным пунктом будет вызов конструктора родителя с базовыми полями position - позиция объекта, rotation - поворот, size - размер, scale - масштаб

Позиция объекта и размер задаются в условных единицах. 
100 условных единиц равны высоте canvas в пикселях


```js
class Field extends paw.GameObject {
    constructor(position, rotation, size, scale, color) {
        super(position, rotation, size, scale);
        this.color = color;
        this.square = this.addModule(new paw.Square(color));
    }
    
    start() {
        this.transform.size = this.gameContext.worldSize;
        this.transform.position.x = this.gameContext.worldSize.x/2;
        this.transform.position.y = this.gameContext.worldSize.y/2;
    }
}
```

---

Создадим также объект кота

```js
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
        if (this.transform.position.y > (this.gameContext.worldSize.y - this.worldSize.y/2) || this.transform.position.y < thisldSize.y/2) {
            this.yDir *= -1;
        }
    }

}
```

---

Далее осталось только создать новую сцену и добавить туда объекты

```js
    let cat = new Cat(new paw.Vector(50, 50), 0, new paw.Vector(0.01, 0.01), new paw.Vector(20, 20));
    let field = new Field(new paw.Vector(50, 50), 0, new paw.Vector(0.01, 0.01), new paw.Vector(200, 100), "darkgreen");

    let firstScene = game.createScene("first");
    firstScene.addGameObject(field);
    firstScene.addGameObject(cat);

    game.setCamera(cat);

    game.loadScene("first");
```

---

### Game

Основной класс для управления игрой. Запускает игровой цикл, встраивает в него цикл активной сцены. Создает объект App, который управляет объектами взаимодействующими с элементами на сцене

```
· Game.init() - Обязателен к вызову после создания объекта игры. Готовит страницу к игре и создает базовые объекты
· Game.destroy() - Полностью останавливает игру
· Game.createScene(name) - Создает новую сцену с именем name, возвращает экземпляр класса Scene
· Game.loadScene(name) - Устанавлиет активную сцену с именем name, при условии что она была создана в Game.createScene(name)
· Game.setCamera(cameraObject) - Делает cameraObject активной камерой. cameraObject должен быть GameObject с модулем камеры
· get Game.mouseController - Возвращает активный MouseController
```

Как создаётся canvas?

Game принимает желаемое соотношение сторон окна игры
При инициализации игры Game ищет подходящие размеры окна исходя из размеров экрана и желаемого соотношения сторон

Размер окна динамически обновляется каждый раз, когда меняется размер экрана, например при масштабировании окна браузера

Система координат в игре работает независимо от текущего размера окна, так как работает на условных единицах.
Во время отрисовки игровых объектов условные единицы переводятся в пиксели по следующему правилу: 100 условных единиц = высота окна игры (canvas)

---

### Scene

```
· get Scene.isLoaded - Возвращает true если сцена активна
· get Scene.name - Возвращает имя сцены
· get Scene.gameObjects - Возвращает список объектов на сцене
· Scene.addGameObject(gameObject) - Добавляет новый объект на сцену
· Scene.clear() - удаляет все объекты со сцены, при этом у каждого объекта вызывается метод GameObject.onDestroy()
· Scene.removeGameObject(gameObject) - Удаляет объект gameObject со сцены
· Scene.getObjectsNearby(position, radiusX=1, radiusY=1) - Возвращает объекты находящиеся рядом с клеткой, в которую входит position, с радиусом в клетках radiusX, radiusY. Весь мир делится на сетку, где каждая клетка размером с 100 условных единиц.
```
---

### GameObject
```
· GameObject.setActive(bool) - Включает или выключает объект. Включенный объект участвует в игровом цикле, то есть у него вызывается loop(). Стоит отметить, что даже если объект выключен, у него будет вызван start()
· get GameObject.isActive - Возвращает true, если объект включен
· GameObject.isPositionCganged() - Возвращает true, если объект сдвинулся после последней итерации игрового цикла
· get GameObject.oldWorldPosition - Возвращает старую позицию объекта, до того как он сдвинулся
· get/set GameObject.renderLayer - Устанавливает слой рендера для объекта. Чем ниже слой, тем первее будет рендериться объект
· get/set GameObject.transform - Возвращает структуру transform
· get/set GameObject.transform.position - локальная позиция объекта в условных единицах, без учета позиции родительских объектов
· get/set GameObject.transform.rotation - поворот объекта в градусах (0 - 360)
· get/set GameObject.transform.size - локальный размер объекта в условных единицах, без учета размера родителей
· get/set GameObject.transform.scale - локальный масштаб объекта, без учета родителей
· get GameObject.worldPosition - Мировая позиция объекта в условных единицых, учитывает позицию родителей
· get GameObject.worldRotation - Поворот объекта с учетом поворота родителей
· get GameObject.worldSize - Размер с учетом родителей
· get GameObject.worldScale - масштаб с учетом родителей
· get GameObject.children - Возвращает список дочерних объектов
· get GameObject.parent - Возвращает родителя объекта. null если родителя нет
· GameObject.setParent(GameObject) - Устанавливает родителя объекту
· GameObject.addChild(GameObject) - Добавляет дочерний объект
· GameObject.removeChild(GameObject) - Удаляет дочерний объект GameObject, если он действительно дочерний
· GameObject.removeChildAt(index) - Удаляет дочерний объект с индексом index
· GameObject.clearChildren() - Отвязывает всех детей
· GameObject.isDescendantOf(GameObject) - Проверяет, является ли объект потомком GameObject
· GameObject.addModule(module) - Добавляет модуль module
· GameObject.getModule(moduleType) - Возвращает модуль по типу moduleType если такой есть
· get GameObject.time - Возвращает объект time. Доступен только при активной сцене, иначе null
· get GameObject.gameContext - Возвращает объект GameContext. Доступен только при активной сцене, иначе null
· GameObject.createEvent(event) - Инициирует ивент event
· GameObject.destroy() - уничтожает объект
```
## Методы GameObject, доступные для перегрузки
```
· start() - Вызывается после Scene.onLoad()
· loop() - Вызывается каждую итерацию игрового цикла
· onDestroy() - Вызывается если объект уничтожен
· onRender(renderer) - Вызывается сценой для рендера объекта. Внутри метода можно работать с временным объектов renderer, который не будет доступен вне метода
· onSceneCanceled() - Вызывается когда сцена с объектом перестает быть активной
```
Многие параметры объекта, такие как position, size, scale и их world производные работают с классом Vector

---

### Vector(x, y)
```
· Vector.add(Vector) - Сумма вектора и Vector
· Vector.distance(Vector) - Расстояние между векторами
· Vector.values() - Возвращает значения вектора в виде списка
· Vector.copy() - Возвращает копию вектора
· Vector.copyTo(vector) - Копирует вектор в существующий Vector
· get/set Vector.x/y - Возвращает/Записывает значения x/y
```
---

### Система ивентов

Сам объект не знает о сцене, на которой находится, но может инициировать ивент, у которого будет доступ к сцене и который выполнится в конце игрового цикла

Ивентом является класс наследник от класса Event.
```
· Event(creator) - Принимает ссылку на объект инициатор ивента
· get Event.creator - Возвращает ссылку на объект инициатор
```
Методы доступные для перегрузки
```
· run(scene) - принимает ссылку на объект сцены, вызывается 1 раз в конце игрового цикла, после этого ивент удаляется
```
---

### Система модулей

Каждый объект может иметь подключенные модули. Модулями являются дополнения к объектам

### Module
```
· get Module.isActive - Возвращает true если модуль активен
· set Module.setActive(bool) - Включает/выключает модуль
· get Module.owner - Возвращает ссылку на объект владельца модуля
```
## Методы доступные для перегрузки
```
· start() - аналогично с GameObject
· loop() - аналогично с GameObject
· onRender(renderer) - аналогично с GameObject
· onSceneCanceled() - аналогично с GameObject
· onDestroy() - аналогично с GameObject
```
Пример реализованных методов - Camera, Animator, ImageRenderer, Sprite, Square, Ellipse. Можно найти в core/modules

---

### Вспомогательные объекты, упомянутые выше

### Time
```
· Time.deltaTime() - Возвращает, сколько секунд прошло с предыдущей итерации игрового цикла
· Time.timeAfterSceneLoaded() - Возвращает время в секундах которое прошло с загрузки сцены
```
### GameContext
```
· get GameContext.worldSize - Возвращает размер окна в условных единицах
```
---

### UI объекты

На сцене могут находиться не только игровые объекты, но и UI объекты

UI объект является аналогом GameObject, но сцена рендерит его без учета камеры
Создается UiObject аналогично с GameObject и имеет те же методы

## Методы доступные для перегрузки
```
· onClick() - Вызывается если на объект кликнули. Границы объекта определяются transform.size и transform.scale
```
---

### Renderer

Рассмотрим вышеупомянутый Renderer. Работа с ним осуществляется в методах onRender GameObject, UiObject и Module
```
· Renderer.drawRect(gameObject, color) - Рисует квадрат основываясь на параметры GameObject цвета color
· Renderer.drawEllipse(gameObject, color, startAngle, endAngle) - Рисует эллипс цвета color, с параметрами startAngle, endAngle
· Renderer.drawImage(gameObject, img) - Рисует картинку img
· Renderer.drawImage(gameObject, img, sx, sy, sw, sh) - Рисует срез картинки с началом в sx, sy и размерами среза sw, sh в пикселях
```
---

### Некоторые готовые модули, упрощающие работу

### Animator
```
· Animator.addAnimation(name) - Создает новую анимацию с именем name, возвращает экземпляр класса Animation
· Animator.getAnimation(name) - Возвращает созданную Animation по имени
· Animator.Play(name) - Бесконечно проигрывает анимацию с именем name
· Animator.Play(name, cycles) - Проигрывает анимацию с именет name cycles раз
· Animator.PlayOnce(name) - Проигрывает анимацию с именем name 1 раз
· Animator.Stop(name) - Останавливает анимацию с именем name
```
### Animation

Анимация выполняет различные функции в определенные моменты времени.
Допустим длина анимации 3 секунды. Анимация состояит из 4х состояний

1. В момент времени 10мс выполняется функция f1
2. В момент времени 1000мс выполняется функция f2
3. В момент времени 2300мс выполняется функция f3
4. В момент времени 3000мс выполняется функия f4

Длина анимации определяется исходя из самого позднего состояния.
```
· get Animation.name - Возвращает имя анимации
· Animation.addState(timePoint, action) - Создает состояние анимации на момент timePoint. Т.е в момент timePoint (мс) выполнится функция action
· get Animation.duration - Возвращает продолжительность анимации в мс
```
Пример использования

Добавление модуля

```js
this.animator = this.addModule(new paw.Animator());
```

Создание анимации

```js
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
```

Запуск анимации

```js
this.animator.play("idle");
```

---

### Модули геометрических объектов

Square(color), Ellipse(color, startAngle=0, endAngle=360)

Простейшие модули, которые просто используют функции renderer.

# Пример использования

```js
this.square = this.addModule(new paw.Square(color));
```

---

### Модуль ImageRenderer

ImageRenderer(src) - Загружает картинку по src, использует метод renderer для отрисовки в момент onRender

# Пример использования

```js
this.imgRenderer = this.addModule(new paw.ImageRenderer('sprites/cat.png'));
```

---

### Модуль Sprite

Sprite(src, columns, rows) - Продвинутый ImageRenderer, работает с sprite sheet'ами, вырезает из них кадр по координатам x, y. Размер кадра автоматически считает исходя из размеров картинки и columns rows.
```
· get Sprite.currentFrame - Возвращает структуру {x: x, y: y}, координаты текущего кадра
· Sprite.setCurrentFrame(x, y) - Устанавливает текущий кадр с координатами x, y
```
# Пример использования

Инициализируем модуль, запоминаем параметры листа

```js
this.totalFrames = 5;
this.columns = 4;
this.rows = 2
this.sprite = this.addModule(new paw.Sprite('cat.png', this.columns, this.rows));
```

Совместно с аниматором делаем анимацию покоя для котика

```js
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
```

---
