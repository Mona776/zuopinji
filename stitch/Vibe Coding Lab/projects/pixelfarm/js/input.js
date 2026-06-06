export class InputHandler {
    constructor() {
      this.keys = {};
      this.prevKeys = {}; // Track previous frame state
      
      window.addEventListener('keydown', (e) => {
        this.keys[e.key.toLowerCase()] = true;
      });
  
      window.addEventListener('keyup', (e) => {
        this.keys[e.key.toLowerCase()] = false;
      });
    }
  
    // Must be called at the end of the game loop
    update() {
      this.prevKeys = { ...this.keys };
    }
  
    isDown(key) {
      return this.keys[key.toLowerCase()] || false;
    }
  
    // Returns true only on the frame the key was pressed
    isPressed(key) {
      const k = key.toLowerCase();
      return this.keys[k] && !this.prevKeys[k];
    }
  }
  // 输入处理系统，捕获键盘和鼠标输入事件
