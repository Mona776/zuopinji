// 瓦片系统，处理地图瓦片的渲染和碰撞检测
export const TILE_TYPES = {
  BASE: 'base',
  DECO: 'deco'
};

export const TILES = {
  // Base Layers
  0: { id: 0, name: 'Grass', color: '#46B34E', type: TILE_TYPES.BASE, solid: false, group: 'grass_group' },
  1: { id: 1, name: 'Wall Wood', color: '#5c4033', type: TILE_TYPES.BASE, solid: true, group: 'wall_group' },
  2: { id: 2, name: 'Roof', color: '#8b4513', type: TILE_TYPES.BASE, solid: true, group: 'wall_group' },
  3: { id: 3, name: 'Door (Out)', color: '#000000', type: TILE_TYPES.BASE, solid: false, group: 'wall_group' }, 
  4: { 
    id: 4, 
    name: 'Floor Wood', 
    color: '#d2b48c', 
    type: TILE_TYPES.BASE, 
    solid: false, 
    group: 'floor_group',
    src: 'https://placehold.co/32x32/d2b48c/c19a6b.png?text=||' // Visual texture
  },
  5: { id: 5, name: 'Floor Stone', color: '#a0a0a0', type: TILE_TYPES.BASE, solid: false, group: 'floor_group' },
  6: { id: 6, name: 'Door (In)', color: '#7ec850', type: TILE_TYPES.BASE, solid: false, group: 'floor_group' }, 
  7: { 
    id: 7, 
    name: 'Floor Special', 
    color: '#a0a0a0', 
    type: TILE_TYPES.BASE, 
    solid: false, 
    group: 'floor_group',
    src: 'https://static.wefun.ai/assets/cc57db16-07b2-4377-a1cb-af829b9426fc.png'
  },
  8: { id: 8, name: 'Water', color: '#3885C9', type: TILE_TYPES.BASE, solid: true, group: 'water_group' },
  9: { 
    id: 9, 
    name: 'Floor Dark', 
    color: '#3e2723', 
    type: TILE_TYPES.BASE, 
    solid: false, 
    group: 'floor_group',
    src: 'https://placehold.co/32x32/3e2723/3e2723.png' 
  },
  // New Floor Tiles
  16: { 
    id: 16, 
    name: 'Floor Cherry', 
    color: '#8b4c39', 
    type: TILE_TYPES.BASE, 
    solid: false, 
    group: 'floor_group',
    src: 'https://placehold.co/32x32/8b4c39/6d3a2b.png?text=||'
  },
  17: { 
    id: 17, 
    name: 'Floor Cream', 
    color: '#f5e6d3', 
    type: TILE_TYPES.BASE, 
    solid: false, 
    group: 'floor_group',
    src: 'https://placehold.co/32x32/f5e6d3/e8d4b8.png?text=||'
  },
  // Farming Tiles
  50: { 
    id: 50, 
    name: 'Dirt', 
    color: '#5d4037', 
    type: TILE_TYPES.BASE, 
    solid: false, 
    group: 'farming_group',
    src: 'https://static.wefun.ai/assets/0ee83915-9919-445c-a1db-84c4984b1feb.png' 
  },

  // Indoor Walls
  20: { 
      id: 20, 
      name: 'Indoor Wall Top', 
      color: '#3e2723', 
      type: TILE_TYPES.BASE, 
      solid: true, 
      group: 'wall_group',
      src: 'https://placehold.co/32x32/3e2723/3e2723.png' 
  },
  21: { 
      id: 21, 
      name: 'Indoor Wall Face', 
      color: '#5d4037', 
      type: TILE_TYPES.BASE, 
      solid: true, 
      group: 'wall_group',
      src: 'https://placehold.co/32x32/5d4037/8d6e63.png?text=||' 
  },

  // Indoor Details (Procedural or semi-transparent)
  28: {
      id: 28,
      name: 'Baseboard',
      color: '#4a3026',
      type: TILE_TYPES.DECO,
      solid: false,
      group: 'wall_group',
      drawType: 'baseboard'
  },
  29: {
      id: 29,
      name: 'Shadow Top',
      color: 'rgba(0,0,0,0.2)',
      type: TILE_TYPES.DECO,
      solid: false,
      group: 'effects_group',
      drawType: 'shadow_top'
  },
  27: {
      id: 27,
      name: 'Shadow Corner',
      color: 'rgba(0,0,0,0.3)',
      type: TILE_TYPES.DECO,
      solid: false,
      group: 'effects_group',
      drawType: 'shadow_full'
  },

  // Deco Layers (Flat)
  10: { 
    id: 10, 
    name: 'Flower Red', 
    color: '#ff0000', 
    type: TILE_TYPES.DECO, 
    solid: false, 
    group: 'plants_group',
    src: 'https://static.wefun.ai/assets/d9c3019d-33a7-4c2a-886f-c0e60f46af8e.png'
  },
  11: {
    id: 11,
    name: 'Blue Flower',
    color: '#6699ff',
    type: TILE_TYPES.DECO, 
    solid: false, 
    group: 'plants_group',
    src: 'https://static.wefun.ai/assets/5e739d58-fcee-480a-89f7-adeb592e8724.png'
  },
  12: { 
    id: 12, 
    name: 'Rug Red', 
    color: '#c04040', 
    type: TILE_TYPES.DECO, 
    solid: false, 
    group: 'rug_group',
    width: 96,
    height: 128,
    src: 'https://static.wefun.ai/assets/64344fbf-a143-4ae7-b052-104188a9ee33.png'
  },
  13: { 
    id: 13, 
    name: 'Rug Blue', 
    color: '#4040c0', 
    type: TILE_TYPES.DECO, 
    solid: false, 
    group: 'rug_group',
    width: 96,
    height: 64,
    src: 'https://static.wefun.ai/assets/c47c47af-3f22-46d4-a1bf-28fd10cdb28e.png'
  },
  14: {
    id: 14,
    name: 'Rug Green',
    color: '#40c040', 
    type: TILE_TYPES.DECO, 
    solid: false, 
    group: 'rug_group',
    width: 128,
    height: 96,
    rotate: 90,
    src: 'https://static.wefun.ai/assets/8ca498ea-473d-4386-9551-af3cd320825c.png'
  },
  15: {
    id: 15,
    name: 'Rug Horizontal',
    color: '#8b4513',
    type: TILE_TYPES.DECO, 
    solid: false,
    group: 'rug_group',
    width: 96,
    height: 64,
    src: 'https://static.wefun.ai/assets/792fbcda-b74f-4c0a-bd35-a5eb8d4c3c64.png'
  },

  // Windows
  22: { 
      id: 22, 
      name: 'Window Day', 
      color: '#87CEEB', 
      type: TILE_TYPES.DECO, 
      solid: false, 
      group: 'wall_group',
      width: 32,
      height: 32,
      src: 'https://placehold.co/32x32/87CEEB/FFFFFF.png?text=Win'
  },
  23: { 
      id: 23, 
      name: 'Window Night', 
      color: '#191970', 
      type: TILE_TYPES.DECO, 
      solid: false, 
      group: 'wall_group',
      width: 32,
      height: 32,
      src: 'https://placehold.co/32x32/191970/FFFFFF.png?text=Win'
  },
  24: { 
      id: 24, 
      name: 'Window Vines', 
      color: '#87CEEB', 
      type: TILE_TYPES.DECO, 
      solid: false, 
      group: 'wall_group',
      width: 32,
      height: 32,
      src: 'https://static.wefun.ai/assets/9e7a349d-cbb9-48c8-a618-ea65cf0c1191.png'
  },
  25: { 
      id: 25, 
      name: 'Window Clean', 
      color: '#87CEEB', 
      type: TILE_TYPES.DECO, 
      solid: false, 
      group: 'wall_group',
      width: 32,
      height: 32,
      src: 'https://static.wefun.ai/assets/5b9116df-7f6e-4792-a662-20c5dd53618d.png'
  },
  26: { 
      id: 26, 
      name: 'Window Lattice', 
      color: '#87CEEB', 
      type: TILE_TYPES.DECO, 
      solid: false, 
      group: 'wall_group',
      width: 32,
      height: 32,
      src: 'https://static.wefun.ai/assets/ef2479eb-3b2b-4152-ac0a-aab59d4de854.png'
  },

  // Grass Assets (rounded to nearest integer)
  30: { 
    id: 30, 
    name: 'Grass 1', 
    color: '#6eb840', 
    type: TILE_TYPES.DECO, 
    solid: false, 
    group: 'grass_group', 
    width: 51,
    height: 51,
    src: 'https://static.wefun.ai/assets/4f184036-6d49-4b19-a7a4-e858c4394af9.png'
  },
  31: { 
    id: 31, 
    name: 'Grass 2', 
    color: '#6eb840', 
    type: TILE_TYPES.DECO, 
    solid: false, 
    group: 'grass_group',
    width: 51,
    height: 51, 
    src: 'https://static.wefun.ai/assets/7ed26b6b-0ad2-4835-94fc-818773a1b0f3.png'
  },
  32: { 
    id: 32, 
    name: 'Grass 3', 
    color: '#6eb840', 
    type: TILE_TYPES.DECO, 
    solid: false, 
    group: 'grass_group', 
    width: 51,
    height: 51,
    src: 'https://static.wefun.ai/assets/a11397a7-4bbd-433d-8a6d-726c085acb7e.png'
  },
  33: { 
    id: 33, 
    name: 'Grass 4', 
    color: '#6eb840', 
    type: TILE_TYPES.DECO, 
    solid: false, 
    group: 'grass_group', 
    width: 51,
    height: 51,
    src: 'https://static.wefun.ai/assets/1ffceb5e-0524-4819-a699-86106b847884.png'
  },
  34: { 
    id: 34, 
    name: 'Grass 5', 
    color: '#6eb840', 
    type: TILE_TYPES.DECO, 
    solid: false, 
    group: 'grass_group', 
    width: 51,
    height: 51,
    src: 'https://static.wefun.ai/assets/d829a2cb-0c37-4056-a192-95c35e41bf6b.png'
  },
  35: { 
    id: 35, 
    name: 'Grass 6', 
    color: '#6eb840', 
    type: TILE_TYPES.DECO, 
    solid: false, 
    group: 'grass_group', 
    width: 51,
    height: 51,
    src: 'https://static.wefun.ai/assets/a9dd0e3b-2bcf-494b-9148-040288d4fb3b.png'
  },
  36: { 
    id: 36, 
    name: 'Grass 7', 
    color: '#6eb840', 
    type: TILE_TYPES.DECO, 
    solid: false, 
    group: 'grass_group', 
    width: 51,
    height: 51,
    src: 'https://static.wefun.ai/assets/aaf4f7d5-36c0-4281-a2cb-8ba38e5b26f9.png'
  },
  37: { 
    id: 37, 
    name: 'Grass 8', 
    color: '#6eb840', 
    type: TILE_TYPES.DECO, 
    solid: false, 
    group: 'grass_group', 
    width: 51,
    height: 51,
    src: 'https://static.wefun.ai/assets/c9c4f39f-5d34-4d45-a858-568f096cadbd.png'
  },
  38: { 
    id: 38, 
    name: 'Grass 9', 
    color: '#6eb840', 
    type: TILE_TYPES.DECO, 
    solid: false, 
    group: 'grass_group', 
    width: 51,
    height: 51,
    src: 'https://static.wefun.ai/assets/4377497b-3ce4-4d7b-adf0-19947d974915.png'
  },
  39: { 
    id: 39, 
    name: 'Grass 10', 
    color: '#6eb840', 
    type: TILE_TYPES.DECO, 
    solid: false, 
    group: 'grass_group', 
    width: 51,
    height: 51,
    src: 'https://static.wefun.ai/assets/7e66409d-9d9a-4e96-b3ed-d10857e4f35a.png'
  },

  // Wall Paintings
  40: {
    id: 40,
    name: 'Painting',
    color: '#fff',
    type: TILE_TYPES.DECO,
    solid: false,
    group: 'wall_group',
    width: 64,
    height: 48,
    src: 'https://static.wefun.ai/assets/a61c2983-f05a-4e72-b733-0fc18ede96fb.png'
  },

  // Water Assets
  80: { 
    id: 80, 
    name: 'Water 1', 
    color: '#3885C9', 
    type: TILE_TYPES.DECO, 
    solid: true, 
    group: 'water_group', 
    width: 64, 
    height: 64, 
    src: 'https://static.wefun.ai/assets/7a4d02be-171f-4e5d-aa0a-ee970e8ba545.png' 
  },
  81: { 
    id: 81, 
    name: 'Water 2', 
    color: '#3885C9', 
    type: TILE_TYPES.DECO, 
    solid: true, 
    group: 'water_group', 
    width: 64, 
    height: 64, 
    src: 'https://static.wefun.ai/assets/73d4520b-2bdb-4737-b7ec-23562aa87c6e.png' 
  },
  82: { 
    id: 82, 
    name: 'Water 3', 
    color: '#3885C9', 
    type: TILE_TYPES.DECO, 
    solid: true, 
    group: 'water_group', 
    width: 64, 
    height: 64, 
    src: 'https://static.wefun.ai/assets/902d3f4e-0e7e-4d4c-be84-962dde25d08a.png'
  },
  83: { 
    id: 83, 
    name: 'Water 4', 
    color: '#3885C9', 
    type: TILE_TYPES.DECO, 
    solid: true, 
    group: 'water_group', 
    width: 64, 
    height: 64, 
    src: 'https://static.wefun.ai/assets/be8ae0ca-0b52-44ea-8127-71294e90e77c.png'
  },
  84: { 
    id: 84, 
    name: 'Water 5', 
    color: '#3885C9', 
    type: TILE_TYPES.DECO, 
    solid: true, 
    group: 'water_group', 
    width: 64, 
    height: 64, 
    src: 'https://static.wefun.ai/assets/c4bf2791-a276-49bd-9ab2-ac9dda6d16af.png'
  },
  85: { 
    id: 85, 
    name: 'Water 6', 
    color: '#3885C9', 
    type: TILE_TYPES.DECO, 
    solid: true, 
    group: 'water_group', 
    width: 64, 
    height: 64, 
    src: 'https://static.wefun.ai/assets/38982e35-c254-4b73-876c-18ec4f9f4045.png'
  },
  86: { 
    id: 86, 
    name: 'Water 7', 
    color: '#3885C9', 
    type: TILE_TYPES.DECO, 
    solid: true, 
    group: 'water_group', 
    width: 64, 
    height: 64, 
    src: 'https://static.wefun.ai/assets/4128c279-593d-440e-b535-6c276a964dd0.png'
  },
  87: { 
    id: 87, 
    name: 'Water 8', 
    color: '#3885C9', 
    type: TILE_TYPES.DECO, 
    solid: true, 
    group: 'water_group', 
    width: 64, 
    height: 64, 
    src: 'https://static.wefun.ai/assets/ff4b666e-d0a4-4503-86f2-20987f6d2333.png'
  },
  88: { 
    id: 88, 
    name: 'Water 9', 
    color: '#3885C9', 
    type: TILE_TYPES.DECO, 
    solid: true, 
    group: 'water_group', 
    width: 64, 
    height: 64, 
    src: 'https://static.wefun.ai/assets/b03bc68e-dbc6-4e9c-acd7-3efad5fb0d73.png'
  },
  89: { 
    id: 89, 
    name: 'Water 10', 
    color: '#3885C9', 
    type: TILE_TYPES.DECO, 
    solid: true, 
    group: 'water_group', 
    width: 64, 
    height: 64, 
    src: 'https://static.wefun.ai/assets/cef52528-7707-4846-ad85-a76b547d5195.png'
  },
};

// New Entity Definitions
export const ENTITIES = {
  100: {
    id: 100,
    name: 'Big Tree',
    group: 'landscape_group',
    width: 64,
    height: 96,
    src: 'https://placehold.co/64x96/2E8B57/FFFFFF.png?text=Tree',
    hitbox: { x: 20, y: 76, w: 24, h: 16 } // Collision at trunk base
  },
  101: {
    id: 101,
    name: 'Rock',
    group: 'landscape_group',
    width: 32,
    height: 32,
    src: 'https://placehold.co/32x32/808080/FFFFFF.png?text=Rock',
    hitbox: { x: 4, y: 16, w: 24, h: 12 }
  },
  102: {
    id: 102,
    name: 'Bush (Entity)',
    group: 'landscape_group',
    width: 32,
    height: 32,
    src: 'https://static.wefun.ai/assets/aa4544ef-431d-49a4-beb3-4fa5110f780d.png',
    hitbox: { x: 4, y: 16, w: 24, h: 12 }
  },
  103: {
    id: 103,
    name: 'Grass 4x4',
    group: 'landscape_group',
    width: 128,
    height: 128,
    src: 'https://placehold.co/128x128/7ec850/ffffff.png?text=Grass+4x4'
    // No hitbox -> walkable
  },
  104: {
    id: 104,
    name: 'Bush 3',
    group: 'landscape_group',
    width: 32,
    height: 45, // 1 * 32, 1.4 * 32 = 44.8 -> 45 integer
    src: 'https://static.wefun.ai/assets/34854d4d-26c8-49a1-bd0e-b592c6e12b1e.png',
    hitbox: { x: 2, y: 28, w: 28, h: 16 } 
  },
  105: {
    id: 105,
    name: 'Bush 4',
    group: 'landscape_group',
    width: 64, // 2 * 32
    height: 32, // 1 * 32
    src: 'https://static.wefun.ai/assets/0200912b-0a9c-4821-a1d4-b3e5f7da2181.png',
    hitbox: { x: 4, y: 14, w: 56, h: 16 }
  },
  106: {
    id: 106,
    name: 'Tree 1',
    group: 'landscape_group',
    width: 48, // 1.5 * 32
    height: 64, // 2 * 32
    src: 'https://static.wefun.ai/assets/6f493466-c736-438c-b5c3-631488d00745.png',
    hitbox: { x: 16, y: 52, w: 16, h: 12 }
  },
  107: {
    id: 107,
    name: 'Tree 2',
    group: 'landscape_group',
    width: 32, // 1 * 32
    height: 32, // 1 * 32
    src: 'https://static.wefun.ai/assets/88293989-b416-437f-8c3e-74e8cb0d1ab8.png',
    hitbox: { x: 8, y: 20, w: 16, h: 12 }
  },
  108: {
    id: 108,
    name: 'Tree 3',
    group: 'landscape_group',
    width: 96, // 3 * 32
    height: 96, // 3 * 32
    src: 'https://static.wefun.ai/assets/a02a2790-183d-4a23-8b84-83bafe83be8a.png',
    hitbox: { x: 36, y: 80, w: 24, h: 16 }
  },
  109: {
    id: 109,
    name: 'House',
    group: 'landscape_group',
    width: 320, // 10 * 32
    height: 320, // 10 * 32
    src: 'https://static.wefun.ai/assets/2d014121-d52f-435b-aa5c-792c52f381f2.png',
    hitbox: { x: 40, y: 220, w: 240, h: 80 }
  },
  110: {
    id: 110,
    name: 'Tree A',
    group: 'tree_group',
    width: 64,
    height: 96,
    src: 'https://static.wefun.ai/assets/d72e9088-942a-451e-a18d-4971bc71404d.png',
    hitbox: { x: 20, y: 76, w: 24, h: 16 }
  },
  111: {
    id: 111,
    name: 'Tree B',
    group: 'tree_group',
    width: 64,
    height: 96,
    src: 'https://static.wefun.ai/assets/fdfe08bd-404c-423b-b635-c002bec94366.png',
    hitbox: { x: 20, y: 76, w: 24, h: 16 }
  },
  112: {
    id: 112,
    name: 'Tree C',
    group: 'tree_group',
    width: 64,
    height: 96,
    src: 'https://static.wefun.ai/assets/9f43c062-3199-4ce9-a23f-f60811eb0225.png',
    hitbox: { x: 20, y: 76, w: 24, h: 16 }
  },
  113: {
    id: 113,
    name: 'Tree D',
    group: 'tree_group',
    width: 64,
    height: 96,
    src: 'https://static.wefun.ai/assets/a22cac60-61ef-482d-91ed-aabac9ea258e.png',
    hitbox: { x: 20, y: 76, w: 24, h: 16 }
  },
  // New Bushes
  120: {
    id: 120,
    name: 'Bush A',
    group: 'bush_group',
    width: 32,
    height: 32,
    src: 'https://static.wefun.ai/assets/ce79c69e-7172-40b7-a280-b1ed74900b5a.png',
    hitbox: { x: 4, y: 16, w: 24, h: 12 }
  },
  121: {
    id: 121,
    name: 'Bush B',
    group: 'bush_group',
    width: 32,
    height: 32,
    src: 'https://static.wefun.ai/assets/4595cc2f-1cfc-4793-8a14-ec20f1d092c0.png',
    hitbox: { x: 4, y: 16, w: 24, h: 12 }
  },
  122: {
    id: 122,
    name: 'Bush C',
    group: 'bush_group',
    width: 32,
    height: 32,
    src: 'https://static.wefun.ai/assets/7e742973-e161-4779-80f7-f7962993fb27.png',
    hitbox: { x: 4, y: 16, w: 24, h: 12 }
  },
  123: {
    id: 123,
    name: 'Bush D',
    group: 'bush_group',
    width: 32,
    height: 32,
    src: 'https://static.wefun.ai/assets/10c5dc3a-d5b6-4b0c-b78e-f9672aebb5b7.png',
    hitbox: { x: 4, y: 16, w: 24, h: 12 }
  },
  // New Stones
  130: {
    id: 130,
    name: 'Stone 1',
    group: 'stone_group',
    width: 32,
    height: 32,
    src: 'https://static.wefun.ai/assets/e003e5fd-cfdd-4e96-8043-89c740deb247.png',
    hitbox: { x: 4, y: 12, w: 24, h: 16 }
  },
  131: {
    id: 131,
    name: 'Stone 2',
    group: 'stone_group',
    width: 32,
    height: 32,
    src: 'https://static.wefun.ai/assets/a0991d6d-30e3-4e58-b99b-9ea17d8030ce.png',
    hitbox: { x: 4, y: 12, w: 24, h: 16 }
  },
  132: {
    id: 132,
    name: 'Stone 3',
    group: 'stone_group',
    width: 32,
    height: 32,
    src: 'https://static.wefun.ai/assets/8cf75cfe-73c6-43d0-8f8e-393a764faf39.png',
    hitbox: { x: 4, y: 12, w: 24, h: 16 }
  },
  133: {
    id: 133,
    name: 'Stone 4',
    group: 'stone_group',
    width: 32,
    height: 32,
    src: 'https://static.wefun.ai/assets/3a03f264-cb07-48ad-8750-39447440b7a6.png',
    hitbox: { x: 4, y: 12, w: 24, h: 16 }
  },
  134: {
    id: 134,
    name: 'Stone 5',
    group: 'stone_group',
    width: 32,
    height: 32,
    src: 'https://static.wefun.ai/assets/297c7fa3-50f4-477b-90d0-dbf855b98652.png',
    hitbox: { x: 4, y: 12, w: 24, h: 16 }
  },
  135: {
    id: 135,
    name: 'Stone 6',
    group: 'stone_group',
    width: 32,
    height: 32,
    src: 'https://static.wefun.ai/assets/3a14fd21-70bc-4aee-8963-cf960a0c873d.png',
    hitbox: { x: 4, y: 12, w: 24, h: 16 }
  },
  // Ponds
  150: {
    id: 150,
    name: 'Garden Pond',
    group: 'pond_group',
    width: 192, 
    height: 128, 
    src: 'https://static.wefun.ai/assets/7521cfc7-7a2f-477e-916c-ffff58a88df3.png',
    hitbox: { x: 0, y: 0, w: 192, h: 128 }
  },
  151: {
    id: 151,
    name: 'Pond Var 1',
    group: 'pond_group',
    width: 192, 
    height: 128, 
    src: 'https://static.wefun.ai/assets/51e5263b-c88a-4811-94e1-4f03497aeab5.png',
    hitbox: { x: 0, y: 0, w: 192, h: 128 }
  },
  152: {
    id: 152,
    name: 'Pond Var 2',
    group: 'pond_group',
    width: 192, 
    height: 128, 
    src: 'https://static.wefun.ai/assets/80809b7f-a53b-4c73-8dbd-2767c8533da4.png',
    hitbox: { x: 0, y: 0, w: 192, h: 128 }
  },
  153: {
    id: 153,
    name: 'Pond Var 3',
    group: 'pond_group',
    width: 192, 
    height: 128, 
    src: 'https://static.wefun.ai/assets/0a512db7-2812-48cb-b2ab-8abc75c9c11c.png',
    hitbox: { x: 0, y: 0, w: 192, h: 128 }
  },
  154: {
    id: 154,
    name: 'Pond Var 4',
    group: 'pond_group',
    width: 192, 
    height: 128, 
    src: 'https://static.wefun.ai/assets/f07e6e61-235b-49d6-bb1b-b1f1699478c6.png',
    hitbox: { x: 0, y: 0, w: 192, h: 128 }
  },
  155: {
    id: 155,
    name: 'Pond Var 5',
    group: 'pond_group',
    width: 192, 
    height: 128, 
    src: 'https://static.wefun.ai/assets/e9e73e53-1141-48f8-84b0-458cbebaa30b.png',
    hitbox: { x: 0, y: 0, w: 192, h: 128 }
  },
  
  // Furniture
  200: {
    id: 200,
    name: 'Bed Empty',
    group: 'furniture_group',
    width: 64,
    height: 96,
    src: 'https://static.wefun.ai/assets/48289b4d-26d1-4409-8db9-43e820cf466d.png',
    hitbox: { x: 4, y: 20, w: 56, h: 70 } 
  },
  201: {
    id: 201,
    name: 'Table',
    group: 'furniture_group',
    width: 96,
    height: 64,
    src: 'https://static.wefun.ai/assets/c4a4bad2-8a8b-4a65-93e4-e8b3347b802d.png',
    hitbox: { x: 4, y: 20, w: 88, h: 40 } 
  },
  202: {
    id: 202,
    name: 'Cabinet',
    group: 'furniture_group',
    width: 48,
    height: 64,
    src: 'https://static.wefun.ai/assets/2f4f4794-5d3d-4ce8-a3bb-79db85d187a0.png',
    hitbox: { x: 4, y: 32, w: 40, h: 32 }
  },
  203: {
    id: 203,
    name: 'Bed Occupied',
    group: 'furniture_group',
    width: 64,
    height: 96,
    src: 'https://static.wefun.ai/assets/0c7dc6a9-bf13-4726-869f-d72cbfc3d16f.png',
    hitbox: { x: 4, y: 20, w: 56, h: 70 }
  },
  204: {
    id: 204,
    name: 'Television',
    group: 'furniture_group',
    width: 64,
    height: 64,
    src: 'https://static.wefun.ai/assets/7bb99374-e7eb-4233-a065-a2f537ebb9fc.png',
    hitbox: { x: 8, y: 32, w: 48, h: 32 }
  },
  205: {
    id: 205,
    name: 'Shelf',
    group: 'furniture_group',
    width: 80, // 2.5 * 32
    height: 96, // 3 * 32
    src: 'https://static.wefun.ai/assets/20f8feb8-d862-4ea1-92cf-2a96cdf741eb.png',
    hitbox: { x: 4, y: 64, w: 72, h: 32 }
  },
  206: {
    id: 206,
    name: 'Armchair Empty',
    group: 'furniture_group',
    width: 64,
    height: 64, 
    src: 'https://static.wefun.ai/assets/c09ae3a9-9b47-49c7-97d5-9593b26e831c.png',
    hitbox: { x: 12, y: 32, w: 40, h: 32 }
  },
  207: {
    id: 207,
    name: 'Television 2',
    group: 'furniture_group',
    width: 64,
    height: 64,
    src: 'https://static.wefun.ai/assets/d740d345-3441-4067-be9b-e23637d90413.png',
    hitbox: { x: 8, y: 32, w: 48, h: 32 }
  },
  208: {
    id: 208,
    name: 'Mushroom Shelf',
    group: 'furniture_group',
    width: 96, 
    height: 80, 
    src: 'https://static.wefun.ai/assets/bcc16e80-36d0-4494-9c78-4da912c6be47.png',
    hitbox: { x: 4, y: 40, w: 88, h: 40 }
  },
  209: {
    id: 209,
    name: 'Mushroom Sofa',
    group: 'furniture_group',
    width: 128,
    height: 80,
    src: 'https://static.wefun.ai/assets/0ef9340a-2928-4bb6-a733-39c3fac26bf4.png',
    hitbox: { x: 8, y: 40, w: 112, h: 32 }
  },
  210: {
    id: 210,
    name: 'Mushroom Lamp',
    group: 'furniture_group',
    width: 32,
    height: 64,
    src: 'https://static.wefun.ai/assets/be96115f-b890-4b8a-bac0-9ec761af6812.png',
    hitbox: { x: 8, y: 48, w: 16, h: 16 }
  },
  211: {
    id: 211,
    name: 'Potted Mushroom',
    group: 'furniture_group',
    width: 32,
    height: 48,
    src: 'https://static.wefun.ai/assets/ccb5c7b5-d6b5-4935-9551-872302a3a4d4.png',
    hitbox: { x: 6, y: 32, w: 20, h: 16 }
  },

  // Farming Crops
  // Sunflower
  301: { 
    id: 301, 
    name: 'Sunflower Seeds', 
    group: 'crops_group', 
    width: 32, 
    height: 32, 
    src: 'https://static.wefun.ai/assets/85cdb5e9-22ed-42f1-a119-da724aa03f0c.png' 
  },
  302: { 
    id: 302, 
    name: 'Sunflower Growing', 
    group: 'crops_group', 
    width: 32, 
    height: 32, 
    src: 'https://static.wefun.ai/assets/e818928a-50e0-4fa4-ada0-bbd6e7ef5c39.png' 
  },
  303: { 
    id: 303, 
    name: 'Sunflower Mature', 
    group: 'crops_group', 
    width: 32, 
    height: 32, 
    src: 'https://static.wefun.ai/assets/1e8746bc-2913-4532-acd1-9f806a20d09a.png'
  },

  // Mushroom
  311: { 
    id: 311, 
    name: 'Mushroom Spores', 
    group: 'crops_group', 
    width: 32, 
    height: 32, 
    src: 'https://static.wefun.ai/assets/53b7212e-3a46-4a65-ad1c-1f6a82028946.png' 
  },
  312: { 
    id: 312, 
    name: 'Mushroom Growing', 
    group: 'crops_group', 
    width: 32, 
    height: 32, 
    src: 'https://static.wefun.ai/assets/312cfb20-c038-4063-8519-8fb9376d0c5c.png' 
  },
  313: { 
    id: 313, 
    name: 'Mushroom Mature', 
    group: 'crops_group', 
    width: 32, 
    height: 32, 
    src: 'https://static.wefun.ai/assets/3d4d93ca-86d0-41c4-aa7c-8ba5c110ea42.png'
  }, 

  // Tulip
  321: { 
    id: 321, 
    name: 'Tulip Bulb', 
    group: 'crops_group', 
    width: 32, 
    height: 32, 
    src: 'https://static.wefun.ai/assets/7185064a-d9cd-4cbd-8b84-37b3382b11ae.png' 
  },
  322: { 
    id: 322, 
    name: 'Tulip Growing', 
    group: 'crops_group', 
    width: 32, 
    height: 32, 
    src: 'https://static.wefun.ai/assets/a46d782c-c4e3-4195-b8ac-3d4bb26d09e7.png' 
  },
  323: { 
    id: 323, 
    name: 'Tulip Mature', 
    group: 'crops_group', 
    width: 32, 
    height: 32, 
    src: 'https://static.wefun.ai/assets/99102d3b-d236-4858-97f3-ffc8e6b17dcb.png'
  },

  // Effects
  900: {
    id: 900,
    name: 'Chimney Smoke',
    group: 'effects_group',
    width: 32,
    height: 32,
    type: 'effect',
    frames: [
        'https://static.wefun.ai/assets/780b5ed9-8ffc-4735-8149-3c2ec62f2a42.png',
        'https://static.wefun.ai/assets/3a112338-4aa7-4a58-a701-6318ee2b8433.png',
        'https://static.wefun.ai/assets/5d48028f-a3d3-43db-9ea9-09e950a3ebc4.png',
        'https://static.wefun.ai/assets/a549fa5c-e95b-4b59-8f7d-15f14e5541ce.png',
        'https://static.wefun.ai/assets/d1f95fdb-d521-4197-a554-9fea1a8c9d41.png'
    ],
    animSpeed: 0.15,
    zIndex: 'high',
    alpha: 0.6
  },
  // Invisible Trigger Zone (ID 999)
  999: {
    id: 999,
    name: 'Trigger Zone',
    group: 'effects_group',
    width: 32,
    height: 32,
    src: '', // Invisible
    hitbox: { x: 0, y: 0, w: 32, h: 32 }
  }
};

export const GROUPS = {
  grass_group: { label: 'Outdoors', type: 'tile' },
  water_group: { label: 'Water', type: 'tile' },
  floor_group: { label: 'Indoors', type: 'tile' },
  wall_group: { label: 'Walls', type: 'tile' },
  farming_group: { label: 'Farming', type: 'tile' },
  plants_group: { label: 'Decorations', type: 'tile' }, // Flat deco
  rug_group: { label: 'Rugs', type: 'tile' },
  
  // Entity Groups
  crops_group: { label: 'Crops', type: 'entity' },
  pond_group: { label: 'Ponds', type: 'entity' },
  stone_group: { label: 'Stones', type: 'entity' },
  tree_group: { label: 'Trees', type: 'entity' },
  bush_group: { label: 'Bushes', type: 'entity' },
  landscape_group: { label: 'Landscape', type: 'entity' },
  furniture_group: { label: 'Furniture', type: 'entity' },
  effects_group: { label: 'Effects', type: 'entity' } 
};

