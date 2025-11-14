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
          >
            <div class="card-image-container">
              <img 
                :src="getGuideImage(guide)" 
                :alt="guide.title" 
                class="card-img"
                @error="handleImageError"
                @click="viewGuideDetail(guide.id)"
              >
              <div class="image-overlay">
                <button class="btn-overlay" @click="viewGuideDetail(guide.id)">
                  查看详情
                </button>
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
// 脚本部分保持不变，与之前相同
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

    // 获取攻略内容摘要
    getGuideContent(guide) {
      const content = guide.content || '';
      const cleanContent = content.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
      return cleanContent.substring(0, 100) + (cleanContent.length > 100 ? '...' : '');
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
                  fans_count: userStats.fans_count
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
                  fans_count: 0
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
      event.target.src = '/images/f.jpg'
    }
  }
}
</script>

<style scoped>
/* 优化后的样式 */
.home {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fbff 0%, #f1f2f6 100%);
}

/* 轮播图样式优化 */
/* 轮播图样式优化 */
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

/* 轮播图控制按钮优化 */
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

.carousel-control:active {
  transform: translateY(-50%) scale(0.95);
}

/* 轮播图指示器优化 */
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

.carousel-indicators button.active {
  border-color: white;
  transform: scale(1.2);
}

.carousel-indicators button.active::before {
  left: 0;
}

.carousel-indicators button:hover {
  border-color: rgba(255, 255, 255, 0.9);
  transform: scale(1.1);
}

/* 轮播图进度条 */
.carousel-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  z-index: 10;
}

.carousel-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #3498db, #9b59b6);
  width: 0%;
  transition: width 5s linear;
  border-radius: 0 2px 2px 0;
}

.carousel-item.active .carousel-progress-bar {
  width: 100%;
}

/* 轮播图导航点动画 */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes zoomIn {
  from {
    opacity: 0;
    transform: scale(1.1);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.carousel-item.active .carousel-img {
  animation: zoomIn 1.2s ease-out;
}

.carousel-item.active .carousel-caption h2 {
  animation: slideInUp 0.8s ease-out 0.4s both;
}

.carousel-item.active .carousel-caption p {
  animation: slideInUp 0.8s ease-out 0.6s both;
}

/* 响应式设计优化 */
@media (max-width: 1200px) {
  .carousel {
    height: 450px;
  }
  
  .carousel-caption h2 {
    font-size: 2.8em;
  }
  
  .carousel-caption p {
    font-size: 1.3em;
  }
}

@media (max-width: 768px) {
  .carousel {
    height: 350px;
    border-radius: 15px;
  }
  
  .carousel-caption {
    padding: 30px 25px;
  }
  
  .carousel-caption h2 {
    font-size: 2.2em;
    margin-bottom: 10px;
  }
  
  .carousel-caption p {
    font-size: 1.1em;
  }
  
  .carousel-control {
    width: 50px;
    height: 50px;
    font-size: 22px;
  }
  
  .carousel-control.prev {
    left: 15px;
  }
  
  .carousel-control.next {
    right: 15px;
  }
  
  .carousel-indicators {
    bottom: 20px;
  }
  
  .carousel-indicators button {
    width: 12px;
    height: 12px;
  }
}

@media (max-width: 480px) {
  .carousel {
    height: 280px;
    border-radius: 12px;
  }
  
  .carousel-caption {
    padding: 20px 15px;
  }
  
  .carousel-caption h2 {
    font-size: 1.8em;
  }
  
  .carousel-caption p {
    font-size: 0.95em;
  }
  
  .carousel-control {
    width: 40px;
    height: 40px;
    font-size: 18px;
  }
  
  .carousel-control.prev {
    left: 10px;
  }
  
  .carousel-control.next {
    right: 10px;
  }
  
  .carousel-indicators {
    bottom: 15px;
    gap: 8px;
  }
  
  .carousel-indicators button {
    width: 10px;
    height: 10px;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .carousel {
    background: linear-gradient(135deg, #0d1b2a, #1a2a3a);
  }
  
  .carousel-control {
    background: rgba(0, 0, 0, 0.3);
    border-color: rgba(255, 255, 255, 0.2);
  }
  
  .carousel-control:hover {
    background: rgba(0, 0, 0, 0.5);
    border-color: rgba(255, 255, 255, 0.4);
  }
}

/* 无障碍支持 */
.carousel-control:focus {
  outline: 2px solid #3498db;
  outline-offset: 2px;
}

.carousel-indicators button:focus {
  outline: 2px solid #3498db;
  outline-offset: 2px;
}

/* 加载状态 */
.carousel-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  z-index: 5;
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  .carousel-control {
    background: rgba(255, 255, 255, 0.25);
    border-color: rgba(255, 255, 255, 0.4);
    opacity: 1;
  }
  
  .carousel-indicators button {
    width: 16px;
    height: 16px;
  }
}

/* 高性能动画优化 */
.carousel-inner {
  will-change: transform;
}

.carousel-img {
  will-change: transform;
}

.carousel-caption {
  will-change: transform, opacity;
}

/* 打印样式 */
@media print {
  .carousel-control,
  .carousel-indicators,
  .carousel-progress {
    display: none;
  }
  
  .carousel {
    height: auto;
    box-shadow: none;
    border: 1px solid #ddd;
  }
  
  .carousel-img {
    filter: none !important;
    transform: none !important;
  }
  
  .carousel-caption {
    position: static;
    background: none;
    color: black;
    padding: 20px;
    transform: none !important;
    opacity: 1 !important;
  }
  
  .carousel-caption h2 {
    background: none;
    -webkit-text-fill-color: black;
    color: black;
    text-shadow: none;
  }
}

/* 搜索区域样式优化 */
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
  margin-bottom: 40px;
  color: #2c3e50;
  font-size: 2.5em;
  font-weight: 800;
  background: linear-gradient(135deg, #3498db, #9b59b6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.guides-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 30px;
  margin-bottom: 50px;
}

.guide-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
}

.guide-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

/* 图片容器优化 */
.card-image-container {
  position: relative;
  width: 100%;
  height: 240px;
  overflow: hidden;
}

.card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: all 0.5s ease;
}

.guide-card:hover .card-img {
  transform: scale(1.1);
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.7));
  opacity: 0;
  transition: all 0.3s ease;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 20px;
}

.guide-card:hover .image-overlay {
  opacity: 1;
}

.btn-overlay {
  background: rgba(255, 255, 255, 0.9);
  color: #2c3e50;
  border: none;
  padding: 10px 20px;
  border-radius: 25px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  transform: translateY(20px);
}

.guide-card:hover .btn-overlay {
  transform: translateY(0);
}

.btn-overlay:hover {
  background: white;
  transform: translateY(-2px);
}

/* 卡片内容优化 */
.card-body {
  padding: 25px;
}

.guide-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.region-tag {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  color: white;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.region-tag.japan {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
}

.region-tag.china {
  background: linear-gradient(135deg, #3498db, #2980b9);
}

.location {
  color: #666;
  font-size: 14px;
  font-weight: 500;
}

.card-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 12px;
  color: #2c3e50;
  line-height: 1.4;
  cursor: pointer;
  transition: color 0.3s ease;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
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
  margin: 20px 0;
  padding: 15px 0;
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
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  color: #666;
}

.action-btn:hover {
  background: #f8f9fa;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.action-btn.liked {
  background: linear-gradient(135deg, #ffeaea, #ffcccc);
  border-color: #ff6b6b;
  color: #e84118;
}

.action-btn.favorited {
  background: linear-gradient(135deg, #fff7e0, #ffeaa7);
  border-color: #f1c40f;
  color: #e67e22;
}

.action-btn.animating {
  animation: pop 0.6s ease;
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

.btn-count {
  font-weight: 600;
  transition: all 0.3s ease;
}

/* 作者信息优化 */
.author-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 15px;
}

.author-avatar-container {
  position: relative;
}

.author-avatar {
  width: 40px;
  height: 40px;
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
  font-weight: 600;
  color: #2c3e50;
  display: block;
  margin-bottom: 2px;
}

.author-stats {
  font-size: 12px;
}

.fans-count {
  color: #999;
}

.follow-btn {
  padding: 6px 16px;
  border: 1px solid #3498db;
  border-radius: 18px;
  background: white;
  color: #3498db;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.follow-btn:hover {
  background: #3498db;
  color: white;
  transform: translateY(-1px);
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
}

.follow-btn.loading {
  opacity: 0.6;
  cursor: not-allowed;
}

.follow-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
  padding: 12px 24px;
  border: 2px solid #3498db;
  background: white;
  color: #3498db;
  border-radius: 10px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-pagination:hover:not(.disabled) {
  background: #3498db;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
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
}

/* 空状态优化 */
.no-data {
  text-align: center;
  padding: 80px 20px;
}

.empty-state {
  color: #95a5a6;
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 20px;
  opacity: 0.7;
}

.empty-state h3 {
  margin-bottom: 15px;
  color: #7f8c8d;
  font-size: 24px;
}

.empty-state p {
  font-size: 16px;
  margin: 0;
}

/* 加载状态优化 */
.loading {
  text-align: center;
  padding: 80px 20px;
  color: #666;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

/* 错误状态优化 */
.error {
  background: linear-gradient(135deg, #ffe6e6, #ffcccc);
  color: #c0392b;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #e74c3c;
  margin: 20px 0;
  text-align: center;
  font-weight: 500;
}

/* 动画定义 */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes pop {
  0% { transform: scale(1); }
  40% { transform: scale(1.2); }
  70% { transform: scale(0.95); }
  100% { transform: scale(1); }
}

@keyframes heartBeat {
  0% { transform: scale(1); }
  25% { transform: scale(1.3); }
  50% { transform: scale(0.9); }
  75% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

/* 响应式设计优化 */
@media (max-width: 1200px) {
  .guides-grid {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 25px;
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
    gap: 20px;
  }
  
  .section-title {
    font-size: 2em;
  }
  
  .guide-stats {
    gap: 10px;
    flex-wrap: wrap;
  }
  
  .pagination {
    flex-direction: column;
    gap: 15px;
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
    height: 200px;
  }
  
  .card-body {
    padding: 20px;
  }
  
  .author-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .follow-btn {
    align-self: stretch;
    text-align: center;
  }
}

/* 工具类 */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-primary {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #2980b9, #1f639c);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

.btn-primary:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
  transform: none !important;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #7f8c8d;
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