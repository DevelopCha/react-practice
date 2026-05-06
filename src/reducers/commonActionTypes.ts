export const SET_ACTIVE_CHAPTER = 'SET_ACTIVE_CHAPTER';

export type CommonAction = {
  type: typeof SET_ACTIVE_CHAPTER;
  payload: { chapterTitle: string };
};
