# Block Reveal — Cocos Creator 1:1 复刻

基于 Unity 原版 **Block Reveal: Slide & Match**（`com.halagames.blockreveal`）的 Cocos Creator 3.8.8 复刻。

## 打开方式

1. 启动 **Cocos Creator 3.8.8**
2. 打开本项目，等待 `assets/bundle/game`（关卡 / 揭图 / 局内 UI）导入完成（首次较慢）
3. 打开 `assets/scenes/Main.scene`，Canvas 挂载 `GameApp`
4. 预览运行

**工程架构（供智能体 / 新开发者阅读）：** [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

## 已迁移

| 内容 | 路径 |
|------|------|
| 650 关明文 | `assets/bundle/game/levels_br/Lv_XXXX.txt` |
| 揭图资源 ~581 | `assets/bundle/game/sprite/pictures/**` |
| UI / 机关图标 | `assets/bundle/game/sprite/ui_br/**`（局内已用） |
| 关卡解析器 | `assets/bundle/game/scripts/blocky/LevelParser.ts` |
| 核心棋盘（逐图揭示） | `assets/bundle/game/scripts/blocky/BoardController.ts` |

## 已实现玩法

- 20×20 棋盘、Polyomino 拖拽滑动、碰撞
- **逐图拼合揭示**（`idPanelPicture` + `listIndexPicture`）
- 方块机制：冰 / 锁+钥匙 / 钉住 / 方向箭 / 炸弹 / 合并拖动 / 神秘层 / **双层 Layered** / **ColorBlock 绳索**
- 环境机关：
  - 传送门（同色传送）
  - **隧道吐块**（队列 FIFO，落点=listPos）
  - **粉碎机**（完成图片后四向计数 -1，归零清除）
  - **木箱**（计数破箱，释放内部块）
  - **卷帘门**（计数破门）
  - **旋转器**（点击中心，臂上块顺时针 90°）
  - **颜色路径**（同色块沿滑动方向强制滑行）
  - 冰墙计数
- 道具：Freeze / Magnet / Slicer / Teleport（局内 UI 暂隐藏）
- 失败续关（+60 秒 / 拆弹）

## 验收建议关卡

`1 → 10 → 75(双层) → 112(绳索) → 172(传送门) → 212(木箱) → 252(粉碎机) → 301(隧道) → 351(色轨) → 401(卷帘门) → 601(旋转器)`
