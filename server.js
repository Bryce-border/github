const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'travel-website-secret-key-2024';

// 创建数据库连接池
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'travel_website',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}).promise();

// 创建上传目录
const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('📁 创建上传目录:', uploadDir);
}

// 配置 multer 用于文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'image-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: function (req, file, cb) {
    const allowedMimeTypes = [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (file.mimetype.startsWith('image/') || allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型。只支持图片和Word文档。'), false);
    }
  }
});

// 增强的 CORS 配置
app.use(cors({
  origin: ['http://localhost:8080', 'http://127.0.0.1:8080', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 静态文件服务 - 提供上传的图片访问
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// 请求日志中间件
app.use((req, res, next) => {
  console.log(`📨 ${new Date().toISOString()} ${req.method} ${req.url}`);
  if (req.method === 'POST' || req.method === 'PUT') {
    if (req.url === '/api/upload') {
      console.log('📦 文件上传请求');
    } else {
      console.log('📦 请求体:', req.body);
    }
  }
  next();
});

app.use(express.json());

// 检查并添加缺失的表字段
async function checkAndAddColumns() {
  try {
    // 检查 parent_id 字段是否存在
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'comments' AND COLUMN_NAME = 'parent_id'
    `);
    
    if (columns.length === 0) {
      console.log('添加 parent_id 字段到 comments 表...');
      await pool.query('ALTER TABLE comments ADD COLUMN parent_id INT DEFAULT NULL');
      console.log('✅ parent_id 字段添加成功');
    }
    
    // 检查 likes 字段是否存在
    const [likesColumn] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'comments' AND COLUMN_NAME = 'likes'
    `);
    
    if (likesColumn.length === 0) {
      console.log('添加 likes 字段到 comments 表...');
      await pool.query('ALTER TABLE comments ADD COLUMN likes INT DEFAULT 0');
      console.log('✅ likes 字段添加成功');
    }
    
    // 检查 favorites 字段是否存在
    const [favoritesColumn] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'guides' AND COLUMN_NAME = 'favorites'
    `);
    
    if (favoritesColumn.length === 0) {
      console.log('添加 favorites 字段到 guides 表...');
      await pool.query('ALTER TABLE guides ADD COLUMN favorites INT DEFAULT 0');
      console.log('✅ favorites 字段添加成功');
    }
    
  } catch (error) {
    console.error('检查表字段失败:', error);
  }
}

// 初始化数据库表
async function initDatabase() {
  try {
    console.log('开始初始化数据库...');
    
    // 创建用户表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        avatar VARCHAR(255) DEFAULT '/images/f.jpg',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('用户表创建成功');

    // 创建攻略表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS guides (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        content TEXT NOT NULL,
        region ENUM('日本', '中国') NOT NULL,
        location VARCHAR(100) NOT NULL,
        image_url VARCHAR(255) DEFAULT '/images/f.jpg',
        user_id INT NOT NULL,
        views INT DEFAULT 0,
        likes INT DEFAULT 0,
        favorites INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('攻略表创建成功');

    // 创建点赞表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS guide_likes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        guide_id INT NOT NULL,
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_like (guide_id, user_id)
      )
    `);
    console.log('点赞表创建成功');

    // 创建关注表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_follows (
        id INT AUTO_INCREMENT PRIMARY KEY,
        follower_id INT NOT NULL,
        following_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_follow (follower_id, following_id),
        FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('关注表创建成功');

    // 创建收藏表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS guide_favorites (
        id INT AUTO_INCREMENT PRIMARY KEY,
        guide_id INT NOT NULL,
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_favorite (guide_id, user_id)
      )
    `);
    console.log('收藏表创建成功');

    // 创建评论表 - 支持多级回复
    await pool.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        content TEXT NOT NULL,
        user_id INT NOT NULL,
        guide_id INT NOT NULL,
        parent_id INT DEFAULT NULL,
        likes INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('评论表创建成功（支持多级回复）');

    // 创建评论点赞表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS comment_likes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        comment_id INT NOT NULL,
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_comment_like (comment_id, user_id)
      )
    `);
    console.log('评论点赞表创建成功');

    // 检查并添加缺失的字段
    await checkAndAddColumns();

    // 检查是否有用户数据，如果没有则创建测试用户
    const [users] = await pool.query('SELECT COUNT(*) as count FROM users');
    if (users[0].count === 0) {
      const hashedPassword = await bcrypt.hash('123456', 10);
      await pool.query(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        ['testuser', 'test@example.com', hashedPassword]
      );
      console.log('测试用户创建成功: test@example.com / 123456');
    }

    // 检查是否有攻略数据，如果没有则创建测试攻略
    const [guides] = await pool.query('SELECT COUNT(*) as count FROM guides');
    if (guides[0].count === 0) {
      await pool.query(`
        INSERT INTO guides (title, content, region, location, image_url, user_id, views, likes, favorites) VALUES 
        ('日本东京旅行攻略', '东京是一个充满活力的现代化都市，融合了传统与现代文化。推荐景点：\n\n1. 浅草寺 - 东京最古老的寺庙\n2. 东京塔 - 城市地标建筑\n3. 秋叶原 - 动漫和电子产品天堂\n4. 涩谷十字路口 - 感受东京的繁忙\n5. 皇居外苑 - 体验日本皇室文化\n\n美食推荐：寿司、拉面、天妇罗、章鱼烧', '日本', '东京', '/images/banner1.jpg', 1, 150, 25, 12),
        ('中国北京长城之旅', '北京长城是世界文化遗产，中国的象征之一。旅行建议：\n\n1. 八达岭长城 - 最著名的段落，设施完善\n2. 慕田峪长城 - 风景优美，游客相对较少\n3. 建议早上7点前到达避免人流高峰\n4. 穿着舒适的鞋子，准备充足的水\n5. 春秋季是最佳游览时间\n\n周边景点：明十三陵、古北水镇', '中国', '北京', '/images/banner2.jpg', 1, 200, 30, 18),
        ('日本京都文化体验', '京都是日本的古都，保留了大量历史建筑和文化传统。\n\n必游景点：\n1. 伏见稻荷大社 - 千本鸟居\n2. 金阁寺 - 金光闪闪的寺庙\n3. 清水寺 - 京都最古老的寺庙\n4. 岚山竹林 - 宁静的竹林小径\n5. 祇园 - 体验传统艺伎文化\n\n特色体验：和服体验、茶道、怀石料理', '日本', '京都', '/images/banner3.jpg', 1, 120, 18, 8),
        ('中国桂林山水风光', '桂林山水甲天下，以喀斯特地貌闻名于世。\n\n推荐行程：\n1. 漓江游船 - 欣赏山水画卷\n2. 阳朔西街 - 感受异国情调\n3. 象鼻山 - 桂林城徽\n4. 龙脊梯田 - 壮观的梯田景观\n5. 银子岩 - 神奇的溶洞景观\n\n美食：桂林米粉、啤酒鱼、荔浦芋头', '中国', '桂林', '/images/banner4.jpg', 1, 180, 22, 15)
      `);
      console.log('测试攻略数据创建成功');
    }

    // 检查是否有评论数据，如果没有则创建测试评论
    const [comments] = await pool.query('SELECT COUNT(*) as count FROM comments');
    if (comments[0].count === 0) {
      await pool.query(`
        INSERT INTO comments (content, user_id, guide_id, parent_id, likes) VALUES 
        ('这篇攻略太详细了！正好计划去东京，非常实用！', 1, 1, NULL, 5),
        ('请问东京的交通卡在哪里购买比较方便？', 1, 1, NULL, 2),
        ('可以在机场或者地铁站的售票机购买Suica卡，很方便的', 1, 1, 2, 3),
        ('长城真的很壮观，建议早点去避开人流', 1, 2, NULL, 4),
        ('京都的和服体验确实很棒，推荐冈本织物', 1, 3, NULL, 3),
        ('漓江的风景真的太美了，一定要坐竹筏', 1, 4, NULL, 2)
      `);
      console.log('测试评论数据创建成功');
    }

    // 在 users 表中添加粉丝数和关注数字段
    const [fansColumn] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'fans_count'
    `);
    
    if (fansColumn.length === 0) {
      console.log('添加粉丝数和关注数字段到 users 表...');
      await pool.query('ALTER TABLE users ADD COLUMN fans_count INT DEFAULT 0');
      await pool.query('ALTER TABLE users ADD COLUMN following_count INT DEFAULT 0');
      console.log('✅ 粉丝数和关注数字段添加成功');
    }

    console.log('数据库初始化完成');
  } catch (error) {
    console.error('数据库初始化失败:', error);
    console.error('错误详情:', error.message);
  }
}

// JWT验证中间件
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '访问令牌不存在' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: '令牌无效' });
    }
    req.user = user;
    next();
  });
}

// 获取攻略点赞数量
async function getGuideLikesCount(guideId) {
  const [result] = await pool.query(
    'SELECT likes FROM guides WHERE id = ?',
    [guideId]
  );
  return result[0]?.likes || 0;
}

// 获取攻略收藏数量
async function getGuideFavoritesCount(guideId) {
  const [result] = await pool.query(
    'SELECT favorites FROM guides WHERE id = ?',
    [guideId]
  );
  return result[0]?.favorites || 0;
}

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: '服务器运行正常',
    timestamp: new Date().toISOString(),
    uploadDir: uploadDir
  });
});

// 服务器信息
app.get('/', (req, res) => {
  res.json({
    message: '旅行攻略后端服务器',
    version: '1.0.0',
    endpoints: {
      auth: ['POST /api/register', 'POST /api/login'],
      guides: ['GET /api/guides', 'GET /api/guides/:id', 'POST /api/guides'],
      user: ['GET /api/user/guides', 'PUT /api/user/avatar', 'GET /api/user/likes', 'GET /api/user/favorites'],
      comments: ['POST /api/guides/:id/comments', 'GET /api/comments/:id/replies', 'DELETE /api/comments/:id'],
      upload: ['POST /api/upload'],
      likes: ['GET /api/guides/:id/like-status', 'POST /api/guides/:id/like'],
      favorites: ['GET /api/guides/:id/favorite-status', 'POST /api/guides/:id/favorite']
    }
  });
});

// ============ 点赞功能 API ============

// 获取用户点赞的攻略列表
app.get('/api/user/likes', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20 } = req.query;
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const offsetNum = (pageNum - 1) * limitNum;

    console.log('❤️ 获取用户点赞列表:', { userId, page: pageNum, limit: limitNum });

    // 获取点赞的攻略
    const [likes] = await pool.query(
      `SELECT g.*, u.username, u.avatar 
       FROM guides g 
       INNER JOIN guide_likes gl ON g.id = gl.guide_id 
       LEFT JOIN users u ON g.user_id = u.id 
       WHERE gl.user_id = ? 
       ORDER BY gl.created_at DESC 
       LIMIT ? OFFSET ?`,
      [userId, limitNum, offsetNum]
    );

    // 获取总数
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM guide_likes WHERE user_id = ?',
      [userId]
    );

    const total = countResult[0].total;

    console.log('✅ 获取用户点赞列表成功:', { userId, count: likes.length, total });

    res.json({
      guides: likes,
      total: total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    console.error('❌ 获取用户点赞列表失败:', error);
    res.status(500).json({ error: '获取用户点赞列表失败', details: error.message });
  }
});

// 获取用户关注的作者列表
app.get('/api/user/following', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 100 } = req.query;
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 100;
    const offsetNum = (pageNum - 1) * limitNum;

    console.log('👤 获取用户关注列表:', { userId, page: pageNum, limit: limitNum });

    // 获取关注的用户
    const [following] = await pool.query(
      `SELECT uf.following_id as user_id, u.username, u.avatar 
       FROM user_follows uf 
       LEFT JOIN users u ON uf.following_id = u.id 
       WHERE uf.follower_id = ? 
       ORDER BY uf.created_at DESC 
       LIMIT ? OFFSET ?`,
      [userId, limitNum, offsetNum]
    );

    // 获取总数
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM user_follows WHERE follower_id = ?',
      [userId]
    );

    const total = countResult[0].total;

    console.log('✅ 获取用户关注列表成功:', { userId, count: following.length, total });

    res.json({
      following: following,
      total: total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    console.error('❌ 获取用户关注列表失败:', error);
    res.status(500).json({ error: '获取用户关注列表失败', details: error.message });
  }
});

// 获取攻略点赞状态
app.get('/api/guides/:id/like-status', authenticateToken, async (req, res) => {
  try {
    const guideId = req.params.id;
    const userId = req.user.userId;

    console.log('❤️ 获取点赞状态:', { guideId, userId });

    // 检查用户是否已经点赞
    const [likes] = await pool.query(
      'SELECT id FROM guide_likes WHERE guide_id = ? AND user_id = ?',
      [guideId, userId]
    );

    const liked = likes.length > 0;
    
    console.log('✅ 点赞状态获取成功:', { guideId, userId, liked });

    res.json({
      liked: liked
    });
  } catch (error) {
    console.error('❌ 获取点赞状态失败:', error);
    res.status(500).json({ error: '获取点赞状态失败', details: error.message });
  }
});

// 点赞/取消点赞
app.post('/api/guides/:id/like', authenticateToken, async (req, res) => {
  try {
    const guideId = req.params.id;
    const userId = req.user.userId;

    console.log('❤️ 点赞操作:', { guideId, userId });

    // 检查是否已经点赞
    const [existingLikes] = await pool.query(
      'SELECT id FROM guide_likes WHERE guide_id = ? AND user_id = ?',
      [guideId, userId]
    );

    if (existingLikes.length > 0) {
      // 取消点赞
      await pool.query(
        'DELETE FROM guide_likes WHERE guide_id = ? AND user_id = ?',
        [guideId, userId]
      );
      
      // 更新攻略表的点赞数
      await pool.query(
        'UPDATE guides SET likes = GREATEST(0, likes - 1) WHERE id = ?',
        [guideId]
      );

      const [guide] = await pool.query('SELECT likes FROM guides WHERE id = ?', [guideId]);
      const likesCount = guide[0]?.likes || 0;
      
      console.log('✅ 取消点赞成功:', { guideId, userId, likes: likesCount });

      res.json({
        message: '取消点赞成功',
        liked: false,
        likes: likesCount
      });
    } else {
      // 添加点赞
      await pool.query(
        'INSERT INTO guide_likes (guide_id, user_id) VALUES (?, ?)',
        [guideId, userId]
      );
      
      // 更新攻略表的点赞数
      await pool.query(
        'UPDATE guides SET likes = likes + 1 WHERE id = ?',
        [guideId]
      );

      const [guide] = await pool.query('SELECT likes FROM guides WHERE id = ?', [guideId]);
      const likesCount = guide[0]?.likes || 0;
      
      console.log('✅ 点赞成功:', { guideId, userId, likes: likesCount });

      res.json({
        message: '点赞成功',
        liked: true,
        likes: likesCount
      });
    }
  } catch (error) {
    console.error('❌ 点赞操作失败:', error);
    res.status(500).json({ error: '点赞操作失败', details: error.message });
  }
});

// ============ 收藏功能 API ============

// 获取用户收藏的攻略列表
app.get('/api/user/favorites', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20 } = req.query;
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const offsetNum = (pageNum - 1) * limitNum;

    console.log('⭐ 获取用户收藏列表:', { userId, page: pageNum, limit: limitNum });

    // 获取收藏的攻略
    const [favorites] = await pool.query(
      `SELECT g.*, u.username, u.avatar 
       FROM guides g 
       INNER JOIN guide_favorites gf ON g.id = gf.guide_id 
       LEFT JOIN users u ON g.user_id = u.id 
       WHERE gf.user_id = ? 
       ORDER BY gf.created_at DESC 
       LIMIT ? OFFSET ?`,
      [userId, limitNum, offsetNum]
    );

    // 获取总数
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM guide_favorites WHERE user_id = ?',
      [userId]
    );

    const total = countResult[0].total;

    console.log('✅ 获取用户收藏列表成功:', { userId, count: favorites.length, total });

    res.json({
      guides: favorites,
      total: total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    console.error('❌ 获取用户收藏列表失败:', error);
    res.status(500).json({ error: '获取用户收藏列表失败', details: error.message });
  }
});

// 获取攻略收藏状态
app.get('/api/guides/:id/favorite-status', authenticateToken, async (req, res) => {
  try {
    const guideId = req.params.id;
    const userId = req.user.userId;

    console.log('⭐ 获取收藏状态:', { guideId, userId });

    // 检查用户是否已经收藏
    const [favorites] = await pool.query(
      'SELECT id FROM guide_favorites WHERE guide_id = ? AND user_id = ?',
      [guideId, userId]
    );

    const favorited = favorites.length > 0;
    
    console.log('✅ 收藏状态获取成功:', { guideId, userId, favorited });

    res.json({
      favorited: favorited
    });
  } catch (error) {
    console.error('❌ 获取收藏状态失败:', error);
    res.status(500).json({ error: '获取收藏状态失败', details: error.message });
  }
});

// 收藏/取消收藏
app.post('/api/guides/:id/favorite', authenticateToken, async (req, res) => {
  try {
    const guideId = req.params.id;
    const userId = req.user.userId;

    console.log('⭐ 收藏操作:', { guideId, userId });

    // 检查是否已经收藏
    const [existingFavorites] = await pool.query(
      'SELECT id FROM guide_favorites WHERE guide_id = ? AND user_id = ?',
      [guideId, userId]
    );

    if (existingFavorites.length > 0) {
      // 取消收藏
      await pool.query(
        'DELETE FROM guide_favorites WHERE guide_id = ? AND user_id = ?',
        [guideId, userId]
      );
      
      // 更新攻略表的收藏数
      await pool.query(
        'UPDATE guides SET favorites = GREATEST(0, favorites - 1) WHERE id = ?',
        [guideId]
      );

      const [guide] = await pool.query('SELECT favorites FROM guides WHERE id = ?', [guideId]);
      const favoritesCount = guide[0]?.favorites || 0;
      
      console.log('✅ 取消收藏成功:', { guideId, userId, favorites: favoritesCount });

      res.json({
        message: '取消收藏成功',
        favorited: false,
        favorites: favoritesCount
      });
    } else {
      // 添加收藏
      await pool.query(
        'INSERT INTO guide_favorites (guide_id, user_id) VALUES (?, ?)',
        [guideId, userId]
      );
      
      // 更新攻略表的收藏数
      await pool.query(
        'UPDATE guides SET favorites = favorites + 1 WHERE id = ?',
        [guideId]
      );

      const [guide] = await pool.query('SELECT favorites FROM guides WHERE id = ?', [guideId]);
      const favoritesCount = guide[0]?.favorites || 0;
      
      console.log('✅ 收藏成功:', { guideId, userId, favorites: favoritesCount });

      res.json({
        message: '收藏成功',
        favorited: true,
        favorites: favoritesCount
      });
    }
  } catch (error) {
    console.error('❌ 收藏操作失败:', error);
    res.status(500).json({ error: '收藏操作失败', details: error.message });
  }
});

// ============ 关注功能 API ============

// 获取用户关注状态
app.get('/api/users/:id/follow-status', authenticateToken, async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const followerId = req.user.userId;

    console.log('👤 获取关注状态:', { targetUserId, followerId });

    // 检查是否已关注
    const [follows] = await pool.query(
      'SELECT id FROM user_follows WHERE follower_id = ? AND following_id = ?',
      [followerId, targetUserId]
    );

    const following = follows.length > 0;
    
    console.log('✅ 关注状态获取成功:', { targetUserId, followerId, following });

    res.json({
      following: following
    });
  } catch (error) {
    console.error('❌ 获取关注状态失败:', error);
    res.status(500).json({ error: '获取关注状态失败', details: error.message });
  }
});

// 关注/取消关注用户
app.post('/api/users/:id/follow', authenticateToken, async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const followerId = req.user.userId;

    console.log('👤 关注操作:', { targetUserId, followerId });

    // 不能关注自己
    if (parseInt(targetUserId) === followerId) {
      return res.status(400).json({ error: '不能关注自己' });
    }

    // 检查是否已经关注
    const [existingFollows] = await pool.query(
      'SELECT id FROM user_follows WHERE follower_id = ? AND following_id = ?',
      [followerId, targetUserId]
    );

    if (existingFollows.length > 0) {
      // 取消关注
      await pool.query(
        'DELETE FROM user_follows WHERE follower_id = ? AND following_id = ?',
        [followerId, targetUserId]
      );
      
      // 更新粉丝数和关注数
      await pool.query(
        'UPDATE users SET fans_count = GREATEST(0, fans_count - 1) WHERE id = ?',
        [targetUserId]
      );
      
      await pool.query(
        'UPDATE users SET following_count = GREATEST(0, following_count - 1) WHERE id = ?',
        [followerId]
      );

      const [targetUser] = await pool.query('SELECT fans_count FROM users WHERE id = ?', [targetUserId]);
      const fansCount = targetUser[0]?.fans_count || 0;
      
      console.log('✅ 取消关注成功:', { targetUserId, followerId, fansCount });

      res.json({
        message: '取消关注成功',
        following: false,
        fans_count: fansCount
      });
    } else {
      // 添加关注
      await pool.query(
        'INSERT INTO user_follows (follower_id, following_id) VALUES (?, ?)',
        [followerId, targetUserId]
      );
      
      // 更新粉丝数和关注数
      await pool.query(
        'UPDATE users SET fans_count = fans_count + 1 WHERE id = ?',
        [targetUserId]
      );
      
      await pool.query(
        'UPDATE users SET following_count = following_count + 1 WHERE id = ?',
        [followerId]
      );

      const [targetUser] = await pool.query('SELECT fans_count FROM users WHERE id = ?', [targetUserId]);
      const fansCount = targetUser[0]?.fans_count || 0;
      
      console.log('✅ 关注成功:', { targetUserId, followerId, fansCount });

      res.json({
        message: '关注成功',
        following: true,
        fans_count: fansCount
      });
    }
  } catch (error) {
    console.error('❌ 关注操作失败:', error);
    res.status(500).json({ error: '关注操作失败', details: error.message });
  }
});

// 获取用户粉丝数和关注数
app.get('/api/users/:id/stats', async (req, res) => {
  try {
    const userId = req.params.id;

    console.log('📊 获取用户统计信息:', userId);

    const [users] = await pool.query(
      'SELECT fans_count, following_count FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: '用户未找到' });
    }

    const stats = users[0];
    
    console.log('✅ 获取用户统计信息成功:', { userId, stats });

    res.json({
      fans_count: stats.fans_count || 0,
      following_count: stats.following_count || 0
    });
  } catch (error) {
    console.error('❌ 获取用户统计信息失败:', error);
    res.status(500).json({ error: '获取用户统计信息失败', details: error.message });
  }
});

// 更新头像接口
app.put('/api/user/avatar', async (req, res) => {
  try {
    console.log('📨 收到头像更新请求');
    console.log('🔑 请求头:', req.headers);
    console.log('📦 请求体:', req.body);
    
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { avatar } = req.body;
    
    console.log('🖼️ 接收到的头像数据:', avatar ? `有数据，长度: ${avatar.length}` : '空');
    
    if (!token) {
      console.log('❌ 未提供token');
      return res.status(401).json({ error: '未提供token' });
    }
    
    // 使用正确的 JWT 密钥验证token
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;
    
    console.log('✅ Token验证成功，用户ID:', userId);
    
    // 查找用户
    const [users] = await pool.query(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      console.log('❌ 用户不存在');
      return res.status(404).json({ error: '用户不存在' });
    }
    
    const user = users[0];
    
    // 更新头像到数据库
    console.log('🔄 更新数据库中的头像...');
    await pool.query(
      'UPDATE users SET avatar = ? WHERE id = ?',
      [avatar || '/images/f.jpg', userId]
    );
    
    console.log('✅ 头像更新成功，用户ID:', userId);
    
    res.json({
      message: '头像更新成功',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: avatar || '/images/f.jpg'
      }
    });
  } catch (error) {
    console.error('❌ 头像更新错误:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'token无效' });
    }
    res.status(500).json({ error: '服务器内部错误', details: error.message });
  }
});

// 图片上传接口
app.post('/api/upload', authenticateToken, upload.single('image'), (req, res) => {
  try {
    console.log('📤 收到图片上传请求');
    
    if (!req.file) {
      console.log('❌ 上传失败: 没有文件');
      return res.status(400).json({ error: '请选择要上传的图片' });
    }

    console.log('✅ 文件上传成功:', {
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    // 返回图片访问URL
    const imageUrl = `/uploads/${req.file.filename}`;
    
    res.json({
      message: '图片上传成功',
      imageUrl: imageUrl,
      filename: req.file.filename,
      size: req.file.size
    });
    
  } catch (error) {
    console.error('❌ 图片上传失败:', error);
    res.status(500).json({ error: '图片上传失败', details: error.message });
  }
});

// 用户注册
app.post('/api/register', async (req, res) => {
  try {
    console.log('🔵 收到注册请求:', req.body);
    
    const { username, email, password, avatar } = req.body;

    if (!username || !email || !password) {
      console.log('❌ 注册失败: 缺少必填字段');
      return res.status(400).json({ error: '请填写所有必填字段' });
    }

    // 检查用户是否已存在
    console.log('🔍 检查用户是否已存在...');
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUsers.length > 0) {
      console.log('❌ 注册失败: 用户已存在');
      return res.status(400).json({ error: '用户名或邮箱已存在' });
    }

    // 加密密码
    console.log('🔐 加密密码...');
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    console.log('👤 创建用户...');
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password, avatar) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, avatar || '/images/f.jpg']
    );

    const token = jwt.sign(
      { userId: result.insertId, username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ 注册成功，用户ID:', result.insertId);
    res.status(201).json({
      message: '注册成功',
      token,
      user: {
        id: result.insertId,
        username,
        email,
        avatar: avatar || '/images/f.jpg'
      }
    });
  } catch (error) {
    console.error('❌ 注册失败:', error);
    res.status(500).json({ error: '注册失败', details: error.message });
  }
});

// 用户登录
app.post('/api/login', async (req, res) => {
  try {
    console.log('🔵 收到登录请求:', req.body);
    
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('❌ 登录失败: 缺少邮箱或密码');
      return res.status(400).json({ error: '请填写邮箱和密码' });
    }

    // 查找用户
    console.log('🔍 查找用户...');
    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      console.log('❌ 登录失败: 用户不存在');
      return res.status(400).json({ error: '用户不存在' });
    }

    const user = users[0];

    // 验证密码
    console.log('🔐 验证密码...');
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      console.log('❌ 登录失败: 密码错误');
      return res.status(400).json({ error: '密码错误' });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ 登录成功，用户:', user.username);
    res.json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('❌ 登录失败:', error);
    res.status(500).json({ error: '登录失败', details: error.message });
  }
});

// 获取攻略列表
app.get('/api/guides', async (req, res) => {
  try {
    console.log('收到获取攻略请求:', req.query);
    
    const { region, search, page = 1, limit = 10 } = req.query;
    
    // 确保参数是数字类型
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offsetNum = (pageNum - 1) * limitNum;
    
    // 构建 WHERE 条件
    let whereConditions = [];
    
    if (region) {
      whereConditions.push(`g.region = '${region}'`);
    }

    if (search) {
      const searchParam = `%${search}%`;
      whereConditions.push(`(g.title LIKE '${searchParam}' OR g.content LIKE '${searchParam}' OR g.location LIKE '${searchParam}')`);
    }

    // 构建完整的 SQL 查询
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    const sql = `
      SELECT g.*, u.username, u.avatar 
      FROM guides g 
      LEFT JOIN users u ON g.user_id = u.id 
      ${whereClause}
      ORDER BY g.created_at DESC 
      LIMIT ${limitNum} OFFSET ${offsetNum}
    `;

    console.log('执行SQL:', sql);

    // 使用 query 方法执行
    const [guides] = await pool.query(sql);

    // 构建计数查询
    let countWhereConditions = [];
    
    if (region) {
      countWhereConditions.push(`region = '${region}'`);
    }

    if (search) {
      const searchParam = `%${search}%`;
      countWhereConditions.push(`(title LIKE '${searchParam}' OR content LIKE '${searchParam}' OR location LIKE '${searchParam}')`);
    }

    const countWhereClause = countWhereConditions.length > 0 ? `WHERE ${countWhereConditions.join(' AND ')}` : '';
    const countSql = `SELECT COUNT(*) as total FROM guides ${countWhereClause}`;
    
    const [countResult] = await pool.query(countSql);
    const total = countResult[0].total;

    console.log('查询成功:', {
      guidesCount: guides.length,
      total: total
    });

    res.json({
      guides,
      total: total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    console.error('获取攻略列表失败:', error);
    res.status(500).json({ 
      error: '获取攻略列表失败',
      details: error.message 
    });
  }
});

// 获取攻略详情
app.get('/api/guides/:id', async (req, res) => {
  try {
    const guideId = req.params.id;
    console.log('获取攻略详情:', guideId);

    // 更新浏览量
    await pool.query(
      'UPDATE guides SET views = views + 1 WHERE id = ?',
      [guideId]
    );

    const [guides] = await pool.query(
      `SELECT g.*, u.username, u.avatar 
       FROM guides g 
       LEFT JOIN users u ON g.user_id = u.id 
       WHERE g.id = ?`,
      [guideId]
    );

    if (guides.length === 0) {
      return res.status(404).json({ error: '攻略未找到' });
    }

    // 只获取顶级评论（parent_id 为 NULL）
    const [comments] = await pool.query(
      `SELECT c.*, u.username, u.avatar 
       FROM comments c 
       LEFT JOIN users u ON c.user_id = u.id 
       WHERE c.guide_id = ? AND c.parent_id IS NULL
       ORDER BY c.created_at DESC`,
      [guideId]
    );

    // 为每个顶级评论获取回复数量
    for (let comment of comments) {
      const [replyCount] = await pool.query(
        'SELECT COUNT(*) as count FROM comments WHERE parent_id = ?',
        [comment.id]
      );
      comment.replyCount = replyCount[0].count;
    }

    res.json({
      guide: guides[0],
      comments
    });
  } catch (error) {
    console.error('获取攻略详情失败:', error);
    res.status(500).json({ error: '获取攻略详情失败', details: error.message });
  }
});

// 发布攻略
app.post('/api/guides', authenticateToken, async (req, res) => {
  try {
    const { title, content, region, location, image_url } = req.body;
    const userId = req.user.userId;

    if (!title || !content || !region || !location) {
      return res.status(400).json({ error: '请填写所有必填字段' });
    }

    const [result] = await pool.query(
      'INSERT INTO guides (title, content, region, location, image_url, user_id) VALUES (?, ?, ?, ?, ?, ?)',
      [title, content, region, location, image_url || '/images/f.jpg', userId]
    );

    res.status(201).json({
      message: '攻略发布成功',
      guide: {
        id: result.insertId,
        title,
        content,
        region,
        location,
        image_url: image_url || '/images/f.jpg',
        user_id: userId
      }
    });
  } catch (error) {
    console.error('发布攻略失败:', error);
    res.status(500).json({ error: '发布攻略失败', details: error.message });
  }
});

// 获取用户发布的攻略
app.get('/api/user/guides', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const [guides] = await pool.query(
      'SELECT * FROM guides WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    res.json(guides);
  } catch (error) {
    console.error('获取用户攻略失败:', error);
    res.status(500).json({ error: '获取用户攻略失败', details: error.message });
  }
});

// 删除攻略
app.delete('/api/guides/:id', authenticateToken, async (req, res) => {
  try {
    const guideId = req.params.id;
    const userId = req.user.userId;

    console.log('🗑️ 删除攻略请求:', { guideId, userId });

    // 检查攻略是否存在且属于当前用户
    const [guides] = await pool.query(
      'SELECT * FROM guides WHERE id = ? AND user_id = ?',
      [guideId, userId]
    );

    if (guides.length === 0) {
      return res.status(404).json({ error: '攻略未找到或无权删除' });
    }

    // 删除相关的点赞记录
    await pool.query('DELETE FROM guide_likes WHERE guide_id = ?', [guideId]);
    
    // 删除相关的收藏记录
    await pool.query('DELETE FROM guide_favorites WHERE guide_id = ?', [guideId]);
    
    // 删除相关的评论记录
    await pool.query('DELETE FROM comments WHERE guide_id = ?', [guideId]);
    
    // 删除攻略
    await pool.query('DELETE FROM guides WHERE id = ?', [guideId]);
    
    console.log('✅ 攻略删除成功');

    res.json({
      message: '攻略删除成功',
      deletedId: guideId
    });
  } catch (error) {
    console.error('❌ 删除攻略失败:', error);
    res.status(500).json({ error: '删除攻略失败', details: error.message });
  }
});

// ============ 多级评论系统 API ============

// 添加评论（支持多级回复）
app.post('/api/guides/:id/comments', authenticateToken, async (req, res) => {
  try {
    const guideId = req.params.id;
    const { content, parent_id } = req.body;
    const userId = req.user.userId;

    if (!content || content.trim() === '') {
      return res.status(400).json({ error: '评论内容不能为空' });
    }

    console.log('💬 添加评论:', { guideId, userId, parent_id, content });

    // 如果有 parent_id，检查父评论是否存在且属于同一攻略
    if (parent_id) {
      const [parentComments] = await pool.query(
        'SELECT guide_id FROM comments WHERE id = ?',
        [parent_id]
      );
      
      if (parentComments.length === 0) {
        return res.status(404).json({ error: '父评论不存在' });
      }
      
      if (parentComments[0].guide_id !== parseInt(guideId)) {
        return res.status(400).json({ error: '评论与攻略不匹配' });
      }
    }

    // 插入评论
    const [result] = await pool.query(
      'INSERT INTO comments (content, user_id, guide_id, parent_id) VALUES (?, ?, ?, ?)',
      [content.trim(), userId, guideId, parent_id || null]
    );

    // 获取新创建的评论详情（包含用户信息）
    const [newComments] = await pool.query(
      `SELECT c.*, u.username, u.avatar 
       FROM comments c 
       LEFT JOIN users u ON c.user_id = u.id 
       WHERE c.id = ?`,
      [result.insertId]
    );

    const newComment = newComments[0];

    // 如果是回复，获取被回复用户的用户名
    if (parent_id) {
      const [parentComments] = await pool.query(
        'SELECT u.username FROM comments c LEFT JOIN users u ON c.user_id = u.id WHERE c.id = ?',
        [parent_id]
      );
      newComment.parent_username = parentComments[0]?.username;
    }

    console.log('✅ 评论添加成功:', newComment.id);

    res.status(201).json({
      message: parent_id ? '回复成功' : '评论成功',
      comment: newComment
    });
  } catch (error) {
    console.error('❌ 添加评论失败:', error);
    res.status(500).json({ error: '添加评论失败', details: error.message });
  }
});

// 获取评论回复数量
app.get('/api/comments/:id/reply-count', async (req, res) => {
  try {
    const commentId = req.params.id;

    console.log('💬 获取评论回复数量:', commentId);

    const [result] = await pool.query(
      'SELECT COUNT(*) as count FROM comments WHERE parent_id = ?',
      [commentId]
    );

    const count = result[0].count;

    console.log('✅ 获取回复数量成功:', { commentId, count });

    res.json({
      count: count
    });
  } catch (error) {
    console.error('❌ 获取评论回复数量失败:', error);
    res.status(500).json({ error: '获取评论回复数量失败', details: error.message });
  }
});

// 获取评论回复
app.get('/api/comments/:id/replies', async (req, res) => {
  try {
    const parentId = req.params.id;

    console.log('💬 获取评论回复:', parentId);

    const [replies] = await pool.query(
      `SELECT c.*, u.username, u.avatar, 
              (SELECT u2.username FROM comments c2 
               LEFT JOIN users u2 ON c2.user_id = u2.id 
               WHERE c2.id = c.parent_id) as parent_username
       FROM comments c 
       LEFT JOIN users u ON c.user_id = u.id 
       WHERE c.parent_id = ? 
       ORDER BY c.created_at ASC`,
      [parentId]
    );

    console.log('✅ 获取回复成功:', { parentId, count: replies.length });

    res.json({
      replies: replies,
      count: replies.length
    });
  } catch (error) {
    console.error('❌ 获取评论回复失败:', error);
    res.status(500).json({ error: '获取评论回复失败', details: error.message });
  }
});

// 删除评论
app.delete('/api/comments/:id', authenticateToken, async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.user.userId;

    console.log('🗑️ 删除评论请求:', { commentId, userId });

    // 检查评论是否存在且属于当前用户
    const [comments] = await pool.query(
      'SELECT * FROM comments WHERE id = ? AND user_id = ?',
      [commentId, userId]
    );

    if (comments.length === 0) {
      return res.status(404).json({ error: '评论未找到或无权删除' });
    }

    // 删除相关的点赞记录
    await pool.query('DELETE FROM comment_likes WHERE comment_id = ?', [commentId]);
    
    // 删除评论（级联删除会自动删除子回复）
    await pool.query('DELETE FROM comments WHERE id = ?', [commentId]);
    
    console.log('✅ 评论删除成功');

    res.json({
      message: '评论删除成功',
      deletedId: commentId
    });
  } catch (error) {
    console.error('❌ 删除评论失败:', error);
    res.status(500).json({ error: '删除评论失败', details: error.message });
  }
});

// 获取评论点赞状态
app.get('/api/comments/:id/like-status', authenticateToken, async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.user.userId;

    const [likes] = await pool.query(
      'SELECT id FROM comment_likes WHERE comment_id = ? AND user_id = ?',
      [commentId, userId]
    );

    res.json({
      liked: likes.length > 0
    });
  } catch (error) {
    console.error('获取评论点赞状态失败:', error);
    res.status(500).json({ error: '获取评论点赞状态失败', details: error.message });
  }
});

// 评论点赞/取消点赞
app.post('/api/comments/:id/like', authenticateToken, async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.user.userId;

    console.log('❤️ 评论点赞操作:', { commentId, userId });

    // 检查是否已经点赞
    const [existingLikes] = await pool.query(
      'SELECT id FROM comment_likes WHERE comment_id = ? AND user_id = ?',
      [commentId, userId]
    );

    if (existingLikes.length > 0) {
      // 取消点赞
      await pool.query(
        'DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?',
        [commentId, userId]
      );
      
      await pool.query(
        'UPDATE comments SET likes = GREATEST(0, likes - 1) WHERE id = ?',
        [commentId]
      );

      const [comment] = await pool.query('SELECT likes FROM comments WHERE id = ?', [commentId]);
      
      console.log('✅ 评论取消点赞成功');

      res.json({
        message: '取消点赞成功',
        liked: false,
        likes: comment[0].likes
      });
    } else {
      // 添加点赞
      await pool.query(
        'INSERT INTO comment_likes (comment_id, user_id) VALUES (?, ?)',
        [commentId, userId]
      );
      
      await pool.query(
        'UPDATE comments SET likes = likes + 1 WHERE id = ?',
        [commentId]
      );

      const [comment] = await pool.query('SELECT likes FROM comments WHERE id = ?', [commentId]);
      
      console.log('✅ 评论点赞成功');

      res.json({
        message: '点赞成功',
        liked: true,
        likes: comment[0].likes
      });
    }
  } catch (error) {
    console.error('❌ 评论点赞操作失败:', error);
    res.status(500).json({ error: '评论点赞操作失败', details: error.message });
  }
});

// 获取用户信息
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const [users] = await pool.query(
      'SELECT id, username, email, avatar, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: '用户未找到' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({ error: '获取用户信息失败', details: error.message });
  }
});

// Multer 错误处理中间件
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: '文件太大，请选择小于5MB的图片' });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: '文件字段名不正确' });
    }
  }
  next(error);
});

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

// 全局错误处理
app.use((error, req, res, next) => {
  console.error('全局错误:', error);
  res.status(500).json({ error: '服务器内部错误', details: error.message });
});

// 启动服务器
app.listen(PORT, async () => {
  console.log('🚀 =================================');
  console.log('🌍 旅行攻略后端服务器启动成功');
  console.log(`📡 服务器运行在: http://localhost:${PORT}`);
  console.log(`🔍 健康检查: http://localhost:${PORT}/api/health`);
  console.log(`📤 图片上传: POST http://localhost:${PORT}/api/upload`);
  console.log(`❤️  点赞功能: GET/POST http://localhost:${PORT}/api/guides/:id/like`);
  console.log(`⭐ 收藏功能: GET/POST http://localhost:${PORT}/api/guides/:id/favorite`);
  console.log(`📚 用户点赞: GET http://localhost:${PORT}/api/user/likes`);
  console.log(`📚 用户收藏: GET http://localhost:${PORT}/api/user/favorites`);
  console.log(`🖼️ 头像更新: PUT http://localhost:${PORT}/api/user/avatar`);
  console.log(`💬 评论系统: 支持多级回复`);
  console.log('📝 测试账号: test@example.com / 123456');
  console.log('🚀 =================================');
  
  await initDatabase();
});

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('\n正在关闭服务器...');
  process.exit(0);
});