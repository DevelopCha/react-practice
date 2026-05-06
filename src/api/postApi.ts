import type { Post } from '../types/post';
import { mockPosts } from '../data/mockPosts';
import { addFlowStep } from '../runtime/flowTracker';
import { addLog } from '../runtime/logger';
import { axiosClient } from './axiosClient';

export const postApi = {
  fetchPosts() {
    addLog('API', 'postApi.fetchPosts() called');
    addFlowStep('postApi.fetchPosts()');
    return axiosClient.get<Post[]>('users', mockPosts);
  },
  createPost(payload: Pick<Post, 'title' | 'body'>) {
    addLog('API', 'postApi.createPost() called');
    addFlowStep('postApi.createPost()');
    return axiosClient.post<Post>('write', { id: Date.now(), title: payload.title, body: payload.body });
  },
  deletePost(id: number) {
    addLog('API', 'postApi.deletePost() called');
    addFlowStep('postApi.deletePost()');
    return axiosClient.delete<{ deletedId: number }>('delete', { deletedId: id });
  },
};
