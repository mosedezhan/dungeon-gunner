## 1. 配置与纹理

- [x] 1.1 在 `src/config.js` 新增 `CLASSES` 配置块（法师/战士定义）
- [x] 1.2 在 `src/scenes/BootScene.js` 为法师生成蓝色变体纹理（`mage` key）

## 2. ClassSelectScene 场景

- [x] 2.1 创建 `src/scenes/ClassSelectScene.js` 场景文件
- [x] 2.2 实现卡片容器布局（水平居中，两张卡片）
- [x] 2.3 实现法师卡片（蓝色立绘 + "精通弹开技能" + 可点击）
- [x] 2.4 实现战士卡片（置灰立绘 + "敬请期待" + 不可点击）
- [x] 2.5 实现卡片悬停高亮效果
- [x] 2.6 实现点击法师卡片启动 GameScene（传递 `{ class: 'mage' }`）
- [x] 2.7 实现键盘交互（ESC 返回 MenuScene）

## 3. GameScene 集成

- [x] 3.1 修改 `GameScene.create(data)` 接收 `data.class` 参数
- [x] 3.2 根据 `data.class` 选择对应纹理初始化 Player（默认 mage）

## 4. 场景流程更新

- [x] 4.1 修改 `src/scenes/MenuScene.js` 启动逻辑（改为启动 ClassSelectScene）
- [x] 4.2 在 `src/main.js` 注册 ClassSelectScene

## 5. 验证

- [x] 5.1 启动游戏，确认从主菜单按 SPACE 进入选人界面
- [x] 5.2 确认法师卡片可点击，点击后进入游戏且使用蓝色立绘
- [x] 5.3 确认战士卡片置灰且不可点击
- [x] 5.4 确认 ESC 可返回主菜单
