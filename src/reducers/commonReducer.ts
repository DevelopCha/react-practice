import { SET_ACTIVE_CHAPTER, type CommonAction } from './commonActionTypes';

export type CommonState = {
  chapterTitle: string;
};

export const initialCommonState: CommonState = {
  chapterTitle: 'Dashboard',
};

export function commonReducer(state: CommonState, action: CommonAction): CommonState {
  switch (action.type) {
    case SET_ACTIVE_CHAPTER:
      return { ...state, chapterTitle: action.payload.chapterTitle };
    default:
      return state;
  }
}
