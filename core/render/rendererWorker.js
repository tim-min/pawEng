/**
 * Renderer worker class. Uses in onRender() function in enteties
 * @class RendererWorker
 */

export class RendererWorker {
    // Специальный воркер рендера, который по сути является прокси классом для предоставления безопасного доступа только к определенным методам.
    // Также обладает методами для обеспечения временного доступа к себе

    #originalRenderer;
    #uiSpace;

    constructor(original, uiSpace=false) {
        this.#originalRenderer = original; // Основной рендерер
        this.#uiSpace = uiSpace; // true если этот рендерер обрабатывает ui объект. Просто передаем этот же флаг в вызовах методов renderer
    }

    destroy() {
        // Для безопасного прекращения работы удаляем ссылку на основной рендерер
        // Убивать воркер нужно после вызова onRender у объекта, чтобы в дальнейшем объект не мог пользоваться им вне этого метода

        this.#originalRenderer = null;
    }

    isAlive() {
        return this.#originalRenderer != null;
    }

    aliveCheck() {
        if (!this.isAlive()) throw Error("Renderer worker is no longer available. You can use renderer only in GameObject.onRender()")
    }

    /**
     * Draws rect. Uses GameObject world transform for positon, rotation, scale and other
     * @param {GameObject|UiObject} gameObject - Entity that draws a rect
     * @param {string} color - Color of rect
     * @param {boolean} fill - Rect will be filled
     * if not provided, will be true
     * @param {boolean} dotted - Rect will be drawn as dotted line
     * if not provided, will be false
     */

    drawRect(gameObject, color, fill=true, dotted=false) {
        this.aliveCheck();
        this.#originalRenderer.drawRect(gameObject, color, fill, dotted, this.#uiSpace);
    }

    /**
     * Draws ellipse. Uses GameObject world transform for positon, rotation, scale and other
     * @param {GameObject|UiObject} gameObject - Entity that draws an ellipse
     * @param {string} color - Color of ellipse
     * @param {Number} startAngle - Start angle
     * @param {Number} endAngle - End angle
     */

    drawEllipse(gameObject, color, startAngle=0, endAngle=360) {
        this.aliveCheck();
        this.#originalRenderer.drawEllipse(gameObject, color, startAngle, endAngle, this.#uiSpace);
    }

    /**
     * Draws image. Uses GameObject world transform for positon, rotation, scale and other
     * @param {GameObject|UiObject} gameObject - Entity that draws an image
     * @param {string} img - Image source 
     */

    drawImage(gameObject, img) {
        this.aliveCheck();
        this.#originalRenderer.drawImage(gameObject, img, this.#uiSpace);
    }

    /**
     * Draws image slice. Uses GameObject world transform for positon, rotation, scale and other
     * @param {GameObject|UiObject} gameObject - Entity that draws an image
     * @param {string} img - Image source 
     * @param {Number} sx - Left corner x 
     * @param {Number} sy - Left corner y
     * @param {Number} sw - Slice width
     * @param {Number} sh - Slice height
     */

    drawImage(gameObject, img, sx, sy, sw, sh) {
        this.aliveCheck();
        this.#originalRenderer.drawImage(gameObject, img, sx, sy, sw, sh, this.#uiSpace);
    }

    /**
     * Draws text. Uses GameObject world transform for positon, rotation, scale and other
     * @param {GameObject|UiObject} gameObject - Entity that draws a text
     * @param {string} font - Text font
     * @param {string} text - Text
     * @param {Number} size - Text size
     */

    drawText(gameObject, font, text, size) {
        this.aliveCheck();
        this.#originalRenderer.drawText(gameObject, font, text, size, this.#uiSpace);
    }
}