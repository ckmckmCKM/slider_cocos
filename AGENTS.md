# Agent 指南 — Block Reveal (Cocos)

本仓库是 Unity **Block Reveal: Slide & Match** 的 Cocos Creator 3.8.8 复刻。

## 开始开发前

**必须先阅读：** [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

该文档包含目录结构、数据流、关卡格式、坐标约定、已知陷阱与扩展方式。

## 快速定位

| 任务 | 文件 |
|------|------|
| 入口 / UI | `assets/scripts/game/GameApp.ts` |
| 棋盘逻辑 | `assets/scripts/blocky/BoardController.ts` |
| 关卡解析 | `assets/scripts/blocky/LevelParser.ts` |
| 机关视觉 | `assets/scripts/blocky/EnvHelpers.ts` |
| 资源加载 | `assets/scripts/utils/ResCache.ts`（`loadGameBundle`） |
| 650 关数据 | `assets/bundle/game/levels_br/Lv_XXXX.txt` |
| 关卡校验 | `node tools/validate-levels.mjs 1 100` |
| 剧情编辑器 | `GEditor/index.html`（蓝图 · 导出 geditor-cocos） |
| 剧情类型 / 导出格式 | `assets/scripts/story/GEditorTypes.ts` |
| 剧情播放 | `assets/scripts/story/GEditorStoryPlayer.ts` |
| 剧情 bundle | `assets/bundle/story1/story.json` + `sprite/step/*` + `audio/*` |
| 剧情内滑块 | `GameApp.enterGameFromStory` → `SliderGameView.setStoryWinHandler` → `completeGameNode` |
| Game 通关道具 | Game 节点 Reward 引脚 → `winReward.textureFile`；动效写死在 `GEditorStoryPlayer`（§4.7.4） |
| Frame 多音频 | 多个 Sound 连同一 Frame → `sounds[]`（1 BGM + 多 SFX，§4.7.5） |

## 禁止误改

- **`assets/scripts/game/BoardController.ts`** — 旧版「超级滑块」，已废弃
- 不要将 board 按**行**解析；Unity 格式是**列优先**（见架构文档 §5.3）
- 不要用「实心包围盒扩盘」修关卡尺寸；仅补**方块占用格** Ground
- **GEditor 逻辑**写在 `assets/scripts/story/`，不要放进 `assets/bundle/` 目录
- 改 GEditor 导出字段须同步：`GEditor/app.js` · `GEditorTypes.ts` · `GEditorStoryPlayer.ts` ·（资源加载时）`ResCache.ts`

## 代码约定

- Map/Set 转数组：`Array.from(map.values())`，**禁止** `[...map.values()]`（`entries()` / `keys()` 同理）

## 入口

- 场景：`assets/scenes/Main.scene`
- 组件：`GameApp` @ Canvas
- 进度 key：`block_reveal_max`（`Constants.PROGRESS_KEY`）
