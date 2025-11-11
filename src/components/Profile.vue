<template>
  <div class="profile">
    <div class="container">
      <!-- 用户信息卡片 -->
      <div class="user-card card" v-if="user">
        <div class="user-header">
          <img :src="user.avatar" :alt="user.username" class="user-avatar">
          <div class="user-details">
            <h2 class="username">{{ user.username }}</h2>
            <p class="user-email">{{ user.email }}</p>
            <p class="member-since">会员 since {{ formatDate(user.created_at) }}</p>
          </div>
        </div>
      </div>

      <!-- 未登录提示 -->
      <div v-else class="not-logged-in card">
        <div class="card-body text-center">
          <h3>请先登录</h3>
          <p>登录后可以查看和管理您的个人主页</p>
          <button class="btn btn-primary" @click="$emit('login-required')">立即登录</button>
        </div>
      </div>

      <!-- 主要内容区域 -->
      <div class="main-content" v-if="user">
        <!-- 功能切换按钮 -->
        <div class="tab-buttons">
          <button 
            class="tab-btn"
            :class="{ 'active': activeTab === 'publish' }"
            @click="activeTab = 'publish'"
          >
            📝 发布攻略
          </button>
          <button 
            class="tab-btn"
            :class="{ 'active': activeTab === 'likes' }"
            @click="activeTab = 'likes'"
          >
            ❤️ 我的点赞
          </button>
          <button 
            class="tab-btn"
            :class="{ 'active': activeTab === 'favorites' }"
            @click="activeTab = 'favorites'"
          >
            ⭐ 我的收藏
          </button>
          <button 
            class="tab-btn"
            :class="{ 'active': activeTab === 'myGuides' }"
            @click="activeTab = 'myGuides'"
          >
            📚 我的攻略
          </button>
        </div>

        <!-- 发布攻略区域 -->
        <section class="tab-content" v-show="activeTab === 'publish'">
          <div class="card">
            <div class="card-body">
              <h3 class="section-title">发布新攻略</h3>
              
              <form @submit.prevent="publishGuide" class="guide-form">
                <div class="form-row">
                  <div class="form-group">
                    <label>攻略标题 *</label>
                    <input 
                      type="text" 
                      class="form-control" 
                      v-model="newGuide.title"
                      placeholder="请输入攻略标题"
                      required
                    >
                  </div>
                  
                  <div class="form-group">
                    <label>地区 *</label>
                    <select v-model="newGuide.region" class="form-control" required>
                      <option value="">请选择地区</option>
                      <option value="日本">日本</option>
                      <option value="中国">中国</option>
                    </select>
                  </div>
                </div>
                
                <div class="form-row">
                  <div class="form-group">
                    <label>具体地点 *</label>
                    <input 
                      type="text" 
                      class="form-control" 
                      v-model="newGuide.location"
                      placeholder="例如：东京、北京、大阪..."
                      required
                    >
                  </div>
                </div>

                <!-- 图片上传区域 -->
                <div class="form-group">
                  <label>封面文件（图片或文档）</label>
                  <div class="image-upload-section">
                    <!-- 图片预览 -->
                    <div v-if="imagePreview" class="image-preview">
                      <img :src="imagePreview" alt="预览图片" class="preview-img">
                      <button type="button" class="btn btn-danger btn-sm" @click="removeImage">
                        移除图片
                      </button>
                    </div>
                    
                    <!-- 文件上传 -->
                    <div class="file-upload-area">
                      <input 
                        type="file" 
                        ref="fileInput"
                        class="file-input" 
                        accept="image/jpeg,image/png,image/gif,image/webp,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        @change="handleFileSelect"
                      >
                      <div 
                        class="upload-placeholder" 
                        @click="triggerFileInput"
                        @dragover="handleDragOver"
                        @dragleave="handleDragLeave"
                        @drop="handleDrop"
                      >
                        <div class="upload-icon">📁</div>
                        <p class="upload-text">点击选择文件或拖拽到此处</p>
                        <p class="upload-hint">支持 JPG, PNG, GIF, WebP, DOC, DOCX, 最大 5MB</p>
                      </div>
                    </div>

                    <!-- 上传进度 -->
                    <div v-if="uploading" class="upload-progress">
                      <div class="progress-bar">
                        <div 
                          class="progress-fill" 
                          :style="{ width: uploadProgress + '%' }"
                        ></div>
                      </div>
                      <span class="progress-text">{{ uploadProgress }}%</span>
                    </div>

                    <!-- 图片URL输入（备用） -->
                    <div class="image-url-input mt-2">
                      <label>或者输入图片URL：(请输入http://localhost:3000/)为前缀</label>
                      <input 
                        type="url" 
                        class="form-control" 
                        v-model="newGuide.image_url"
                        placeholder="https://example.com/image.jpg"
                        @input="updateImagePreview"
                      >
                    </div>
                    
                    <!-- 图片示例 -->
                    <div class="image-examples mt-2">
                      <p class="example-title">快速选择示例图片：</p>
                      <div class="example-images">
                        <div 
                          v-for="example in exampleImages" 
                          :key="example.url"
                          class="example-image"
                          @click="selectExampleImage(example)"
                        >
                          <img :src="example.url" :alt="example.name" class="example-img">
                          <span class="example-name">{{ example.name }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="form-group">
                  <label>攻略内容 *</label>
                  <textarea 
                    class="form-control" 
                    v-model="newGuide.content"
                    placeholder="请详细描述你的旅行经历、tips、推荐景点等..."
                    rows="8"
                    required
                  ></textarea>
                </div>
                
                <div class="form-actions">
                  <button 
                    type="submit" 
                    class="btn btn-success"
                    :disabled="publishing || uploading"
                  >
                    {{ publishing ? '发布中...' : '发布攻略' }}
                  </button>
                  <button 
                    type="button" 
                    class="btn btn-primary"
                    @click="resetForm"
                  >
                    重置
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>

        <!-- 我的点赞区域 -->
        <section class="tab-content" v-show="activeTab === 'likes'">
          <div class="card">
            <div class="card-body">
              <div class="section-header">
                <h3 class="section-title">我的点赞 ❤️</h3>
                <div class="likes-stats">
                  <span class="stats-item">共 {{ likedGuides.length }} 篇</span>
                </div>
              </div>
              
              <div v-if="likesLoading" class="loading">
                <div class="spinner"></div>
                <p>加载点赞列表中...</p>
              </div>
              
              <div v-else-if="likesError" class="error">
                {{ likesError }}
              </div>
              
              <div v-else-if="likedGuides.length === 0" class="no-likes">
                <div class="empty-state">
                  <div class="empty-icon">❤️</div>
                  <h4>暂无点赞</h4>
                  <p>你还没有点赞任何攻略</p>
                  <p class="hint">浏览攻略时点击❤️即可点赞</p>
                </div>
              </div>
              
              <div v-else class="likes-list">
                <div 
                  v-for="guide in likedGuides" 
                  :key="guide.id" 
                  class="like-item"
                >
                  <div class="like-content">
                    <img 
                      :src="guide.image_url" 
                      :alt="guide.title" 
                      class="like-img"
                      @error="handleImageError"
                      @click="viewGuideDetail(guide.id)"
                    >
                    <div class="like-details">
                      <h4 class="like-title" @click="viewGuideDetail(guide.id)">{{ guide.title }}</h4>
                      <div class="like-meta">
                        <span class="region-tag" :class="guide.region === '日本' ? 'japan' : 'china'">
                          {{ guide.region }}
                        </span>
                        <span class="location">{{ guide.location }}</span>
                      </div>
                      <div class="like-stats">
                        <span class="views">👁️ {{ guide.views }}</span>
                        <span class="likes">❤️ {{ guide.likes }}</span>
                        <span class="favorites">⭐ {{ guide.favorites }}</span>
                      </div>
                      <div class="author-info">
                        <img :src="guide.avatar || '/images/f.jpg'" :alt="guide.username" class="author-avatar">
                        <span class="author-name">{{ guide.username }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="like-actions">
                    <button 
                      class="btn btn-primary btn-sm"
                      @click="viewGuideDetail(guide.id)"
                    >
                      查看详情
                    </button>
                    <button 
                      class="btn btn-danger btn-sm"
                      @click="removeFromLikes(guide.id)"
                      :disabled="guide.removing"
                    >
                      {{ guide.removing ? '取消中...' : '取消点赞' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 我的收藏区域 -->
        <section class="tab-content" v-show="activeTab === 'favorites'">
          <div class="card">
            <div class="card-body">
              <div class="section-header">
                <h3 class="section-title">我的收藏 ⭐</h3>
                <div class="favorites-stats">
                  <span class="stats-item">共 {{ favoriteGuides.length }} 篇</span>
                </div>
              </div>
              
              <div v-if="favoritesLoading" class="loading">
                <div class="spinner"></div>
                <p>加载收藏中...</p>
              </div>
              
              <div v-else-if="favoritesError" class="error">
                {{ favoritesError }}
              </div>
              
              <div v-else-if="favoriteGuides.length === 0" class="no-favorites">
                <div class="empty-state">
                  <div class="empty-icon">⭐</div>
                  <h4>暂无收藏</h4>
                  <p>你还没有收藏任何攻略</p>
                  <p class="hint">浏览攻略时点击⭐即可收藏</p>
                </div>
              </div>
              
              <div v-else class="favorites-list">
                <div 
                  v-for="guide in favoriteGuides" 
                  :key="guide.id" 
                  class="favorite-item"
                >
                  <div class="favorite-content">
                    <img 
                      :src="guide.image_url" 
                      :alt="guide.title" 
                      class="favorite-img"
                      @error="handleImageError"
                      @click="viewGuideDetail(guide.id)"
                    >
                    <div class="favorite-details">
                      <h4 class="favorite-title" @click="viewGuideDetail(guide.id)">{{ guide.title }}</h4>
                      <div class="favorite-meta">
                        <span class="region-tag" :class="guide.region === '日本' ? 'japan' : 'china'">
                          {{ guide.region }}
                        </span>
                        <span class="location">{{ guide.location }}</span>
                      </div>
                      <div class="favorite-stats">
                        <span class="views">👁️ {{ guide.views }}</span>
                        <span class="likes">❤️ {{ guide.likes }}</span>
                        <span class="favorites">⭐ {{ guide.favorites }}</span>
                      </div>
                      <div class="author-info">
                        <img :src="guide.avatar || '/images/f.jpg'" :alt="guide.username" class="author-avatar">
                        <span class="author-name">{{ guide.username }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="favorite-actions">
                    <button 
                      class="btn btn-primary btn-sm"
                      @click="viewGuideDetail(guide.id)"
                    >
                      查看详情
                    </button>
                    <button 
                      class="btn btn-danger btn-sm"
                      @click="removeFromFavorites(guide.id)"
                      :disabled="guide.removing"
                    >
                      {{ guide.removing ? '移除中...' : '取消收藏' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 我的攻略列表 -->
        <section class="tab-content" v-show="activeTab === 'myGuides'">
          <div class="card">
            <div class="card-body">
              <div class="section-header">
                <h3 class="section-title">我的攻略</h3>
                <div class="guides-stats">
                  <span class="stats-item">共 {{ myGuides.length }} 篇</span>
                </div>
              </div>
              
              <div v-if="loading" class="loading">
                <div class="spinner"></div>
                <p>加载中...</p>
              </div>
              
              <div v-else-if="error" class="error">
                {{ error }}
              </div>
              
              <div v-else-if="myGuides.length === 0" class="no-data">
                <div class="empty-state">
                  <div class="empty-icon">📝</div>
                  <h4>暂无攻略</h4>
                  <p>你还没有发布过任何攻略</p>
                  <p class="hint">分享你的旅行经历，帮助其他旅行者吧！</p>
                </div>
              </div>
              
              <div v-else class="guides-grid grid grid-2">
                <div 
                  v-for="guide in myGuides" 
                  :key="guide.id" 
                  class="guide-card"
                >
                  <img 
                    :src="guide.image_url" 
                    :alt="guide.title" 
                    class="card-img"
                    @error="handleImageError"
                    @click="viewGuideDetail(guide.id)"
                  >
                  <div class="card-body">
                    <div class="guide-header">
                      <div class="guide-meta">
                        <span class="region-tag" :class="guide.region === '日本' ? 'japan' : 'china'">
                          {{ guide.region }}
                        </span>
                        <span class="location">{{ guide.location }}</span>
                      </div>
                      <div class="guide-stats">
                        <span>👁️ {{ guide.views }}</span>
                        <span>❤️ {{ guide.likes }}</span>
                        <span>⭐ {{ guide.favorites }}</span>
                      </div>
                    </div>
                    
                    <h3 class="card-title" @click="viewGuideDetail(guide.id)">{{ guide.title }}</h3>
                    <p class="card-text">{{ guide.content.substring(0, 150) }}...</p>
                    
                    <div class="guide-footer">
                      <span class="post-time">{{ formatDate(guide.created_at) }}</span>
                      <div class="guide-actions">
                        <button 
                          class="btn btn-primary btn-sm"
                          @click="editGuide(guide)"
                        >
                          编辑
                        </button>
                        <button 
                          class="btn btn-danger btn-sm"
                          @click="deleteGuide(guide.id)"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Profile',
  inject: ['$api'],
  props: {
    user: Object
  },
  emits: ['login-required', 'show-message'],
  data() {
    return {
      activeTab: 'publish', // 默认显示发布攻略
      myGuides: [],
      likedGuides: [],      // 点赞的攻略
      favoriteGuides: [],   // 收藏的攻略
      loading: false,
      likesLoading: false,
      favoritesLoading: false,
      likesError: null,
      favoritesError: null,
      error: null,
      publishing: false,
      uploading: false,
      uploadProgress: 0,
      imagePreview: '',
      selectedFile: null,
      exampleImages: [
        { 
          name: '富士山', 
          url: '/images/banner1.jpg' 
        },
        { 
          name: '长城', 
          url: '/images/banner2.jpg' 
        },
        { 
          name: '京都', 
          url: '/images/banner3.jpg' 
        },
        { 
          name: '桂林', 
          url: '/images/banner4.jpg' 
        }
      ],
      newGuide: {
        title: '',
        content: '',
        region: '',
        location: '',
        image_url: ''
      }
    }
  },
  mounted() {
    if (this.user) {
      this.fetchMyGuides()
      this.fetchLikes()
      this.fetchFavorites()
    }
  },
  methods: {
    // 查看攻略详情（和Home.vue保持一致）
    async viewGuideDetail(guideId) {
      try {
        console.log('📖 查看攻略详情:', guideId);
        
        // 使用路由跳转到攻略详情页
        this.$router.push(`/guide/${guideId}`);
        
      } catch (error) {
        console.error('❌ 跳转失败:', error);
        this.$emit('show-message', {
          type: 'error', 
          text: '跳转失败，请重试'
        });
      }
    },

    async fetchMyGuides() {
      this.loading = true
      this.error = null
      
      try {
        const guides = await this.$api.get('/user/guides')
        this.myGuides = guides
      } catch (error) {
        this.error = '获取我的攻略失败'
        console.error('Error fetching my guides:', error)
      } finally {
        this.loading = false
      }
    },

    // 获取点赞的攻略
    async fetchLikes() {
      this.likesLoading = true
      this.likesError = null
      
      try {
        // 使用点赞接口获取用户点赞的攻略
        const response = await this.$api.get('/user/likes')
        
        if (response && response.guides) {
          this.likedGuides = response.guides.map(guide => ({
            ...guide,
            removing: false
          }))
        } else {
          this.likedGuides = []
        }
        
      } catch (error) {
        console.error('获取点赞列表失败:', error)
        this.likesError = error.details || error.error || '获取点赞列表失败'
        this.likedGuides = []
      } finally {
        this.likesLoading = false
      }
    },

    // 获取收藏的攻略
    async fetchFavorites() {
      this.favoritesLoading = true
      this.favoritesError = null
      
      try {
        // 使用收藏接口获取用户收藏的攻略
        const response = await this.$api.get('/user/favorites')
        
        if (response && response.guides) {
          this.favoriteGuides = response.guides.map(guide => ({
            ...guide,
            removing: false
          }))
        } else {
          this.favoriteGuides = []
        }
        
      } catch (error) {
        console.error('获取收藏列表失败:', error)
        this.favoritesError = error.details || error.error || '获取收藏列表失败'
        this.favoriteGuides = []
      } finally {
        this.favoritesLoading = false
      }
    },

    // 从点赞中移除
    async removeFromLikes(guideId) {
      const guide = this.likedGuides.find(g => g.id === guideId)
      if (!guide) return
      
      guide.removing = true
      
      try {
        // 取消点赞
        await this.$api.post(`/guides/${guideId}/like`)
        
        // 从点赞列表中移除
        this.likedGuides = this.likedGuides.filter(g => g.id !== guideId)
        
      } catch (error) {
        console.error('取消点赞失败:', error)
        this.likesError = '取消点赞失败，请重试'
      } finally {
        guide.removing = false
      }
    },

    // 从收藏中移除
    async removeFromFavorites(guideId) {
      const guide = this.favoriteGuides.find(g => g.id === guideId)
      if (!guide) return
      
      guide.removing = true
      
      try {
        // 取消收藏
        await this.$api.post(`/guides/${guideId}/favorite`)
        
        // 从收藏列表中移除
        this.favoriteGuides = this.favoriteGuides.filter(g => g.id !== guideId)
        
      } catch (error) {
        console.error('移除收藏失败:', error)
        this.favoritesError = '移除收藏失败，请重试'
      } finally {
        guide.removing = false
      }
    },

    async publishGuide() {
      if (!this.validateForm()) return
      
      this.publishing = true
      this.error = null
      
      try {
        // 如果没有设置图片，使用默认图片
        const guideData = {
          ...this.newGuide,
          image_url: this.newGuide.image_url || '/images/f.jpg'
        }
        
        await this.$api.post('/guides', guideData)
        
        this.$emit('show-message', {
          type: 'success',
          text: '攻略发布成功！'
        });
        
        this.resetForm()
        this.fetchMyGuides()
        // 发布成功后切换到我的攻略页面
        this.activeTab = 'myGuides'
      } catch (error) {
        this.error = error.details || error.error || '发布攻略失败'
        console.error('Error publishing guide:', error)
        this.$emit('show-message', {
          type: 'error',
          text: this.error
        });
      } finally {
        this.publishing = false
      }
    },
    
    async deleteGuide(guideId) {
      if (!confirm('确定要删除这篇攻略吗？此操作不可恢复。')) {
        return
      }
      
      this.loading = true
      this.error = null
      
      try {
        console.log('🗑️ 开始删除攻略:', guideId)
        
        const response = await this.$api.delete(`/guides/${guideId}`)
        console.log('✅ 删除响应:', response)
        
        if (response.message === '攻略删除成功') {
          this.$emit('show-message', {
            type: 'success',
            text: '攻略删除成功！'
          });
          await this.fetchMyGuides()
          // 同时从点赞和收藏列表中移除
          this.likedGuides = this.likedGuides.filter(g => g.id !== guideId)
          this.favoriteGuides = this.favoriteGuides.filter(g => g.id !== guideId)
        } else {
          throw new Error(response.error || '删除失败')
        }
      } catch (error) {
        console.error('❌ 删除攻略失败:', error)
        this.error = error.message || '删除攻略失败，请重试'
        this.$emit('show-message', {
          type: 'error',
          text: this.error
        });
      } finally {
        this.loading = false
      }
    },
    
    editGuide(guide) {
      // 简单的编辑功能 - 填充表单
      this.newGuide = { 
        title: guide.title,
        content: guide.content,
        region: guide.region,
        location: guide.location,
        image_url: guide.image_url
      }
      this.imagePreview = guide.image_url
      // 切换到发布攻略页面
      this.activeTab = 'publish'
    },
    
    resetForm() {
      this.newGuide = {
        title: '',
        content: '',
        region: '',
        location: '',
        image_url: ''
      }
      this.imagePreview = ''
      this.selectedFile = null
      this.uploadProgress = 0
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = ''
      }
    },
    
    validateForm() {
      if (!this.newGuide.title.trim()) {
        this.error = '请输入攻略标题'
        return false
      }
      
      if (!this.newGuide.region) {
        this.error = '请选择地区'
        return false
      }
      
      if (!this.newGuide.location.trim()) {
        this.error = '请输入具体地点'
        return false
      }
      
      if (!this.newGuide.content.trim()) {
        this.error = '请输入攻略内容'
        return false
      }
      
      this.error = null
      return true
    },
    
    handleImageError(event) {
      event.target.src = '/images/f.jpg'
    },
    
    formatDate(dateString) {
      if (!dateString) return '未知时间'
      return new Date(dateString).toLocaleDateString('zh-CN')
    },

    // 文件上传相关方法保持不变...
    triggerFileInput() {
      this.$refs.fileInput.click()
    },
    
    handleFileSelect(event) {
      const file = event.target.files[0]
      if (!file) return

      const isImage = file.type.startsWith('image/')
      const isWord = file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.doc') || file.name.endsWith('.docx')

      if (!isImage && !isWord) {
        this.error = '请选择图片或Word文档'
        return
      }
      
      if (file.size > 5 * 1024 * 1024) {
        this.error = '文件大小不能超过 5MB'
        return
      }
      
      if (isImage) {
        const reader = new FileReader()
        reader.onload = (e) => {
          this.imagePreview = e.target.result
        }
        reader.readAsDataURL(file)
      } else {
        // For Word docs, we can show a generic icon.
        this.imagePreview = '/images/keji.png'
      }
      
      this.selectedFile = file
      this.uploadImage()
    },
    
    async uploadImage() {
      if (!this.selectedFile) return
      
      this.uploading = true
      this.uploadProgress = 0
      this.error = null
      
      try {
        const formData = new FormData()
        formData.append('image', this.selectedFile)
        
        const xhr = new XMLHttpRequest()
        
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            this.uploadProgress = Math.round((event.loaded / event.total) * 100)
          }
        })
        
        const uploadPromise = new Promise((resolve, reject) => {
          xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
              try {
                const result = JSON.parse(xhr.responseText)
                resolve(result)
              } catch (e) {
                reject(new Error('服务器响应格式错误'))
              }
            } else if (xhr.status === 413) {
              reject(new Error('文件太大，请选择小于5MB的文件'))
            } else if (xhr.status === 415) {
              reject(new Error('不支持的文件格式'))
            } else {
              reject(new Error('上传失败，服务器错误'))
            }
          })
          xhr.addEventListener('error', () => reject(new Error('网络连接失败')))
        })
        
        const token = localStorage.getItem('token')
        
        xhr.open('POST', 'http://localhost:3000/api/upload')
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`)
        }
        xhr.send(formData)
        
        const result = await uploadPromise
        
        this.newGuide.image_url = result.imageUrl
        // Only update preview if it's an image
        if (this.selectedFile.type.startsWith('image/')) {
          this.imagePreview = result.imageUrl
        }
        this.selectedFile = null
        
        console.log('✅ 文件上传成功:', result.imageUrl)
        
      } catch (error) {
        console.error('❌ 文件上传失败:', error)
        this.error = '文件上传失败: ' + error.message
        this.removeImage()
      } finally {
        this.uploading = false
        this.uploadProgress = 0
      }
    },
    
    removeImage() {
      this.newGuide.image_url = ''
      this.imagePreview = ''
      this.selectedFile = null
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = ''
      }
    },
    
    updateImagePreview() {
      if (this.newGuide.image_url) {
        this.imagePreview = this.newGuide.image_url
      } else {
        this.imagePreview = ''
      }
    },
    
    selectExampleImage(example) {
      this.newGuide.image_url = example.url
      this.imagePreview = example.url
      this.selectedFile = null
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = ''
      }
    }
  },
  watch: {
    user: {
      handler(newUser) {
        if (newUser) {
          this.fetchMyGuides()
          this.fetchLikes()
          this.fetchFavorites()
        }
      },
      immediate: true
    }
  }
}
</script>

<style scoped>
/* 标签按钮样式 */
.tab-buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  border-bottom: 2px solid #e9ecef;
  padding-bottom: 10px;
  flex-wrap: wrap;
}

.tab-btn {
  padding: 12px 20px;
  border: none;
  border-radius: 8px 8px 0 0;
  background: #f8f9fa;
  color: #6c757d;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 3px solid transparent;
  white-space: nowrap;
}

.tab-btn:hover {
  background: #e9ecef;
  color: #495057;
  transform: translateY(-1px);
}

.tab-btn.active {
  background: #3498db;
  color: white;
  border-bottom-color: #2980b9;
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3);
}

/* 标签内容区域 */
.tab-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 我的点赞和收藏区域样式 */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.likes-stats,
.favorites-stats,
.guides-stats {
  font-size: 14px;
  color: #666;
}

.stats-item {
  background: #f8f9fa;
  padding: 4px 12px;
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.no-likes,
.no-favorites,
.no-data {
  text-align: center;
  padding: 40px 20px;
}

.empty-state {
  color: #6c757d;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.empty-state h4 {
  margin-bottom: 10px;
  color: #495057;
}

.likes-list,
.favorites-list {
  max-height: 600px;
  overflow-y: auto;
}

.like-item,
.favorite-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  margin-bottom: 12px;
  transition: all 0.3s ease;
  background: white;
}

.like-item:hover,
.favorite-item:hover {
  border-color: #3498db;
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.1);
  transform: translateY(-1px);
}

.like-content,
.favorite-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.like-img,
.favorite-img {
  width: 80px;
  height: 60px;
  object-fit: cover;
  border-radius: 6px;
  flex-shrink: 0;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.like-img:hover,
.favorite-img:hover {
  transform: scale(1.05);
}

.like-details,
.favorite-details {
  flex: 1;
  min-width: 0;
}

.like-title,
.favorite-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 5px;
  color: #2c3e50;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}

.like-title:hover,
.favorite-title:hover {
  color: #3498db;
}

.like-meta,
.favorite-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 5px;
  flex-wrap: wrap;
}

.like-stats,
.favorite-stats {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
  flex-wrap: wrap;
}

.like-stats span,
.favorite-stats span {
  display: flex;
  align-items: center;
  gap: 3px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 5px;
}

.author-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
}

.author-name {
  font-size: 12px;
  color: #666;
}

.like-actions,
.favorite-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

/* 我的攻略网格布局 */
.guides-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.guide-card {
  border: 1px solid #e9ecef;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  background: white;
}

.guide-card:hover {
  border-color: #3498db;
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.15);
  transform: translateY(-2px);
}

.card-img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.card-img:hover {
  transform: scale(1.05);
}

.card-body {
  padding: 20px;
}

.guide-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 10px;
}

.guide-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.guide-stats {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: #666;
  flex-wrap: wrap;
}

.guide-stats span {
  display: flex;
  align-items: center;
  gap: 3px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
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
  line-height: 1.6;
  margin-bottom: 15px;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.guide-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #eee;
  flex-wrap: wrap;
  gap: 10px;
}

.post-time {
  font-size: 12px;
  color: #999;
}

.guide-actions {
  display: flex;
  gap: 8px;
}

/* 地区标签样式 */
.region-tag {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  color: white;
}

.region-tag.japan {
  background: #e74c3c;
}

.region-tag.china {
  background: #3498db;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .tab-buttons {
    flex-direction: column;
    gap: 5px;
  }
  
  .tab-btn {
    border-radius: 8px;
    margin-bottom: 5px;
    text-align: center;
  }
  
  .like-item,
  .favorite-item {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .like-actions,
  .favorite-actions {
    justify-content: flex-end;
  }
  
  .like-content,
  .favorite-content {
    gap: 15px;
  }
  
  .like-img,
  .favorite-img {
    width: 100px;
    height: 75px;
  }
  
  .guides-grid {
    grid-template-columns: 1fr;
  }
  
  .guide-header {
    flex-direction: column;
    gap: 10px;
  }
  
  .guide-footer {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}

/* 加载和错误状态样式 */
.loading {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  background: #ffe6e6;
  color: #d63031;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #ffcccc;
  margin-bottom: 20px;
}

/* 表单样式保持不变 */
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #2c3e50;
}

.form-control {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.3s ease;
}

.form-control:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 25px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2980b9;
  transform: translateY(-1px);
}

.btn-success {
  background: #27ae60;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #219a52;
  transform: translateY(-1px);
}

.btn-danger {
  background: #e74c3c;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c0392b;
  transform: translateY(-1px);
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

/* 图片上传区域样式保持不变 */
.image-upload-section {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 20px;
  background: #fafafa;
}

.image-preview {
  text-align: center;
  margin-bottom: 15px;
}

.preview-img {
  max-width: 300px;
  max-height: 200px;
  border-radius: 6px;
  margin-bottom: 10px;
}

.file-upload-area {
  position: relative;
}

.file-input {
  display: none;
}

.upload-placeholder {
  text-align: center;
  padding: 30px;
  border: 2px dashed #ccc;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
}

.upload-placeholder:hover {
  border-color: #3498db;
  background: #f8f9fa;
}

.upload-placeholder.drag-over {
  border-color: #3498db;
  background: #e3f2fd;
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.upload-text {
  font-size: 16px;
  color: #666;
  margin-bottom: 5px;
}

.upload-hint {
  font-size: 12px;
  color: #999;
}

.upload-progress {
  margin-top: 15px;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 5px;
}

.progress-fill {
  height: 100%;
  background: #3498db;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  color: #666;
}

.image-url-input {
  margin-top: 15px;
}

.image-examples {
  margin-top: 15px;
}

.example-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
}

.example-images {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 10px;
}

.example-image {
  text-align: center;
  cursor: pointer;
  transition: transform 0.3s ease;
  flex-shrink: 0;
}

.example-image:hover {
  transform: scale(1.05);
}

.example-img {
  width: 80px;
  height: 60px;
  object-fit: cover;
  border-radius: 6px;
  border: 2px solid transparent;
}

.example-image:hover .example-img {
  border-color: #3498db;
}

.example-name {
  display: block;
  font-size: 12px;
  color: #666;
  margin-top: 5px;
}

/* 用户卡片样式保持不变 */
.user-card {
  margin-bottom: 30px;
}

.user-header {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
}

.user-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #3498db;
}

.user-details {
  flex: 1;
}

.username {
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 5px;
}

.user-email {
  color: #666;
  margin-bottom: 5px;
}

.member-since {
  color: #999;
  font-size: 14px;
}

.not-logged-in {
  text-align: center;
  padding: 40px 20px;
}

.mt-2 {
  margin-top: 10px;
}

.text-center {
  text-align: center;
}
</style>