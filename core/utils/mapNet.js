import { Vector } from "../math/index.js";
import { GameObject } from "../entities/index.js";

export class MapNet {
    #cellSize;
    #cells;
    #objects;

    constructor(cellSize=100) {
        this.#cellSize = cellSize;
        this.#cells = new Map(); // Клетка на поле (строка "x, y") : список объектов в этой клетке
        this.#objects = new Map(); // Ссылка на объект : Клетка (структура {x: x, y: y})
    }

    get cellSize() {
        return this.#cellSize;
    }

    #assertIsGameObject(obj) {
        if (!(obj instanceof GameObject)) {
            throw new TypeError("You can only add game objects that inherit from GameObject");
        }
    }

    #assertIsVector(obj) {
        if (!(obj instanceof Vector)) {
            throw new TypeError(`${obj} object is not paw.Vector`);
        }
    }

    calculateCell(position) { // Возвращает координаты клетки на основе позиции
        this.#assertIsVector(position);

        let cell = {
            x: Math.ceil(position.x/this.#cellSize),
            y: Math.ceil(position.y/this.#cellSize)
        }
        return cell;
    }

    calculateObjectCells(gameObject) {
        // Возвращает список всех клеток, в которых находится объект

        let result = [];

        let centralCell = this.calculateCell(gameObject.worldPosition);
        let newCell;

        for (let x=-(Math.ceil(gameObject.worldSize.x/2/this.#cellSize)); x<(Math.ceil(gameObject.worldSize.x/2/this.#cellSize)); x++) {
            for (let y=-(Math.ceil(gameObject.worldSize.y/2/this.#cellSize)); y<(Math.ceil(gameObject.worldSize.y/2/this.#cellSize)); y++) {
                newCell = {
                    x: centralCell.x+x,
                    y: centralCell.y+y,
                }

                result.push(newCell);
            }
        }

        return result;

    }

    getObjectsInCell(cell) { // Возвращает список объектов в клетке
        return this.#cells.get(`${cell.x}, ${cell.y}`);
    }

    updateObject(object) { // Обновляет позицию объекта в сетке
        this.#assertIsGameObject(object);
        if (!object.isPositionChanged() && !(this.#objects.get(object) === undefined)) return; // Если объект не двигался, ничего не делаем
        let objectCells = this.calculateObjectCells(object); // Считаем все клетки, в которых находится объект

        if (objectCells.every(cell => 
            this.getObjectsInCell(cell) != undefined && this.getObjectsInCell(cell).includes(object)
        )) return; // Если в каждой из клеток объект уже и так записан, то ничего не трогаем

        // Смотрим предыдущие клетки в которые мы записывали объект
        let oldCells = this.#objects.get(object);

        // Если такие есть, то удаляем их них объект
        if (oldCells != undefined) {
            oldCells.forEach(cell => {
                if (cell != null) this.removeObject(cell, object);
            });
        }

        // Обновляем список клеток в которых есть объект в #objects и записываем объект в новые клетки в #cells
        this.#objects.set(object, []);
        objectCells.forEach(cell => {
            this.addObject(cell, object);
        });

        // Также обновляем клетки для детей, так как их позиция поменялась в итерацию цикла на момент родителя, 
        // а после выполнения их собственного loop получится так, что они не изменили свою позицию
        object.children.forEach(gameObject => {
            this.updateObject(gameObject);
        });
    }

    getObjectsNearby(position, radiusX=1, radiusY=1) {
        // Возвращает список объектов которые находятся в клетках вокруг заданной позиции с радиусом (в клетках) radiusX, radiusY

        this.#assertIsVector(position);

        let cell = this.calculateCell(position); // Считаем центральную клетку по заданной позиции

        let result = [];

        for (let x=-radiusX; x<radiusX+1; x++) {
            for (let y=-radiusY; y<radiusY+1; y++) {
                let foundObjects = this.#cells.get(`${cell.x+x}, ${cell.y+y}`);
                if (foundObjects == undefined) continue;

                // Записываем только те объекты, которые ещё не были записаны и которые активны
                // Дубликаты могут попадаться в связи с тем, что большой объект может быть одновременно в нескольких клетках

                foundObjects.forEach(gameObject => {if (!result.includes(gameObject) && gameObject.isActive) result.push(gameObject);});
            }
        }

        return result;
    }

    removeObject(cell, object) {
        // Удаляет объект из клетки

        let objects = this.#cells.get(`${cell.x}, ${cell.y}`);
        if (objects == undefined) return;

        this.#cells.set(`${cell.x}, ${cell.y}`, objects.filter( el => el !== object));
        this.#objects.set(object, null);
    }

    addObject(cell, object) {
        // Записывает объект в заданную клетку

        let objectsInCell = this.getObjectsInCell(cell);

        if (objectsInCell == undefined) {
            this.#cells.set(`${cell.x}, ${cell.y}`, [object]);
        } else {
            objectsInCell.push(object);
        }

        // Также обновляем у объекта список клеток, в которых он находится
        if (this.#objects.get(object) == undefined) this.#objects.set(object, [cell]);
        else this.#objects.get(object).push(cell);
    }
}