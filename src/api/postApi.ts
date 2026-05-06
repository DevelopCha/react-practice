import type { Post } from '../types/post';
import { mockPosts } from '../data/mockPosts';
import { axiosClient } from './axiosClient';

export const postApi = {
  fetchPosts() {
    return axiosClient.get<Post[]>('users', mockPosts);
  },
  createPost(payload: Pick<Post, 'title' | 'body'>) {
    return axiosClient.post<Post>('write', { id: Date.now(), title: payload.title, body: payload.body });
  },
  deletePost(id: number) {
    return axiosClient.delete<{ deletedId: number }>('delete', { deletedId: id });
  },
};
