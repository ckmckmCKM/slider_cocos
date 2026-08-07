export interface StoryStepSubview {
  type: 'subview';
  /** 二级界面底图：sprite/step/{bg} */
  bg: string;
  /** 二级界面上层 icon：sprite/step/{icon} */
  icon: string;
}

export type StoryStep = string | StoryStepSubview;

export interface StoryConfig {
  id: string;
  steps: StoryStep[];
}

export function isStorySubview(step: StoryStep): step is StoryStepSubview {
  return typeof step === 'object' && step !== null && step.type === 'subview';
}
