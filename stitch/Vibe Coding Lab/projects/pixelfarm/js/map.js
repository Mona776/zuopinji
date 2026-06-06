import { TILES, TILE_TYPES, ENTITIES } from './tiles.js';
import { Animator } from './animator.js';

// 默认室内地图数据
const DEFAULT_INDOOR_MAP = {"layers":{"base":[[20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20],[20,1,1,1,1,1,1,1,20,1,1,1,1,1,1,20],[20,1,1,1,1,1,1,1,20,1,1,1,1,1,1,20],[20,4,4,4,4,4,4,4,20,4,4,4,4,4,4,20],[20,4,4,4,4,4,4,4,20,4,4,4,4,4,4,20],[20,4,4,4,4,4,4,4,20,4,4,4,4,4,4,20],[20,4,4,4,4,4,4,4,20,4,4,4,4,4,4,20],[20,20,20,20,9,9,20,20,20,20,20,9,9,20,20,20],[20,1,1,1,4,4,1,1,1,1,1,4,4,1,1,20],[20,1,1,1,4,4,1,1,1,1,1,4,4,1,1,20],[20,4,4,4,4,4,4,4,4,4,4,4,4,4,4,20],[20,4,4,4,4,4,4,4,4,4,4,4,4,4,4,20],[20,4,4,4,4,4,4,4,4,4,4,4,4,4,4,20],[20,4,4,4,4,4,4,4,4,4,4,4,4,4,4,20],[20,4,4,4,4,4,4,4,4,4,4,4,4,4,4,20],[20,20,20,20,20,20,20,4,20,20,20,20,20,20,20,20]],"deco":[[null,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28],[null,null,null,null,null,25,25,null,null,null,null,null,24,24,null,null],[null,28,28,28,28,25,25,28,28,28,28,28,28,28,28,28],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,14,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28],[null,null,40,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,28,28,28,null,null,28,28,28,28,28,null,null,28,28,28],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,13,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]]},"entities":[{"id":201,"x":128,"y":128,"offsetX":0,"offsetY":0,"data":{}},{"id":205,"x":32,"y":32,"offsetX":0,"offsetY":0,"data":{}},{"id":206,"x":320,"y":64,"offsetX":0,"offsetY":0,"data":{}},{"id":200,"x":416,"y":64,"offsetX":0,"offsetY":0,"data":{}},{"id":202,"x":128,"y":96,"offsetX":0,"offsetY":0,"data":{}},{"id":202,"x":160,"y":96,"offsetX":0,"offsetY":0,"data":{}},{"id":210,"x":384,"y":64,"offsetX":0,"offsetY":0,"data":{}},{"id":207,"x":32,"y":384,"offsetX":0,"offsetY":0,"data":{}},{"id":209,"x":96,"y":352,"offsetX":0,"offsetY":0,"data":{}},{"id":208,"x":224,"y":256,"offsetX":0,"offsetY":0,"data":{}},{"id":211,"x":320,"y":288,"offsetX":0,"offsetY":0,"data":{}},{"id":210,"x":64,"y":320,"offsetX":0,"offsetY":0,"data":{}}],"portals":[{"x":7,"y":15,"targetScene":"outdoor","spawnX":15,"spawnY":17}]};

// 默认户外地图数据
const DEFAULT_OUTDOOR_MAP = {"layers":{"base":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]],"deco":[[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,10,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,31,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,37,null,null,null,null,null,30,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,37,null,null,null,null,null,null,null,null,null,null,null,36,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,32,null,null,null,null,null,null,null,null,37,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,10,null,null,null,null,null,null,null,null,null,38,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,39,36,null,null,null,null,null,null,null,null,31,10,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,35,35,null,10,null,null,null,10,null,null,37,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,10,null,null,null,null,null,null,null,null,null,null,null,null,null],[33,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,38,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,31,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,38,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,31,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,38,36,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]]},"entities":[{"id":108,"x":0,"y":864,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":0,"y":960,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":64,"y":896,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":64,"y":864,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":32,"y":896,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":0,"y":896,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":64,"y":960,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":128,"y":928,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":128,"y":864,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":128,"y":960,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":128,"y":896,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":32,"y":832,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":160,"y":928,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":192,"y":928,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":192,"y":960,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":288,"y":896,"offsetX":0,"offsetY":0,"data":{}},{"id":107,"x":0,"y":928,"offsetX":0,"offsetY":0,"data":{}},{"id":106,"x":288,"y":960,"offsetX":0,"offsetY":0,"data":{}},{"id":106,"x":256,"y":928,"offsetX":0,"offsetY":0,"data":{}},{"id":106,"x":256,"y":896,"offsetX":0,"offsetY":0,"data":{}},{"id":106,"x":160,"y":896,"offsetX":0,"offsetY":0,"data":{}},{"id":106,"x":192,"y":896,"offsetX":0,"offsetY":0,"data":{}},{"id":106,"x":160,"y":832,"offsetX":0,"offsetY":0,"data":{}},{"id":105,"x":0,"y":832,"offsetX":0,"offsetY":0,"data":{}},{"id":105,"x":96,"y":928,"offsetX":0,"offsetY":0,"data":{}},{"id":105,"x":128,"y":992,"offsetX":0,"offsetY":0,"data":{}},{"id":105,"x":288,"y":864,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":256,"y":960,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":320,"y":960,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":352,"y":896,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":0,"y":800,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":32,"y":864,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":-32,"y":928,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":64,"y":800,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":96,"y":800,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":288,"y":800,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":320,"y":832,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":352,"y":864,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":-32,"y":832,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":0,"y":768,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":-32,"y":768,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":224,"y":864,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":0,"y":672,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":0,"y":704,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":64,"y":704,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":96,"y":736,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":32,"y":544,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":0,"y":512,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":0,"y":576,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":0,"y":544,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":352,"y":960,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":416,"y":960,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":480,"y":928,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":512,"y":960,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":480,"y":992,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":576,"y":960,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":576,"y":928,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":608,"y":960,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":640,"y":960,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":640,"y":992,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":672,"y":992,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":800,"y":992,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":768,"y":992,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":832,"y":960,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":960,"y":832,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":992,"y":928,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":992,"y":992,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":928,"y":992,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":896,"y":960,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":960,"y":960,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":992,"y":736,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":992,"y":800,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":928,"y":800,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":960,"y":736,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":928,"y":896,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":960,"y":864,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":896,"y":896,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":960,"y":576,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":992,"y":608,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":960,"y":640,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":992,"y":352,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":960,"y":352,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":960,"y":384,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":928,"y":384,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":928,"y":416,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":960,"y":416,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":960,"y":448,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":960,"y":480,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":992,"y":544,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":992,"y":576,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":992,"y":480,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":960,"y":608,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":960,"y":0,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":992,"y":0,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":928,"y":0,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":896,"y":0,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":864,"y":0,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":928,"y":-32,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":992,"y":-32,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":992,"y":32,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":992,"y":64,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":992,"y":96,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":992,"y":128,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":960,"y":96,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":960,"y":64,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":960,"y":32,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":928,"y":32,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":896,"y":32,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":896,"y":64,"offsetX":0,"offsetY":0,"data":{}},{"id":108,"x":960,"y":128,"offsetX":0,"offsetY":0,"data":{}},{"id":106,"x":864,"y":64,"offsetX":0,"offsetY":0,"data":{}},{"id":106,"x":928,"y":160,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":128,"y":256,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":160,"y":288,"offsetX":0,"offsetY":0,"data":{}},{"id":112,"x":192,"y":256,"offsetX":0,"offsetY":0,"data":{}},{"id":122,"x":192,"y":320,"offsetX":0,"offsetY":0,"data":{}},{"id":122,"x":224,"y":320,"offsetX":0,"offsetY":0,"data":{}},{"id":123,"x":224,"y":352,"offsetX":0,"offsetY":0,"data":{}},{"id":123,"x":608,"y":192,"offsetX":0,"offsetY":0,"data":{}},{"id":122,"x":640,"y":224,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":896,"y":608,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":928,"y":608,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":896,"y":416,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":928,"y":448,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":960,"y":512,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":928,"y":512,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":928,"y":544,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":928,"y":672,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":928,"y":736,"offsetX":0,"offsetY":0,"data":{}},{"id":109,"x":320,"y":192,"offsetX":0,"offsetY":0,"data":{}},{"id":900,"x":576,"y":224,"offsetX":0,"offsetY":0,"data":{}},{"id":150,"x":384,"y":64,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":0,"y":-96,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":32,"y":-64,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":64,"y":-64,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":128,"y":-64,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":128,"y":-32,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":160,"y":-64,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":192,"y":-64,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":224,"y":-64,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":384,"y":-64,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":416,"y":-64,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":448,"y":-64,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":480,"y":-64,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":544,"y":-64,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":576,"y":-64,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":608,"y":-32,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":640,"y":-32,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":672,"y":-32,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":672,"y":-64,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":704,"y":-64,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":736,"y":-64,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":768,"y":-64,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":800,"y":-64,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":832,"y":-64,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":864,"y":-32,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":928,"y":-64,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":704,"y":-32,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":640,"y":-64,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":608,"y":-64,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":576,"y":-96,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":480,"y":-32,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":448,"y":-32,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":384,"y":-32,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":416,"y":-32,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":832,"y":-32,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":0,"y":-64,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":-32,"y":-64,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":-32,"y":-32,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":-32,"y":0,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":-32,"y":32,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":-32,"y":64,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":32,"y":0,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":64,"y":32,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":64,"y":64,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":64,"y":96,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":64,"y":128,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":32,"y":160,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":32,"y":192,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":32,"y":224,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":32,"y":256,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":0,"y":288,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":0,"y":352,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":0,"y":384,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":-32,"y":384,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":0,"y":448,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":0,"y":480,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":32,"y":480,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":0,"y":96,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":0,"y":160,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":-32,"y":160,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":-32,"y":128,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":-32,"y":224,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":32,"y":32,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":-32,"y":192,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":-32,"y":96,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":32,"y":64,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":64,"y":160,"offsetX":0,"offsetY":0,"data":{}},{"id":123,"x":416,"y":32,"offsetX":0,"offsetY":0,"data":{}},{"id":123,"x":448,"y":32,"offsetX":0,"offsetY":0,"data":{}},{"id":121,"x":640,"y":32,"offsetX":0,"offsetY":0,"data":{}},{"id":121,"x":704,"y":32,"offsetX":0,"offsetY":0,"data":{}},{"id":121,"x":864,"y":32,"offsetX":0,"offsetY":0,"data":{}},{"id":122,"x":576,"y":32,"offsetX":0,"offsetY":0,"data":{}},{"id":122,"x":640,"y":64,"offsetX":0,"offsetY":0,"data":{}},{"id":122,"x":672,"y":32,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":576,"y":0,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":320,"y":-32,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":288,"y":-32,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":288,"y":-64,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":320,"y":-96,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":352,"y":-64,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":256,"y":-96,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":256,"y":-64,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":224,"y":-32,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":192,"y":-96,"offsetX":0,"offsetY":0,"data":{}},{"id":131,"x":512,"y":-32,"offsetX":0,"offsetY":0,"data":{}},{"id":131,"x":544,"y":0,"offsetX":0,"offsetY":0,"data":{}},{"id":131,"x":512,"y":0,"offsetX":0,"offsetY":0,"data":{}},{"id":134,"x":832,"y":32,"offsetX":0,"offsetY":0,"data":{}},{"id":106,"x":800,"y":-32,"offsetX":0,"offsetY":0,"data":{}},{"id":106,"x":64,"y":0,"offsetX":0,"offsetY":0,"data":{}},{"id":106,"x":0,"y":320,"offsetX":0,"offsetY":0,"data":{}},{"id":106,"x":0,"y":224,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":736,"y":992,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":704,"y":992,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":608,"y":992,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":576,"y":992,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":544,"y":992,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":512,"y":992,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":416,"y":992,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":384,"y":992,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":352,"y":992,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":320,"y":992,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":384,"y":960,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":448,"y":960,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":448,"y":928,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":416,"y":928,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":384,"y":928,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":352,"y":928,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":320,"y":928,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":288,"y":928,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":224,"y":960,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":224,"y":992,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":192,"y":992,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":160,"y":992,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":96,"y":992,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":64,"y":992,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":32,"y":992,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":0,"y":992,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":-32,"y":288,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":-32,"y":320,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":-32,"y":416,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":-32,"y":512,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":-32,"y":544,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":-32,"y":576,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":32,"y":576,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":32,"y":704,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":-32,"y":704,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":-32,"y":736,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":-32,"y":800,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":64,"y":736,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":-32,"y":896,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":-32,"y":960,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":-32,"y":864,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":160,"y":1024,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":224,"y":1024,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":288,"y":992,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":288,"y":1024,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":288,"y":1056,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":288,"y":1088,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":288,"y":1120,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":320,"y":1120,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":320,"y":1088,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":352,"y":1088,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":384,"y":1088,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":416,"y":1088,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":448,"y":1088,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":480,"y":1024,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":448,"y":1024,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":384,"y":1024,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":352,"y":1024,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":512,"y":1024,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":544,"y":1024,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":576,"y":1024,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":608,"y":1024,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":640,"y":1024,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":672,"y":1024,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":768,"y":1024,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":800,"y":1024,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":832,"y":1024,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":864,"y":1024,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":864,"y":992,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":864,"y":960,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":800,"y":960,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":768,"y":960,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":736,"y":960,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":928,"y":960,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":960,"y":992,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":960,"y":1024,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":960,"y":928,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":960,"y":896,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":928,"y":864,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":928,"y":832,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":896,"y":832,"offsetX":0,"offsetY":0,"data":{}},{"id":112,"x":704,"y":928,"offsetX":0,"offsetY":0,"data":{}},{"id":112,"x":864,"y":896,"offsetX":0,"offsetY":0,"data":{}},{"id":112,"x":1024,"y":416,"offsetX":0,"offsetY":0,"data":{}},{"id":112,"x":1024,"y":352,"offsetX":0,"offsetY":0,"data":{}},{"id":112,"x":1024,"y":256,"offsetX":0,"offsetY":0,"data":{}},{"id":112,"x":1024,"y":224,"offsetX":0,"offsetY":0,"data":{}},{"id":112,"x":992,"y":224,"offsetX":0,"offsetY":0,"data":{}},{"id":112,"x":992,"y":288,"offsetX":0,"offsetY":0,"data":{}},{"id":112,"x":1024,"y":288,"offsetX":0,"offsetY":0,"data":{}},{"id":112,"x":1056,"y":416,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":960,"y":224,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":1024,"y":320,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":960,"y":256,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":992,"y":256,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":1024,"y":192,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":992,"y":160,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":1024,"y":672,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":1024,"y":640,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":1024,"y":576,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":1056,"y":544,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":928,"y":1024,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":896,"y":1024,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":896,"y":928,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":992,"y":896,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":1024,"y":896,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":1024,"y":864,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":1024,"y":832,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":1024,"y":800,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":1024,"y":768,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":1024,"y":512,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":1024,"y":480,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":1024,"y":448,"offsetX":0,"offsetY":0,"data":{}},{"id":112,"x":960,"y":672,"offsetX":0,"offsetY":0,"data":{}},{"id":112,"x":992,"y":672,"offsetX":0,"offsetY":0,"data":{}},{"id":112,"x":992,"y":640,"offsetX":0,"offsetY":0,"data":{}},{"id":112,"x":1024,"y":704,"offsetX":0,"offsetY":0,"data":{}},{"id":112,"x":1024,"y":736,"offsetX":0,"offsetY":0,"data":{}},{"id":112,"x":992,"y":768,"offsetX":0,"offsetY":0,"data":{}},{"id":112,"x":960,"y":800,"offsetX":0,"offsetY":0,"data":{}},{"id":112,"x":960,"y":768,"offsetX":0,"offsetY":0,"data":{}},{"id":112,"x":1024,"y":608,"offsetX":0,"offsetY":0,"data":{}},{"id":112,"x":1024,"y":544,"offsetX":0,"offsetY":0,"data":{}},{"id":112,"x":992,"y":512,"offsetX":0,"offsetY":0,"data":{}},{"id":112,"x":928,"y":480,"offsetX":0,"offsetY":0,"data":{}},{"id":112,"x":992,"y":448,"offsetX":0,"offsetY":0,"data":{}},{"id":112,"x":1024,"y":384,"offsetX":0,"offsetY":0,"data":{}},{"id":112,"x":1056,"y":576,"offsetX":0,"offsetY":0,"data":{}},{"id":112,"x":1056,"y":640,"offsetX":0,"offsetY":0,"data":{}},{"id":112,"x":1056,"y":672,"offsetX":0,"offsetY":0,"data":{}},{"id":112,"x":1056,"y":736,"offsetX":0,"offsetY":0,"data":{}},{"id":112,"x":1056,"y":768,"offsetX":0,"offsetY":0,"data":{}},{"id":112,"x":1024,"y":928,"offsetX":0,"offsetY":0,"data":{}},{"id":112,"x":1056,"y":864,"offsetX":0,"offsetY":0,"data":{}},{"id":112,"x":1056,"y":832,"offsetX":0,"offsetY":0,"data":{}},{"id":112,"x":1056,"y":896,"offsetX":0,"offsetY":0,"data":{}},{"id":112,"x":1056,"y":992,"offsetX":0,"offsetY":0,"data":{}},{"id":112,"x":1024,"y":992,"offsetX":0,"offsetY":0,"data":{}},{"id":112,"x":1056,"y":1024,"offsetX":0,"offsetY":0,"data":{}},{"id":112,"x":1024,"y":1024,"offsetX":0,"offsetY":0,"data":{}},{"id":112,"x":992,"y":1024,"offsetX":0,"offsetY":0,"data":{}},{"id":112,"x":928,"y":1056,"offsetX":0,"offsetY":0,"data":{}},{"id":112,"x":896,"y":1056,"offsetX":0,"offsetY":0,"data":{}},{"id":112,"x":864,"y":1056,"offsetX":0,"offsetY":0,"data":{}},{"id":112,"x":256,"y":1024,"offsetX":0,"offsetY":0,"data":{}},{"id":112,"x":128,"y":1024,"offsetX":0,"offsetY":0,"data":{}},{"id":112,"x":96,"y":1024,"offsetX":0,"offsetY":0,"data":{}},{"id":112,"x":960,"y":-64,"offsetX":0,"offsetY":0,"data":{}},{"id":112,"x":992,"y":-64,"offsetX":0,"offsetY":0,"data":{}},{"id":112,"x":1024,"y":-64,"offsetX":0,"offsetY":0,"data":{}},{"id":112,"x":1056,"y":-32,"offsetX":0,"offsetY":0,"data":{}},{"id":112,"x":1056,"y":0,"offsetX":0,"offsetY":0,"data":{}},{"id":112,"x":1056,"y":32,"offsetX":0,"offsetY":0,"data":{}},{"id":112,"x":1056,"y":64,"offsetX":0,"offsetY":0,"data":{}},{"id":112,"x":1056,"y":96,"offsetX":0,"offsetY":0,"data":{}},{"id":112,"x":1056,"y":128,"offsetX":0,"offsetY":0,"data":{}},{"id":112,"x":1056,"y":160,"offsetX":0,"offsetY":0,"data":{}},{"id":112,"x":1024,"y":160,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":928,"y":64,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":928,"y":128,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":960,"y":160,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":1088,"y":480,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":1056,"y":480,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":1088,"y":416,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":1056,"y":352,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":1056,"y":320,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":1056,"y":288,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":1088,"y":288,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":1088,"y":256,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":1088,"y":224,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":1088,"y":192,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":1056,"y":224,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":1056,"y":256,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":1088,"y":320,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":1088,"y":352,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":1088,"y":384,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":0,"y":608,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":-32,"y":640,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":64,"y":608,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":64,"y":672,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":-32,"y":448,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":512,"y":-64,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":768,"y":-32,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":832,"y":1056,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":800,"y":1056,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":768,"y":1056,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":608,"y":1056,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":544,"y":1120,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":576,"y":1120,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":512,"y":1120,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":672,"y":1088,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":960,"y":1056,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":896,"y":1088,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":544,"y":1056,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":576,"y":1056,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":512,"y":1056,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":480,"y":1088,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":576,"y":1088,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":704,"y":1088,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":736,"y":1088,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":768,"y":1088,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":768,"y":1120,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":800,"y":1120,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":832,"y":1120,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":864,"y":1088,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":928,"y":1088,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":992,"y":1056,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":992,"y":1088,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":1024,"y":1056,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":1056,"y":1056,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":1056,"y":1088,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":1024,"y":1088,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":960,"y":1088,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":928,"y":1120,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":896,"y":1120,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":864,"y":1120,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":672,"y":1120,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":640,"y":1120,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":608,"y":1120,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":416,"y":1120,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":384,"y":1120,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":224,"y":1088,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":160,"y":1088,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":128,"y":1088,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":96,"y":1056,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":64,"y":1056,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":32,"y":1056,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":-32,"y":1024,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":-32,"y":1056,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":-32,"y":1088,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":0,"y":1088,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":0,"y":1120,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":32,"y":1120,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":64,"y":1120,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":160,"y":1120,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":192,"y":1120,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":256,"y":1120,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":-32,"y":1120,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":-64,"y":1120,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":992,"y":1120,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":960,"y":1120,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":1024,"y":1120,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":1056,"y":1120,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":224,"y":-96,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":288,"y":-96,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":352,"y":-96,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":384,"y":-96,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":448,"y":-128,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":448,"y":-96,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":512,"y":-96,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":640,"y":-96,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":736,"y":-96,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":768,"y":-96,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":928,"y":-96,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":992,"y":-96,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":1024,"y":-96,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":1056,"y":-96,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":32,"y":-96,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":-32,"y":-96,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":-64,"y":-96,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":-64,"y":-64,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":-64,"y":-32,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":-64,"y":0,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":-64,"y":32,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":-64,"y":64,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":-64,"y":96,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":-64,"y":160,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":-64,"y":192,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":-64,"y":256,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":-64,"y":288,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":-64,"y":352,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":-64,"y":384,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":-64,"y":448,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":-32,"y":480,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":-64,"y":544,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":-64,"y":576,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":-64,"y":608,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":-64,"y":672,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":-64,"y":704,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":-64,"y":768,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":-64,"y":832,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":-64,"y":864,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":-64,"y":896,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":-64,"y":928,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":-64,"y":992,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":-64,"y":1024,"offsetX":0,"offsetY":0,"data":{}},{"id":110,"x":-64,"y":1056,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":-64,"y":480,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":-64,"y":128,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":-64,"y":224,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":-64,"y":320,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":-64,"y":640,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":-32,"y":672,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":-64,"y":736,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":96,"y":-64,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":96,"y":-96,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":64,"y":-96,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":416,"y":-96,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":480,"y":-96,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":544,"y":-96,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":800,"y":-96,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":832,"y":-96,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":864,"y":-96,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":896,"y":-96,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":896,"y":-64,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":896,"y":-32,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":128,"y":1120,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":96,"y":1120,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":64,"y":1088,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":32,"y":1088,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":32,"y":1024,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":0,"y":1024,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":0,"y":1056,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":96,"y":1088,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":192,"y":1056,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":320,"y":1056,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":384,"y":1056,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":448,"y":1120,"offsetX":0,"offsetY":0,"data":{}},{"id":111,"x":480,"y":1120,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":544,"y":1088,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":512,"y":1088,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":480,"y":1056,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":448,"y":1056,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":640,"y":1056,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":672,"y":1056,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":704,"y":1056,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":832,"y":1088,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":608,"y":1088,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":256,"y":1088,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":256,"y":1056,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":224,"y":1056,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":160,"y":1056,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":192,"y":1088,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":224,"y":1120,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":352,"y":1120,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":640,"y":1088,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":800,"y":1088,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":736,"y":1056,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":736,"y":1120,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":704,"y":1120,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":160,"y":-96,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":128,"y":-96,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":608,"y":-96,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":672,"y":-96,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":704,"y":-96,"offsetX":0,"offsetY":0,"data":{}},{"id":113,"x":768,"y":256,"offsetX":0,"offsetY":0,"data":{}}],"portals":[{"x":15,"y":15,"targetScene":"indoor","spawnX":7,"spawnY":14}]};

export class Map {
  constructor(tileSize) {
    this.tileSize = tileSize;
    this.cols = 32;
    this.rows = 32;
    this.width = this.cols * tileSize;
    this.height = this.rows * tileSize;
    
    this.layers = {
      base: [],
      deco: []
    };
    
    this.entities = [];

    this.sceneType = ''; 
    this.portals = []; 

    this.tileImages = {};
    this.entityImages = {};
    
    this.pondAnim = {
        timer: 0,
        frameIndex: 0,
        sequence: [150, 151, 152, 153, 154, 155] 
    };

    this.glowTimer = 0;

    this.loadAssets();
  }

  loadAssets() {
    Object.values(TILES).forEach(tile => {
      if (tile.src) {
        const img = new Image();
        img.src = tile.src;
        this.tileImages[tile.id] = img;
      }
    });

    Object.values(ENTITIES).forEach(ent => {
      if (ent.src) {
        const img = new Image();
        img.src = ent.src;
        this.entityImages[ent.id] = img;
      } else if (ent.frames) {
        this.entityImages[ent.id] = ent.frames.map(url => {
            const img = new Image();
            img.src = url;
            return img;
        });
      }
    });
  }

  generate(type) {
    this.sceneType = type;
    this.portals = [];
    this.entities = [];
    
    if (type === 'indoor') {
        this.cols = 16;
        this.rows = 16;
    } else {
        this.cols = 32;
        this.rows = 32;
    }
    
    this.width = this.cols * this.tileSize;
    this.height = this.rows * this.tileSize;

    if (this.loadFromStorage(type)) {
      console.log(`✅ Loaded ${type} scene from player save.`);
      this.addDefaultPortals(type);
      return;
    }

    if (this.loadFromDefaultMap(type)) {
      console.log(`✅ Loaded ${type} scene from default map.`);
      this.addDefaultPortals(type);
      return;
    }

    // 尝试从内嵌的默认地图数据加载
    if (this.loadFromEmbeddedMap(type)) {
      console.log(`✅ Loaded ${type} scene from embedded map data.`);
      return;
    }

    console.log(`🆕 Generating fresh ${type} scene (no save/default found).`);
    
    this.layers.base = [];
    this.layers.deco = [];

    for (let y = 0; y < this.rows; y++) {
      let rowBase = [];
      let rowDeco = [];
      for (let x = 0; x < this.cols; x++) {
        rowBase.push(0); 
        rowDeco.push(null);
      }
      this.layers.base.push(rowBase);
      this.layers.deco.push(rowDeco);
    }

    if (type === 'outdoor') {
      this.generateOutdoor();
    } else {
      this.generateIndoor();
    }
  }

  loadFromDefaultMap(type) {
    const key = `pixel_farm_default_map_${type}`;
    const stored = localStorage.getItem(key);
    
    if (!stored) {
      return false;
    }

    try {
      const mapData = JSON.parse(stored);
      
      if (!mapData.version || mapData.sceneType !== type) {
        console.warn('Default map data invalid or mismatched scene type');
        return false;
      }

      const loadedRows = mapData.layers.base.length;
      const loadedCols = loadedRows > 0 ? mapData.layers.base[0].length : 0;

      if (loadedRows !== this.rows || loadedCols !== this.cols) {
        console.warn(`Default map size mismatch (Expected: ${this.cols}x${this.rows}, Got: ${loadedCols}x${loadedRows})`);
        return false;
      }

      this.layers = mapData.layers;
      
      const loadedEntities = mapData.entities || [];
      this.entities = [];
      loadedEntities.forEach(e => {
        const ent = this.addEntity(e.id, e.x, e.y, e.offsetX, e.offsetY, e.data);
        if (ent && (e.w || e.h)) {
          ent.width = e.w || null;
          ent.height = e.h || null;
        }
      });

      if (mapData.portals && Array.isArray(mapData.portals)) {
        this.portals = mapData.portals;
      }

      return true;
    } catch (e) {
      console.error('Failed to load default map:', e);
      return false;
    }
  }

  loadFromEmbeddedMap(type) {
    const mapData = type === 'indoor' ? DEFAULT_INDOOR_MAP : DEFAULT_OUTDOOR_MAP;
    
    if (!mapData) {
      return false;
    }

    try {
      // 检查是否是新格式（直接包含 layers）
      if (mapData.layers) {
        // 新格式：直接使用 layers
        this.layers = JSON.parse(JSON.stringify(mapData.layers)); // 深拷贝
        
        // 处理 entities
        this.entities = [];
        if (mapData.entities && Array.isArray(mapData.entities)) {
          for (const e of mapData.entities) {
            this.addEntity(e.id, e.x, e.y, e.offsetX || 0, e.offsetY || 0, e.data || {});
          }
        }
        
        // 处理传送门
        if (mapData.portals && Array.isArray(mapData.portals)) {
          this.portals = mapData.portals;
        }
        
        return true;
      }
      
      // 旧格式：items 数组
      if (mapData.scene !== type) {
        return false;
      }
      
      // 初始化图层
      this.layers.base = [];
      this.layers.deco = [];
      
      // 默认填充：户外用草地(0)，室内用木地板(4)
      const defaultBase = type === 'outdoor' ? 0 : 4;
      
      for (let y = 0; y < this.rows; y++) {
        let rowBase = [];
        let rowDeco = [];
        for (let x = 0; x < this.cols; x++) {
          rowBase.push(defaultBase);
          rowDeco.push(null);
        }
        this.layers.base.push(rowBase);
        this.layers.deco.push(rowDeco);
      }

      // 处理 items 数组
      for (const item of mapData.items) {
        if (item.type === 'tile') {
          const tileDef = TILES[item.id];
          if (tileDef && item.x >= 0 && item.x < this.cols && item.y >= 0 && item.y < this.rows) {
            if (tileDef.type === TILE_TYPES.BASE) {
              this.layers.base[item.y][item.x] = item.id;
            } else if (tileDef.type === TILE_TYPES.DECO) {
              this.layers.deco[item.y][item.x] = item.id;
            }
          }
        } else if (item.type === 'entity') {
          this.addEntity(item.id, item.x, item.y);
        }
      }

      // 处理传送门
      if (mapData.portals && Array.isArray(mapData.portals)) {
        this.portals = mapData.portals;
      }

      return true;
    } catch (e) {
      console.error('Failed to load embedded map:', e);
      return false;
    }
  }

  generateOutdoor() {
    for (let x = 0; x < this.cols; x++) {
      this.layers.base[0][x] = 1;
      this.layers.base[this.rows - 1][x] = 1;
    }
    for (let y = 0; y < this.rows; y++) {
      this.layers.base[y][0] = 1;
      this.layers.base[y][this.cols - 1] = 1;
    }

    const houseX = 12;
    const houseY = 10;
    const houseW = 8;
    const houseH = 6;

    for (let y = houseY; y < houseY + houseH; y++) {
      for (let x = houseX; x < houseX + houseW; x++) {
        if (y === houseY || y === houseY + houseH - 1 || x === houseX || x === houseX + houseW - 1) {
          this.layers.base[y][x] = 1; 
        } else {
          this.layers.base[y][x] = 2; 
        }
      }
    }

    const doorX = houseX + 3;
    const doorY = houseY + houseH - 1;
    this.layers.base[doorY][doorX] = 3; 

    for (let y = 1; y < this.rows - 1; y++) {
      for (let x = 1; x < this.cols - 1; x++) {
        if (this.layers.base[y][x] === 0) {
          if (Math.random() < 0.15) {
            const variant = Math.floor(Math.random() * 10) + 30; 
            this.layers.deco[y][x] = variant;
          }
        }
      }
    }
    
    this.layers.deco[15][5] = 10;
    this.layers.deco[15][6] = 10;

    this.addEntity(100, 200, 200);
    this.addEntity(100, 600, 150);
    this.addEntity(100, 100, 600);
    
    this.addEntity(101, 300, 400);
    this.addEntity(102, 350, 410);
    this.addEntity(102, 380, 400);

    this.addEntity(104, 450, 300);
    this.addEntity(104, 490, 310);
    this.addEntity(105, 550, 350);

    this.addEntity(106, 260, 230);
    this.addEntity(107, 660, 180);
    this.addEntity(108, 150, 550);

    this.addEntity(109, 600, 100);

    this.addEntity(130, 200, 450); 
    this.addEntity(131, 700, 200);
    this.addEntity(132, 100, 700);
    this.addEntity(133, 500, 600);
    this.addEntity(134, 800, 500);
    this.addEntity(135, 350, 650);

    this.addEntity(150, 750, 450, 0, 0, { message: "The fish are swimming happily today.", portrait: "default" }); 
    this.addEntity(151, 100, 100);
    this.addEntity(153, 500, 750);

    this.addDefaultPortals('outdoor');
  }

  generateIndoor() {
    for(let y=0; y<this.rows; y++) {
      for(let x=0; x<this.cols; x++) {
        this.layers.base[y][x] = 4;
      }
    }

    for (let x = 0; x < this.cols; x++) {
        this.layers.base[0][x] = 20;
        this.layers.base[1][x] = 21;

        this.layers.deco[1][x] = 28; 

        if (x > 0 && x < this.cols - 1) {
            this.layers.deco[2][x] = 29; 
        }
    }

    for (let x = 0; x < this.cols; x++) {
        this.layers.base[this.rows - 1][x] = 20;
    }

    for (let y = 0; y < this.rows; y++) {
        this.layers.base[y][0] = 20; 
        this.layers.base[y][this.cols - 1] = 20;
    }

    this.layers.deco[2][1] = 27;
    this.layers.deco[2][this.cols - 2] = 27;

    this.layers.deco[1][3] = 22;
    this.layers.deco[1][7] = 22; 
    this.layers.deco[1][11] = 22;

    this.layers.deco[1][5] = 40; 

    this.layers.base[15][8] = 6; 

    this.layers.deco[13][8] = 14; 

    this.layers.deco[8][7] = 15;

    this.addEntity(200, 1 * 32, 2 * 32, 0, 0, { message: "This bed looks so comfy... Zzz...", portrait: "default" }); 
    
    this.addEntity(201, 5 * 32, 6 * 32); 
    
    this.addEntity(202, 11 * 32, 2 * 32); 
    
    this.addEntity(105, 12 * 32, 12 * 32); 

    this.addEntity(204, 9 * 32, 2 * 32); 

    this.addEntity(205, 13 * 32, 2 * 32); 

    this.addEntity(206, 4 * 32, 8 * 32); 
    
    this.addEntity(207, 9 * 32, 5 * 32);

    this.addEntity(208, 4 * 32, 2 * 32);

    this.addEntity(209, 2 * 32, 9 * 32);

    this.addEntity(210, 1 * 32, 8 * 32);

    this.addEntity(211, 14 * 32, 12 * 32);

    this.addDefaultPortals('indoor');
  }

  addDefaultPortals(type) {
    this.portals = [];
    if (type === 'outdoor') {
      this.portals.push({
        x: 15, 
        y: 15, 
        targetScene: 'indoor',
        spawnX: 8,
        spawnY: 13
      });
    } else {
       this.portals.push({
        x: 8,
        y: 14,
        targetScene: 'outdoor',
        spawnX: 15,
        spawnY: 17
      });
    }
  }

  addEntity(id, x, y, offsetX = 0, offsetY = 0, data = {}) {
    const def = ENTITIES[id];
    if (!def) return;
    
    const ent = { 
        id, 
        x, 
        y, 
        offsetX, 
        offsetY, 
        width: null,
        height: null,
        data: data || {},
        runtime: {},
        uid: Date.now() + Math.random() 
    };

    if (def.frames) {
        const imgs = this.entityImages[id];
        if (imgs && Array.isArray(imgs)) {
             const frames = imgs.map(img => ({
                 x: 0, y: 0, w: 0, h: 0, image: img, useFullSource: true
             }));
             const speed = (def.animSpeed || 0.15) * (0.8 + Math.random() * 0.4);
             ent.animator = new Animator({
                 'loop': { frames: frames, speed: speed, loop: true }
             });
             ent.animator.play('loop');
        }
    } else if (def.frameCount) {
        const frames = [];
        const img = this.entityImages[id];
        const fw = def.frameWidth || def.width;
        const fh = def.frameHeight || def.height;
        
        for(let i = 0; i < def.frameCount; i++) {
            frames.push({
                x: i * fw,
                y: 0,
                w: fw,
                h: fh,
                image: img 
            });
        }
        
        const speed = def.animSpeed * (0.8 + Math.random() * 0.4);
        
        ent.animator = new Animator({
            'loop': { frames: frames, speed: speed, loop: true }
        });
        ent.animator.play('loop');
    }

    this.entities.push(ent);
    return ent;
  }

  removeEntityAt(x, y) {
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const e = this.entities[i];
      const def = ENTITIES[e.id];
      const realX = e.x + (e.offsetX || 0);
      const realY = e.y + (e.offsetY || 0);
      
      const w = e.width || def.width;
      const h = e.height || def.height;

      if (x >= realX && x < realX + w && y >= realY && y < realY + h) {
        this.entities.splice(i, 1);
        return true;
      }
    }
    return false;
  }
  
  update(dt) {
      this.pondAnim.timer += dt;
      if (this.pondAnim.timer >= 0.15) {
          this.pondAnim.timer -= 0.15;
          this.pondAnim.frameIndex = (this.pondAnim.frameIndex + 1) % 6;
      }

      this.glowTimer += dt * 2;

      this.entities.forEach(ent => {
          if (ent.animator) {
              ent.animator.update(dt);
          }
          if (ent.runtime && ent.runtime.cooldown > 0) {
              ent.runtime.cooldown -= dt;
          }
      });
  }

  checkTriggers(player) {
      if (!player) return null;
      
      const pCenterX = player.x + player.width / 2;
      const pCenterY = player.y + player.height / 2;
      const triggerDist = 48;

      for (const ent of this.entities) {
          if (!ent.data || !ent.data.message) continue;
          if (ent.runtime && ent.runtime.cooldown > 0) continue;

          const def = ENTITIES[ent.id];
          const realX = ent.x + (ent.offsetX || 0);
          const realY = ent.y + (ent.offsetY || 0);
          
          const width = ent.width || def.width;
          const height = ent.height || def.height;
          
          const clampX = Math.max(realX, Math.min(pCenterX, realX + width));
          const clampY = Math.max(realY, Math.min(pCenterY, realY + height));
          
          const dist = Math.sqrt(
              Math.pow(pCenterX - clampX, 2) + 
              Math.pow(pCenterY - clampY, 2)
          );

          if (dist < triggerDist) {
              ent.runtime.cooldown = 10.0;
              return {
                  message: ent.data.message,
                  portrait: ent.data.portrait
              };
          }
      }
      return null;
  }

  getEntityAt(x, y) {
    for (let i = this.entities.length - 1; i >= 0; i--) {
        const e = this.entities[i];
        const def = ENTITIES[e.id];
        const realX = e.x + (e.offsetX || 0);
        const realY = e.y + (e.offsetY || 0);
        
        const w = e.width || def.width;
        const h = e.height || def.height;
  
        if (x >= realX && x < realX + w && y >= realY && y < realY + h) {
          return e;
        }
    }
    return null;
  }

  setTile(x, y, tileId) {
    if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) return;
    
    const tileDef = TILES[tileId];
    if (!tileDef) return;

    if (tileDef.type === TILE_TYPES.BASE) {
      this.layers.base[y][x] = tileId;
    } else if (tileDef.type === TILE_TYPES.DECO) {
      this.layers.deco[y][x] = tileId;
    }
  }

  setDeco(x, y, tileId) {
    if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) return;
    this.layers.deco[y][x] = tileId;
  }

  removeDeco(x, y) {
    if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) return;
    this.layers.deco[y][x] = null;
  }

  saveToStorage() {
    const key = 'pixel_farm_map_' + this.sceneType;
    const cleanEntities = this.entities.map(e => {
        let saveId = e.id;
        const def = ENTITIES[e.id];
        if (def && def.group === 'pond_group') {
            saveId = 150; 
        }
        const data = {
            id: saveId,
            x: e.x,
            y: e.y,
            offsetX: e.offsetX || 0,
            offsetY: e.offsetY || 0,
            data: e.data || {}
        };
        if (e.width) data.w = e.width;
        if (e.height) data.h = e.height;
        
        return data;
    });

    const data = {
        layers: this.layers,
        entities: cleanEntities
    };
    localStorage.setItem(key, JSON.stringify(data));
    console.log(`💾 Saved ${this.sceneType} to player storage.`);
  }

  loadFromStorage(type) {
    const key = 'pixel_farm_map_' + type;
    const data = localStorage.getItem(key);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        if (parsed.layers) {
          const loadedRows = parsed.layers.base.length;
          const loadedCols = loadedRows > 0 ? parsed.layers.base[0].length : 0;

          if (loadedRows !== this.rows || loadedCols !== this.cols) {
             console.log(`Map size mismatch (Saved: ${loadedCols}x${loadedRows}, Expected: ${this.cols}x${this.rows}). Regenerating.`);
             return false; 
          }

          this.layers = parsed.layers;
          
          const loadedEntities = parsed.entities || [];
          this.entities = [];
          loadedEntities.forEach(e => {
              const ent = this.addEntity(e.id, e.x, e.y, e.offsetX, e.offsetY, e.data);
              if (ent && (e.w || e.h)) {
                  ent.width = e.w || null;
                  ent.height = e.h || null;
              }
          });
          
          return true;
        }
      } catch (e) {
        console.error('Failed to load map', e);
      }
    }
    return false;
  }

  draw(ctx, camera, player, shepherd) {
    const startCol = Math.floor(camera.x / this.tileSize);
    const endCol = startCol + (camera.width / this.tileSize) + 1;
    const startRow = Math.floor(camera.y / this.tileSize);
    const endRow = startRow + (camera.height / this.tileSize) + 1;

    for (let y = startRow; y <= endRow; y++) {
      for (let x = startCol; x <= endCol; x++) {
        if (y >= 0 && y < this.rows && x >= 0 && x < this.cols) {
          const posX = Math.floor(x * this.tileSize);
          const posY = Math.floor(y * this.tileSize);
          const baseId = this.layers.base[y][x];
          this.drawTile(ctx, baseId, posX, posY);
        }
      }
    }

    for (let y = startRow; y <= endRow; y++) {
      for (let x = startCol; x <= endCol; x++) {
        if (y >= 0 && y < this.rows && x >= 0 && x < this.cols) {
           const decoId = this.layers.deco[y][x];
           if (decoId !== null) {
              const posX = Math.floor(x * this.tileSize);
              const posY = Math.floor(y * this.tileSize);
              this.drawTile(ctx, decoId, posX, posY);
           }
        }
      }
    }

    const renderList = [];

    if (player) {
        renderList.push({
            type: 'player',
            obj: player,
            y: player.y + player.height
        });
    }

    if (shepherd) {
        renderList.push({
            type: 'shepherd',
            obj: shepherd,
            y: shepherd.y + shepherd.height
        });
    }

    for (const ent of this.entities) {
        const def = ENTITIES[ent.id];
        if (!def) continue;

        const realX = ent.x + (ent.offsetX || 0);
        const realY = ent.y + (ent.offsetY || 0);
        
        const w = ent.width || def.width;
        const h = ent.height || def.height;

        if (realX + w >= camera.x && realX <= camera.x + camera.width &&
            realY + h >= camera.y && realY <= camera.y + camera.height) {
            
            let sortY = realY + h;
            if (def.zIndex === 'high') {
                sortY = Infinity;
            }

            renderList.push({
                type: 'entity',
                obj: ent,
                def: def,
                y: sortY,
                realX: realX,
                realY: realY,
                w: w,
                h: h
            });
        }
    }

    renderList.sort((a, b) => a.y - b.y);

    // 设置裁剪区域，只显示地图范围内的内容
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, this.width, this.height);
    ctx.clip();

    for (const item of renderList) {
        if (item.type === 'player') {
            item.obj.draw(ctx);
        } else if (item.type === 'shepherd') {
            item.obj.draw(ctx);
        } else {
            this.drawEntity(ctx, item.obj, item.def, item.realX, item.realY, item.w, item.h);
        }
    }

    ctx.restore();
  }

  drawTile(ctx, tileId, x, y) {
    const tile = TILES[tileId];
    if (!tile) return;

    let w = this.tileSize;
    let h = this.tileSize;
    let dx = x;
    let dy = y;
    const img = this.tileImages[tileId];
    const hasImage = img && img.complete && img.naturalWidth !== 0;

    if (tile.drawType === 'baseboard') {
        ctx.fillStyle = tile.color || '#4a3026';
        ctx.fillRect(dx, dy + this.tileSize - 4, this.tileSize, 4);
        return;
    }
    if (tile.drawType === 'shadow_top') {
        ctx.fillStyle = tile.color || 'rgba(0,0,0,0.2)';
        ctx.fillRect(dx, dy, this.tileSize, 10);
        return;
    }
    if (tile.drawType === 'shadow_full') {
        ctx.fillStyle = tile.color || 'rgba(0,0,0,0.3)';
        ctx.fillRect(dx, dy, this.tileSize, this.tileSize);
        return;
    }

    if (tile.useNaturalSize && hasImage) {
        w = img.naturalWidth;
        h = img.naturalHeight;
        dx = x + (this.tileSize - w) / 2;
        dy = y + (this.tileSize - h) / 2;
    } else if (tile.width && tile.height) {
        w = tile.width;
        h = tile.height;
        dx = x + (this.tileSize - w) / 2;
        dy = y + (this.tileSize - h) / 2;
    } else if (tile.type === TILE_TYPES.DECO && hasImage) {
        const ratio = img.naturalWidth / img.naturalHeight;
        if (ratio > 1) h = this.tileSize / ratio;
        else w = this.tileSize * ratio;
        dx = x + (this.tileSize - w) / 2;
        dy = y + (this.tileSize - h) / 2;
    }

    if (hasImage) {
      if (tile.rotate) {
          ctx.save();
          const cx = dx + w / 2;
          const cy = dy + h / 2;
          ctx.translate(cx, cy);
          ctx.rotate(tile.rotate * Math.PI / 180);
          
          if (Math.abs(tile.rotate) % 180 !== 0) {
               ctx.drawImage(img, -h / 2, -w / 2, h, w);
          } else {
               ctx.drawImage(img, -w / 2, -h / 2, w, h);
          }
          ctx.restore();
      } else {
          ctx.drawImage(img, dx, dy, w, h);
      }
    } else {
      ctx.fillStyle = tile.color;
      if (tile.type === TILE_TYPES.DECO && !tile.width) {
          ctx.fillRect(x + 4, y + 4, 24, 24);
      } else {
          ctx.fillRect(dx, dy, w, h);
      }
    }
  }

  drawEntity(ctx, ent, def, x, y, width, height) {
    if (ent.id === 999) return;

    if (def.group === 'pond_group') {
        const currentFrameId = this.pondAnim.sequence[this.pondAnim.frameIndex];
        const pondImg = this.entityImages[currentFrameId];
        
        if (pondImg && pondImg.complete) {
            ctx.drawImage(pondImg, Math.floor(x), Math.floor(y), width, height);
        } else {
            ctx.fillStyle = '#3885C9';
            ctx.fillRect(Math.floor(x), Math.floor(y), width, height);
        }
        return;
    }

    const isMature = ent.data && ent.data.type === 'crop' && ent.data.stage === 'mature';

    if (isMature) {
        const glowAlpha = 0.3 + Math.sin(this.glowTimer) * 0.2;
        const glowSize = 8;
        
        ctx.save();
        ctx.globalAlpha = glowAlpha;
        ctx.fillStyle = '#ffd700';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ffd700';
        ctx.fillRect(
            Math.floor(x) - glowSize / 2, 
            Math.floor(y) - glowSize / 2, 
            width + glowSize, 
            height + glowSize
        );
        ctx.restore();
    }

    if (ent.animator) {
        const frame = ent.animator.getCurrentFrame();
        if (frame && frame.image && frame.image.complete) {
            ctx.save();
            ctx.globalAlpha = def.alpha !== undefined ? def.alpha : 1.0; 
            
            if (frame.useFullSource) {
                 ctx.drawImage(frame.image, Math.floor(x), Math.floor(y), width, height);
            } else {
                 ctx.drawImage(frame.image, frame.x, frame.y, frame.w, frame.h, Math.floor(x), Math.floor(y), width, height);
            }
            
            ctx.restore();
        } else {
             ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
             ctx.fillRect(Math.floor(x), Math.floor(y), width, height);
        }
    } else {
        if (this.entityImages[ent.id] && this.entityImages[ent.id].complete) {
            ctx.drawImage(this.entityImages[ent.id], Math.floor(x), Math.floor(y), width, height);
        } else {
            ctx.fillStyle = 'purple';
            ctx.fillRect(Math.floor(x), Math.floor(y), width, height);
        }
    }

    if (isMature) {
        const sparkleX = Math.floor(x + width * (0.3 + Math.sin(this.glowTimer * 3) * 0.2));
        const sparkleY = Math.floor(y + height * (0.2 + Math.cos(this.glowTimer * 2) * 0.1));
        
        ctx.save();
        ctx.globalAlpha = 0.5 + Math.sin(this.glowTimer * 4) * 0.3;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(sparkleX, sparkleY, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
  }

  isSolid(x, y) {
    if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) return true;
    const baseId = this.layers.base[y][x];
    const decoId = this.layers.deco[y][x];
    if (TILES[baseId] && TILES[baseId].solid) return true;
    if (decoId !== null && TILES[decoId] && TILES[decoId].solid) return true;
    return false;
  }

  checkCollision(playerRect) {
      const pad = 6;
      const corners = [
        { x: playerRect.x + pad, y: playerRect.y + pad + 8 },
        { x: playerRect.x + playerRect.width - pad, y: playerRect.y + pad + 8 },
        { x: playerRect.x + pad, y: playerRect.y + playerRect.height - pad },
        { x: playerRect.x + playerRect.width - pad, y: playerRect.y + playerRect.height - pad }
      ];

      for (const corner of corners) {
        const tileX = Math.floor(corner.x / this.tileSize);
        const tileY = Math.floor(corner.y / this.tileSize);
        if (this.isSolid(tileX, tileY)) return true;
      }

      for (const ent of this.entities) {
          const def = ENTITIES[ent.id];
          if (!def || !def.hitbox) continue;

          const realX = ent.x + (ent.offsetX || 0);
          const realY = ent.y + (ent.offsetY || 0);

          const boxX = realX + def.hitbox.x;
          const boxY = realY + def.hitbox.y;
          const boxW = def.hitbox.w;
          const boxH = def.hitbox.h;

          if (playerRect.x < boxX + boxW &&
              playerRect.x + playerRect.width > boxX &&
              playerRect.y < boxY + boxH &&
              playerRect.y + playerRect.height > boxY) {
              return true;
          }
      }

      return false;
  }

  checkPortal(playerRect) {
    const pCenterX = playerRect.x + playerRect.width / 2;
    const pCenterY = playerRect.y + playerRect.height / 2;
    
    const tileX = Math.floor(pCenterX / this.tileSize);
    const tileY = Math.floor(pCenterY / this.tileSize);

    for (const portal of this.portals) {
      if (portal.x === tileX && portal.y === tileY) {
        return portal;
      }
    }
    return null;
  }
}
// 地图系统，加载和管理游戏地图数据
