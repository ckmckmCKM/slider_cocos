# 超级滑块大师 - Cocos Creator 3.8.8 2D 复刻

## 打开方式

1. 启动 **Cocos Creator 3.8.8**
2. 打开项目目录：`D:\aaa\superdashi\slider_cocos`
3. 打开场景 `assets/scenes/Main.scene`
4. 选中 **Canvas** 节点，添加组件 `GameApp`（脚本在 `assets/scripts/game/GameApp.ts`）
5. 菜单 **项目 → 项目设置 → 功能裁剪** 保持 2D 即可
6. 将 `Main` 设为启动场景后点击预览

首次打开会自动为 png/m4a/json 生成 `.meta`，可能需要等待资源导入完成。

## 已迁移内容

- 大厅（开始游戏 / 选择关卡）
- 选关列表（进度解锁）
- 2D 棋盘：拖拽滑动、碰撞、拼合自动消除
- 道具：沙漏 / 锤子 / 磁铁
- 冰块 / 钥匙 / 锁链（简化）
- 107 关数据（`assets/resources/levels/all.json`）
- 原版贴图与音效（`assets/resources/img|ui|audio`）

## 目录

```
assets/
  scenes/Main.scene
  scripts/game/GameApp.ts          # 入口：大厅/选关/对局 UI
  scripts/game/BoardController.ts  # 核心玩法
  scripts/utils/                   # 常量、资源、音效、UI 工具
  resources/img|ui|audio|levels/
```
