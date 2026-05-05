## Tasks

- [x] T1: config.js — 新增 ARCANE_STORM 配置块（脉冲参数、伤害、范围递增、视觉参数）+ 2 张分级 UPGRADES 卡（冰霜新星 / 法力虹吸）+ 1 张奥术风暴解锁卡
- [x] T2: config.js — 新增冰霜减速参数（slowFactors 数组、durations 数组）和虹吸 XP 参数（extraOrbs 数组、xpMultiplier 数组）到 ARCANE_STORM 配置块
- [x] T3: Upgrades.js — 奥术风暴解锁条件检测（frostLevel + siphonLevel >= 3）+ 首次 100% 刷新逻辑（复用 timeStopShown 模式，用 arcaneStormShown 标记）
- [x] T4: Player.js — triggerSkill 增强：支持 useSkill 返回数值型消耗（奥术风暴扣 3，冲击波扣 1）
- [x] T5: Enemy.js — 新增 frostSlowFactor / frostSlowUntil 属性 + setVelocity 中减速逻辑（与 scene.slowFactor 叠加）
- [x] T6: BootScene — 预生成金色 XP 球纹理（xp_orb_siphon）+ 紫色漩涡纹理（arcane_vortex）+ 新增 SiphonOrb 类
- [x] T7: GameScene.fireShockwave — 增强为读取 player.stats 附加效果层：冰霜减速（命中敌人设置 frostSlowFactor/frostSlowUntil + 蓝色 tint）+ 虹吸（绿色能量线 VFX + 金色 XP 球生成）
- [x] T8: GameScene.fireArcaneStorm — 奥术风暴核心逻辑：5 次脉冲定时器，范围递增，每次脉冲继承冰霜/虹吸效果，脉冲期间标记 _arcaneStormActive 防止重复触发
- [x] T9: GameScene — 奥术风暴 VFX：紫色脉冲环 + 中央漩涡 sprite（跟随玩家）+ camera shake
- [x] T10: HUDScene — 充能 ≥ 3 且已解锁奥术风暴时显示"风暴就绪"提示 + 未满时显示进度提示
- [x] T11: 语法检查通过（config / upgrades / player / enemy / siphon / boot / hud / gamescene）
