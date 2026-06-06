export class Animator {
    constructor(animations) {
      this.animations = animations; // Object: { name: { frames: [], speed: 0.1, loop: true } }
      this.currentAnim = null;
      this.currentAnimName = '';
      this.frameIndex = 0;
      this.timeSinceLastFrame = 0;
    }
  
    play(name) {
      if (this.currentAnimName === name) return;
  
      if (this.animations[name]) {
        this.currentAnimName = name;
        this.currentAnim = this.animations[name];
        this.frameIndex = 0;
        this.timeSinceLastFrame = 0;
      }
    }
  
    update(dt) {
      if (!this.currentAnim) return;
  
      this.timeSinceLastFrame += dt;
  
      if (this.timeSinceLastFrame >= this.currentAnim.speed) {
        this.timeSinceLastFrame -= this.currentAnim.speed;
        this.frameIndex++;
  
        if (this.frameIndex >= this.currentAnim.frames.length) {
          if (this.currentAnim.loop) {
            this.frameIndex = 0;
          } else {
            this.frameIndex = this.currentAnim.frames.length - 1;
          }
        }
      }
    }
  
    getCurrentFrame() {
      if (!this.currentAnim) return null;
      return this.currentAnim.frames[this.frameIndex];
    }
  }
  // 动画系统，管理角色和对象的动画播放
