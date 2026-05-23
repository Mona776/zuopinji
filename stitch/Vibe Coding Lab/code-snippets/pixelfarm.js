// oc-steel.vercel.app — js/game.js (excerpt)

import { FarmingSystem } from './farming.js';
import { InteractionSystem } from './interaction.js';
import { InventorySystem } from './inventory.js';

export class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.tileSize = 32;
        this.map = new Map(this.tileSize);
        this.loadScene('outdoor', 5 * 32, 5 * 32);
        this.farming = new FarmingSystem(this);
        this.interaction = new InteractionSystem(this);
    }

    update(dt) {
        this.player.update(dt, this.map);
        this.farming.tick(dt);
        this.camera.follow(this.player);
    }
}

// WASD 移动 · 1/2/3 切换锄/种/水 · 点击地块耕种
