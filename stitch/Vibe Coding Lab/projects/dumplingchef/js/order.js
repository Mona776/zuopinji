import { CONFIG, COLORS } from './config.js';
import { soundManager } from './sound.js';

export class Order {
    static nextId = 0;

    constructor() {
        this.id = Order.nextId++;
        
        // Randomly select one of 3 recipes
        const recipes = [
            { name: 'pork_dumpling', components: ['wrapper', 'minced_pork'] },
            { name: 'veggie_dumpling', components: ['wrapper', 'chopped_cabbage'] },
            { name: 'combo_dumpling', components: ['wrapper', 'minced_pork', 'chopped_cabbage'] }
        ];
        
        const recipe = recipes[Math.floor(Math.random() * recipes.length)];
        this.recipeName = recipe.name;
        this.components = recipe.components;
        this.timer = CONFIG.ORDER_TIME;
        this.maxTime = CONFIG.ORDER_TIME;
    }

    update(dt) {
        this.timer -= dt;
        return this.timer > 0;
    }

    getTimePercent() {
        return this.timer / this.maxTime;
    }

    getTimeColor() {
        const remaining = this.timer;
        if (remaining > 45) return COLORS.TIME_GREEN;
        if (remaining > 20) return COLORS.TIME_YELLOW;
        return COLORS.TIME_RED;
    }
    
    isBlinking() {
        return this.timer <= 20;
    }

    getTimeRemaining() {
        return Math.max(0, Math.ceil(this.timer));
    }
}

export class OrderManager {
    constructor() {
        this.orders = [];
        this.wrongDeliveryEffect = null;
        this.successEffect = null;
        this.gameTime = 0;
        this.spawnedCount = 0;
        
        // Start with ONLY 1 order
        this.spawnOrder();
    }

    spawnOrder() {
        if (this.orders.length < CONFIG.MAX_ORDERS) {
            this.orders.push(new Order());
            this.spawnedCount++;
            soundManager.playNewOrder();
        }
    }

    update(dt) {
        this.gameTime += dt;
        
        // Staggered spawning: 2nd order at 10s, 3rd at 25s
        if (this.spawnedCount === 1 && this.gameTime >= CONFIG.ORDER_SPAWN_TIMES[1]) {
            this.spawnOrder();
        } else if (this.spawnedCount === 2 && this.gameTime >= CONFIG.ORDER_SPAWN_TIMES[2]) {
            this.spawnOrder();
        }
        
        // Update all orders
        for (let i = this.orders.length - 1; i >= 0; i--) {
            this.orders[i].update(dt);
            // Orders stay until completed (no timeout removal)
        }

        // Update effects
        if (this.wrongDeliveryEffect) {
            this.wrongDeliveryEffect.timer -= dt;
            if (this.wrongDeliveryEffect.timer <= 0) {
                this.wrongDeliveryEffect = null;
            }
        }

        if (this.successEffect) {
            this.successEffect.timer -= dt;
            if (this.successEffect.timer <= 0) {
                this.successEffect = null;
            }
        }

        return 0;
    }

    tryDeliverItem(itemType, recipeType) {
        // Check if delivered item matches any order
        // 接受所有装盘类型：plated_pork_dumpling, plated_veggie_dumpling, plated_combo_dumpling
        if (itemType.startsWith('plated_')) {
            // Find matching order (oldest first)
            for (let i = 0; i < this.orders.length; i++) {
                if (this.orders[i].recipeName === recipeType) {
                    // Success!
                    const order = this.orders[i];
                    this.orders.splice(i, 1);
                    soundManager.playOrderComplete();
                    this.spawnOrder();
                    
                    // Calculate score with time bonus: +1 for every 5 seconds remaining
                    const timeRemaining = Math.max(0, order.timer);
                    const timeBonus = Math.floor(timeRemaining / 5);
                    const totalScore = CONFIG.SCORE_PER_ORDER + timeBonus;
                    
                    // Show success effect with bonus message
                    this.successEffect = { 
                        timer: 1.0, 
                        score: totalScore,
                        baseScore: CONFIG.SCORE_PER_ORDER,
                        bonus: timeBonus
                    };
                    
                    return { success: true, score: totalScore };
                }
            }
        }

        // Wrong item!
        this.wrongDeliveryEffect = { timer: 1.0 };
        return { success: false, score: 0 };
    }
}
