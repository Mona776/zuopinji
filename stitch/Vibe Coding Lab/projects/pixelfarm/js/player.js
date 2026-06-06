import { Animator } from './animator.js';

export class Player {
  constructor(x, y, tileSize) {
    this.x = x;
    this.y = y;
    this.tileSize = tileSize;
    this.width = tileSize; 
    this.height = tileSize; 
    this.speed = 150; 
    this.visible = true; // Visibility flag
    
    // Image Sources
    this.sources = {
      base: 'https://static.wefun.ai/assets/131a74de-5e12-4d53-ace3-8f558026b719.png',
      // Walk Right
      walk_right_1: 'https://static.wefun.ai/assets/b71ec4eb-96fd-432a-a257-13c79ebd95d7.png',
      walk_right_2: 'https://static.wefun.ai/assets/863812c2-481d-46c5-a5f8-59cd5a17e098.png',
      walk_right_3: 'https://static.wefun.ai/assets/cf1fb710-ead6-4ade-abdb-d21b2e16820b.png',
      walk_right_4: 'https://static.wefun.ai/assets/8eca4504-f5c5-42e0-a303-0cf38ad99c36.png',
      walk_right_5: 'https://static.wefun.ai/assets/ae0ace78-87c6-4165-8aed-c8187e8c2c16.png',
      walk_right_6: 'https://static.wefun.ai/assets/e1294b18-8103-4873-8648-c3f58a96be3f.png',
      // Walk Left
      walk_left_1: 'https://static.wefun.ai/assets/e9ad5664-8737-439b-8570-bfd03a8f309d.png',
      walk_left_2: 'https://static.wefun.ai/assets/ddb9bcd8-ef6a-42ba-9014-757b14914678.png',
      walk_left_3: 'https://static.wefun.ai/assets/66236da0-5c8c-49db-b445-2d25a6081a18.png',
      walk_left_4: 'https://static.wefun.ai/assets/6e04c01b-b70b-4645-9c88-e235a7b13a06.png',
      walk_left_5: 'https://static.wefun.ai/assets/db7f9070-2387-4c33-8c87-a8d3c0677559.png',
      walk_left_6: 'https://static.wefun.ai/assets/96511f8c-e5db-4865-b6e4-553198965f99.png',
      // Walk Up
      walk_up_1: 'https://static.wefun.ai/assets/e412ee38-48c6-4acd-a429-fb89ae0d7be9.png',
      walk_up_2: 'https://static.wefun.ai/assets/2a0f6b4b-a670-402e-a31f-f69fd4df6b96.png',
      walk_up_3: 'https://static.wefun.ai/assets/5147afd7-ddb1-478f-bdca-775195c70a59.png',
      walk_up_4: 'https://static.wefun.ai/assets/269ff996-061f-4b0b-8041-c2682737d45f.png',
      walk_up_5: 'https://static.wefun.ai/assets/4e4df2ae-e1ad-4019-aa5a-86a73121d2e9.png',
      walk_up_6: 'https://static.wefun.ai/assets/867405f5-3fe3-4e96-8d56-4adafd5f441a.png',
      // Walk Down
      walk_down_1: 'https://static.wefun.ai/assets/39523801-63c0-44f4-b247-04e6770ca033.png',
      walk_down_2: 'https://static.wefun.ai/assets/be1e8e0a-51a2-45c4-96ec-02141102a3b9.png',
      walk_down_3: 'https://static.wefun.ai/assets/62c4253e-d056-4aa9-ae6a-63edd65d8982.png',
      walk_down_4: 'https://static.wefun.ai/assets/7fe429bf-291d-4565-9ebf-bac29c640365.png',
      walk_down_5: 'https://static.wefun.ai/assets/a2fbb171-a29b-41f8-abd8-66d13f5fdba2.png',
      walk_down_6: 'https://static.wefun.ai/assets/249809a9-2ffe-47ed-bd37-28bed1a079ba.png',
      // Idle Down (New)
      idle_down_1: 'https://static.wefun.ai/assets/2eb88725-4f20-4bb2-ae1a-b1d7536497d8.png',
      idle_down_2: 'https://static.wefun.ai/assets/73f6f6ae-cb45-4acf-9e56-bb1f4067e0e6.png',
      idle_down_3: 'https://static.wefun.ai/assets/63913e53-f978-4039-aebd-e3db9a3cc144.png',
      idle_down_4: 'https://static.wefun.ai/assets/c7e366de-5f12-4fc4-b1a9-d08181f22530.png',
      idle_down_5: 'https://static.wefun.ai/assets/4e0c5592-d3ab-41cf-be16-684080b4993e.png',
      idle_down_6: 'https://static.wefun.ai/assets/8db81876-5e4b-4c08-a7dd-a8fa15d023ee.png'
    };
    
    this.images = {};
    this.isLoaded = false;
    
    this.frameW = 32;
    this.frameH = 32;

    this.animator = new Animator({});
    
    this.facingDirection = 'down'; 
    this.currentState = 'idle';
    
    this.loadImages();
  }

  loadImages() {
    const keys = Object.keys(this.sources);
    let loadedCount = 0;
    
    keys.forEach(key => {
      const img = new Image();
      img.src = this.sources[key];
      img.onload = () => {
        this.images[key] = img;
        loadedCount++;
        if (loadedCount === keys.length) {
          this.onLoaded();
        }
      };
      img.onerror = () => {
         loadedCount++;
         if (loadedCount === keys.length) this.onLoaded();
      };
    });
  }

  onLoaded() {
    this.isLoaded = true;
    
    const cols = 6;
    const rows = 4;
    if (this.images['base']) {
        this.frameW = this.images['base'].width / cols;
        this.frameH = this.images['base'].height / rows;
    }
    
    const animConfig = this.createAnimConfig();
    this.animator = new Animator(animConfig);
    
    this.setState(this.currentState, this.facingDirection);
  }

  createAnimConfig() {
    const animConfig = {};

    const createFrames = (prefix) => {
        const frames = [];
        for(let i=1; i<=6; i++) {
            const img = this.images[`${prefix}_${i}`];
            if(img) {
                frames.push({ x: 0, y: 0, w: img.width, h: img.height, image: img });
            }
        }
        return frames;
    };

    const idleFrames = createFrames('idle_down');
    const sharedIdleConfig = { frames: idleFrames, speed: 0.15, loop: true };

    animConfig['walk_right'] = { frames: createFrames('walk_right'), speed: 0.1, loop: true };
    animConfig['idle_right'] = sharedIdleConfig;

    animConfig['walk_left'] = { frames: createFrames('walk_left'), speed: 0.1, loop: true };
    animConfig['idle_left'] = sharedIdleConfig;

    animConfig['walk_up'] = { frames: createFrames('walk_up'), speed: 0.1, loop: true };
    animConfig['idle_up'] = sharedIdleConfig;

    animConfig['walk_down'] = { frames: createFrames('walk_down'), speed: 0.1, loop: true };
    animConfig['idle_down'] = sharedIdleConfig;

    return animConfig;
  }

  setState(state, direction) {
    if (direction) {
      this.facingDirection = direction;
    }
    const animName = `${state}_${this.facingDirection}`;
    this.currentState = state;
    this.animator.play(animName);
  }

  update(input, dt, map) {
    let dx = 0;
    let dy = 0;
    const moveAmount = this.speed * dt;

    if (input.isDown('w')) dy -= moveAmount;
    if (input.isDown('s')) dy += moveAmount;
    if (input.isDown('a')) dx -= moveAmount;
    if (input.isDown('d')) dx += moveAmount;

    if (dx !== 0 && dy !== 0) {
      dx *= 0.707;
      dy *= 0.707;
    }

    let nextState = 'idle';
    let nextDirection = this.facingDirection;

    if (dy < 0) nextDirection = 'up';
    else if (dy > 0) nextDirection = 'down';
    else if (dx < 0) nextDirection = 'left';
    else if (dx > 0) nextDirection = 'right';

    if (dx !== 0 || dy !== 0) {
      nextState = 'walk';
    }

    this.setState(nextState, nextDirection);
    this.animator.update(dt);

    // Check Collision with Future Position
    // We check X and Y separately to allow sliding along walls
    
    // Check X
    if (!this.checkCollision(this.x + dx, this.y, map)) {
      this.x += dx;
    }
    
    // Check Y
    if (!this.checkCollision(this.x, this.y + dy, map)) {
      this.y += dy;
    }

    this.x = Math.max(0, Math.min(this.x, map.width - this.width));
    this.y = Math.max(0, Math.min(this.y, map.height - this.height));
  }

  checkCollision(x, y, map) {
    const rect = {
      x: x,
      y: y,
      width: this.width,
      height: this.height
    };
    return map.checkCollision(rect);
  }

  draw(ctx) {
    if (!this.isLoaded) return;
    if (!this.visible) return; // Check visibility

    const frame = this.animator.getCurrentFrame();
    if (frame && frame.image) {
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(
        Math.floor(this.x + this.width/2), 
        Math.floor(this.y + this.height - 2), 
        10, 4, 0, 0, Math.PI * 2
      );
      ctx.fill();

      // Character
      // Center the character sprite on the logical tile position
      const drawX = Math.floor(this.x + (this.width - frame.w) / 2);
      const drawY = Math.floor(this.y + (this.height - frame.h)); 

      ctx.drawImage(
        frame.image,
        frame.x, frame.y, frame.w, frame.h,
        drawX, drawY, frame.w, frame.h
      );
    }
  }
}
// 玩家角色类，处理玩家移动、状态和属性
