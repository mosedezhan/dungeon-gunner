import { WORLD } from '../config.js';

/**
 * World 系统模块 - 封装世界边界、生成环、出界判断等逻辑
 * 作为接口骨架，支持未来地图扩展（如动态边界、分块加载）
 */
export class World {
  constructor(scene) {
    this.scene = scene;
  }

  /**
   * 获取世界边界
   * @returns {{ x: number, y: number, width: number, height: number }}
   */
  getBounds() {
    return { x: 0, y: 0, width: WORLD.width, height: WORLD.height };
  }

  /**
   * 获取生成环区域
   * 返回相机外一圈的候选区域，用于敌人生成
   * @param {Phaser.Cameras.Scene2D.Camera} camera
   * @returns {{ worldW: number, worldH: number, viewW: number, viewH: number, viewX: number, viewY: number, viewRight: number, viewBottom: number }}
   */
  getSpawnRing(camera) {
    const view = camera.worldView;
    return {
      worldW: WORLD.width,
      worldH: WORLD.height,
      viewW: view.width,
      viewH: view.height,
      viewX: view.x,
      viewY: view.y,
      viewRight: view.right,
      viewBottom: view.bottom,
    };
  }

  /**
   * 判断坐标是否超出世界边界
   * @param {number} x
   * @param {number} y
   * @param {number} margin - 额外边距
   * @returns {boolean}
   */
  isOutOfBounds(x, y, margin = 50) {
    return x < -margin || x > WORLD.width + margin ||
           y < -margin || y > WORLD.height + margin;
  }

  /**
   * 获取当前可见区域的 tile 索引范围
   * 用于动态铺地板（Phase 3）
   * @param {Phaser.Cameras.Scene2D.Camera} camera
   * @param {number} tileSize - 瓦片尺寸，默认 32
   * @returns {{ xMin: number, xMax: number, yMin: number, yMax: number }}
   */
  getVisibleTileRange(camera, tileSize = 32) {
    // 骨架实现：返回固定范围 (0~30, 0~18)，对应 960/32, 600/32
    return {
      xMin: 0,
      xMax: Math.ceil(WORLD.width / tileSize),
      yMin: 0,
      yMax: Math.ceil(WORLD.height / tileSize),
    };
  }

  /**
   * 设置物理世界边界
   */
  setupPhysicsWorld() {
    this.scene.physics.world.setBounds(0, 0, WORLD.width, WORLD.height);
  }
}
