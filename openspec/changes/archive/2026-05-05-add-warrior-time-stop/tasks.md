## Tasks

- [x] T1: config.js — 新增 TIME_STOP 配置块 + 2 张分级 UPGRADES 卡（Time Dilation / Gravity Well）+ 1 张时间暂停卡
- [x] T2: Upgrades.js — 支持分级卡过滤（maxLevel）+ 解锁条件检测 + 时间暂停卡注入
- [x] T3: Player.js — triggerSkill 分支处理（skillCost / skillId）+ stats 新增追踪字段
- [x] T4: GameScene.fireBulletTime — 从 player.stats 动态读取持续时间/slowFactor（支持分级升级生效）
- [x] T5: BootScene — 预生成表盘纹理（time_stop_clock）+ 秒针纹理（time_stop_hand）+ 6 张碎片纹理（time_stop_shard_0~5）
- [x] T6: GameScene.fireTimeStop — 时间暂停核心逻辑（slowFactor=0 + 无敌 + 灰度控制）
- [x] T7: GameScene — 钟表盘 UI（秒针旋转 + 颜色渐变 + 最后 1 秒红色警告）
- [x] T8: GameScene — 钟表碎裂动画 + 灰度恢复 + 白闪
- [x] T9: 手测 + 特效调优（cooldownMs 调至 15s）
