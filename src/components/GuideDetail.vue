<template>
  <div class="guide-detail-page"> 
    <div class="container">
      <!-- 返回按钮 -->
      <div class="back-section">
        <button class="btn btn-secondary" @click="goBack">
          ← 返回
        </button>
      </div>

      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>
      
      <div v-else-if="error" class="error">
        {{ error }}
      </div>
      
      <div v-else-if="guide" class="guide-content">
        <!-- 攻略标题 -->
        <h1 class="guide-title">{{ guide.title }}</h1>
        
        <!-- 封面图片 - 优化版 -->
        <div v-if="guide.cover_image_url" class="guide-image-container">
          <div v-if="imageLoading" class="image-loading">
            <div class="loading-spinner"></div>
            <p>图片加载中...</p>
          </div>
          
          <img
            v-show="!imageLoading && !imageError"
            :src="guide.cover_image_url"
            :alt="guide.title"
            :class="['guide-image', imageClass]"
            @load="handleImageLoad"
            @error="handleImageError"
            ref="guideImage"
          />
          
          <div v-if="imageError" class="image-error">
            <div class="error-icon">🖼️</div>
            <p>图片加载失败</p>
            <button class="retry-btn" @click="retryLoadImage">重新加载</button>
          </div>
          
          <!-- 图片操作工具栏 -->
          <div class="image-toolbar" v-if="!imageLoading && !imageError">
            <button class="toolbar-btn" @click="zoomImage" title="放大查看">
              <span class="toolbar-icon">🔍</span>
            </button>
            <button class="toolbar-btn" @click="downloadImage" title="下载图片">
              <span class="toolbar-icon">⬇️</span>
            </button>
          </div>
          
          <!-- 图片类型指示器 -->
          <div v-if="showImageInfo && !imageLoading && !imageError" class="image-info">
            <span class="image-type">{{ imageType }}</span>
            <span class="image-size">{{ imageSize }}</span>
          </div>
        </div>

        <!-- 更多图片 - 优化版 -->
        <div v-if="guide.guide_images && guide.guide_images.length > 0" class="guide-images-gallery">
          <h3 class="gallery-title">图集 ({{ guide.guide_images.length }})</h3>
          <div class="gallery-container">
            <div class="gallery-scroll-container" ref="galleryScroll" @scroll="updateScrollButtons">
              <div class="image-grid">
                <div 
                  v-for="(image, index) in guide.guide_images" 
                  :key="index" 
                  class="grid-item" 
                  @click="openGalleryImage(index)"
                  :class="{ active: galleryCurrentIndex === index }"
                >
                  <img 
                    :src="image" 
                    :alt="guide.title + ' image ' + (index + 1)" 
                    class="gallery-image"
                    loading="lazy"
                  >
                  <div class="image-overlay">
                    <span class="image-number">{{ index + 1 }}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 左右滚动按钮 -->
            <button 
              v-if="canScrollLeft" 
              class="scroll-btn scroll-left" 
              @click="scrollGallery('left')"
              aria-label="向左滚动"
            >
              <span class="scroll-icon">‹</span>
            </button>
            <button 
              v-if="canScrollRight" 
              class="scroll-btn scroll-right" 
              @click="scrollGallery('right')"
              aria-label="向右滚动"
            >
              <span class="scroll-icon">›</span>
            </button>
          </div>
        </div>

        <!-- 文档下载 -->
        <div v-if="guide.document_url" class="document-download">
          <a :href="guide.document_url" download class="btn btn-primary">
            下载攻略文档
          </a>
        </div>
        
        <!-- 攻略内容 -->
        <div class="guide-body">
          <p class="guide-text">{{ guide.content }}</p>
        </div>

        <!-- 攻略元信息 -->
        <div class="guide-meta">
          <span class="region-tag" :class="guide.region === '日本' ? 'japan' : 'china'">
            {{ guide.region }}
          </span>
          <span class="location">{{ guide.location }}</span>
          <span class="views">👁️ {{ guide.views }} 浏览</span>
          <span class="likes">❤️ {{ guide.likes }} 点赞</span>
          <span class="favorites">⭐ {{ guide.favorites }} 收藏</span>
        </div>
        
        <!-- 作者信息 -->
        <div class="author-info">
          <img :src="guide.avatar || '/images/f.jpg'" :alt="guide.username" class="author-avatar">
          <div class="author-details">
            <div class="author-name">{{ guide.username }}</div>
            <div class="author-stats">
              <span class="fans-count">粉丝: {{ guide.fans_count || 0 }}</span>
            </div>
            <div class="post-time">发布于 {{ formatDate(guide.created_at) }}</div>
          </div>
          <button 
            v-if="user && user.id !== guide.user_id"
            class="follow-btn"
            :class="{ 'following': guide.following, 'loading': guide.followLoading }"
            @click="toggleFollow(guide)"
            :disabled="guide.followLoading"
          >
            {{ guide.followLoading ? '...' : (guide.following ? '已关注' : '关注') }}
          </button>
        </div>

        <!-- 点赞和收藏按钮 -->
        <div class="action-buttons" v-if="user">
          <button 
            class="btn like-btn"
            :class="{ 'liked': guide.liked, 'animating': guide.animating }"
            @click="toggleLike(guide)"
            :disabled="guide.likeLoading"
          >
            <span class="like-icon">❤️</span>
            <span class="like-count">{{ guide.likes }}</span>
          </button>
          
          <button 
            class="btn favorite-btn"
            :class="{ 'favorited': guide.favorited, 'animating': guide.favoriteAnimating }"
            @click="toggleFavorite(guide)"
            :disabled="guide.favoriteLoading"
          >
            <span class="favorite-icon">⭐</span>
            <span class="favorite-count">{{ guide.favorites }}</span>
          </button>
        </div>
        <div v-else class="login-prompt">
          <p>请 <a @click="goToLogin" style="color: #3498db; cursor: pointer;">登录</a> 后点赞或收藏</p>
        </div>

        <!-- 评论区域 -->
        <div class="comments-section">
          <h3 class="comments-title">评论 ({{ totalCommentCount }})</h3>
          
          <!-- 评论表单 -->
          <div v-if="user" class="comment-form">
            <textarea 
              ref="commentInput"
              v-model="newComment" 
              placeholder="写下你的评论..." 
              class="form-control"
              rows="3"
              :class="{ 'replying': replyingTo }"
            ></textarea>
            <div v-if="replyingTo" class="reply-info">
              正在回复 @{{ replyingTo.username }}
              <button class="btn-cancel-reply" @click="cancelReply">取消回复</button>
            </div>
            <button 
              @click="addComment" 
              class="btn btn-primary mt-2"
              :disabled="!newComment.trim() || commentSubmitting"
            >
              {{ commentSubmitting ? (replyingTo ? '回复中...' : '发表中...') : (replyingTo ? '回复' : '发表评论') }}
            </button>
          </div>
          <div v-else class="login-prompt">
            <p>请 <a @click="goToLogin" style="color: #3498db; cursor: pointer;">登录</a> 后发表评论</p>
          </div>
          
          <!-- 评论列表 -->
          <div class="comments-list">
            <div 
              v-for="comment in comments" 
              :key="comment.id" 
              class="comment-item"
              :class="{ 'top-level': !comment.parent_id }"
            >
              <img :src="comment.avatar || '/images/f.jpg'" :alt="comment.username" class="comment-avatar">
              <div class="comment-content">
                <div class="comment-header">
                  <div class="comment-user">
                    <strong>{{ comment.username }}</strong>
                    <span class="comment-time">{{ formatDate(comment.created_at) }}</span>
                  </div>
                  <div class="comment-actions">
                    <!-- 点赞按钮 -->
                    <button 
                      class="comment-like-btn"
                      :class="{ 'liked': comment.liked, 'animating': comment.animating }"
                      @click="toggleCommentLike(comment)"
                      :disabled="comment.likeLoading"
                    >
                      <span class="like-icon">❤️</span>
                      <span class="like-count">{{ comment.likes || 0 }}</span>
                    </button>
                    <!-- 回复按钮 -->
                    <button 
                      v-if="user"
                      class="btn-reply"
                      @click="startReply(comment)"
                      title="回复"
                    >
                      💬 回复
                    </button>
                    <!-- 删除按钮 -->
                    <button 
                      v-if="user && user.id === comment.user_id"
                      class="btn-delete-comment"
                      @click="deleteComment(comment.id)"
                      :disabled="comment.deleting"
                      :title="comment.deleting ? '删除中...' : '删除评论'"
                    >
                      {{ comment.deleting ? '⏳' : '🗑️' }}
                    </button>
                  </div>
                </div>
                <p class="comment-text">{{ comment.content }}</p>
                
                <!-- 回复列表 -->
                <div v-if="comment.replies && comment.replies.length > 0" class="replies-section">
                  <div 
                    v-for="reply in comment.replies" 
                    :key="reply.id" 
                    class="comment-item reply-item"
                  >
                    <img :src="reply.avatar || '/images/f.jpg'" :alt="reply.username" class="comment-avatar">
                    <div class="comment-content">
                      <div class="comment-header">
                        <div class="comment-user">
                          <strong>{{ reply.username }}</strong>
                          <span class="comment-time">{{ formatDate(reply.created_at) }}</span>
                        </div>
                        <div class="comment-actions">
                          <button 
                            class="comment-like-btn"
                            :class="{ 'liked': reply.liked, 'animating': reply.animating }"
                            @click="toggleCommentLike(reply)"
                            :disabled="reply.likeLoading"
                          >
                            <span class="like-icon">❤️</span>
                            <span class="like-count">{{ reply.likes || 0 }}</span>
                          </button>
                          <button 
                            v-if="user"
                            class="btn-reply"
                            @click="startReply(comment, reply)"
                            title="回复"
                          >
                            💬 回复
                          </button>
                          <button 
                            v-if="user && user.id === reply.user_id"
                            class="btn-delete-comment"
                            @click="deleteComment(reply.id)"
                            :disabled="reply.deleting"
                            :title="reply.deleting ? '删除中...' : '删除评论'"
                          >
                            {{ reply.deleting ? '⏳' : '🗑️' }}
                          </button>
                        </div>
                      </div>
                      <p class="comment-text">
                        <span class="reply-mention" v-if="reply.parent_username">
                          回复 @{{ reply.parent_username }}
                        </span>
                        {{ reply.content }}
                      </p>
                    </div>
                  </div>
                </div>
                
                <!-- 展开更多回复 -->
                <div 
                  v-if="comment.replyCount > 0 && (!comment.replies || comment.replies.length < comment.replyCount)" 
                  class="show-more-replies"
                >
                  <button 
                    class="btn-show-replies"
                    @click="loadReplies(comment)"
                    :disabled="comment.loadingReplies"
                  >
                    {{ comment.loadingReplies ? '加载中...' : `展开 ${comment.replyCount} 条回复 ›` }}
                  </button>
                </div>
              </div>
            </div>
            
            <!-- 空状态 -->
            <div v-if="comments.length === 0" class="no-comments">
              <p>暂无评论，快来发表第一条评论吧！</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 取消关注确认弹窗 -->
    <div v-if="showUnfollowModal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>取消关注</h3>
          <button class="close" @click="cancelUnfollow">&times;</button>
        </div>
        <div class="modal-body">
          <p>确定要取消关注 @{{ guide?.username }} 吗？</p>
          <div class="modal-actions">
            <button class="btn btn-primary" @click="confirmUnfollow">确定</button>
            <button class="btn btn-secondary" @click="cancelUnfollow">取消</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 图片放大模态框 -->
    <div v-if="showImageModal" class="image-modal" @click="closeImageModal">
      <div class="image-modal-content" @click.stop>
        <img
          :src="modalImageUrl"
          :alt="guide.title"
          class="image-modal-img"
        />
        <button class="image-modal-close" @click="closeImageModal">
          ✕
        </button>
        <div class="image-modal-info">
          点击图片外区域或按 ESC 键关闭
        </div>
      </div>
    </div>
    
    <!-- 图集模态框 -->
    <div v-if="showGalleryModal" class="gallery-modal" @click="closeGalleryModal">
      <div class="gallery-modal-content" @click.stop>
        <div class="gallery-modal-header">
          <span class="gallery-counter">{{ galleryCurrentIndex + 1 }} / {{ guide.guide_images.length }}</span>
          <button class="gallery-modal-close" @click="closeGalleryModal">
            ✕
          </button>
        </div>
        
        <div class="gallery-modal-body">
          <div class="gallery-image-container">
            <img
              :src="currentGalleryImage"
              :alt="guide.title + ' image ' + (galleryCurrentIndex + 1)"
              class="gallery-modal-img"
              @load="handleGalleryImageLoad"
              @error="handleGalleryImageError"
            />
            
            <!-- 加载状态 -->
            <div v-if="galleryImageLoading" class="gallery-image-loading">
              <div class="loading-spinner"></div>
              <p>图片加载中...</p>
            </div>
            
            <!-- 错误状态 -->
            <div v-if="galleryImageError" class="gallery-image-error">
              <div class="error-icon">🖼️</div>
              <p>图片加载失败</p>
              <button class="retry-btn" @click="retryLoadGalleryImage">重新加载</button>
            </div>
          </div>
        </div>
        
        <!-- 导航按钮 -->
        <button 
          v-if="galleryCurrentIndex > 0"
          class="gallery-nav-btn gallery-prev"
          @click="prevGalleryImage"
          aria-label="上一张"
        >
          <span class="nav-icon">‹</span>
        </button>
        <button 
          v-if="galleryCurrentIndex < guide.guide_images.length - 1"
          class="gallery-nav-btn gallery-next"
          @click="nextGalleryImage"
          aria-label="下一张"
        >
          <span class="nav-icon">›</span>
        </button>
        
        <!-- 缩略图导航 -->
        <div class="gallery-thumbnails">
          <div 
            v-for="(image, index) in guide.guide_images" 
            :key="index" 
            class="thumbnail-item"
            :class="{ active: galleryCurrentIndex === index }"
            @click="goToGalleryImage(index)"
          >
            <img 
              :src="image" 
              :alt="guide.title + ' thumbnail ' + (index + 1)" 
              class="thumbnail-image"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GuideDetail',
  inject: ['$api'],
  props: {
    user: Object
  },
  emits: ['login-required'],
  data() {
    return {
      guide: null,
      loading: false,
      error: null,
      
      // 评论相关数据
      comments: [],
      newComment: '',
      commentSubmitting: false,
      replyingTo: null,
      totalCommentCount: 0,
      showUnfollowModal: false,
      
      // 图片相关数据
      imageLoading: false,
      imageError: false,
      showImageModal: false,
      modalImageUrl: null,
      imageNaturalSize: { width: 0, height: 0 },
      
      // 图集相关数据
      galleryCurrentIndex: 0,
      showGalleryModal: false,
      galleryImageLoading: false,
      galleryImageError: false,
      canScrollLeft: false,
      canScrollRight: false
    }
  },
  computed: {
    imageClass() {
      if (!this.imageNaturalSize.width || !this.imageNaturalSize.height) {
        return 'image-standard';
      }
      
      const ratio = this.imageNaturalSize.width / this.imageNaturalSize.height;
      
      if (ratio < 0.7) {
        return 'image-portrait';
      } else if (ratio > 1.5) {
        return 'image-landscape';
      } else if (this.imageNaturalSize.width < 400) {
        return 'image-small';
      } else {
        return 'image-standard';
      }
    },
    
    showImageInfo() {
      return this.imageNaturalSize.width > 0 && this.imageNaturalSize.height > 0;
    },
    
    imageType() {
      if (!this.imageNaturalSize.width || !this.imageNaturalSize.height) {
        return '';
      }
      
      const ratio = this.imageNaturalSize.width / this.imageNaturalSize.height;
      
      if (ratio < 0.7) return '竖版';
      if (ratio > 1.5) return '宽版';
      return '方版';
    },
    
    imageSize() {
      if (!this.imageNaturalSize.width || !this.imageNaturalSize.height) {
        return '';
      }
      return `${this.imageNaturalSize.width} × ${this.imageNaturalSize.height}`;
    },
    
    currentGalleryImage() {
      if (!this.guide || !this.guide.guide_images || this.guide.guide_images.length === 0) {
        return '';
      }
      return this.guide.guide_images[this.galleryCurrentIndex];
    }
  },
  mounted() {
    this.fetchGuideDetail();
    // 监听窗口大小变化，更新滚动按钮状态
    window.addEventListener('resize', this.updateScrollButtons);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.updateScrollButtons);
  },
  methods: {
    async fetchGuideDetail() {
      this.loading = true
      this.error = null
      this.imageLoading = true
      
      try {
        const guideId = this.$route.params.id
        console.log('📖 获取攻略详情:', guideId)
        
        const response = await this.$api.get(`/guides/${guideId}`)
        
        if (response && response.guide) {
          // 获取攻略点赞、收藏状态，以及关注状态和用户统计信息
          const [likeStatus, favoriteStatus, followStatus, userStats] = await Promise.all([
            this.getLikeStatus(guideId),
            this.getFavoriteStatus(guideId),
            this.getFollowStatus(response.guide.user_id),
            this.getUserStats(response.guide.user_id)
          ])
          
          this.guide = {
            ...response.guide,
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
          
          // 加载评论
          await this.loadComments(response.comments);
          
          // 更新图集滚动按钮状态
          this.$nextTick(() => {
            this.updateScrollButtons();
          });
        } else {
          throw new Error('攻略未找到')
        }
      } catch (error) {
        console.error('❌ 获取攻略详情失败:', error)
        this.error = error.details || error.error || '获取攻略详情失败'
      } finally {
        this.loading = false
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
        return
      }

      guide.followLoading = true
      
      try {
        const response = await this.$api.post(`/users/${guide.user_id}/follow`)
        
        // 更新关注状态和粉丝数
        guide.following = response.following
        guide.fans_count = response.fans_count
        
      } catch (error) {
        console.error('关注操作失败:', error)
        this.error = '关注操作失败，请重试'
      } finally {
        guide.followLoading = false
      }
    },

    // 确认取消关注
    async confirmUnfollow() {
      if (!this.guide) return

      this.guide.followLoading = true
      
      try {
        const response = await this.$api.post(`/users/${this.guide.user_id}/follow`)
        
        // 更新关注状态和粉丝数
        this.guide.following = response.following
        this.guide.fans_count = response.fans_count
        
      } catch (error) {
        console.error('取消关注操作失败:', error)
        this.error = '取消关注操作失败，请重试'
      } finally {
        this.guide.followLoading = false
        this.showUnfollowModal = false
      }
    },

    // 取消取消关注操作
    cancelUnfollow() {
      this.showUnfollowModal = false
    },

    
    // 加载评论
    async loadComments(comments = []) {
      try {
        console.log('💬 开始加载评论，数量:', comments.length);
        
        // 为后端优化做准备：移除循环API请求，使用默认值
        this.comments = comments.map(comment => ({
          ...comment,
          liked: false, // 占位符
          likeLoading: false,
          animating: false,
          deleting: false,
          loadingReplies: false,
          // 后端将来会直接提供 replyCount，现在暂时使用默认值或后端已有的值
          replyCount: comment.replyCount || 0,
          replies: null // 初始时回复不加载
        }));
        
        const totalReplies = this.comments.reduce((sum, comment) => sum + comment.replyCount, 0);
        this.totalCommentCount = this.comments.length + totalReplies;
        console.log('✅ 评论加载完成');
      } catch (error) {
        console.error('❌ 加载评论失败:', error);
        this.comments = [];
        this.totalCommentCount = 0;
      }
    },

    // 加载回复
    async loadReplies(comment) {
      comment.loadingReplies = true;
      
      try {
        const response = await this.$api.get(`/comments/${comment.id}/replies`);
        
        // 为后端优化做准备：移除循环API请求，使用默认值
        const repliesWithState = response.replies.map(reply => ({
          ...reply,
          liked: false, // 占位符
          likeLoading: false,
          animating: false,
          deleting: false
        }));
        
        // 更新评论的回复列表
        comment.replies = repliesWithState;
        
      } catch (error) {
        console.error('加载回复失败:', error);
        this.error = '加载回复失败，请重试';
      } finally {
        comment.loadingReplies = false;
      }
    },

    // 获取评论点赞状态
    async getCommentLikeStatus(commentId) {
      if (!this.user) {
        return { liked: false }
      }
      
      try {
        const response = await this.$api.get(`/comments/${commentId}/like-status`)
        return response
      } catch (error) {
        console.error('获取评论点赞状态失败:', error)
        return { liked: false }
      }
    },

    // 获取回复数量
    async getReplyCount(commentId) {
      try {
        const response = await this.$api.get(`/comments/${commentId}/reply-count`)
        return response
      } catch (error) {
        console.error('获取回复数量失败:', error)
        return { count: 0 }
      }
    },

    // 评论点赞/取消点赞
    async toggleCommentLike(comment) {
      if (!this.user) {
        this.$emit('login-required')
        return
      }

      comment.likeLoading = true
      
      try {
        const response = await this.$api.post(`/comments/${comment.id}/like`)
        
        // 更新点赞状态和数量
        comment.liked = response.liked
        comment.likes = response.likes
        
        // 触发点赞动画
        comment.animating = true
        setTimeout(() => {
          comment.animating = false
        }, 600)
        
      } catch (error) {
        console.error('评论点赞操作失败:', error)
        this.error = '点赞操作失败，请重试'
      } finally {
        comment.likeLoading = false
      }
    },

    // 开始回复评论
    startReply(comment, reply = null) {
      this.replyingTo = reply || comment
      this.newComment = `@${this.replyingTo.username} `
      
      // 自动聚焦输入框
      this.$nextTick(() => {
        const textarea = this.$refs.commentInput
        if (textarea) {
          textarea.focus()
          textarea.setSelectionRange(this.newComment.length, this.newComment.length)
        }
      })
    },

    // 取消回复
    cancelReply() {
      this.replyingTo = null
      this.newComment = ''
    },

    // 添加评论
    async addComment() {
      if (!this.newComment.trim()) return;
      
      this.commentSubmitting = true;
      
      try {
        const commentData = {
          content: this.newComment.trim(),
        };
        
        // 如果是回复，添加父评论ID
        if (this.replyingTo) {
          commentData.parent_id = this.replyingTo.id;
        }
        
        const response = await this.$api.post(`/guides/${this.guide.id}/comments`, commentData);
        
        // API成功后，直接更新本地数据
        const newCommentData = {
          ...response.comment,
          liked: false,
          likes: 0,
          likeLoading: false,
          animating: false,
          deleting: false,
          // 如果是新评论，初始化回复相关字段
          ...( !response.comment.parent_id && {
            replies: [],
            replyCount: 0,
            loadingReplies: false
          })
        };

        if (response.comment.parent_id) {
          // 这是一个回复
          // 找到要添加回复的顶级评论
          const topLevelParentId = this.replyingTo.parent_id || this.replyingTo.id;
          const topLevelComment = this.comments.find(c => c.id === topLevelParentId);

          if (topLevelComment) {
            if (!topLevelComment.replies) {
              topLevelComment.replies = [];
            }
            topLevelComment.replies.push(newCommentData);
            topLevelComment.replyCount = (topLevelComment.replyCount || 0) + 1;
          } else {
             // 如果找不到父评论，作为后备方案，重新加载所有内容
            console.warn('找不到父评论，将重新加载所有攻略详情。');
            await this.fetchGuideDetail();
          }
        } else {
          // 这是一个新的顶级评论
          this.comments.unshift(newCommentData);
        }
        
        this.newComment = '';
        this.replyingTo = null;
        this.totalCommentCount++;
        
      } catch (error) {
        console.error('发表评论失败:', error);
        this.error = '发表评论失败，请重试';
      } finally {
        this.commentSubmitting = false;
      }
    },

    // 删除评论
    async deleteComment(commentId) {
      if (!confirm('确定要删除这条评论吗？此操作不可恢复。')) {
        return
      }
      
      try {
        // 设置删除状态
        const comment = this.findCommentById(commentId)
        if (comment) {
          comment.deleting = true
        }
        
        await this.$api.delete(`/comments/${commentId}`)
        
        // 从评论列表中移除
        this.removeCommentById(commentId)
        
        this.totalCommentCount--
        
        console.log('✅ 评论删除成功')
        
      } catch (error) {
        console.error('删除评论失败:', error)
        this.error = '删除评论失败，请重试'
        
        // 重置删除状态
        const comment = this.findCommentById(commentId)
        if (comment) {
          comment.deleting = false
        }
      }
    },

    // 辅助方法：根据ID查找评论
    findCommentById(commentId, comments = this.comments) {
      for (let comment of comments) {
        if (comment.id === commentId) {
          return comment
        }
        if (comment.replies) {
          const found = this.findCommentById(commentId, comment.replies)
          if (found) return found
        }
      }
      return null
    },

    // 辅助方法：根据ID移除评论
    removeCommentById(commentId, comments = this.comments) {
      for (let i = 0; i < comments.length; i++) {
        if (comments[i].id === commentId) {
          comments.splice(i, 1)
          return true
        }
        if (comments[i].replies) {
          if (this.removeCommentById(commentId, comments[i].replies)) {
            return true
          }
        }
      }
      return false
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
        
      } catch (error) {
        console.error('收藏操作失败:', error)
        this.error = '收藏操作失败，请重试'
      } finally {
        guide.favoriteLoading = false
      }
    },

    // 图片相关方法
    handleImageLoad(event) {
      this.imageLoading = false;
      this.imageError = false;
      this.imageNaturalSize = {
        width: event.target.naturalWidth,
        height: event.target.naturalHeight
      };
    },

    handleImageError(event) {
      this.imageLoading = false;
      this.imageError = true;
      event.target.src = '/images/f.jpg';
    },

    retryLoadImage() {
      this.imageLoading = true;
      this.imageError = false;
      if (this.$refs.guideImage) {
        this.$refs.guideImage.src = this.guide.cover_image_url;
      }
    },

    openImageInModal(imageUrl) {
      if (!imageUrl) return;
      this.modalImageUrl = imageUrl;
      this.showImageModal = true;
      document.addEventListener('keydown', this.handleKeydown);
    },

    zoomImage() {
      this.openImageInModal(this.guide.cover_image_url);
    },

    closeImageModal() {
      this.showImageModal = false;
      this.modalImageUrl = null;
      document.removeEventListener('keydown', this.handleKeydown);
    },

    handleKeydown(event) {
      if (event.key === 'Escape') {
        this.closeImageModal();
      }
    },

    downloadImage() {
      const link = document.createElement('a');
      link.href = this.guide.cover_image_url;
      link.download = `guide-image-${this.guide.id}.jpg`;
      link.click();
    },

    // 图集相关方法
    openGalleryImage(index) {
      this.galleryCurrentIndex = index;
      this.showGalleryModal = true;
      this.galleryImageLoading = true;
      this.galleryImageError = false;
      document.addEventListener('keydown', this.handleGalleryKeydown);
    },

    closeGalleryModal() {
      this.showGalleryModal = false;
      document.removeEventListener('keydown', this.handleGalleryKeydown);
    },

    handleGalleryKeydown(event) {
      if (event.key === 'Escape') {
        this.closeGalleryModal();
      } else if (event.key === 'ArrowLeft') {
        this.prevGalleryImage();
      } else if (event.key === 'ArrowRight') {
        this.nextGalleryImage();
      }
    },

    prevGalleryImage() {
      if (this.galleryCurrentIndex > 0) {
        this.galleryCurrentIndex--;
        this.galleryImageLoading = true;
        this.galleryImageError = false;
      }
    },

    nextGalleryImage() {
      if (this.guide && this.guide.guide_images && 
          this.galleryCurrentIndex < this.guide.guide_images.length - 1) {
        this.galleryCurrentIndex++;
        this.galleryImageLoading = true;
        this.galleryImageError = false;
      }
    },

    goToGalleryImage(index) {
      this.galleryCurrentIndex = index;
      this.galleryImageLoading = true;
      this.galleryImageError = false;
    },

    handleGalleryImageLoad() {
      this.galleryImageLoading = false;
      this.galleryImageError = false;
    },

    handleGalleryImageError() {
      this.galleryImageLoading = false;
      this.galleryImageError = true;
    },

    retryLoadGalleryImage() {
      this.galleryImageLoading = true;
      this.galleryImageError = false;
    },

    // 图集滚动方法
    scrollGallery(direction) {
      const scrollContainer = this.$refs.galleryScroll;
      if (!scrollContainer) return;
      
      const scrollAmount = 300; // 每次滚动的像素数
      const currentScroll = scrollContainer.scrollLeft;
      
      if (direction === 'left') {
        scrollContainer.scrollTo({
          left: currentScroll - scrollAmount,
          behavior: 'smooth'
        });
      } else {
        scrollContainer.scrollTo({
          left: currentScroll + scrollAmount,
          behavior: 'smooth'
        });
      }
      
      // 更新滚动按钮状态
      this.$nextTick(() => {
        this.updateScrollButtons();
      });
    },

    updateScrollButtons() {
      const scrollContainer = this.$refs.galleryScroll;
      if (!scrollContainer) return;
      
      this.canScrollLeft = scrollContainer.scrollLeft > 0;
      this.canScrollRight = 
        scrollContainer.scrollLeft < 
        (scrollContainer.scrollWidth - scrollContainer.clientWidth);
    },

    goBack() {
      this.$router.back()
    },

    goToLogin() {
      this.$emit('login-required')
    },

    formatDate(dateString) {
      if (!dateString) return '未知时间'
      return new Date(dateString).toLocaleDateString('zh-CN')
    }
  }
}
</script>

<style scoped>
/* 页面整体 */
.guide-detail-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fbff 0%, #f1f2f6 100%);
  padding: 40px 0;
  display: flex;
  justify-content: center;
  position: relative;
}

.guide-detail-page::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 300px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  opacity: 0.03;
  z-index: 0;
}

/* 页面容器 */
.container {
  width: 90%;
  max-width: 900px;
  position: relative;
  z-index: 1;
}

/* 返回按钮 */
.back-section {
  margin-bottom: 25px;
}

.btn-secondary {
  background: linear-gradient(135deg, #95a5a6, #7f8c8d);
  color: white;
  border: none;
  border-radius: 30px;
  padding: 10px 20px;
  font-weight: 500;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  overflow: hidden;
}

.btn-secondary::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s;
}

.btn-secondary:hover::before {
  left: 100%;
}

.btn-secondary:hover {
  transform: translateY(-3px);
  background: linear-gradient(135deg, #7f8c8d, #636e72);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

/* 攻略内容卡片 */
.guide-content {
  background: #fff;
  border-radius: 24px;
  padding: 40px;
  box-shadow: 
    0 10px 40px rgba(0, 0, 0, 0.08),
    0 1px 0 rgba(255, 255, 255, 0.8) inset;
  transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  overflow: hidden;
}

.guide-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #3498db, #9b59b6, #e74c3c);
  opacity: 0.8;
}

.guide-content:hover {
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.12),
    0 1px 0 rgba(255, 255, 255, 0.9) inset;
  transform: translateY(-5px);
}

/* 标题 */
.guide-title {
  font-size: 2.6em;
  font-weight: 800;
  color: #2c3e50;
  margin-bottom: 25px;
  line-height: 1.3;
  text-align: center;
  background: linear-gradient(135deg, #2c3e50, #3498db, #9b59b6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-size: 200% auto;
  animation: shimmer 3s ease-in-out infinite;
  position: relative;
  padding-bottom: 15px;
}

.guide-title::after {
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

/* 图片容器样式 */
.guide-image-container {
  position: relative;
  width: 100%;
  margin: 25px 0;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 
    0 8px 30px rgba(0, 0, 0, 0.12),
    0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.guide-image-container:hover {
  transform: translateY(-5px);
  box-shadow: 
    0 15px 40px rgba(0, 0, 0, 0.18),
    0 5px 15px rgba(0, 0, 0, 0.1);
}

/* 图片自适应样式 */
.guide-image {
  transition: all 0.4s ease;
  display: block;
  border-radius: 16px;
  background: white;
  padding: 8px;
  max-width: 100%;
  height: auto;
}

/* 不同图片类型的自适应样式 */
.guide-image.image-standard {
  max-height: 500px;
  width: auto;
  max-width: 100%;
}

.guide-image.image-portrait {
  max-height: 600px;
  max-width: 70%;
  height: auto;
}

.guide-image.image-landscape {
  max-height: 400px;
  width: 100%;
  object-fit: contain;
}

.guide-image.image-small {
  max-width: 50%;
  height: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

/* 图片加载状态 */
.image-loading {
  width: 100%;
  height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
  gap: 15px;
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
  width: 100%;
  height: 300px;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
  gap: 12px;
}

.error-icon {
  font-size: 48px;
  opacity: 0.5;
}

.retry-btn {
  background: #3498db;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.3s ease;
  margin-top: 8px;
}

.retry-btn:hover {
  background: #2980b9;
  transform: translateY(-1px);
}

/* 图片操作工具栏 */
.image-toolbar {
  position: absolute;
  top: 15px;
  right: 15px;
  display: flex;
  gap: 8px;
  opacity: 0;
  transform: translateY(-10px);
  transition: all 0.3s ease;
  z-index: 10;
}

.guide-image-container:hover .image-toolbar {
  opacity: 1;
  transform: translateY(0);
}

.toolbar-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.toolbar-btn:hover {
  background: white;
  transform: scale(1.1);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
}

.toolbar-btn:active {
  transform: scale(0.95);
}

/* 图片信息显示 */
.image-info {
  position: absolute;
  bottom: 15px;
  left: 15px;
  display: flex;
  gap: 10px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
  background: rgba(0, 0, 0, 0.6);
  padding: 6px 12px;
  border-radius: 12px;
  backdrop-filter: blur(5px);
}

.image-type, .image-size {
  font-weight: 500;
}

/* 图片放大模态框 */
.image-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  opacity: 0;
  animation: fadeIn 0.3s ease forwards;
}

.image-modal-content {
  max-width: 90%;
  max-height: 90%;
  position: relative;
  transform: scale(0.8);
  animation: zoomIn 0.3s ease 0.1s forwards;
}

.image-modal-img {
  max-width: 100%;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.image-modal-close {
  position: absolute;
  top: -50px;
  right: 0;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 20px;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.image-modal-close:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: rotate(90deg);
}

.image-modal-info {
  position: absolute;
  bottom: -60px;
  left: 0;
  right: 0;
  text-align: center;
  color: white;
  font-size: 14px;
  opacity: 0.8;
}

@keyframes zoomIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 文档下载 */
.document-download {
  margin: 25px 0;
  text-align: center;
}

/* 元信息 */
.guide-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 15px;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
  justify-content: center;
}

.region-tag {
  padding: 8px 16px;
  border-radius: 25px;
  font-size: 14px;
  font-weight: 600;
  color: white;
  box-shadow: 0 4px 15px rgba(0,0,0,0.15);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.region-tag::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  transition: left 0.5s;
}

.region-tag:hover::before {
  left: 100%;
}

.region-tag.japan {
  background: linear-gradient(135deg, #e74c3c, #ff6b6b);
}

.region-tag.china {
  background: linear-gradient(135deg, #3498db, #74b9ff);
}

.region-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.2);
}

.location {
  font-weight: 500;
  color: #555;
  padding: 6px 12px;
  background: #f8f9fa;
  border-radius: 15px;
  transition: all 0.3s ease;
}

.location:hover {
  background: #e9ecef;
  transform: translateY(-1px);
}

.views, .likes, .favorites {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #666;
  font-size: 14px;
  padding: 5px 10px;
  background: #f8f9fa;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.views:hover, .likes:hover, .favorites:hover {
  background: #e9ecef;
  transform: translateY(-1px);
}

/* 攻略正文 */
.guide-body {
  margin-bottom: 35px;
}

.guide-text {
  font-size: 17px;
  line-height: 1.9;
  color: #444;
  white-space: pre-line;
  letter-spacing: 0.3px;
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  padding: 25px;
  border-radius: 16px;
  border-left: 4px solid #3498db;
  box-shadow: inset 0 2px 10px rgba(0,0,0,0.04);
}

/* 作者信息卡 */
.author-info {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 22px;
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  border-radius: 18px;
  margin-bottom: 35px;
  box-shadow: 
    0 4px 20px rgba(0,0,0,0.06),
    inset 0 1px 0 rgba(255,255,255,0.8);
  transition: all 0.4s ease;
  position: relative;
  overflow: hidden;
}

.author-info::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #3498db, #9b59b6);
  opacity: 0.6;
}

.author-info:hover {
  transform: translateY(-3px);
  box-shadow: 
    0 8px 30px rgba(0,0,0,0.1),
    inset 0 1px 0 rgba(255,255,255,0.9);
}

.author-details {
  flex: 1;
}

.author-stats {
  margin: 6px 0;
}

.fans-count {
  font-size: 13px;
  color: #666;
  background: #e9ecef;
  padding: 3px 8px;
  border-radius: 10px;
  display: inline-block;
}

.follow-btn {
  padding: 8px 20px;
  border: 1px solid #3498db;
  border-radius: 20px;
  background: white;
  color: #3498db;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(52, 152, 219, 0.2);
}

.follow-btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(52, 152, 219, 0.1);
  border-radius: 50%;
  transition: all 0.4s ease;
  transform: translate(-50%, -50%);
}

.follow-btn:hover::before {
  width: 100%;
  height: 100%;
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
  box-shadow: 0 2px 10px rgba(108, 117, 125, 0.2);
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

/* 弹窗样式 */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: white;
  border-radius: 20px;
  width: 90%;
  max-width: 420px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
  animation: slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  overflow: hidden;
}

@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to { 
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  padding: 25px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
}

.modal-body {
  padding: 25px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 25px;
}

.close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  transition: all 0.3s ease;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close:hover {
  background: #f8f9fa;
  color: #666;
}

.author-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #3498db;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
}

.author-avatar:hover {
  transform: rotate(-8deg) scale(1.1);
  box-shadow: 0 8px 25px rgba(52, 152, 219, 0.4);
}

.author-name {
  font-weight: 700;
  color: #2c3e50;
  font-size: 16px;
  margin-bottom: 4px;
}

.post-time {
  font-size: 13px;
  color: #999;
  background: #f8f9fa;
  padding: 3px 8px;
  border-radius: 10px;
  display: inline-block;
}

/* 点赞与收藏 */
.action-buttons {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-bottom: 30px;
}

.like-btn, .favorite-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 30px;
  border: 2px solid #e0e0e0;
  border-radius: 50px;
  background: white;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0,0,0,0.08);
}

.like-btn::before, .favorite-btn::before {
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

.like-btn:hover::before, .favorite-btn:hover::before {
  width: 100%;
  height: 100%;
}

.like-btn:hover, .favorite-btn:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 25px rgba(0,0,0,0.15);
}

/* 点赞按钮 */
.like-btn.liked {
  background: linear-gradient(135deg, #ffeaea, #ffcccc);
  border-color: #ff6b6b;
  color: #e84118;
  box-shadow: 0 6px 20px rgba(255, 107, 107, 0.3);
}

/* 收藏按钮 */
.favorite-btn.favorited {
  background: linear-gradient(135deg, #fff7e0, #ffeaa7);
  border-color: #f1c40f;
  color: #e67e22;
  box-shadow: 0 6px 20px rgba(241, 196, 15, 0.3);
}

/* 按钮动画 */
.like-btn.animating, .favorite-btn.animating {
  animation: pop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes pop {
  0% { transform: scale(1); }
  25% { transform: scale(1.3); }
  50% { transform: scale(0.9); }
  75% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

/* 登录提示 */
.login-prompt {
  text-align: center;
  padding: 22px;
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  border-radius: 16px;
  margin-bottom: 25px;
  color: #555;
  box-shadow: 0 4px 15px rgba(0,0,0,0.06);
  border: 1px solid rgba(255,255,255,0.8);
}

.login-prompt a {
  color: #3498db;
  cursor: pointer;
  font-weight: 600;
  text-decoration: none;
  position: relative;
  padding-bottom: 2px;
}

.login-prompt a::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: #3498db;
  transition: width 0.3s ease;
}

.login-prompt a:hover::after {
  width: 100%;
}

/* 评论区域样式 */
.comments-section {
  margin-top: 45px;
  padding-top: 35px;
  border-top: 1px solid #eee;
  position: relative;
}

.comments-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 3px;
  background: linear-gradient(90deg, transparent, #3498db, transparent);
  border-radius: 2px;
}

.comments-title {
  font-size: 1.6em;
  margin-bottom: 25px;
  color: #2c3e50;
  font-weight: 700;
  text-align: center;
  position: relative;
  padding-bottom: 12px;
}

.comments-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 2px;
  background: linear-gradient(90deg, #3498db, #9b59b6);
  border-radius: 1px;
}

.comment-form {
  margin-bottom: 35px;
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  padding: 25px;
  border-radius: 18px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.06);
  border: 1px solid rgba(255,255,255,0.8);
}

.comment-form textarea.replying {
  border-color: #3498db;
  background: linear-gradient(135deg, #f8fdff, #ffffff);
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.reply-info {
  background: linear-gradient(135deg, #e3f2fd, #f0f8ff);
  padding: 12px 16px;
  border-radius: 12px;
  margin: 12px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #1976d2;
  border-left: 4px solid #3498db;
}

.btn-cancel-reply {
  background: none;
  border: 1px solid #1976d2;
  color: #1976d2;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s ease;
  font-weight: 500;
}

.btn-cancel-reply:hover {
  background: #1976d2;
  color: white;
  transform: translateY(-1px);
}

.comments-list {
  margin-top: 25px;
}

.comment-item {
  display: flex;
  gap: 18px;
  margin-bottom: 25px;
  padding-bottom: 25px;
  border-bottom: 1px solid #f0f0f0;
  transition: all 0.3s ease;
}

.comment-item:hover {
  background: #fafafa;
  border-radius: 12px;
  padding: 15px;
  margin: -5px -10px 20px -10px;
}

.comment-item.top-level {
  background: linear-gradient(135deg, #fafafa, #ffffff);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid #f0f0f0;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  position: relative;
}

.comment-item.top-level::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(135deg, #3498db, #9b59b6);
  border-radius: 4px 0 0 4px;
}

.reply-item {
  margin-left: 55px;
  border-left: 3px solid #e8e8e8;
  padding-left: 18px;
  position: relative;
}

.reply-item::before {
  content: '';
  position: absolute;
  left: -3px;
  top: 20px;
  width: 12px;
  height: 12px;
  background: #3498db;
  border-radius: 50%;
  opacity: 0.6;
}

.comment-avatar {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  border: 2px solid #e0e0e0;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.comment-avatar:hover {
  transform: scale(1.1);
  border-color: #3498db;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
  flex-wrap: wrap;
  gap: 12px;
}

.comment-user {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.comment-user strong {
  color: #2c3e50;
  font-weight: 700;
  background: linear-gradient(135deg, #2c3e50, #3498db);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.comment-time {
  font-size: 12px;
  color: #999;
  background: #f8f9fa;
  padding: 3px 8px;
  border-radius: 10px;
}

.comment-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.comment-like-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 12px;
  color: #666;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}

.comment-like-btn:hover {
  background: #f5f5f5;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.comment-like-btn.liked {
  background: #fff0f0;
  border-color: #ff6b6b;
  color: #ff6b6b;
  box-shadow: 0 2px 8px rgba(255, 107, 107, 0.2);
}

.comment-like-btn.animating {
  animation: likeAnimation 0.6s ease;
}

.comment-like-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-reply {
  background: none;
  border: 1px solid #666;
  color: #666;
  padding: 4px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s ease;
  font-weight: 500;
}

.btn-reply:hover {
  background: #666;
  color: white;
  transform: translateY(-1px);
}

.btn-delete-comment {
  background: none;
  border: 1px solid #e74c3c;
  color: #e74c3c;
  padding: 4px 10px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s ease;
}

.btn-delete-comment:hover:not(:disabled) {
  background: #e74c3c;
  color: white;
  transform: translateY(-1px);
}

.btn-delete-comment:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.comment-text {
  margin: 0;
  line-height: 1.6;
  color: #444;
  word-break: break-word;
  font-size: 14px;
}

.reply-mention {
  color: #3498db;
  font-weight: 600;
  margin-right: 6px;
  background: #e3f2fd;
  padding: 1px 6px;
  border-radius: 6px;
}

.replies-section {
  margin-top: 18px;
  border-top: 1px solid #f5f5f5;
  padding-top: 18px;
}

.show-more-replies {
  margin-top: 12px;
}

.btn-show-replies {
  background: none;
  border: none;
  color: #3498db;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.3s ease;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 8px;
  background: #f8f9fa;
}

.btn-show-replies:hover:not(:disabled) {
  color: #2980b9;
  background: #e9ecef;
  transform: translateY(-1px);
}

.btn-show-replies:disabled {
  color: #999;
  cursor: not-allowed;
  background: #f8f9fa;
}

.no-comments {
  text-align: center;
  padding: 50px 20px;
  color: #666;
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
}

.no-comments p {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

/* 表单控件 */
.form-control {
  width: 100%;
  padding: 14px 18px;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  font-size: 14px;
  transition: all 0.3s ease;
  font-family: inherit;
  resize: vertical;
  min-height: 90px;
  background: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.form-control:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 
    0 0 0 3px rgba(52, 152, 219, 0.1),
    0 4px 15px rgba(0,0,0,0.08);
  transform: translateY(-1px);
}

.btn-primary {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 12px 24px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
  position: relative;
  overflow: hidden;
}

.btn-primary::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s;
}

.btn-primary:hover::before {
  left: 100%;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(52, 152, 219, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
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

.mt-2 {
  margin-top: 12px;
}

/* 加载状态 */
.loading {
  text-align: center;
  padding: 90px 20px;
  color: #555;
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.08);
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

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 错误提示 */
.error {
  background: linear-gradient(135deg, #ffe6e6, #ffcccc);
  border: 1px solid #e74c3c;
  color: #c0392b;
  padding: 25px;
  border-radius: 16px;
  text-align: center;
  margin: 30px 0;
  font-weight: 600;
  box-shadow: 0 6px 20px rgba(231, 76, 60, 0.15);
  border-left: 4px solid #e74c3c;
}

/* 图集样式 - 优化版 */
.guide-images-gallery {
  margin: 40px 0;
  padding-top: 30px;
  border-top: 1px solid #f0f0f0;
}

.gallery-title {
  font-size: 1.6em;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 25px;
  text-align: center;
  position: relative;
  padding-bottom: 10px;
}

.gallery-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 50px;
  height: 2px;
  background: linear-gradient(90deg, #3498db, #9b59b6);
}

.gallery-container {
  position: relative;
  margin: 0 auto;
  overflow: hidden;
  border-radius: 16px;
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.06);
}

.gallery-scroll-container {
  overflow-x: auto;
  scroll-behavior: smooth;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e0 #f7fafc;
  padding-bottom: 10px;
}

.gallery-scroll-container::-webkit-scrollbar {
  height: 6px;
}

.gallery-scroll-container::-webkit-scrollbar-track {
  background: #f7fafc;
  border-radius: 3px;
}

.gallery-scroll-container::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 3px;
}

.gallery-scroll-container::-webkit-scrollbar-thumb:hover {
  background: #a0aec0;
}

.image-grid {
  display: flex;
  gap: 15px;
  padding: 5px;
  width: max-content;
}

.grid-item {
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  box-shadow: 0 5px 20px rgba(0,0,0,0.08);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  cursor: pointer;
  flex-shrink: 0;
  width: 180px;
  height: 180px;
}

.grid-item:hover {
  transform: translateY(-8px) scale(1.05);
  box-shadow: 0 12px 30px rgba(0,0,0,0.15);
}

.grid-item.active {
  border: 3px solid #3498db;
  box-shadow: 0 8px 25px rgba(52, 152, 219, 0.3);
}

.gallery-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.grid-item:hover .gallery-image {
  transform: scale(1.1);
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 50%);
  opacity: 0;
  transition: opacity 0.3s ease;
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  padding: 12px;
}

.grid-item:hover .image-overlay {
  opacity: 1;
}

.image-number {
  color: white;
  font-weight: 600;
  font-size: 14px;
  background: rgba(0,0,0,0.6);
  padding: 4px 8px;
  border-radius: 6px;
}

/* 滚动按钮 */
.scroll-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  box-shadow: 0 4px 15px rgba(0,0,0,0.15);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 10;
  backdrop-filter: blur(5px);
}

.scroll-btn:hover {
  background: white;
  transform: translateY(-50%) scale(1.1);
  box-shadow: 0 6px 20px rgba(0,0,0,0.2);
}

.scroll-btn:active {
  transform: translateY(-50%) scale(0.95);
}

.scroll-left {
  left: 10px;
}

.scroll-right {
  right: 10px;
}

.scroll-icon {
  font-size: 20px;
  font-weight: bold;
  color: #2c3e50;
}

/* 图集模态框 - 自适应屏幕优化 */
.gallery-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 4000;
  opacity: 0;
  animation: fadeIn 0.3s ease forwards;
}

.gallery-modal-content {
  width: 95%;
  max-width: 95vw;
  height: 95%;
  max-height: 95vh;
  background: #1a1a1a;
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  transform: scale(0.9);
  animation: zoomIn 0.3s ease 0.1s forwards;
  display: flex;
  flex-direction: column;
}

.gallery-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  background: rgba(0, 0, 0, 0.8);
  border-bottom: 1px solid #333;
  flex-shrink: 0;
}

.gallery-counter {
  color: white;
  font-weight: 600;
  font-size: 16px;
}

.gallery-modal-close {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 20px;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.gallery-modal-close:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: rotate(90deg);
}

.gallery-modal-body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30px;
  position: relative;
  overflow: hidden;
}

.gallery-image-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.gallery-modal-img {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  transition: transform 0.3s ease;
}

/* 图集导航按钮 */
.gallery-nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 10;
  backdrop-filter: blur(10px);
  font-size: 24px;
}

.gallery-nav-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-50%) scale(1.1);
}

.gallery-nav-btn:active {
  transform: translateY(-50%) scale(0.95);
}

.gallery-prev {
  left: 30px;
}

.gallery-next {
  right: 30px;
}

.nav-icon {
  font-weight: bold;
}

/* 图集缩略图导航 */
.gallery-thumbnails {
  display: flex;
  gap: 10px;
  padding: 20px 30px;
  background: rgba(0, 0, 0, 0.8);
  border-top: 1px solid #333;
  overflow-x: auto;
  scrollbar-width: none;
  flex-shrink: 0;
}

.gallery-thumbnails::-webkit-scrollbar {
  display: none;
}

.thumbnail-item {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  opacity: 0.6;
  transition: all 0.3s ease;
  flex-shrink: 0;
  border: 2px solid transparent;
}

.thumbnail-item:hover {
  opacity: 0.8;
  transform: scale(1.05);
}

.thumbnail-item.active {
  opacity: 1;
  border-color: #3498db;
  transform: scale(1.1);
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 图集图片加载状态 */
.gallery-image-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  gap: 15px;
}

.gallery-image-error {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  gap: 12px;
  text-align: center;
}

/* 响应式优化 */
@media (max-width: 768px) {
  .guide-title {
    font-size: 2.2em;
  }

  .guide-content {
    padding: 25px;
  }

  .comment-item {
    flex-direction: column;
    gap: 12px;
  }

  .comment-avatar {
    width: 40px;
    height: 40px;
  }

  .reply-item {
    margin-left: 30px;
  }

  .comment-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .comment-actions {
    align-self: flex-end;
  }
  
  .action-buttons {
    flex-direction: column;
    align-items: center;
    gap: 15px;
  }
  
  .like-btn, .favorite-btn {
    width: 100%;
    justify-content: center;
  }
  
  /* 移动端图片优化 */
  .guide-image.image-portrait {
    max-width: 85%;
    max-height: 500px;
  }
  
  .guide-image.image-small {
    max-width: 70%;
  }
  
  .image-toolbar {
    opacity: 1;
    transform: translateY(0);
    background: rgba(255, 255, 255, 0.8);
    border-radius: 20px;
    padding: 4px;
    top: 10px;
    right: 10px;
  }
  
  /* 移动端图集优化 */
  .grid-item {
    width: 150px;
    height: 150px;
  }
  
  .gallery-nav-btn {
    width: 50px;
    height: 50px;
    font-size: 20px;
  }
  
  .gallery-prev {
    left: 15px;
  }
  
  .gallery-next {
    right: 15px;
  }
  
  .gallery-modal-body {
    padding: 15px;
  }
  
  .thumbnail-item {
    width: 50px;
    height: 50px;
  }
  
  /* 移动端图集模态框优化 */
  .gallery-modal-content {
    width: 98%;
    height: 98%;
    max-width: 98vw;
    max-height: 98vh;
  }
  
  .gallery-modal-header {
    padding: 15px 20px;
  }
  
  .gallery-thumbnails {
    padding: 15px 20px;
  }
}

@media (max-width: 480px) {
  .guide-title {
    font-size: 1.8em;
  }

  .guide-content {
    padding: 20px;
  }

  .reply-item {
    margin-left: 20px;
  }

  .comment-actions {
    align-self: stretch;
    justify-content: flex-end;
  }
  
  .guide-meta {
    flex-direction: column;
    gap: 10px;
  }
  
  .modal-content {
    width: 95%;
    margin: 20px;
  }
  
  /* 移动端图片优化 */
  .guide-image.image-portrait {
    max-width: 90%;
    max-height: 400px;
  }
  
  .guide-image.image-small {
    max-width: 80%;
  }
  
  .image-info {
    font-size: 10px;
    padding: 4px 8px;
  }
  
  /* 移动端图集优化 */
  .grid-item {
    width: 120px;
    height: 120px;
  }
  
  .gallery-container {
    padding: 15px;
  }
  
  .gallery-nav-btn {
    width: 40px;
    height: 40px;
    font-size: 18px;
  }
  
  .gallery-prev {
    left: 10px;
  }
  
  .gallery-next {
    right: 10px;
  }
  
  .thumbnail-item {
    width: 40px;
    height: 40px;
  }
  
  .gallery-thumbnails {
    padding: 15px 20px;
  }
}

/* 大屏幕优化 */
@media (min-width: 1200px) {
  .gallery-modal-content {
    max-width: 1200px;
    max-height: 90vh;
  }
  
  .gallery-modal-img {
    max-width: 90%;
    max-height: 90%;
  }
}

/* 超大屏幕优化 */
@media (min-width: 1600px) {
  .gallery-modal-content {
    max-width: 1400px;
  }
  
  .gallery-modal-img {
    max-width: 85%;
    max-height: 85%;
  }
}

/* 横屏优化 */
@media (max-height: 600px) and (orientation: landscape) {
  .gallery-modal-content {
    height: 98vh;
    max-height: 98vh;
  }
  
  .gallery-modal-body {
    padding: 15px;
  }
  
  .gallery-thumbnails {
    padding: 10px 15px;
  }
  
  .thumbnail-item {
    width: 50px;
    height: 50px;
  }
}
</style>