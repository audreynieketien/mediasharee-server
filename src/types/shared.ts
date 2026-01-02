// Shared TypeScript interfaces matching frontend data contract

export interface IUser {
  id: string;
  username: string;
  email: string;
  avatarUrl: string;
  role: 'consumer' | 'creator';
}

export interface IComment {
  id: string;
  user: string;
  text: string;
  likes: number;
  hasLiked: boolean;
  timestamp: Date;
}

export interface IPost {
  _id: string;
  mediaType: 'image' | 'video';
  url: string;
  title?: string;
  caption: string;
  location?: string;
  people?: string[];
  tags: string[];
  creator: IUser;
  stats: {
    likes: number;
    hasLiked: boolean;
  };
  comments: IComment[];
  createdAt: Date;
}
