import { CONFIG, COLORS } from './config.js';

export class Map {
  constructor() {
    this.cols = CONFIG.GRID_COLS;
    this.rows = CONFIG.GRID_ROWS;
    this.tileSize = CONFIG.TILE_SIZE;
    this.width = CONFIG.MAP_WIDTH;
    this.height = CONFIG.MAP_HEIGHT;

    this.grid = Array(this.rows).fill(null).map(() => Array(this.cols).fill(null));
    this.setupLayout();
  }

  setupLayout() {
    const createStation = (type, name) => ({ type, name, item: null });
    const createPlateRack = () => ({ type: 'plate', name: 'Plates', item: null, cleanPlates: CONFIG.MAX_CLEAN_PLATES });

    // 1. THE DIVIDER
    for (let r = 1; r <= 6; r++) {
      this.grid[r][6] = createStation('counter', 'Counter');
    }
    // Specific roles for processing
    this.grid[2][6].name = 'Chop';
    this.grid[3][6].name = 'Chop';
    this.grid[4][6].name = 'Chop';

    // 2. LEFT ZONE: PANTRY
    this.grid[1][1] = createStation('flour', 'Flour');
    this.grid[1][2] = createStation('mixer', 'Mixer');
    this.grid[1][2].mixProgress = 0;
    this.grid[1][3] = createStation('mixer', 'Mixer');
    this.grid[1][3].mixProgress = 0;
    this.grid[4][1] = createStation('meat', 'Meat');
    this.grid[7][1] = createStation('veggie', 'Cabbage');

    // 3. RIGHT ZONE: KITCHEN
    this.grid[1][8] = createStation('serving', 'Service');
    this.grid[1][9] = createStation('serving', 'Service');
    this.grid[1][10] = createStation('serving', 'Service');
    this.grid[1][11] = createPlateRack();
    this.grid[1][7] = createStation('dirty_return', 'Return');

    this.grid[4][11] = createStation('sink', 'Sink');
    this.grid[5][11] = createStation('sink', 'Sink');
    this.grid[4][11].dirtyPlates = [];
    this.grid[5][11].dirtyPlates = [];
    this.grid[4][11].washProgress = 0;
    this.grid[5][11].washProgress = 0;
    this.grid[7][10] = createStation('stove', 'Stove');
    this.grid[7][11] = createStation('stove', 'Stove');

    this.grid[8][8] = createStation('trash', 'Trash');
    this.grid[4][10] = createStation('counter', 'Assembly');
    this.grid[5][10] = createStation('counter', 'Assembly');
  }

  drawFloor(ctx) {
    // 中国新年主题 - 深色木纹拼花地板
    const tileSize = 60;  // 拼花瓷砖大小
    const floorDark = '#4E342E';   // 深胡桃木
    const floorLight = '#5D4037';  // 浅一点的木纹
    const floorAccent = '#6D4C41'; // 钻石图案色

    // 绘制基础深色底
    ctx.fillStyle = floorDark;
    ctx.fillRect(0, 0, this.width, this.height);

    // 绘制拼花瓷砖
    for (let y = 0; y < this.height; y += tileSize) {
      for (let x = 0; x < this.width; x += tileSize) {
        // 交替的瓷砖底色
        const isAlt = ((x / tileSize) + (y / tileSize)) % 2 === 0;
        ctx.fillStyle = isAlt ? floorDark : floorLight;
        ctx.fillRect(x, y, tileSize, tileSize);

        // 钻石图案（在每个瓷砖中心）
        const centerX = x + tileSize / 2;
        const centerY = y + tileSize / 2;
        const diamondSize = tileSize * 0.35;

        ctx.fillStyle = floorAccent;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - diamondSize);
        ctx.lineTo(centerX + diamondSize, centerY);
        ctx.lineTo(centerX, centerY + diamondSize);
        ctx.lineTo(centerX - diamondSize, centerY);
        ctx.closePath();
        ctx.fill();

        // 内层小钻石
        ctx.fillStyle = isAlt ? floorLight : floorDark;
        const innerSize = diamondSize * 0.5;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - innerSize);
        ctx.lineTo(centerX + innerSize, centerY);
        ctx.lineTo(centerX, centerY + innerSize);
        ctx.lineTo(centerX - innerSize, centerY);
        ctx.closePath();
        ctx.fill();

        // 瓷砖边线
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, tileSize, tileSize);
      }
    }
  }

  drawWalls(ctx) {
    const d = CONFIG.WALL_DEPTH;

    // 中国新年主题 - 暖色墙壁
    const wallColor = '#8D6E63';      // 暖棕色墙壁
    const wallTopColor = '#A1887F';   // 墙顶高亮
    const wallShadow = '#6D4C41';     // 墙壁阴影

    // 后墙
    ctx.fillStyle = wallColor;
    ctx.fillRect(0, 0, this.width, d + 10);
    // 墙顶高亮
    ctx.fillStyle = wallTopColor;
    ctx.fillRect(0, 0, this.width, 8);
    // 墙底阴影
    ctx.fillStyle = wallShadow;
    ctx.fillRect(0, d + 6, this.width, 4);

    // 红色装饰横条
    ctx.fillStyle = '#C62828';
    ctx.fillRect(0, d - 2, this.width, 8);
    ctx.fillStyle = '#FFC107';
    ctx.fillRect(0, d, this.width, 2);

    // 左右墙
    ctx.fillStyle = wallColor;
    ctx.fillRect(0, 0, d, this.height);
    ctx.fillRect(this.width - d, 0, d, this.height);

    // 底墙
    ctx.fillStyle = wallColor;
    ctx.fillRect(0, this.height - d, this.width, d);

    // 窗户 - 深红框架
    const winX = 8 * this.tileSize;
    const winW = 3 * this.tileSize;
    ctx.fillStyle = '#1a1a2e';  // 深色窗户
    ctx.fillRect(winX, 0, winW, d + 10);

    // 窗框 - 红色
    ctx.strokeStyle = '#8E0000';
    ctx.lineWidth = 4;
    ctx.strokeRect(winX + 2, 2, winW - 4, d + 6);

    // 窗台 - 金色
    ctx.fillStyle = '#FFC107';
    ctx.fillRect(winX - 5, d, winW + 10, 6);

    // 绘制红灯笼
    this.drawLanterns(ctx, d);
  }

  drawLanterns(ctx, wallDepth) {
    const lanternPositions = [2, 4, 12];  // 灯笼位置（格子数）

    for (const col of lanternPositions) {
      const lx = col * this.tileSize + this.tileSize / 2;
      const ly = wallDepth + 8;

      // 吊绳
      ctx.strokeStyle = '#FFC107';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lx, 0);
      ctx.lineTo(lx, ly);
      ctx.stroke();

      // 灯笼顶盖（金色）
      ctx.fillStyle = '#FFC107';
      ctx.fillRect(lx - 8, ly, 16, 4);

      // 灯笼主体（红色椭圆形）
      ctx.fillStyle = '#C62828';
      ctx.beginPath();
      ctx.ellipse(lx, ly + 18, 10, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      // 灯笼高亮
      ctx.fillStyle = 'rgba(255, 200, 100, 0.3)';
      ctx.beginPath();
      ctx.ellipse(lx - 3, ly + 15, 4, 8, -0.2, 0, Math.PI * 2);
      ctx.fill();

      // 灯笼横纹
      ctx.strokeStyle = '#8E0000';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(lx - 8, ly + 14);
      ctx.lineTo(lx + 8, ly + 14);
      ctx.moveTo(lx - 8, ly + 22);
      ctx.lineTo(lx + 8, ly + 22);
      ctx.stroke();

      // 灯笼底盖（金色）
      ctx.fillStyle = '#FFC107';
      ctx.fillRect(lx - 6, ly + 30, 12, 3);

      // 流苏
      ctx.strokeStyle = '#FFC107';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(lx, ly + 33);
      ctx.lineTo(lx, ly + 42);
      ctx.stroke();

      // 流苏末端
      ctx.fillStyle = '#FFC107';
      ctx.beginPath();
      ctx.moveTo(lx - 4, ly + 42);
      ctx.lineTo(lx, ly + 48);
      ctx.lineTo(lx + 4, ly + 42);
      ctx.closePath();
      ctx.fill();
    }
  }

  getStationAt(r, c) {
    if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return null;
    return this.grid[r][c];
  }

  isConnectable(r, c, baseType) {
    const s = this.getStationAt(r, c);
    if (!s) return false;
    if (baseType === 'counter' && s.type === 'counter') return true;
    return s.type === baseType;
  }

  getColorsForType(type) {
    switch (type) {
      case 'counter':
      case 'meat':      // 肉桌使用 counter 样式
      case 'veggie':    // 蔬菜桌使用 counter 样式
      case 'flour':     // 面粉桌使用 counter 样式
      case 'mixer':     // 搅拌机桌使用 counter 样式
        return { top: COLORS.COUNTER, front: COLORS.COUNTER_FRONT };
      case 'serving': return { top: '#ffeb3b', front: '#fbc02d' };
      case 'plate': return { top: COLORS.WOOD, front: COLORS.WOOD_FRONT };
      case 'dirty_return': return { top: '#ffccbc', front: '#ff8a65' };
      case 'stove': return { top: COLORS.STOVE, front: COLORS.STOVE_FRONT };
      case 'sink': return { top: COLORS.SINK, front: COLORS.SINK_FRONT };
      case 'trash': return { top: COLORS.TRASH, front: COLORS.TRASH_FRONT };
      default: return { top: COLORS.COUNTER, front: COLORS.COUNTER_FRONT };
    }
  }

  drawLabel(ctx, name, x, y) {
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const tw = ctx.measureText(name).width;
    ctx.fillStyle = COLORS.LABEL;
    ctx.fillRect(x - tw / 2 - 3, y - 7, tw + 6, 14);
    ctx.fillStyle = 'white';
    ctx.fillText(name, x, y);
  }

  checkCircleCollision(cx, cy, radius) {
    const d = CONFIG.WALL_DEPTH;
    if (cx - radius < d || cx + radius > this.width - d || cy - radius < d || cy + radius > this.height - d) return true;

    const startCol = Math.floor((cx - radius) / this.tileSize);
    const endCol = Math.floor((cx + radius) / this.tileSize);
    const startRow = Math.floor((cy - radius) / this.tileSize);
    const endRow = Math.floor((cy + radius) / this.tileSize);

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const s = this.getStationAt(r, c);
        if (s) {
          const tx = c * this.tileSize;
          const ty = r * this.tileSize;
          const tw = this.tileSize;
          const th = this.tileSize;
          const closestX = Math.max(tx, Math.min(cx, tx + tw));
          const closestY = Math.max(ty, Math.min(cy, ty + th));
          const dx = cx - closestX;
          const dy = cy - closestY;
          if ((dx * dx + dy * dy) < radius * radius) return true;
        }
      }
    }
    return false;
  }
}
