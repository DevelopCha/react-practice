import { createContext, useCallback, useContext, useMemo, useReducer, type ReactNode } from 'react';
import { SET_ACTIVE_CHAPTER } from '../reducers/commonActionTypes';
import { commonReducer, initialCommonState, type CommonState } from '../reducers/commonReducer';

type CommonContextValue = {
  state: CommonState;
  setActiveChapter: (chapterTitle: string) => void;
};

const CommonContext = createContext<CommonContextValue | null>(null);

export function CommonProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(commonReducer, initialCommonState);

  const setActiveChapter = useCallback((chapterTitle: string) => {
    dispatch({ type: SET_ACTIVE_CHAPTER, payload: { chapterTitle } });
  }, []);

  const value = useMemo(() => ({ state, setActiveChapter }), [state]);

  return <CommonContext.Provider value={value}>{children}</CommonContext.Provider>;
}

export function useCommon() {
  const value = useContext(CommonContext);

  if (!value) {
    throw new Error('useCommon must be used inside CommonProvider');
  }

  return value;
}
