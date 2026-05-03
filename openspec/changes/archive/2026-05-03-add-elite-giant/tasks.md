## Tasks

- [x] T1: config.js — 新增 ENEMY.elite_giant 配置块（HP ~300、dashSpeed、dashTriggerRange、dashDurationMs、dashCooldownMs 等）
- [x] T2: EliteGiant.js — 继承 Giant，重写 preUpdate 插入 dash 状态（idle → dash → windup 衔接），加精英视觉层（黑身红眼 + 黑烟 + scale 3.6）
- [x] T3: WaveManager.js — 将 EliteGiant 加入精英刷怪池（与 EliteChaser / EliteShooter 随机选取）
- [x] T4: registry.js — 注册 `Elite Giant` 到 DEBUG_SPAWNABLE
- [x] T5: 手测 + 平衡微调
