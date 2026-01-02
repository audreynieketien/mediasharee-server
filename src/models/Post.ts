import mongoose, { Document, Schema, Types } from 'mongoose';
import { IPost, IComment } from '../types/shared';
import { User } from './User';

export interface ICommentSubdoc {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  text: string;
  likes: number;
  likedBy: Types.ObjectId[];
  createdAt: Date;
}

export interface IPostDocument extends Document {
  creator: Types.ObjectId;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  title?: string;
  caption: string;
  location?: string;
  people?: string[];
  tags: string[];
  likes: number;
  likedBy: Types.ObjectId[];
  comments: ICommentSubdoc[];
  createdAt: Date;
  toClientFormat(currentUserId?: string): Promise<IPost>;
}

const CommentSchema = new Schema<ICommentSubdoc>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String,
    required: true,
    maxlength: 500,
  },
  likes: {
    type: Number,
    default: 0,
  },
  likedBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const PostSchema = new Schema<IPostDocument>({
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  mediaUrl: {
    type: String,
    required: true,
  },
  mediaType: {
    type: String,
    enum: ['image', 'video'],
    required: true,
  },
  title: {
    type: String,
    maxlength: 100,
  },
  caption: {
    type: String,
    required: true,
    maxlength: 500,
  },
  location: {
    type: String,
    maxlength: 100,
    index: true,
  },
  people: [{
    type: String,
  }],
  tags: [{
    type: String,
    index: true,
  }],
  likes: {
    type: Number,
    default: 0,
  },
  likedBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  comments: [CommentSchema],
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

PostSchema.methods.toClientFormat = async function(
  this: IPostDocument,
  currentUserId?: string
): Promise<IPost> {
  if (!this.populated('creator')) {
    await this.populate('creator');
  }

  const creatorDoc = this.creator as any;
  const hasLiked = currentUserId 
    ? this.likedBy.some(id => id.toString() === currentUserId)
    : false;

  const comments: IComment[] = this.comments.map((comment) => {
    const userDoc = comment.user as any;
    
    return {
      id: comment._id.toString(),
      user: userDoc?.username || 'Unknown User',
      text: comment.text,
      likes: comment.likes,
      hasLiked: currentUserId 
        ? comment.likedBy.some(id => id.toString() === currentUserId)
        : false,
      timestamp: comment.createdAt,
    };
  });

  return {
    _id: this._id.toString(),
    mediaType: this.mediaType,
    url: this.mediaUrl,
    title: this.title,
    caption: this.caption,
    location: this.location,
    people: this.people,
    tags: this.tags,
    creator: {
      id: creatorDoc._id.toString(),
      username: creatorDoc.username,
      email: creatorDoc.email,
      avatarUrl: creatorDoc.avatarUrl,
      role: creatorDoc.role,
    },
    stats: {
      likes: this.likes,
      hasLiked,
    },
    comments,
    createdAt: this.createdAt,
  };
};

export const Post = mongoose.model<IPostDocument>('Post', PostSchema);
