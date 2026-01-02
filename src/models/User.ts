import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from '../types/shared';

export interface IUserDocument extends Document {
  username: string;
  email: string;
  passwordHash: string;
  role: 'consumer' | 'creator';
  avatarUrl: string;
  createdAt: Date;
  toClientFormat(): IUser;
}

const UserSchema = new Schema<IUserDocument>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  passwordHash: {
    type: String,
    required: true,
    select: false
  },
  role: {
    type: String,
    enum: ['consumer', 'creator'],
    default: 'consumer'
  },
  avatarUrl: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});


UserSchema.methods.toClientFormat = function(this: IUserDocument): IUser {
  return {
    id: this._id.toString(),
    username: this.username,
    email: this.email,
    avatarUrl: this.avatarUrl,
    role: this.role,
  };
};

export const User = mongoose.model<IUserDocument>('User', UserSchema);
