export class Input {
    constructor() {
        this.keys = {};
        this.justPressed = {};
        this.keyPressTime = {}; // 记录按键按下的时间
        this.keyReleased = {}; // 记录按键释放事件
        this.longPressThreshold = 300; // 长按阈值（毫秒）
        this.isSinglePlayerMode = true; // 默认为单人模式，由 Game 类更新

        window.addEventListener('keydown', (e) => {
            if (!this.keys[e.code]) {
                this.justPressed[e.code] = true;
                this.keyPressTime[e.code] = Date.now(); // 记录按下时间
            }
            this.keys[e.code] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            this.keyReleased[e.code] = {
                released: true,
                pressDuration: Date.now() - (this.keyPressTime[e.code] || 0)
            };
        });
    }

    getP1Input() {
        let dx = 0;
        if (this.keys['KeyA'] || (this.isSinglePlayerMode && this.keys['ArrowLeft'])) dx -= 1;
        if (this.keys['KeyD'] || (this.isSinglePlayerMode && this.keys['ArrowRight'])) dx += 1;
        
        let dy = 0;
        if (this.keys['KeyW'] || (this.isSinglePlayerMode && this.keys['ArrowUp'])) dy -= 1;
        if (this.keys['KeyS'] || (this.isSinglePlayerMode && this.keys['ArrowDown'])) dy += 1;

        const actionKey = (this.isSinglePlayerMode && (this.keys['KeyE'] || this.keys['Space'])) ? 
            (this.keys['KeyE'] ? 'KeyE' : 'Space') : 'KeyE';

        return {
            x: dx,
            y: dy,
            pickup: this.isSinglePlayerMode ? (this.wasShortPress('KeyE') || this.wasShortPress('Space')) : this.wasShortPress('KeyE'),
            work: this.isSinglePlayerMode ? (this.isLongPress('KeyE') || this.isLongPress('Space')) : this.isLongPress('KeyE')
        };
    }

    getP2Input() {
        let dx = 0;
        if (this.keys['ArrowLeft']) dx -= 1;
        if (this.keys['ArrowRight']) dx += 1;
        
        let dy = 0;
        if (this.keys['ArrowUp']) dy -= 1;
        if (this.keys['ArrowDown']) dy += 1;

        return {
            x: dx,
            y: dy,
            pickup: this.wasShortPress('Space'),
            work: this.isLongPress('Space')
        };
    }

    get x() {
        let dx = 0;
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) dx -= 1;
        if (this.keys['ArrowRight'] || this.keys['KeyD']) dx += 1;
        return dx;
    }

    get y() {
        let dy = 0;
        if (this.keys['ArrowUp'] || this.keys['KeyW']) dy -= 1;
        if (this.keys['ArrowDown'] || this.keys['KeyS']) dy += 1;
        return dy;
    }

    isJustPressed(code) {
        if (this.justPressed[code]) {
            this.justPressed[code] = false;
            return true;
        }
        return false;
    }

    isHeld(code) {
        return !!this.keys[code];
    }

    // 检查是否是长按
    isLongPress(code) {
        if (this.keys[code] && this.keyPressTime[code]) {
            const duration = Date.now() - this.keyPressTime[code];
            return duration >= this.longPressThreshold;
        }
        return false;
    }

    // 检查是否是短按（按键释放时判断）
    wasShortPress(code) {
        if (this.keyReleased[code]?.released) {
            const wasShort = this.keyReleased[code].pressDuration < this.longPressThreshold;
            this.keyReleased[code] = null; // 清除释放标记
            return wasShort;
        }
        return false;
    }

    // E 或 Space 短按：拾取/放下
    get pickup() {
        return this.wasShortPress('KeyE') || this.wasShortPress('Space');
    }

    // E 或 Space 长按：切菜/烹饪
    get work() {
        return this.isLongPress('KeyE') || this.isLongPress('Space');
    }
    
    // 检测是否有任何键被按下（用于初始化音频）
    get anyKeyPressed() {
        return Object.values(this.keys).some(v => v);
    }
    
    // 检测是否按下交互键
    get actionPressed() {
        return this.keys['KeyE'] || this.keys['Space'];
    }
}
