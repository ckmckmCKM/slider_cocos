/** StoryPlayer / GEditorStoryPlayer 共用外壳接口（GameApp 注入回调与挂载 Game） */

export interface GEditorStoryPlayback {
  getGameSiblingIndex(): number;
  setGameRequestHandler(handler: ((level: number, onWin: () => void) => void) | null): void;
  setSubviewCloseHandler(handler: (() => void) | null): void;
  play(storyName: string, onFinished?: () => void): Promise<void>;
  showGameGateLayerOnly(): void;
  hide(): void;
}
