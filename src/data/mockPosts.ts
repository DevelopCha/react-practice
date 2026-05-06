import type { Post } from '../types/post';

export const mockPosts: Post[] = [
  { id: 101, title: 'Legacy router migration note', body: 'Route pages still own their first fetch side effects.' },
  { id: 102, title: 'Reducer dispatch lifecycle', body: 'Actions describe events, reducers calculate the next state.' },
  { id: 103, title: 'Context provider nesting', body: 'Global state is intentionally split by domain providers.' },
];
