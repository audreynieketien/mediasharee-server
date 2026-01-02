import { Router, Request, Response } from 'express';
import { verifyToken } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { commentSchema } from '../validators/schemas';
import { Post } from '../models/Post';
import { Types } from 'mongoose';

const router = Router();

interface LikeResponse {
  success: true;
  likes: number;
  hasLiked: boolean;
}

interface CommentResponse {
  success: true;
  comment: any;
}

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const post = await Post.findById(req.params.id).populate('creator');

    if (!post) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Post not found',
      });
    }

    const currentUserId = req.auth?.userId;
    const formattedPost = await post.toClientFormat(currentUserId);

    res.json(formattedPost);
  } catch (error) {
    throw error;
  }
});

router.post('/:id/like', verifyToken, async (req: Request, res: Response) => {
  try {
    const userId = new Types.ObjectId(req.user!._id);
    const postId = req.params.id;

    const post = await Post.findOneAndUpdate(
      { _id: postId, likedBy: { $ne: userId } },
      {
        $addToSet: { likedBy: userId },
        $inc: { likes: 1 },
      },
      { new: true }
    );

    if (!post) {
      const existingPost = await Post.findById(postId);
      if (existingPost) {
         return res.json({
          success: true,
          likes: existingPost.likes,
          hasLiked: true,
        });
      }

      return res.status(404).json({
        error: 'Not Found',
        message: 'Post not found',
      });
    }

    const response: LikeResponse = {
      success: true,
      likes: post.likes,
      hasLiked: true,
    };

    res.json(response);
  } catch (error) {
    throw error;
  }
});

router.post(
  '/:id/comments',
  verifyToken,
  validate(commentSchema),
  async (req: Request, res: Response) => {
    try {
      const { text } = req.body;
      const postId = req.params.id;
      const userId = req.user!._id;

      const comment = {
        user: userId,
        text,
        likes: 0,
        likedBy: [],
        createdAt: new Date(),
      };

      const post = await Post.findByIdAndUpdate(
        postId,
        { $push: { comments: comment } },
        { new: true }
      ).populate('comments.user');

      if (!post) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Post not found',
        });
      }

      const newComment = post.comments[post.comments.length - 1];
      const userDoc = newComment.user as any;

      const response: CommentResponse = {
        success: true,
        comment: {
          id: newComment._id.toString(),
          user: userDoc.username,
          text: newComment.text,
          likes: newComment.likes,
          hasLiked: false,
          timestamp: newComment.createdAt,
        },
      };

      res.status(201).json(response);
    } catch (error) {
      throw error;
    }
  }
);

export default router;
