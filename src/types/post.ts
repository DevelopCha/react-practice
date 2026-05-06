export type Post = {
  id: number;
  title: string;
  body: string;
};

export type PostState = {
  posts: Post[];
  loading: boolean;
  error: string | null;
  message: string | null;
};
