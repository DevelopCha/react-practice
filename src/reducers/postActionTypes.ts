import type { Post } from '../types/post';

export const FETCH_POSTS_REQUEST = 'FETCH_POSTS_REQUEST';
export const FETCH_POSTS_SUCCESS = 'FETCH_POSTS_SUCCESS';
export const FETCH_POSTS_FAILURE = 'FETCH_POSTS_FAILURE';
export const ADD_POST_REQUEST = 'ADD_POST_REQUEST';
export const ADD_POST_SUCCESS = 'ADD_POST_SUCCESS';
export const REMOVE_POST_REQUEST = 'REMOVE_POST_REQUEST';
export const REMOVE_POST_SUCCESS = 'REMOVE_POST_SUCCESS';
export const POST_MUTATION_FAILURE = 'POST_MUTATION_FAILURE';

export type PostAction =
  | { type: typeof FETCH_POSTS_REQUEST }
  | { type: typeof FETCH_POSTS_SUCCESS; payload: { posts: Post[]; message: string } }
  | { type: typeof FETCH_POSTS_FAILURE; payload: { error: string } }
  | { type: typeof ADD_POST_REQUEST }
  | { type: typeof ADD_POST_SUCCESS; payload: { post: Post; message: string } }
  | { type: typeof REMOVE_POST_REQUEST }
  | { type: typeof REMOVE_POST_SUCCESS; payload: { id: number; message: string } }
  | { type: typeof POST_MUTATION_FAILURE; payload: { error: string } };
