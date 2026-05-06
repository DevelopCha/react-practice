import { createContext, useCallback, useContext, useMemo, useReducer, type ReactNode } from 'react';
import { postApi } from '../api/postApi';
import {
  ADD_POST_REQUEST,
  ADD_POST_SUCCESS,
  FETCH_POSTS_FAILURE,
  FETCH_POSTS_REQUEST,
  FETCH_POSTS_SUCCESS,
  POST_MUTATION_FAILURE,
  REMOVE_POST_REQUEST,
  REMOVE_POST_SUCCESS,
} from '../reducers/postActionTypes';
import { initialPostState, postReducer } from '../reducers/postReducer';
import type { MockServerFailure } from '../runtime/mockServer';
import type { Post, PostState } from '../types/post';

type PostContextValue = {
  state: PostState;
  fetchPosts: () => Promise<void>;
  createPost: (payload: Pick<Post, 'title' | 'body'>) => Promise<void>;
  deletePost: (id: number) => Promise<void>;
};

const PostContext = createContext<PostContextValue | null>(null);

function getErrorMessage(error: unknown) {
  return (error as MockServerFailure).response?.message || 'request failed';
}

export function PostProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(postReducer, initialPostState);

  const fetchPosts = useCallback(() => {
    dispatch({ type: FETCH_POSTS_REQUEST });

    return postApi
      .fetchPosts()
      .then((response) => {
        dispatch({ type: FETCH_POSTS_SUCCESS, payload: { posts: response.data, message: response.message } });
      })
      .catch((error) => {
        dispatch({ type: FETCH_POSTS_FAILURE, payload: { error: getErrorMessage(error) } });
      });
  }, []);

  const createPost = useCallback((payload: Pick<Post, 'title' | 'body'>) => {
    dispatch({ type: ADD_POST_REQUEST });

    return postApi
      .createPost(payload)
      .then((response) => {
        dispatch({ type: ADD_POST_SUCCESS, payload: { post: response.data, message: response.message } });
      })
      .catch((error) => {
        dispatch({ type: POST_MUTATION_FAILURE, payload: { error: getErrorMessage(error) } });
      });
  }, []);

  const deletePost = useCallback((id: number) => {
    dispatch({ type: REMOVE_POST_REQUEST });

    return postApi
      .deletePost(id)
      .then((response) => {
        dispatch({ type: REMOVE_POST_SUCCESS, payload: { id: response.data.deletedId, message: response.message } });
      })
      .catch((error) => {
        dispatch({ type: POST_MUTATION_FAILURE, payload: { error: getErrorMessage(error) } });
      });
  }, []);

  const value = useMemo(() => ({ state, fetchPosts, createPost, deletePost }), [state]);

  return <PostContext.Provider value={value}>{children}</PostContext.Provider>;
}

export function usePosts() {
  const value = useContext(PostContext);

  if (!value) {
    throw new Error('usePosts must be used inside PostProvider');
  }

  return value;
}
