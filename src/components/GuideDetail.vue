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
        
        <!-- 攻略文件 -->
        <div class="guide-file-container">
          <img
            v-if="!isWordDocument"
            :src="guide.image_url"
            :alt="guide.title"
            class="guide-image"
            @error="handleImageError"
          >
          <div v-else class="word-document-download">
            <a :href="guide.image_url" target="_blank" rel="noopener noreferrer" class="btn btn-primary">
              下载攻略文档
            </a>
          </div>
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
        
        <!-- 攻略内容 -->
        <div class="guide-body">
          <p class="guide-text">{{ guide.content }}</p>
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
      showUnfollowModal: false
    }
  },
  computed: {
    isWordDocument() {
      if (this.guide && this.guide.image_url) {
        const url = this.guide.image_url.toLowerCase();
        return url.endsWith('.doc') || url.endsWith('.docx');
      }
      return false;
    }
  },
  mounted() {
    this.fetchGuideDetail()
  },
  methods: {
    async fetchGuideDetail() {
      this.loading = true
      this.error = null
      
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
          await this.loadComments(response.comments)
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
        
        // 为每个评论获取点赞状态和回复数量
        this.comments = await Promise.all(
          comments.map(async (comment) => {
            try {
              let likeStatus = { liked: false };
              let replyCount = { count: 0 };
              
              // 获取点赞状态
              try {
                likeStatus = await this.getCommentLikeStatus(comment.id);
              } catch (error) {
                console.warn(`获取评论 ${comment.id} 点赞状态失败:`, error);
              }
              
              // 获取回复数量
              try {
                replyCount = await this.getReplyCount(comment.id);
              } catch (error) {
                console.warn(`获取评论 ${comment.id} 回复数量失败:`, error);
              }
              
              return {
                ...comment,
                liked: likeStatus.liked,
                likeLoading: false,
                animating: false,
                deleting: false,
                loadingReplies: false,
                replyCount: replyCount.count || 0,
                replies: null
              };
            } catch (error) {
              console.error(`处理评论 ${comment.id} 失败:`, error);
              return {
                ...comment,
                liked: false,
                likeLoading: false,
                animating: false,
                deleting: false,
                loadingReplies: false,
                replyCount: 0,
                replies: null
              };
            }
          })
        );
        
        this.totalCommentCount = this.comments.length;
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
        
        // 为每个回复获取点赞状态
        const repliesWithLikeStatus = await Promise.all(
          response.replies.map(async (reply) => {
            try {
              const likeStatus = await this.getCommentLikeStatus(reply.id);
              return {
                ...reply,
                liked: likeStatus.liked,
                likeLoading: false,
                animating: false,
                deleting: false
              };
            } catch (error) {
              console.error(`处理回复 ${reply.id} 失败:`, error);
              return {
                ...reply,
                liked: false,
                likeLoading: false,
                animating: false,
                deleting: false
              };
            }
          })
        );
        
        // 更新评论的回复列表
        comment.replies = repliesWithLikeStatus;
        
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
      if (!this.newComment.trim()) return
      
      this.commentSubmitting = true
      
      try {
        const commentData = {
          content: this.newComment.trim()
        }
        
        // 如果是回复，添加父评论ID
        if (this.replyingTo) {
          commentData.parent_id = this.replyingTo.id
        }
        
        const response = await this.$api.post(`/guides/${this.guide.id}/comments`, commentData)
        
        if (this.replyingTo) {
          // 如果是回复，重新加载回复列表
          await this.loadReplies(this.replyingTo.parent_id ? this.comments.find(c => c.id === this.replyingTo.parent_id) : this.replyingTo)
        } else {
          // 如果是新评论，重新加载所有评论
          await this.fetchGuideDetail()
        }
        
        this.newComment = ''
        this.replyingTo = null
        
        this.$nextTick(() => {
          this.totalCommentCount++
        })
        
      } catch (error) {
        console.error('发表评论失败:', error)
        this.error = '发表评论失败，请重试'
      } finally {
        this.commentSubmitting = false
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

    goBack() {
      this.$router.back()
    },

    goToLogin() {
      this.$emit('login-required')
    },

    handleImageError(event) {
      event.target.src = '/images/f.jpg'
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
}

/* 页面容器 */
.container {
  width: 90%;
  max-width: 900px;
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
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  transform: translateY(-2px);
  background: linear-gradient(135deg, #7f8c8d, #636e72);
}

/* 攻略内容卡片 */
.guide-content {
  background: #fff;
  border-radius: 20px;
  padding: 35px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.4s ease;
}

.guide-content:hover {
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.12);
}

/* 标题 */
.guide-title {
  font-size: 2.4em;
  font-weight: 800;
  color: #2c3e50;
  margin-bottom: 20px;
  line-height: 1.3;
  text-align: center;
  background: linear-gradient(90deg, #3498db, #9b59b6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* 图片 */
.guide-image {
  width: 100%;
  height: 420px;
  object-fit: cover;
  border-radius: 16px;
  transition: all 0.4s ease;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

.guide-file-container {
  margin-bottom: 25px;
}

.word-document-download {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  background-color: #f7f9fb;
  border: 2px dashed #e0e0e0;
  border-radius: 16px;
  padding: 40px;
}

.guide-image:hover {
  transform: scale(1.02);
}

/* 元信息 */
.guide-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 15px;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ececec;
  justify-content: center;
}

.region-tag {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  color: white;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}

.region-tag.japan {
  background: linear-gradient(135deg, #e74c3c, #ff7675);
}

.region-tag.china {
  background: linear-gradient(135deg, #3498db, #74b9ff);
}

.location {
  font-weight: 500;
  color: #555;
}

.views, .likes, .favorites {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #666;
  font-size: 14px;
}

/* 攻略正文 */
.guide-body {
  margin-bottom: 30px;
}

.guide-text {
  font-size: 17px;
  line-height: 1.9;
  color: #333;
  white-space: pre-line;
  letter-spacing: 0.3px;
}

/* 作者信息卡 */
.author-info {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 18px 22px;
  background: #f7f9fb;
  border-radius: 12px;
  margin-bottom: 30px;
  box-shadow: inset 0 0 6px rgba(0,0,0,0.05);
  position: relative;
}

.author-details {
  flex: 1;
}

.author-stats {
  margin: 5px 0;
}

.fans-count {
  font-size: 13px;
  color: #666;
}

.follow-btn {
  padding: 6px 16px;
  border: 1px solid #3498db;
  border-radius: 18px;
  background: white;
  color: #3498db;
  font-size: 13px;
  font-weight: 500;
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
  z-index: 2000;
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

.author-avatar {
  width: 55px;
  height: 55px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #3498db;
  transition: transform 0.3s ease;
}

.author-avatar:hover {
  transform: rotate(-5deg) scale(1.05);
}

.author-name {
  font-weight: 600;
  color: #2c3e50;
  font-size: 15px;
}

.post-time {
  font-size: 13px;
  color: #999;
}

/* 点赞与收藏 */
.action-buttons {
  display: flex;
  justify-content: center;
  gap: 25px;
  margin-bottom: 25px;
}

.like-btn, .favorite-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 26px;
  border: 2px solid #e0e0e0;
  border-radius: 50px;
  background: white;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.like-btn:hover, .favorite-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 14px rgba(0,0,0,0.1);
}

/* 点赞按钮 */
.like-btn.liked {
  background: linear-gradient(135deg, #ffeaea, #ffcccc);
  border-color: #ff6b6b;
  color: #e84118;
}

/* 收藏按钮 */
.favorite-btn.favorited {
  background: linear-gradient(135deg, #fff7e0, #ffeaa7);
  border-color: #f1c40f;
  color: #e67e22;
}

/* 按钮动画 */
.like-btn.animating, .favorite-btn.animating {
  animation: pop 0.4s ease;
}

@keyframes pop {
  0% { transform: scale(1); }
  40% { transform: scale(1.2); }
  70% { transform: scale(0.95); }
  100% { transform: scale(1); }
}

/* 登录提示 */
.login-prompt {
  text-align: center;
  padding: 18px;
  background: #f7f9fb;
  border-radius: 12px;
  margin-bottom: 20px;
  color: #555;
}

.login-prompt a:hover {
  text-decoration: underline;
}

/* 评论区域样式 */
.comments-section {
  margin-top: 40px;
  padding-top: 30px;
  border-top: 1px solid #eee;
}

.comments-title {
  font-size: 1.5em;
  margin-bottom: 20px;
  color: #2c3e50;
  font-weight: 700;
}

.comment-form {
  margin-bottom: 30px;
}

.comment-form textarea.replying {
  border-color: #3498db;
  background-color: #f8fdff;
}

.reply-info {
  background: #e3f2fd;
  padding: 8px 12px;
  border-radius: 6px;
  margin: 8px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #1976d2;
}

.btn-cancel-reply {
  background: none;
  border: 1px solid #1976d2;
  color: #1976d2;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s ease;
}

.btn-cancel-reply:hover {
  background: #1976d2;
  color: white;
}

.comments-list {
  margin-top: 20px;
}

.comment-item {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.comment-item.top-level {
  background: #fafafa;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  border: 1px solid #eee;
}

.reply-item {
  margin-left: 50px;
  border-left: 3px solid #e0e0e0;
  padding-left: 15px;
}

.comment-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
  flex-wrap: wrap;
  gap: 10px;
}

.comment-user {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.comment-user strong {
  color: #2c3e50;
  font-weight: 600;
}

.comment-time {
  font-size: 12px;
  color: #999;
}

.comment-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.comment-like-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 12px;
  color: #666;
}

.comment-like-btn:hover {
  background: #f5f5f5;
}

.comment-like-btn.liked {
  background: #fff0f0;
  border-color: #ff6b6b;
  color: #ff6b6b;
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
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s ease;
}

.btn-reply:hover {
  background: #666;
  color: white;
}

.btn-delete-comment {
  background: none;
  border: 1px solid #e74c3c;
  color: #e74c3c;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s ease;
}

.btn-delete-comment:hover:not(:disabled) {
  background: #e74c3c;
  color: white;
}

.btn-delete-comment:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.comment-text {
  margin: 0;
  line-height: 1.5;
  color: #333;
  word-break: break-word;
}

.reply-mention {
  color: #3498db;
  font-weight: 500;
  margin-right: 5px;
}

.replies-section {
  margin-top: 15px;
  border-top: 1px solid #f0f0f0;
  padding-top: 15px;
}

.show-more-replies {
  margin-top: 10px;
}

.btn-show-replies {
  background: none;
  border: none;
  color: #3498db;
  cursor: pointer;
  font-size: 13px;
  transition: color 0.3s ease;
}

.btn-show-replies:hover:not(:disabled) {
  color: #2980b9;
  text-decoration: underline;
}

.btn-show-replies:disabled {
  color: #999;
  cursor: not-allowed;
}

.no-comments {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.no-comments p {
  margin: 0;
  font-size: 16px;
}

/* 表单控件 */
.form-control {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.3s ease;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
}

.form-control:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.1);
}

.btn-primary {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
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
  margin-top: 10px;
}

/* 加载状态 */
.loading {
  text-align: center;
  padding: 80px 20px;
  color: #555;
}

.spinner {
  width: 55px;
  height: 55px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 错误提示 */
.error {
  background: #ffe6e6;
  border: 1px solid #e74c3c;
  color: #c0392b;
  padding: 20px;
  border-radius: 10px;
  text-align: center;
  margin: 25px 0;
  font-weight: 500;
}


/* 响应式优化 */
@media (max-width: 768px) {
  .guide-title {
    font-size: 2em;
  }

  .guide-image {
    height: 280px;
  }

  .guide-content {
    padding: 22px;
  }

  .comment-item {
    flex-direction: column;
    gap: 10px;
  }

  .comment-avatar {
    width: 35px;
    height: 35px;
  }

  .reply-item {
    margin-left: 25px;
  }

  .comment-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .comment-actions {
    align-self: flex-end;
  }
}

@media (max-width: 480px) {
  .guide-title {
    font-size: 1.6em;
  }

  .action-buttons {
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .like-btn, .favorite-btn {
    width: 100%;
    justify-content: center;
  }

  .reply-item {
    margin-left: 15px;
  }

  .comment-actions {
    align-self: stretch;
    justify-content: flex-end;
  }
}
</style>