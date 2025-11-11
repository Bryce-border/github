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
            :class="{ active: currentSlide === index }"
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
            :class="{ active: currentSlide === index }"
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
          <p>暂无攻略数据</p>
          <p class="hint">成为第一个分享旅行攻略的人吧！</p>
        </div>
        
        <div v-else class="guides-grid grid grid-3">
          <div 
            v-for="guide in guides" 
            :key="guide.id" 
            class="guide-card card"
          >
            <img 
              :src="guide.image_url || '/images/f.jpg'" 
              :alt="guide.title" 
              class="card-img"
              @error="handleImageError"
              @click="viewGuideDetail(guide.id)"
            >
            <div class="card-body">
              <div class="guide-meta">
                <span class="region-tag" :class="guide.region === '日本' ? 'japan' : 'china'">
                  {{ guide.region || '未知地区' }}
                </span>
                <span class="location">{{ guide.location || '未知地点' }}</span>
              </div>
              <h3 class="card-title" @click="viewGuideDetail(guide.id)">{{ guide.title || '未命名攻略' }}</h3>
              <p class="card-text">{{ (guide.content || '').substring(0, 100) }}...</p>
              <div class="guide-stats">
                <span>👁️ {{ guide.views || 0 }} 浏览</span>
                <!-- 点赞按钮 -->
                <button 
                  class="like-btn"
                  :class="{ 'liked': guide.liked, 'animating': guide.animating }"
                  @click.stop="toggleLike(guide)"
                  :disabled="guide.likeLoading"
                >
                  <span class="like-icon">❤️</span>
                  <span class="like-count">{{ guide.likes || 0 }}</span>
                </button>
                <!-- 收藏按钮 -->
                <button 
                  class="favorite-btn"
                  :class="{ 'favorited': guide.favorited, 'animating': guide.favoriteAnimating }"
                  @click.stop="toggleFavorite(guide)"
                  :disabled="guide.favoriteLoading"
                >
                  <span class="favorite-icon">⭐</span>
                  <span class="favorite-count">{{ guide.favorites || 0 }}</span>
                </button>
              </div>
              <div class="author-info">
                <img :src="guide.avatar || '/images/f.jpg'" :alt="guide.username" class="author-avatar">
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
            class="btn btn-primary"
          >
            上一页
          </button>
          <span class="page-info">
            第 {{ currentPage }} 页，共 {{ totalPages }} 页
          </span>
          <button 
            :disabled="currentPage === totalPages" 
            @click="changePage(currentPage + 1)"
            class="btn btn-primary"
          >
            下一页
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

    // 查看攻略详情 - 跳转到独立页面
    viewGuideDetail(guideId) {
      console.log('📖 查看攻略详情:', guideId);
      this.$router.push(`/guide/${guideId}`);
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
        
        const response = await this.$api.get(`/guides?${params}`)
        
        if (response && response.guides) {
          // 为每个攻略获取点赞、收藏状态，以及关注状态和用户统计信息
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
          this.totalPages = response.totalPages || 1
        } else {
          this.guides = []
          this.totalPages = 1
        }
      } catch (error) {
        console.error('获取攻略列表失败:', error)
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
        
        // 更新点赞状态和数量
        guide.liked = response.liked
        guide.likes = response.likes
        
        // 触发点赞动画
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

      // 如果是已关注状态，显示取消关注确认弹窗
      if (guide.following) {
        this.showUnfollowModal = true
        this.unfollowGuide = guide
        return
      }

      guide.followLoading = true
      
      try {
        const response = await this.$api.post(`/users/${guide.user_id}/follow`)
        
        // 更新关注状态和粉丝数
        guide.following = response.following
        guide.fans_count = response.fans_count
        
        // 更新主页中相同作者的其他攻略
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
        
        // 更新关注状态和粉丝数
        guide.following = response.following
        guide.fans_count = response.fans_count
        
        // 更新主页中相同作者的其他攻略
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
        
        // 更新收藏状态和数量
        guide.favorited = response.favorited
        guide.favorites = response.favorites
        
        // 触发收藏动画
        guide.favoriteAnimating = true
        setTimeout(() => {
          guide.favoriteAnimating = false
        }, 600)
        
        // 触发收藏事件，可以在父组件中监听
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
/* 点赞按钮样式 */
.like-btn, .favorite-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 8px;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  color: #666;
}

.like-btn:hover, .favorite-btn:hover {
  background: #f5f5f5;
  transform: translateY(-1px);
}

.like-btn.liked, .favorite-btn.favorited {
  background: #fff0f0;
  border-color: #ff6b6b;
  color: #ff6b6b;
}

.like-btn.animating, .favorite-btn.animating {
  animation: likeAnimation 0.6s ease;
}

.like-btn:disabled, .favorite-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.like-icon, .favorite-icon {
  font-size: 16px;
  transition: all 0.3s ease;
}

.like-btn.liked .like-icon, .favorite-btn.favorited .favorite-icon {
  animation: heartBeat 0.6s ease;
}

.like-count, .favorite-count {
  font-weight: 500;
  transition: all 0.3s ease;
}

.like-btn.liked .like-count, .favorite-btn.favorited .favorite-count {
  color: #ff6b6b;
}

/* 点赞动画 */
@keyframes likeAnimation {
  0% {
    transform: scale(1);
  }
  25% {
    transform: scale(1.2);
  }
  50% {
    transform: scale(0.95);
  }
  75% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes heartBeat {
  0% {
    transform: scale(1);
  }
  25% {
    transform: scale(1.3);
  }
  50% {
    transform: scale(0.9);
  }
  75% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

/* 更新攻略统计区域样式 */
.guide-stats {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 10px 0;
  font-size: 12px;
  color: #999;
  flex-wrap: wrap;
}

.guide-stats span:not(.like-btn):not(.favorite-btn) {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 轮播图样式 */
.banner-section {
  margin-bottom: 40px;
  position: relative;
}

.carousel {
  position: relative;
  height: 400px;
  overflow: hidden;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.carousel-inner {
  display: flex;
  height: 100%;
  transition: transform 0.5s ease-in-out;
}

.carousel-item {
  min-width: 100%;
  height: 100%;
  position: relative;
}

.carousel-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.carousel-caption {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.7));
  color: white;
  padding: 30px;
  text-align: center;
}

.carousel-caption h2 {
  font-size: 2.5em;
  margin-bottom: 10px;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
}

.carousel-caption p {
  font-size: 1.2em;
  margin: 0;
  opacity: 0.9;
}

/* 轮播图控制按钮 */
.carousel-control {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.8);
  border: none;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  font-size: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
}

.carousel-control:hover {
  background: rgba(255, 255, 255, 1);
  transform: translateY(-50%) scale(1.1);
}

.carousel-control.prev {
  left: 20px;
}

.carousel-control.next {
  right: 20px;
}

/* 轮播图指示器 */
.carousel-indicators {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
}

.carousel-indicators button {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid white;
  background: transparent;
  cursor: pointer;
  transition: all 0.3s ease;
}

.carousel-indicators button.active {
  background: white;
  transform: scale(1.2);
}

.carousel-indicators button:hover {
  background: rgba(255, 255, 255, 0.5);
}

/* 搜索区域样式 */
.search-section {
  background: white;
  padding: 30px 0;
  margin-bottom: 40px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.search-box {
  display: flex;
  max-width: 600px;
  margin: 0 auto 20px;
}

.search-input {
  flex: 1;
  padding: 15px;
  border: 2px solid #3498db;
  border-right: none;
  border-radius: 25px 0 0 25px;
  font-size: 16px;
}

.search-btn {
  border-radius: 0 25px 25px 0;
  padding: 15px 30px;
}

.filter-section {
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-group label {
  margin-bottom: 0;
  white-space: nowrap;
}

.filter-group .form-control {
  width: auto;
  min-width: 150px;
}

/* 攻略卡片样式 */
.guides-section {
  padding: 20px 0;
}

.section-title {
  text-align: center;
  margin-bottom: 30px;
  color: #2c3e50;
  font-size: 2em;
}

.guides-grid {
  margin-bottom: 40px;
}

.guide-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  overflow: hidden;
}

.guide-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.card-img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  transition: transform 0.3s ease;
  cursor: pointer;
}

.guide-card:hover .card-img {
  transform: scale(1.05);
}

.card-body {
  padding: 20px;
}

.guide-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.region-tag {
  padding: 4px 12px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: bold;
  color: white;
}

.region-tag.japan {
  background: #e74c3c;
}

.region-tag.china {
  background: #3498db;
}

.location {
  color: #666;
  font-size: 14px;
}

.card-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 10px;
  color: #2c3e50;
  line-height: 1.4;
  cursor: pointer;
}

.card-title:hover {
  color: #3498db;
}

.card-text {
  color: #666;
  margin-bottom: 15px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.author-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  object-fit: cover;
}

.author-name {
  font-size: 14px;
  color: #666;
}

/* 分页样式 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 40px;
}

.page-info {
  color: #666;
  font-weight: bold;
}

/* 加载和错误状态 */
.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 10px;
}

/* 作者信息样式 */
.author-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.author-details {
  flex: 1;
}

.author-stats {
  font-size: 12px;
  color: #666;
}

.fans-count {
  font-size: 11px;
  color: #999;
}

.follow-btn {
  padding: 4px 12px;
  border: 1px solid #3498db;
  border-radius: 15px;
  background: white;
  color: #3498db;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.follow-btn:hover {
  background: #3498db;
  color: white;
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

/* 弹窗样式 */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 10px;
  width: 90%;
  max-width: 400px;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-body {
  padding: 20px;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}

.close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  background-color: #ffeaea;
  border: 1px solid #e74c3c;
  color: #c0392b;
  padding: 15px;
  border-radius: 5px;
  margin: 20px 0;
  text-align: center;
}

.no-data {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.no-data p {
  font-size: 18px;
  margin-bottom: 10px;
}

.hint {
  color: #999;
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .carousel {
    height: 300px;
  }
  
  .carousel-caption h2 {
    font-size: 1.8em;
  }
  
  .carousel-caption p {
    font-size: 1em;
  }
  
  .carousel-control {
    width: 40px;
    height: 40px;
    font-size: 20px;
  }
  
  .carousel-control.prev {
    left: 10px;
  }
  
  .carousel-control.next {
    right: 10px;
  }

  .search-box {
    flex-direction: column;
  }

  .search-input {
    border-radius: 25px;
    border-right: 2px solid #3498db;
    margin-bottom: 10px;
  }

  .search-btn {
    border-radius: 25px;
  }

  .filter-section {
    flex-direction: column;
    align-items: center;
  }

  .filter-group {
    width: 100%;
    justify-content: space-between;
  }

  .filter-group .form-control {
    width: 150px;
  }

  .grid-3 {
    grid-template-columns: 1fr;
  }

  .guide-stats {
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .carousel {
    height: 250px;
  }
  
  .carousel-caption {
    padding: 20px;
  }
  
  .carousel-caption h2 {
    font-size: 1.5em;
  }

  .section-title {
    font-size: 1.5em;
  }

  .guide-card {
    margin-bottom: 20px;
  }
}

/* 工具类 */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.grid {
  display: grid;
  gap: 20px;
}

.grid-3 {
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.card {
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-block;
  text-align: center;
}

.btn-primary {
  background-color: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2980b9;
}

.btn-primary:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.form-control {
  width: 100%;
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
  transition: border-color 0.3s ease;
}

.form-control:focus {
  outline: none;
  border-color: #3498db;
}
</style>