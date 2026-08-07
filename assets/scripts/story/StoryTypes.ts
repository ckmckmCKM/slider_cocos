export interface StoryStepSubview {
  type: 'subview';
  /** 二级界面底图：sprite/step/{bg} */
  bg: string;
  /** 二级界面上层 icon：sprite/step/{icon} */
  icon: string;
}

export interface StoryStepDialogue {
  type: 'dialogue';
  /** 说话人（显示在 com/mingzi 名牌上） */
  speaker: string;
  /** 对话正文（逐字显示在 com/duihuakuang 上） */
  text: string;
}

/** 一级界面 + 游戏入口：点按钮进关卡，点其它区域弹出提示 */
export interface StoryStepGameGate {
  type: 'gameGate';
  /** 一级界面图：sprite/step/{frame} */
  frame: string;
  /** 入口按钮图：sprite/step/{btn}，默认 gametubiao */
  btn?: string;
  /** 点击进入的关卡号 */
  level: number;
  /** 点击其它区域时的提示文案 */
  tip?: string;
}

export type StoryStep = string | StoryStepSubview | StoryStepDialogue | StoryStepGameGate;

export interface StoryConfig {
  id: string;
  steps: StoryStep[];
}

export function isStorySubview(step: StoryStep): step is StoryStepSubview {
  return typeof step === 'object' && step !== null && step.type === 'subview';
}

export function isStoryDialogue(step: StoryStep): step is StoryStepDialogue {
  return typeof step === 'object' && step !== null && step.type === 'dialogue';
}

export function isStoryGameGate(step: StoryStep): step is StoryStepGameGate {
  return typeof step === 'object' && step !== null && step.type === 'gameGate';
}
