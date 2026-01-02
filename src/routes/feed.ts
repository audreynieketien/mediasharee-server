import { Router, Request, Response } from 'express';
import { cacheService } from '../services/cache';
import { Post } from '../models/Post';
import { config } from '../config';
import { optionalAuth } from '../middleware/auth';
import { User } from '../models/User';

const router = Router();

interface FeedResponse {
  posts: any[];
  page: number;
  totalPages: number;
  totalPosts: number;
}

router.get('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const { q, location, tag, type, username } = req.query;
    const query: any = {};

    if (q) {
      const searchString = (q as string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(searchString, 'i');
      
      const orConditions: any[] = [
        { title: regex },
        { caption: regex },
        { location: regex },
        { tags: regex }
      ];

      const matchedUsers = await User.find({ username: regex }).select('_id');
      if (matchedUsers.length > 0) {
        orConditions.push({ creator: { $in: matchedUsers.map(u => u._id) } });
      }

      query.$or = orConditions;
    }

    if (location) {
      query.location = new RegExp(location as string, 'i');
    }

    if (tag) {
      query.tags = tag;
    }

    if (type && ['image', 'video'].includes(type as string)) {
      query.mediaType = type;
    }

    if (username) {
      const user = await User.findOne({ username: username as string });
      if (user) {
        query.creator = user._id;
      } else {
        return res.json({
          posts: [],
          page,
          totalPages: 0,
          totalPosts: 0,
        });
      }
    }

    const [posts, totalPosts] = await Promise.all([
      Post.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('creator'),
      Post.countDocuments(query),
    ]);

    const currentUserId = req.auth?.userId;
    const formattedPosts = await Promise.all(
      posts.map(post => post.toClientFormat(currentUserId))
    );

    const response: FeedResponse = {
      posts: formattedPosts,
      page,
      totalPages: Math.ceil(totalPosts / limit),
      totalPosts,
    };

    res.json(response);
  } catch (error) {
    console.error('Feed fetch failed:', error);
    throw error;
  }
});

interface SuggestionsResponse {
  tags: string[];
  locations: string[];
}

router.get('/search/suggestions', async (req: Request, res: Response) => {
  try {
    const cacheKey = 'search:suggestions';
    const cached = cacheService.get<SuggestionsResponse>(cacheKey);

    if (cached) {
      return res.json(cached);
    }

    const [tagsResult, locationsResult] = await Promise.all([
      Post.aggregate([
        { $unwind: '$tags' },
        { $group: { _id: '$tags' } },
        { $sort: { _id: 1 } },
        { $limit: 100 },
      ]),
      Post.aggregate([
        { $match: { location: { $exists: true, $ne: null } } },
        { $group: { _id: '$location' } },
        { $sort: { _id: 1 } },
        { $limit: 100 },
      ]),
    ]);

    const response: SuggestionsResponse = {
      tags: tagsResult.map(item => item._id),
      locations: locationsResult.map(item => item._id),
    };

    cacheService.set(cacheKey, response, config.cache.suggestionsTtl);

    res.json(response);
  } catch (error) {
    console.error('Suggestions fetch failed:', error);
    throw error;
  }
});

export default router;
