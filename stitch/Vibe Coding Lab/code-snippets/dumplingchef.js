// dumplingchef-ypih.vercel.app — js/game.js (excerpt)

import { CONFIG, COLORS } from './config.js';
import { OrderManager } from './order.js';
import { soundManager } from './sound.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.orderManager = new OrderManager();
        this.gameTime = CONFIG.GAME_TIME_LIMIT;
        this.state = 'playing';
    }

    update(dt) {
        this.orderManager.tick(dt);
        this.players.forEach((p) => p.update(dt, this.map));
        if (this.gameTime <= 0) this.endRound();
    }
}
