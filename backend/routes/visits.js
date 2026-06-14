const router = require('express').Router();
const Visit = require('../models/Visit');
const authMiddleware = require('../middleware/auth');

// All routes require auth
router.use(authMiddleware);

// POST /api/visits — log a visit (called by extension)
router.post('/', async (req, res) => {
  try {
    const { url, title, favicon, duration } = req.body;
    if (!url) return res.status(400).json({ message: 'URL required' });

    const domain = new URL(url).hostname.replace('www.', '');
    const visit = await Visit.create({
      user: req.userId, url, domain,
      title: title || '',
      favicon: favicon || '',
      duration: duration || 0,
    });
    res.status(201).json(visit);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/visits — paginated history
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, date } = req.query;
    const filter = { user: req.userId };

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.visitedAt = { $gte: start, $lte: end };
    }

    const visits = await Visit.find(filter)
      .sort({ visitedAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Visit.countDocuments(filter);
    res.json({ visits, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/visits/stats — summary stats
router.get('/stats', async (req, res) => {
  try {
    const userId = req.userId;

    // Today boundaries
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Last 7 days
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [todayCount, weekCount, topDomains, dailyActivity] = await Promise.all([
      Visit.countDocuments({ user: userId, visitedAt: { $gte: todayStart, $lte: todayEnd } }),

      Visit.countDocuments({ user: userId, visitedAt: { $gte: weekAgo } }),

      Visit.aggregate([
        { $match: { user: userId, visitedAt: { $gte: weekAgo } } },
        { $group: { _id: '$domain', count: { $sum: 1 }, favicon: { $first: '$favicon' } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),

      Visit.aggregate([
        { $match: { user: userId, visitedAt: { $gte: weekAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$visitedAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    res.json({ todayCount, weekCount, topDomains, dailyActivity });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/visits/:id
router.delete('/:id', async (req, res) => {
  try {
    const visit = await Visit.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!visit) return res.status(404).json({ message: 'Visit not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
