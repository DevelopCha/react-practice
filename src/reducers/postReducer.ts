import type { PostState } from '../types/post';
import { addFlowStep } from '../runtime/flowTracker';
import { addLog } from '../runtime/logger';
import {
  ADD_POST_REQUEST,
  ADD_POST_SUCCESS,
  FETCH_POSTS_FAILURE,
  FETCH_POSTS_REQUEST,
  FETCH_POSTS_SUCCESS,
  POST_MUTATION_FAILURE,
  REMOVE_POST_REQUEST,
  REMOVE_POST_SUCCESS,
  type PostAction,
} from './postActionTypes';

export const initialPostState: PostState = {
  posts: [],
  loading: false,
  error: null,
  message: null,
};

function recordPostReducerStep(message: string) {

  addLog('Reducer', message);
  addFlowStep(message);
}

export function postReducer(state: PostState, action: PostAction): PostState {
  switch (action.type) {
    case FETCH_POSTS_REQUEST:
    case ADD_POST_REQUEST:
    case REMOVE_POST_REQUEST:
      recordPostReducerStep(`postReducer handled ${action.type}`);
      return { ...state, loading: true, error: null, message: null };
    case FETCH_POSTS_SUCCESS:
      recordPostReducerStep('postReducer handled FETCH_POSTS_SUCCESS');
      return { ...state, posts: action.payload.posts, loading: false, message: action.payload.message };
    case FETCH_POSTS_FAILURE:
      recordPostReducerStep('postReducer handled FETCH_POSTS_FAILURE');
      return { ...state, posts: [], loading: false, error: action.payload.error, message: null };
    case ADD_POST_SUCCESS:
      recordPostReducerStep('postReducer handled ADD_POST_SUCCESS');
      return {
        ...state,
        posts: [action.payload.post, ...state.posts],
        loading: false,
        message: action.payload.message,
      };
    case REMOVE_POST_SUCCESS:
      recordPostReducerStep('postReducer handled REMOVE_POST_SUCCESS');
      return {
        ...state,
        posts: state.posts.filter((post) => post.id !== action.payload.id),
        loading: false,
        message: action.payload.message,
      };
    case POST_MUTATION_FAILURE:
      recordPostReducerStep('postReducer handled POST_MUTATION_FAILURE');
      return { ...state, loading: false, error: action.payload.error, message: null };
    default:
      return state;
  }
}
