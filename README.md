# Block Reveal — Cocos Creator 1:1 复刻

基于 Unity 原版 **Block Reveal: Slide & Match**（`com.halagames.blockreveal`）的 Cocos Creator 3.8.8 复刻。

## 打开方式

1. 启动 **Cocos Creator 3.8.8**
2. 打开本项目，等待 `assets/resources/pictures`、`ui_br`、`levels_br` 导入完成（首次较慢）
3. 打开 `assets/scenes/Main.scene`，Canvas 挂载 `GameApp`
4. 预览运行

## 已迁移

| 内容 | 路径 |
|------|------|
| 650 关明文 | `assets/resources/levels_br/Lv_XXXX.txt` |
| 揭图资源 ~581 | `assets/resources/pictures/**` |
| UI / 道具 / 机关图标 ~401 | `assets/resources/ui_br/**` |
| 关卡解析器 | `assets/scripts/blocky/LevelParser.ts` |
| 核心棋盘（逐图揭示） | `assets/scripts/blocky/BoardController.ts` |

## 已实现玩法

- 20×20 棋盘、Polyomino 拖拽滑动、碰撞
- **逐图拼合揭示**（`idPanelPicture` + `listIndexPicture`）
- 方块机制：冰 / 锁+钥匙 / 钉住 / 方向箭 / 炸弹倒计时 / 合并拖动 / 神秘层（简化）
- 环境：冰墙计数；传送门/隧道/粉碎机等 **先占位可视化**
- 道具：Freeze / Magnet / Slicer / Teleport
- 失败续关（+60 秒 / 拆弹）

## 待对齐（环境机关完整逻辑）

Portal 传送、Tunnel 吐块、Grinder / RollerDoor / Rotator / WoodenBox / ColorPath 强制路径、生命与商店等 F2P。

## 验收建议关卡

`1 → 10 → 21 → 50 → 93(炸弹) → 172(传送门) → 301(隧道) → 489 → 601`
