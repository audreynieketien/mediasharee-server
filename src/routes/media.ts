import { Router, Request, Response } from 'express';
import multer from 'multer';
import { verifyToken, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { uploadMetadataSchema } from '../validators/schemas';
import { azureStorageService } from '../services/azureStorage';

import { Post } from '../models/Post';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'));
    }
  },
});

router.post(
  '/upload',
  verifyToken,
  requireRole('creator'),
  upload.single('file'),
  validate(uploadMetadataSchema),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'No file uploaded',
          message: 'Please provide a file in the request',
        });
      }

      const { title, caption, location, people } = req.body;
      const file = req.file;

      const fileExtension = file.originalname.split('.').pop();
      const filename = `${uuidv4()}.${fileExtension}`;

      const mediaUrl = await azureStorageService.uploadFile(
        file.buffer,
        filename,
        file.mimetype
      );

      const mediaType = file.mimetype.startsWith('image/') ? 'image' : 'video';
      let tags: string[] = [];

      const post = await Post.create({
        creator: req.user!._id,
        mediaUrl,
        mediaType,
        title,
        caption,
        location,
        people: people || [],
        tags,
      });

      const formattedPost = await post.toClientFormat(req.auth!.userId);

      res.status(201).json({
        success: true,
        post: formattedPost,
      });
    } catch (error: any) {
      console.error('Media upload failed:', error);
      throw error;
    }
  }
);

export default router;
