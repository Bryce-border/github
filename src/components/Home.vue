<template>
  <div class="home">
    <!-- 轮播图区域 -->
    <section class="banner-section">
      <div class="carousel">
        <div class="carousel-inner" :style="{ transform: `translateX(-${currentSlide * 100}%)` }">
          <div 
            v-for="(slide, index) in carouselSlides" 
            :key="index"
            class="carousel-item"
            :class="{ 'active': currentSlide === index }"
          >
            <img 
              :src="slide.image" 
              :alt="slide.title" 
              class="carousel-img"
              @error="handleImageError"
            >
            <div class="carousel-caption">
              <h2>{{ slide.title }}</h2>
              <p>{{ slide.description }}</p>
            </div>
          </div>
        </div>
        
        <!-- 轮播图控制按钮 -->
        <button class="carousel-control prev" @click="prevSlide">‹</button>
        <button class="carousel-control next" @click="nextSlide">›</button>
        
        <!-- 轮播图指示器 -->
        <div class="carousel-indicators">
          <button
            v-for="(slide, index) in carouselSlides"
            :key="index"
            :class="{ 'active': currentSlide === index }"
            @click="goToSlide(index)"
          ></button>
        </div>
      </div>
    </section>

    <!-- 搜索和筛选区域 -->
    <section class="search-section">
      <div class="container">
        <div class="search-box">
          <input 
            type="text" 
            class="search-input" 
            placeholder="搜索目的地、攻略..."
            v-model="searchKeyword"
            @keyup.enter="searchGuides"
          >
          <button class="btn btn-primary search-btn" @click="searchGuides">
            🔍 搜索
          </button>
        </div>
        
        <div class="filter-section">
          <div class="filter-group">
            <label>地区筛选:</label>
            <select v-model="selectedRegion" @change="filterGuides" class="form-control">
              <option value="">全部地区</option>
              <option value="日本">日本</option>
              <option value="中国">中国</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label>排序方式:</label>
            <select v-model="sortBy" @change="filterGuides" class="form-control">
              <option value="newest">最新发布</option>
              <option value="popular">最受欢迎</option>
              <option value="views">最多浏览</option>
            </select>
          </div>
        </div>
      </div>
    </section>

    <!-- 攻略列表区域 -->
    <section class="guides-section">
      <div class="container">
        <h2 class="section-title">旅行攻略</h2>
        
        <div v-if="loading" class="loading">
          <div class="spinner"></div>
          <p>加载中...</p>
        </div>
        
        <div v-else-if="error" class="error">
          {{ error }}
        </div>
        
        <div v-else-if="!guides || guides.length === 0" class="no-data">
          <div class="empty-state">
            <div class="empty-icon">📝</div>
            <h3>暂无攻略数据</h3>
            <p>成为第一个分享旅行攻略的人吧！</p>
          </div>
        </div>
        
        <div v-else class="guides-grid">
          <div 
            v-for="guide in guides" 
            :key="guide.id" 
            class="guide-card"
            :class="getCardAnimationClass(guide)"
          >
            <!-- 图片容器 - 优化版 -->
            <div class="card-image-container">
              <div class="image-wrapper">
                <img 
                  :src="getGuideImage(guide)" 
                  :alt="guide.title" 
                  :class="['card-img', getImageClass(guide)]"
                  @load="handleImageLoad(guide)"
                  @error="handleImageError"
                  @click="viewGuideDetail(guide.id)"
                />
                <!-- 图片加载状态 -->
                <div v-if="guide.imageLoading" class="image-loading">
                  <div class="loading-spinner"></div>
                </div>
                <!-- 图片错误状态 -->
                <div v-else-if="guide.imageError" class="image-error">
                  <span>🖼️</span>
                  <p>图片加载失败</p>
                </div>
              </div>
              
              <!-- 图片悬停效果层 -->
              <div class="image-overlay">
                <div class="overlay-content">
                  <button class="btn-overlay" @click="viewGuideDetail(guide.id)">
                    <span class="btn-icon">👁️</span>
                    <span class="btn-text">查看详情</span>
                  </button>
                  <div class="quick-actions">
                    <button 
                      class="quick-btn like-quick"
                      :class="{ 'liked': guide.liked }"
                      @click.stop="toggleLike(guide)"
                      :disabled="guide.likeLoading"
                    >
                      ❤️
                    </button>
                    <button 
                      class="quick-btn favorite-quick"
                      :class="{ 'favorited': guide.favorited }"
                      @click.stop="toggleFavorite(guide)"
                      :disabled="guide.favoriteLoading"
                    >
                      ⭐
                    </button>
                  </div>
                </div>
              </div>
              
              <!-- 图片类型指示器 -->
              <div v-if="guide.imageInfo && !guide.imageLoading && !guide.imageError" class="image-info">
                <span class="image-type">{{ guide.imageInfo.type }}</span>
                <span class="image-dimensions">{{ guide.imageInfo.dimensions }}</span>
              </div>
            </div>

            <div class="card-body">
              <div class="guide-meta">
                <span class="region-tag" :class="guide.region === '日本' ? 'japan' : 'china'">
                  {{ guide.region || '未知地区' }}
                </span>
                <span class="location">{{ guide.location || '未知地点' }}</span>
              </div>
              <h3 class="card-title" @click="viewGuideDetail(guide.id)">{{ guide.title || '未命名攻略' }}</h3>
              <p class="card-text">{{ getGuideContent(guide) }}</p>
              
              <!-- 统计信息 -->
              <div class="guide-stats">
                <span class="stat-item">
                  <span class="stat-icon">👁️</span>
                  <span class="stat-count">{{ guide.views || 0 }}</span>
                </span>
                <button 
                  class="action-btn like-btn"
                  :class="{ 'liked': guide.liked, 'animating': guide.animating }"
                  @click.stop="toggleLike(guide)"
                  :disabled="guide.likeLoading"
                >
                  <span class="btn-icon">❤️</span>
                  <span class="btn-count">{{ guide.likes || 0 }}</span>
                </button>
                <button 
                  class="action-btn favorite-btn"
                  :class="{ 'favorited': guide.favorited, 'animating': guide.favoriteAnimating }"
                  @click.stop="toggleFavorite(guide)"
                  :disabled="guide.favoriteLoading"
                >
                  <span class="btn-icon">⭐</span>
                  <span class="btn-count">{{ guide.favorites || 0 }}</span>
                </button>
              </div>
              
              <!-- 作者信息 -->
              <div class="author-info">
                <div class="author-avatar-container">
                  <img :src="guide.avatar || '/images/f.jpg'" :alt="guide.username" class="author-avatar">
                </div>
                <div class="author-details">
                  <span class="author-name">{{ guide.username || '匿名用户' }}</span>
                  <div class="author-stats">
                    <span class="fans-count">粉丝: {{ guide.fans_count || 0 }}</span>
                  </div>
                </div>
                <button 
                  v-if="user && user.id !== guide.user_id"
                  class="follow-btn"
                  :class="{ 'following': guide.following, 'loading': guide.followLoading }"
                  @click.stop="toggleFollow(guide)"
                  :disabled="guide.followLoading"
                >
                  {{ guide.followLoading ? '...' : (guide.following ? '已关注' : '关注') }}
                </button>
              </div>
            </div>
            
            <!-- 卡片装饰元素 -->
            <div class="card-decoration">
              <div class="decoration-corner top-left"></div>
              <div class="decoration-corner top-right"></div>
              <div class="decoration-corner bottom-left"></div>
              <div class="decoration-corner bottom-right"></div>
            </div>
          </div>
        </div>

        <!-- 分页控件 -->
        <div v-if="totalPages > 1" class="pagination">
          <button 
            :disabled="currentPage === 1" 
            @click="changePage(currentPage - 1)"
            class="btn btn-pagination"
            :class="{ 'disabled': currentPage === 1 }"
          >
            ← 上一页
          </button>
          <span class="page-info">
            第 {{ currentPage }} 页，共 {{ totalPages }} 页
          </span>
          <button 
            :disabled="currentPage === totalPages" 
            @click="changePage(currentPage + 1)"
            class="btn btn-pagination"
            :class="{ 'disabled': currentPage === totalPages }"
          >
            下一页 →
          </button>
        </div>
      </div>
    </section>
  </div>

<!-- 取消关注确认弹窗 -->
<div v-if="showUnfollowModal" class="modal">
  <div class="modal-content">
    <div class="modal-header">
      <h3>取消关注</h3>
      <button class="close" @click="cancelUnfollow">&times;</button>
    </div>
    <div class="modal-body">
      <p>确定要取消关注 @{{ unfollowGuide?.username }} 吗？</p>
      <div class="modal-actions">
        <button class="btn btn-primary" @click="confirmUnfollow">确定</button>
        <button class="btn btn-secondary" @click="cancelUnfollow">取消</button>
      </div>
    </div>
  </div>
</div>
</template>

<script>
export default {
  name: 'Home',
  inject: ['$api'],
  props: {
    user: Object
  },
  emits: ['login-required', 'favorite-updated'],
  data() {
    return {
      // 轮播图数据
      carouselSlides: [
        {
          image: '/images/banner1.jpg',
          title: '日本富士山',
          description: '春季樱花盛开的富士山，美不胜收'
        },
        {
          image: '/images/banner2.jpg',
          title: '中国长城',
          description: '世界文化遗产，中国的象征'
        },
        {
          image: '/images/banner3.jpg',
          title: '日本京都',
          description: '古都文化，传统与现代的融合'
        },
        {
          image: '/images/banner4.jpg',
          title: '中国桂林',
          description: '山水甲天下，喀斯特地貌奇观'
        }
      ],
      currentSlide: 0,
      autoPlayInterval: null,
      
      // 攻略数据
      guides: [],
      loading: false,
      error: null,
      searchKeyword: '',
      selectedRegion: '',
      sortBy: 'newest',
      currentPage: 1,
      totalPages: 1,
      showUnfollowModal: false,
      unfollowGuide: null
    }
  },
  mounted() {
    this.fetchGuides()
    this.startAutoPlay()
  },
  beforeUnmount() {
    this.stopAutoPlay()
  },
  methods: {
    // 轮播图方法
    nextSlide() {
      this.currentSlide = (this.currentSlide + 1) % this.carouselSlides.length
    },
    
    prevSlide() {
      this.currentSlide = this.currentSlide === 0 ? this.carouselSlides.length - 1 : this.currentSlide - 1
    },
    
    goToSlide(index) {
      this.currentSlide = index
    },
    
    startAutoPlay() {
      this.autoPlayInterval = setInterval(() => {
        this.nextSlide()
      }, 5000)
    },
    
    stopAutoPlay() {
      if (this.autoPlayInterval) {
        clearInterval(this.autoPlayInterval)
        this.autoPlayInterval = null
      }
    },

    // 查看攻略详情
    viewGuideDetail(guideId) {
      console.log('📖 查看攻略详情:', guideId);
      this.$router.push(`/guide/${guideId}`);
    },

    // 获取攻略图片
    getGuideImage(guide) {
      return guide.cover_image_url || guide.image_url || '/images/f.jpg';
    },

    // 获取图片类名
    getImageClass(guide) {
      if (!guide.imageInfo) return 'image-standard';
      
      const ratio = guide.imageInfo.ratio;
      
      if (ratio < 0.7) {
        return 'image-portrait';
      } else if (ratio > 1.5) {
        return 'image-landscape';
      } else if (guide.imageInfo.width < 400) {
        return 'image-small';
      } else {
        return 'image-standard';
      }
    },

    // 处理图片加载
    handleImageLoad(guide) {
      const img = event.target;
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      const ratio = width / height;
      
      guide.imageLoading = false;
      guide.imageError = false;
      guide.imageInfo = {
        width,
        height,
        ratio,
        type: ratio < 0.7 ? '竖版' : ratio > 1.5 ? '宽版' : '方版',
        dimensions: `${width} × ${height}`
      };
    },

    // 获取攻略内容摘要
    getGuideContent(guide) {
      const content = guide.content || '';
      const cleanContent = content.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
      return cleanContent.substring(0, 100) + (cleanContent.length > 100 ? '...' : '');
    },

    // 获取卡片动画类名
    getCardAnimationClass(guide) {
      const index = this.guides.indexOf(guide);
      return `card-${index % 4}`; // 4种不同的动画效果
    },
    
    // 攻略相关方法
    async fetchGuides() {
      this.loading = true
      this.error = null
      
      try {
        const params = new URLSearchParams({
          page: this.currentPage,
          limit: 9
        })
        
        if (this.selectedRegion) {
          params.append('region', this.selectedRegion)
        }
        
        if (this.searchKeyword) {
          params.append('search', this.searchKeyword)
        }
        
        console.log('📡 获取攻略列表，参数:', params.toString());
        const response = await this.$api.get(`/guides?${params}`)
        
        if (response && response.guides) {
          const guidesWithStatus = await Promise.all(
            response.guides.map(async (guide) => {
              try {
                const [likeStatus, favoriteStatus, followStatus, userStats] = await Promise.all([
                  this.getLikeStatus(guide.id),
                  this.getFavoriteStatus(guide.id),
                  this.getFollowStatus(guide.user_id),
                  this.getUserStats(guide.user_id)
                ])
                return {
                  ...guide,
                  liked: likeStatus.liked,
                  likeLoading: false,
                  animating: false,
                  favorited: favoriteStatus.favorited,
                  favoriteLoading: false,
                  favoriteAnimating: false,
                  following: followStatus.following,
                  followLoading: false,
                  fans_count: userStats.fans_count,
                  imageLoading: true,
                  imageError: false,
                  imageInfo: null
                }
              } catch (error) {
                console.error('获取状态失败:', error)
                return {
                  ...guide,
                  liked: false,
                  likeLoading: false,
                  animating: false,
                  favorited: false,
                  favoriteLoading: false,
                  favoriteAnimating: false,
                  following: false,
                  followLoading: false,
                  fans_count: 0,
                  imageLoading: true,
                  imageError: false,
                  imageInfo: null
                }
              }
            })
          )
          
          this.guides = guidesWithStatus
          this.totalPages = response.totalPages || Math.ceil(response.total / 9) || 1
          console.log('✅ 攻略列表加载成功:', this.guides.length, '条数据');
        } else {
          this.guides = []
          this.totalPages = 1
        }
      } catch (error) {
        console.error('❌ 获取攻略列表失败:', error)
        this.error = error.details || error.error || '获取攻略列表失败'
        this.guides = []
      } finally {
        this.loading = false
      }
    },

    // 获取点赞状态
    async getLikeStatus(guideId) {
      if (!this.user) {
        return { liked: false }
      }
      
      try {
        const response = await this.$api.get(`/guides/${guideId}/like-status`)
        return response
      } catch (error) {
        console.error('获取点赞状态失败:', error)
        return { liked: false }
      }
    },

    // 获取收藏状态
    async getFavoriteStatus(guideId) {
      if (!this.user) {
        return { favorited: false }
      }
      
      try {
        const response = await this.$api.get(`/guides/${guideId}/favorite-status`)
        return response
      } catch (error) {
        console.error('获取收藏状态失败:', error)
        return { favorited: false }
      }
    },

    // 点赞/取消点赞
    async toggleLike(guide) {
      if (!this.user) {
        this.$emit('login-required')
        return
      }

      guide.likeLoading = true
      
      try {
        const response = await this.$api.post(`/guides/${guide.id}/like`)
        
        guide.liked = response.liked
        guide.likes = response.likes
        
        guide.animating = true
        setTimeout(() => {
          guide.animating = false
        }, 600)
        
      } catch (error) {
        console.error('点赞操作失败:', error)
        this.error = '点赞操作失败，请重试'
      } finally {
        guide.likeLoading = false
      }
    },

    // 获取关注状态
    async getFollowStatus(userId) {
      if (!this.user) {
        return { following: false }
      }
      
      try {
        const response = await this.$api.get(`/users/${userId}/follow-status`)
        return response
      } catch (error) {
        console.error('获取关注状态失败:', error)
        return { following: false }
      }
    },

    // 获取用户统计信息
    async getUserStats(userId) {
      try {
        const response = await this.$api.get(`/users/${userId}/stats`)
        return response
      } catch (error) {
        console.error('获取用户统计信息失败:', error)
        return { fans_count: 0, following_count: 0 }
      }
    },

    // 关注/取消关注
    async toggleFollow(guide) {
      if (!this.user) {
        this.$emit('login-required')
        return
      }

      if (guide.following) {
        this.showUnfollowModal = true
        this.unfollowGuide = guide
        return
      }

      guide.followLoading = true
      
      try {
        const response = await this.$api.post(`/users/${guide.user_id}/follow`)
        
        guide.following = response.following
        guide.fans_count = response.fans_count
        
        this.updateAuthorFollowStatus(guide.user_id, response.following, response.fans_count)
        
      } catch (error) {
        console.error('关注操作失败:', error)
        this.error = '关注操作失败，请重试'
      } finally {
        guide.followLoading = false
      }
    },

    // 确认取消关注
    async confirmUnfollow() {
      if (!this.unfollowGuide) return

      const guide = this.unfollowGuide
      guide.followLoading = true
      
      try {
        const response = await this.$api.post(`/users/${guide.user_id}/follow`)
        
        guide.following = response.following
        guide.fans_count = response.fans_count
        
        this.updateAuthorFollowStatus(guide.user_id, response.following, response.fans_count)
        
      } catch (error) {
        console.error('取消关注操作失败:', error)
        this.error = '取消关注操作失败，请重试'
      } finally {
        guide.followLoading = false
        this.showUnfollowModal = false
        this.unfollowGuide = null
      }
    },

    // 取消取消关注操作
    cancelUnfollow() {
      this.showUnfollowModal = false
      this.unfollowGuide = null
    },

    // 更新相同作者的关注状态
    updateAuthorFollowStatus(userId, following, fansCount) {
      this.guides.forEach(guide => {
        if (guide.user_id === userId) {
          guide.following = following
          guide.fans_count = fansCount
        }
      })
    },

    // 收藏/取消收藏
    async toggleFavorite(guide) {
      if (!this.user) {
        this.$emit('login-required')
        return
      }

      guide.favoriteLoading = true
      
      try {
        const response = await this.$api.post(`/guides/${guide.id}/favorite`)
        
        guide.favorited = response.favorited
        guide.favorites = response.favorites
        
        guide.favoriteAnimating = true
        setTimeout(() => {
          guide.favoriteAnimating = false
        }, 600)
        
        this.$emit('favorite-updated', {
          guideId: guide.id,
          favorited: response.favorited,
          favorites: response.favorites
        })
        
      } catch (error) {
        console.error('收藏操作失败:', error)
        this.error = '收藏操作失败，请重试'
      } finally {
        guide.favoriteLoading = false
      }
    },
    
    searchGuides() {
      this.currentPage = 1
      this.fetchGuides()
    },
    
    filterGuides() {
      this.currentPage = 1
      this.fetchGuides()
    },
    
    changePage(page) {
      this.currentPage = page
      this.fetchGuides()
    },
    
    handleImageError(event) {
      console.log('图片加载失败:', event.target.src)
      const guide = this.guides.find(g => this.getGuideImage(g) === event.target.src);
      if (guide) {
        guide.imageLoading = false;
        guide.imageError = true;
      }
      event.target.src = '/images/f.jpg';
    }
  }
}
</script>

<style scoped>
/* 首页整体样式 */
.home {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fbff 0%, #f1f2f6 100%);
}

/* 轮播图样式保持不变 */
.banner-section {
  margin-bottom: 50px;
  position: relative;
}

.carousel {
  position: relative;
  height: 500px;
  overflow: hidden;
  border-radius: 20px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  background: linear-gradient(135deg, #1a2a3a, #0d1b2a);
}

.carousel-inner {
  display: flex;
  height: 100%;
  transition: transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.carousel-item {
  min-width: 100%;
  height: 100%;
  position: relative;
  opacity: 0;
  transition: opacity 0.8s ease;
}

.carousel-item.active {
  opacity: 1;
}

.carousel-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: all 1.2s ease;
  filter: brightness(0.8);
}

.carousel-item.active .carousel-img {
  filter: brightness(1);
  transform: scale(1.05);
}

.carousel-caption {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.9));
  color: white;
  padding: 50px;
  text-align: center;
  transform: translateY(20px);
  opacity: 0;
  transition: all 0.8s ease 0.3s;
}

.carousel-item.active .carousel-caption {
  transform: translateY(0);
  opacity: 1;
}

.carousel-caption h2 {
  font-size: 3.2em;
  margin-bottom: 15px;
  font-weight: 800;
  text-shadow: 2px 2px 12px rgba(0,0,0,0.6);
  letter-spacing: -0.5px;
  background: linear-gradient(45deg, #fff, #e3f2fd);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.1;
}

.carousel-caption p {
  font-size: 1.4em;
  margin: 0;
  opacity: 0.95;
  font-weight: 300;
  text-shadow: 1px 1px 4px rgba(0,0,0,0.5);
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.5;
}

/* 轮播图控制按钮 */
.carousel-control {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  width: 60px;
  height: 60px;
  border-radius: 50%;
  font-size: 28px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  z-index: 10;
  opacity: 0.8;
}

.carousel-control:hover {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.6);
  transform: translateY(-50%) scale(1.1);
  opacity: 1;
  box-shadow: 0 8px 25px rgba(255, 255, 255, 0.2);
}

.carousel-control.prev {
  left: 30px;
}

.carousel-control.next {
  right: 30px;
}

/* 轮播图指示器 */
.carousel-indicators {
  position: absolute;
  bottom: 25px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 12px;
  z-index: 10;
}

.carousel-indicators button {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.6);
  background: transparent;
  cursor: pointer;
  transition: all 0.4s ease;
  position: relative;
  overflow: hidden;
}

.carousel-indicators button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, #3498db, #9b59b6);
  transition: left 0.4s ease;
  border-radius: 50%;
}

.carousel-indicators button.active::before {
  left: 0;
}

.carousel-indicators button.active {
  border-color: white;
  transform: scale(1.2);
}

/* 搜索区域样式 */
.search-section {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 40px 0;
  margin-bottom: 50px;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.search-box {
  display: flex;
  max-width: 600px;
  margin: 0 auto 25px;
  background: white;
  border-radius: 50px;
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.2);
  overflow: hidden;
  border: 2px solid #3498db;
}

.search-input {
  flex: 1;
  padding: 18px 25px;
  border: none;
  font-size: 16px;
  background: transparent;
  outline: none;
  color: #2c3e50;
}

.search-input::placeholder {
  color: #95a5a6;
}

.search-btn {
  padding: 18px 35px;
  border-radius: 0;
  background: linear-gradient(135deg, #3498db, #2980b9);
  font-weight: 600;
  font-size: 16px;
  transition: all 0.3s ease;
}

.search-btn:hover {
  background: linear-gradient(135deg, #2980b9, #1f639c);
  transform: translateX(2px);
}

.filter-section {
  display: flex;
  justify-content: center;
  gap: 30px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
  padding: 12px 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.filter-group label {
  margin-bottom: 0;
  white-space: nowrap;
  font-weight: 600;
  color: #2c3e50;
}

.filter-group .form-control {
  width: auto;
  min-width: 140px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 8px 12px;
}

/* 攻略网格布局优化 */
.guides-section {
  padding: 30px 0 60px;
}

.section-title {
  text-align: center;
  margin-bottom: 50px;
  color: #2c3e50;
  font-size: 2.8em;
  font-weight: 800;
  background: linear-gradient(135deg, #3498db, #9b59b6, #e74c3c);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  background-size: 200% auto;
  animation: shimmer 3s ease-in-out infinite;
  position: relative;
  padding-bottom: 15px;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 3px;
  background: linear-gradient(90deg, transparent, #3498db, transparent);
  border-radius: 2px;
}

@keyframes shimmer {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.guides-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 35px;
  margin-bottom: 50px;
}

/* 攻略卡片样式优化 */
.guide-card {
  background: white;
  border-radius: 24px;
  overflow: hidden;
  transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 
    0 8px 30px rgba(0, 0, 0, 0.08),
    0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.3);
  position: relative;
  opacity: 0;
  transform: translateY(30px);
  animation: cardSlideIn 0.6s ease forwards;
}

/* 卡片动画序列 */
.guide-card.card-0 { animation-delay: 0.1s; }
.guide-card.card-1 { animation-delay: 0.2s; }
.guide-card.card-2 { animation-delay: 0.3s; }
.guide-card.card-3 { animation-delay: 0.4s; }

@keyframes cardSlideIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.guide-card:hover {
  transform: translateY(-12px) scale(1.02);
  box-shadow: 
    0 25px 60px rgba(0, 0, 0, 0.15),
    0 10px 30px rgba(52, 152, 219, 0.1);
}

/* 图片容器优化 */
.card-image-container {
  position: relative;
  width: 100%;
  height: 260px;
  overflow: hidden;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
}

.image-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 图片自适应样式 */
.card-img {
  transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  display: block;
  border-radius: 0;
  background: white;
}

/* 不同图片类型的自适应样式 */
.card-img.image-standard {
  max-height: 100%;
  max-width: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
}

.card-img.image-portrait {
  max-height: 100%;
  max-width: 80%;
  height: auto;
  width: auto;
  object-fit: contain;
}

.card-img.image-landscape {
  max-height: 100%;
  width: 100%;
  height: auto;
  object-fit: cover;
}

.card-img.image-small {
  max-width: 60%;
  max-height: 80%;
  height: auto;
  width: auto;
  object-fit: contain;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.guide-card:hover .card-img {
  transform: scale(1.08);
}

/* 图片加载状态 */
.image-loading {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(248, 249, 250, 0.9);
  z-index: 2;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 图片错误状态 */
.image-error {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  color: #95a5a6;
  gap: 10px;
  z-index: 2;
}

.image-error span {
  font-size: 48px;
  opacity: 0.5;
}

.image-error p {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
}

/* 图片悬停效果层 */
.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.3) 0%,
    rgba(0, 0, 0, 0.1) 30%,
    rgba(0, 0, 0, 0.7) 100%
  );
  opacity: 0;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 25px;
  z-index: 3;
}

.guide-card:hover .image-overlay {
  opacity: 1;
}

.overlay-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  width: 100%;
  transform: translateY(20px);
  transition: transform 0.4s ease 0.1s;
}

.guide-card:hover .overlay-content {
  transform: translateY(0);
}

.btn-overlay {
  background: rgba(255, 255, 255, 0.95);
  color: #2c3e50;
  border: none;
  padding: 12px 24px;
  border-radius: 25px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.btn-overlay:hover {
  background: white;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

.quick-actions {
  display: flex;
  gap: 10px;
}

.quick-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  backdrop-filter: blur(10px);
}

.quick-btn:hover {
  transform: scale(1.1);
  border-color: white;
  background: white;
}

.quick-btn.liked {
  background: rgba(255, 107, 107, 0.9);
  border-color: #ff6b6b;
  color: white;
}

.quick-btn.favorited {
  background: rgba(241, 196, 15, 0.9);
  border-color: #f1c40f;
  color: white;
}

/* 图片信息显示 */
.image-info {
  position: absolute;
  top: 15px;
  left: 15px;
  display: flex;
  gap: 10px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.9);
  background: rgba(0, 0, 0, 0.6);
  padding: 6px 12px;
  border-radius: 12px;
  backdrop-filter: blur(5px);
  z-index: 4;
}

.image-type, .image-dimensions {
  font-weight: 600;
}

/* 卡片内容优化 */
.card-body {
  padding: 28px;
  position: relative;
  z-index: 2;
}

.guide-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.region-tag {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  color: white;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  transition: all 0.3s ease;
}

.region-tag.japan {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
}

.region-tag.china {
  background: linear-gradient(135deg, #3498db, #2980b9);
}

.region-tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 15px rgba(0,0,0,0.3);
}

.location {
  color: #666;
  font-size: 14px;
  font-weight: 500;
  background: #f8f9fa;
  padding: 6px 12px;
  border-radius: 15px;
}

.card-title {
  font-size: 20px;
  font-weight: 800;
  margin-bottom: 15px;
  color: #2c3e50;
  line-height: 1.4;
  cursor: pointer;
  transition: color 0.3s ease;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  position: relative;
}

.card-title:hover {
  color: #3498db;
}

.card-text {
  color: #666;
  margin-bottom: 20px;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 4.8em;
}

/* 统计信息优化 */
.guide-stats {
  display: flex;
  align-items: center;
  gap: 15px;
  margin: 25px 0;
  padding: 20px 0;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #666;
}

.stat-icon {
  font-size: 16px;
}

.stat-count {
  font-weight: 600;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 25px;
  background: white;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  font-size: 14px;
  color: #666;
  position: relative;
  overflow: hidden;
}

.action-btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(0,0,0,0.05);
  border-radius: 50%;
  transition: all 0.4s ease;
  transform: translate(-50%, -50%);
}

.action-btn:hover::before {
  width: 100%;
  height: 100%;
}

.action-btn:hover {
  background: #f8f9fa;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.1);
}

.action-btn.liked {
  background: linear-gradient(135deg, #ffeaea, #ffcccc);
  border-color: #ff6b6b;
  color: #e84118;
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
}

.action-btn.favorited {
  background: linear-gradient(135deg, #fff7e0, #ffeaa7);
  border-color: #f1c40f;
  color: #e67e22;
  box-shadow: 0 4px 15px rgba(241, 196, 15, 0.3);
}

.action-btn.animating {
  animation: pop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes pop {
  0% { transform: scale(1); }
  25% { transform: scale(1.3); }
  50% { transform: scale(0.9); }
  75% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.btn-icon {
  font-size: 16px;
  transition: all 0.3s ease;
}

.action-btn.liked .btn-icon,
.action-btn.favorited .btn-icon {
  animation: heartBeat 0.6s ease;
}

@keyframes heartBeat {
  0% { transform: scale(1); }
  25% { transform: scale(1.3); }
  50% { transform: scale(0.9); }
  75% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.btn-count {
  font-weight: 700;
  transition: all 0.3s ease;
}

/* 作者信息优化 */
.author-info {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
}

.author-avatar-container {
  position: relative;
}

.author-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #3498db;
  transition: all 0.3s ease;
}

.author-avatar:hover {
  transform: scale(1.1);
}

.author-details {
  flex: 1;
}

.author-name {
  font-size: 14px;
  font-weight: 700;
  color: #2c3e50;
  display: block;
  margin-bottom: 3px;
}

.author-stats {
  font-size: 12px;
}

.fans-count {
  color: #999;
}

.follow-btn {
  padding: 8px 18px;
  border: 2px solid #3498db;
  border-radius: 20px;
  background: white;
  color: #3498db;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  white-space: nowrap;
  position: relative;
  overflow: hidden;
}

.follow-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(52, 152, 219, 0.1), transparent);
  transition: left 0.5s;
}

.follow-btn:hover::before {
  left: 100%;
}

.follow-btn:hover {
  background: #3498db;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(52, 152, 219, 0.4);
}

.follow-btn.following {
  background: #f8f9fa;
  border-color: #6c757d;
  color: #6c757d;
}

.follow-btn.following:hover {
  background: #e74c3c;
  border-color: #e74c3c;
  color: white;
  box-shadow: 0 6px 20px rgba(231, 76, 60, 0.4);
}

.follow-btn.loading {
  opacity: 0.6;
  cursor: not-allowed;
}

.follow-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 卡片装饰元素 */
.card-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1;
}

.decoration-corner {
  position: absolute;
  width: 20px;
  height: 20px;
  border: 2px solid transparent;
  transition: all 0.4s ease;
}

.decoration-corner.top-left {
  top: 15px;
  left: 15px;
  border-top: 2px solid #3498db;
  border-left: 2px solid #3498db;
}

.decoration-corner.top-right {
  top: 15px;
  right: 15px;
  border-top: 2px solid #9b59b6;
  border-right: 2px solid #9b59b6;
}

.decoration-corner.bottom-left {
  bottom: 15px;
  left: 15px;
  border-bottom: 2px solid #e74c3c;
  border-left: 2px solid #e74c3c;
}

.decoration-corner.bottom-right {
  bottom: 15px;
  right: 15px;
  border-bottom: 2px solid #2ecc71;
  border-right: 2px solid #2ecc71;
}

.guide-card:hover .decoration-corner {
  width: 25px;
  height: 25px;
}

/* 分页优化 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 25px;
  margin-top: 50px;
}

.btn-pagination {
  padding: 14px 28px;
  border: 2px solid #3498db;
  background: white;
  color: #3498db;
  border-radius: 12px;
  font-weight: 700;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  overflow: hidden;
}

.btn-pagination::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(52, 152, 219, 0.1), transparent);
  transition: left 0.5s;
}

.btn-pagination:hover::before {
  left: 100%;
}

.btn-pagination:hover:not(.disabled) {
  background: #3498db;
  color: white;
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(52, 152, 219, 0.4);
}

.btn-pagination.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.page-info {
  color: #666;
  font-weight: 600;
  font-size: 16px;
  background: #f8f9fa;
  padding: 10px 20px;
  border-radius: 10px;
}

/* 空状态优化 */
.no-data {
  text-align: center;
  padding: 100px 20px;
}

.empty-state {
  color: #95a5a6;
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 25px;
  opacity: 0.7;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.empty-state h3 {
  margin-bottom: 15px;
  color: #7f8c8d;
  font-size: 24px;
  font-weight: 700;
}

.empty-state p {
  font-size: 16px;
  margin: 0;
  opacity: 0.8;
}

/* 加载状态优化 */
.loading {
  text-align: center;
  padding: 100px 20px;
  color: #666;
}

.spinner {
  width: 60px;
  height: 60px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 25px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

/* 错误状态优化 */
.error {
  background: linear-gradient(135deg, #ffe6e6, #ffcccc);
  color: #c0392b;
  padding: 25px;
  border-radius: 16px;
  border: 1px solid #e74c3c;
  margin: 30px 0;
  text-align: center;
  font-weight: 600;
  box-shadow: 0 6px 20px rgba(231, 76, 60, 0.15);
  border-left: 4px solid #e74c3c;
}

/* 响应式设计优化 */
@media (max-width: 1200px) {
  .guides-grid {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 30px;
  }
}

@media (max-width: 768px) {
  .carousel {
    height: 350px;
  }
  
  .carousel-caption {
    padding: 25px;
  }
  
  .carousel-caption h2 {
    font-size: 2em;
  }
  
  .carousel-caption p {
    font-size: 1.1em;
  }
  
  .carousel-control {
    width: 40px;
    height: 40px;
    font-size: 20px;
  }
  
  .search-box {
    flex-direction: column;
    border-radius: 20px;
    border: 2px solid #3498db;
  }
  
  .search-input {
    border-radius: 20px 20px 0 0;
    border-right: 2px solid #3498db;
    margin-bottom: 0;
  }
  
  .search-btn {
    border-radius: 0 0 20px 20px;
    padding: 15px;
  }
  
  .filter-section {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }
  
  .filter-group {
    justify-content: space-between;
    padding: 15px;
  }
  
  .guides-grid {
    grid-template-columns: 1fr;
    gap: 25px;
  }
  
  .section-title {
    font-size: 2.2em;
  }
  
  .guide-stats {
    gap: 12px;
    flex-wrap: wrap;
  }
  
  .pagination {
    flex-direction: column;
    gap: 15px;
  }
  
  .card-img.image-portrait {
    max-width: 70%;
  }
  
  .card-img.image-small {
    max-width: 50%;
  }
}

@media (max-width: 480px) {
  .carousel {
    height: 280px;
  }
  
  .carousel-caption {
    padding: 20px;
  }
  
  .carousel-caption h2 {
    font-size: 1.6em;
  }
  
  .section-title {
    font-size: 1.8em;
  }
  
  .card-image-container {
    height: 220px;
  }
  
  .card-body {
    padding: 20px;
  }
  
  .author-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .follow-btn {
    align-self: stretch;
    text-align: center;
  }
  
  .card-img.image-portrait {
    max-width: 60%;
  }
  
  .card-img.image-small {
    max-width: 45%;
  }
}

/* 工具类 */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 25px;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-primary {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #2980b9, #1f639c);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(52, 152, 219, 0.4);
}

.btn-primary:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
  transform: none !important;
}

.btn-secondary {
  background: linear-gradient(135deg, #95a5a6, #7f8c8d);
  color: white;
  box-shadow: 0 4px 15px rgba(149, 165, 166, 0.3);
}

.btn-secondary:hover:not(:disabled) {
  background: linear-gradient(135deg, #7f8c8d, #636e72);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(149, 165, 166, 0.4);
}

.form-control {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s ease;
  background: white;
}

.form-control:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}
</style>