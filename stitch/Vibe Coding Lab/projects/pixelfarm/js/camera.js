// 摄像机系统，控制视角跟随玩家移动
export class Camera {
    constructor(width, height, mapWidth, mapHeight) {
      this.width = width;
      this.height = height;
      this.x = 0;
      this.y = 0;
      this.mapWidth = mapWidth;
      this.mapHeight = mapHeight;
    }
  
    follow(target) {
      // Calculate ideal position (centered on target)
      const idealX = target.x - this.width / 2 + target.width / 2;
      const idealY = target.y - this.height / 2 + target.height / 2;
      
      const padding = 128; // 允许摄像机超出地图边界 128 像素（约4格）

      // Handle X axis
      if (this.mapWidth <= this.width) {
          // Center the map in the screen
          this.x = -(this.width - this.mapWidth) / 2;
      } else {
          // Clamp to map bounds with padding
          this.x = Math.max(-padding, Math.min(idealX, this.mapWidth - this.width + padding));
      }
  
      // Handle Y axis - 地图顶部始终对齐屏幕顶部
      if (this.mapHeight <= this.height) {
          // 地图比屏幕小时，顶部对齐
          this.y = 0;
      } else {
          // 地图比屏幕大时，Y最小为0（顶部对齐），最大允许向下滚动到底部+padding
          this.y = Math.max(0, Math.min(idealY, this.mapHeight - this.height + padding));
      }
    }
  }
  