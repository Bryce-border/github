<template>
  <header class="header">
    <div class="container">
      <!-- 移动端汉堡菜单 -->
      <div class="mobile-menu-toggle" @click="toggleMobileMenu">
        <div class="hamburger" :class="{ 'active': isMobileMenuOpen }">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      <div class="header-content">
        <!-- 左侧：Logo和首页 -->
        <div class="header-left">
          <div class="logo" @click="goHome">
            <h1>🌱 旅行攻略</h1>
            <span class="tagline">来一场说走就走的旅行吧！</span>
          </div>
        </div>
        
        <!-- 右侧：用户区域和个人主页 -->
        <div class="header-right" :class="{ 'mobile-open': isMobileMenuOpen }">
          <!-- 桌面端导航 -->
          <nav class="nav desktop-nav">
            <a :class="['nav-link', { active: $route.path === '/' }]" @click="goHomeAndCloseMenu">
             🌐 首页
            </a>
            <a 
              v-if="user" 
              :class="['nav-link', { active: $route.path === '/profile' }]" 
              @click="goProfileAndCloseMenu"
            >
              📝 个人主页
            </a>
          </nav>
          
          <!-- 移动端导航 -->
          <nav class="nav mobile-nav">
            <a :class="['nav-link', { active: $route.path === '/' }]" @click="goHomeAndCloseMenu">
              🏠 首页
            </a>
            <a 
              v-if="user" 
              :class="['nav-link', { active: $route.path === '/profile' }]" 
              @click="goProfileAndCloseMenu"
            >
              👤 个人主页
            </a>
          </nav>
          
          <div class="user-section">
            <template v-if="user">
              <!-- 桌面端用户信息 -->
              <div class="user-info desktop-user">
                <div class="avatar-container" @click="showAvatarSelector = true" title="点击修改头像">
                  <img :src="user.avatar" :alt="user.username" class="avatar">
                  <div class="avatar-edit-overlay">
                    <span>✏️</span>
                  </div>
                </div>
                <div class="user-details">
                  <span class="username">{{ user.username }}</span>
                  <span class="user-email">{{ user.email }}</span>
                </div>
                <button class="btn-ghost red" @click="$emit('logout')">
                  🚪 退出
                </button>
              </div>
              
              <!-- 移动端用户信息 -->
              <div class="user-info mobile-user">
                <div class="avatar-container" @click="handleMobileEditAvatar" title="点击修改头像">
                  <img :src="user.avatar" :alt="user.username" class="avatar">
                  <div class="avatar-edit-overlay">
                    <span>✏️</span>
                  </div>
                </div>
                <div class="user-details">
                  <span class="username">{{ user.username }}</span>
                </div>
                <div class="mobile-actions">
                  <button class="btn-ghost blue btn-sm" @click="handleMobileEditAvatar">
                    修改头像
                  </button>
                  <button class="btn-ghost red btn-sm" @click="handleMobileLogout">
                    🚪 退出
                  </button>
                </div>
              </div>
            </template>
            <template v-else>
              <!-- 桌面端登录注册 -->
              <div class="auth-buttons desktop-auth">
                <button class="btn-ghost teal" @click="$emit('login')">
                  🔑 登录
                </button>
                <button class="btn-ghost blue" @click="$emit('register')">
                  ✨ 注册
                </button>
              </div>
              
              <!-- 移动端登录注册 -->
              <div class="auth-buttons mobile-auth">
                <button class="btn-ghost teal btn-sm" @click="handleMobileAuth('login')">
                  🔑 登录
                </button>
                <button class="btn-ghost blue btn-sm" @click="handleMobileAuth('register')">
                  ✨ 注册
                </button>
              </div>
            </template>
          </div>
        </div>

        <!-- 移动端菜单遮罩 -->
        <div 
          class="mobile-overlay" 
          :class="{ 'active': isMobileMenuOpen }"
          @click="closeMobileMenu"
        ></div>
      </div>
    </div>

    <!-- 头像选择器模态框 -->
    <transition name="fade-zoom">
      <div v-if="showAvatarSelector" class="modal">
        <div class="modal-content avatar-selector-modal">
          <div class="modal-header">
            <h3>选择头像</h3>
            <button class="close" @click="showAvatarSelector = false">&times;</button>
          </div>
          <div class="modal-body">
            <div class="avatar-grid">
              <div 
                v-for="(avatar, index) in defaultAvatars" 
                :key="index"
                class="avatar-option"
                :class="{ 'selected': selectedAvatar === avatar }"
                @click="selectAvatar(avatar)"
              >
                <img :src="avatar" :alt="`默认头像 ${index + 1}`" class="avatar-preview">
                <div class="avatar-check" v-if="selectedAvatar === avatar">✓</div>
              </div>
            </div>
            <div class="avatar-actions">
              <button class="btn btn-primary" @click="confirmAvatarChange" :disabled="avatarChanging">
                <span v-if="avatarChanging" class="loading-spinner"></span>
                {{ avatarChanging ? '更新中...' : '确认更换' }}
              </button>
              <button class="btn btn-secondary" @click="showAvatarSelector = false">取消</button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </header>
</template>

<script>
export default {
  name: 'Header',
  inject: ['$api'],
  props: {
    user: Object
  },
  data() {
    return {
      isMobileMenuOpen: false,
      showAvatarSelector: false,
      avatarChanging: false,
      selectedAvatar: null,
      defaultAvatars: [
        '/images/f.jpg',
        '/images/f 1.jpg', 
        '/images/f 2.jpg',
        '/images/f 3.jpg',
        '/images/f 4.jpg',
        '/images/f 5.jpg',
        '/images/f 6.jpg',
        '/images/f 7.jpg',
        '/images/f 8.jpg'
      ]
    }
  },
  mounted() {
    if (this.user) {
      this.selectedAvatar = this.user.avatar;
    }
  },
  methods: {
    goHome() {
      this.$router.push('/');
    },
    goProfile() {
      if (this.user) {
        this.$router.push('/profile');
      } else {
        this.$emit('login-required');
      }
    },
    goHomeAndCloseMenu() {
      this.goHome();
      this.closeMobileMenu();
    },
    goProfileAndCloseMenu() {
      this.goProfile();
      this.closeMobileMenu();
    },
    toggleMobileMenu() {
      this.isMobileMenuOpen = !this.isMobileMenuOpen;
    },
    closeMobileMenu() {
      this.isMobileMenuOpen = false;
    },
    handleMobileAuth(type) {
      this.closeMobileMenu();
      if (type === 'login') {
        this.$emit('login');
      } else {
        this.$emit('register');
      }
    },
    handleMobileEditAvatar() {
      this.closeMobileMenu();
      this.showAvatarSelector = true;
      this.selectedAvatar = this.user?.avatar || this.defaultAvatars[0];
    },
    handleMobileLogout() {
      this.closeMobileMenu();
      this.$emit('logout');
    },
    selectAvatar(avatarUrl) {
      this.selectedAvatar = avatarUrl;
    },
    async confirmAvatarChange() {
      if (!this.user || !this.selectedAvatar) return;
      if (this.selectedAvatar === this.user.avatar) {
        this.showAvatarSelector = false;
        return;
      }

      this.avatarChanging = true;
      try {
        const response = await this.$api.put('/user/avatar', {
          avatar: this.selectedAvatar
        });
        if (response && response.user) {
          this.$emit('avatar-updated', response.user);
          this.showAvatarSelector = false;
          this.selectedAvatar = null;
          this.$emit('show-message', { type: 'success', text: '头像更换成功！' });
        }
      } catch (error) {
        this.$emit('show-message', { type: 'error', text: '头像更换失败，请重试' });
      } finally {
        this.avatarChanging = false;
      }
    }
  },
  watch: {
    user(newUser) {
      if (newUser) this.selectedAvatar = newUser.avatar;
    }
  }
}
</script>

<style scoped>
/* 新增头像更换动画样式 */
.fade-zoom-enter-active,
.fade-zoom-leave-active {
  transition: all 0.3s ease;
}
.fade-zoom-enter-from,
.fade-zoom-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* 加载动画 */
.loading-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #fff;
  border-top: 2px solid transparent;
  border-radius: 50%;
  margin-right: 6px;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 呼吸光动画（头像选中高亮） */
@keyframes glow {
  0%, 100% { box-shadow: 0 0 10px rgba(39, 174, 96, 0.5); }
  50% { box-shadow: 0 0 20px rgba(39, 174, 96, 0.9); }
}
.avatar-option.selected {
  border: 3px solid #27ae60;
  animation: glow 1.2s ease-in-out infinite;
  transform: scale(1.08);
}

/* 头像选择器模态框 */
.avatar-selector-modal {
  max-width: 500px;
  max-height: 80vh;
}

.avatar-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-bottom: 20px;
  max-height: 400px;
  overflow-y: auto;
  padding: 10px;
}

.avatar-option {
  position: relative;
  cursor: pointer;
  border-radius: 10px;
  overflow: hidden;
  transition: all 0.3s ease;
  border: 3px solid transparent;
  aspect-ratio: 1;
}

.avatar-option:hover {
  transform: scale(1.05);
  border-color: #3498db;
}

.avatar-option.selected {
  border: 3px solid #27ae60;
  box-shadow: 0 6px 20px rgba(39, 174, 96, 0.4);
  transform: scale(1.08);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.avatar-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.avatar-check {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 28px;
  height: 28px;
  background: #27ae60;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: bold;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
  border: 2px solid white;
  animation: bounceIn 0.4s ease;
  z-index: 10;
}

.avatar-actions .btn-primary:disabled {
  background-color: #7f8c8d;
  opacity: 0.8;
}


/* 添加入场动画 */
@keyframes bounceIn {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
.avatar-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover:not(:disabled) {
  background: #7f8c8d;
  transform: translateY(-1px);
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .avatar-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  
  .avatar-selector-modal {
    max-width: 90%;
    margin: 20px;
  }
  
  .avatar-actions {
    flex-direction: column;
  }
  
  .avatar-actions .btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .avatar-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
}

/* 原有的样式保持不变 */
.header {
  background: linear-gradient(135deg, #1a2a3a 0%, #0d1b2a 100%);
  color: white;
  padding: 12px 0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  position: sticky;
  top: 0;
  z-index: 1000;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  position: relative;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
  z-index: 1002;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.logo:hover {
  transform: translateY(-1px);
}

.logo h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(45deg, #fff, #e3f2fd);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  white-space: nowrap;
}

.tagline {
  font-size: 11px;
  opacity: 0.9;
  font-weight: 300;
  letter-spacing: 0.3px;
  white-space: nowrap;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 25px;
  transition: all 0.3s ease;
}

.nav {
  display: flex;
  gap: 15px;
}

.nav-link {
  color: white;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 20px;
  transition: all 0.3s ease;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  border: 2px solid transparent;
  background: rgba(255, 255, 255, 0.05);
  white-space: nowrap;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.nav-link.active {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

.user-section {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.user-info:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
}

.avatar-container {
  position: relative;
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.avatar-container:hover {
  transform: scale(1.05);
}

.avatar-container:hover .avatar-edit-overlay {
  opacity: 1;
}

.avatar-edit-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.avatar-edit-overlay span {
  color: white;
  font-size: 14px;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  object-fit: cover;
  transition: all 0.3s ease;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.username {
  font-weight: 600;
  font-size: 13px;
  white-space: nowrap;
}

.user-email {
  font-size: 10px;
  opacity: 0.8;
  white-space: nowrap;
}

.auth-buttons {
  display: flex;
  gap: 12px;
  align-items: center;
}

.btn-ghost {
  padding: 8px 16px;
  background: transparent;
  border: 2px solid;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: color 0.4s;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 70px;
  justify-content: center;
  white-space: nowrap;
}

.btn-ghost::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  transition: left 0.4s;
  z-index: -1;
}

.btn-ghost:hover {
  color: white;
}

.btn-ghost:hover::before {
  left: 0;
}

.btn-ghost.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
  min-width: 60px;
}

.btn-ghost.blue {
  color: #3498db;
  border-color: #3498db;
}

.btn-ghost.blue::before {
  background: #3498db;
}

.btn-ghost.teal {
  color: #1abc9c;
  border-color: #1abc9c;
}

.btn-ghost.teal::before {
  background: #1abc9c;
}

.btn-ghost.red {
  color: #e74c3c;
  border-color: #e74c3c;
}

.btn-ghost.red::before {
  background: #e74c3c;
}

.mobile-menu-toggle {
  display: none;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 30px;
  height: 30px;
  cursor: pointer;
  z-index: 1002;
}

.hamburger {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 20px;
  height: 16px;
  position: relative;
}

.hamburger span {
  display: block;
  height: 2px;
  width: 100%;
  background: white;
  border-radius: 2px;
  transition: all 0.3s ease;
  transform-origin: center;
}

.hamburger.active span:nth-child(1) {
  transform: rotate(45deg) translate(6px, 6px);
}

.hamburger.active span:nth-child(2) {
  opacity: 0;
}

.hamburger.active span:nth-child(3) {
  transform: rotate(-45deg) translate(6px, -6px);
}

.mobile-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.mobile-overlay.active {
  opacity: 1;
}

.mobile-nav,
.mobile-user,
.mobile-auth {
  display: none;
}

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
  max-height: 90vh;
  overflow-y: auto;
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

.close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
}

.close:hover {
  color: #666;
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

@media (max-width: 1024px) {
  .tagline {
    display: none;
  }
  
  .nav-link {
    padding: 6px 12px;
    font-size: 13px;
  }
  
  .user-info {
    padding: 6px 12px;
    gap: 8px;
  }
  
  .avatar {
    width: 32px;
    height: 32px;
  }
  
  .username {
    font-size: 12px;
  }
  
  .user-email {
    display: none;
  }
}

@media (max-width: 768px) {
  .container {
    padding: 0 15px;
  }
  
  .mobile-menu-toggle {
    display: flex;
  }
  
  .header-right {
    position: fixed;
    top: 0;
    right: -100%;
    width: 280px;
    height: 100vh;
    background: linear-gradient(135deg, #1a2a3a 0%, #0d1b2a 100%);
    flex-direction: column;
    justify-content: flex-start;
    align-items: stretch;
    padding: 80px 20px 30px;
    gap: 0;
    box-shadow: -5px 0 25px rgba(0, 0, 0, 0.3);
    z-index: 1001;
    transition: right 0.3s ease;
    overflow-y: auto;
  }
  
  .header-right.mobile-open {
    right: 0;
  }
  
  .desktop-nav,
  .desktop-user,
  .desktop-auth {
    display: none;
  }
  
  .mobile-nav,
  .mobile-user,
  .mobile-auth {
    display: flex;
  }
  
  .mobile-nav {
    flex-direction: column;
    gap: 10px;
    margin-bottom: 30px;
  }
  
  .mobile-nav .nav-link {
    padding: 12px 16px;
    border-radius: 10px;
    font-size: 14px;
    justify-content: flex-start;
    background: rgba(255, 255, 255, 0.08);
  }
  
  .mobile-user {
    flex-direction: column;
    text-align: center;
    gap: 15px;
    padding: 20px;
    margin-bottom: 20px;
    background: rgba(255, 255, 255, 0.05);
  }
  
  .mobile-user .user-details {
    align-items: center;
  }
  
  .mobile-actions {
    display: flex;
    gap: 10px;
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .mobile-auth {
    flex-direction: column;
    gap: 12px;
    width: 100%;
  }
  
  .mobile-auth .btn-ghost {
    width: 100%;
    padding: 12px;
    font-size: 14px;
  }
  
  .mobile-overlay {
    display: block;
  }
  
  .logo h1 {
    font-size: 18px;
  }
  
  .mobile-user .avatar-container {
    margin: 0 auto;
  }
  
  .mobile-user .avatar {
    width: 60px;
    height: 60px;
  }
  
  .mobile-user .avatar-edit-overlay span {
    font-size: 18px;
  }
}

@media (max-width: 480px) {
  .header-right {
    width: 100%;
  }
  
  .logo h1 {
    font-size: 16px;
  }
  
  .container {
    padding: 0 12px;
  }
  
  .mobile-nav .nav-link {
    padding: 14px 16px;
    font-size: 15px;
  }
  
  .mobile-user {
    padding: 15px;
  }
  
  .mobile-auth .btn-ghost {
    padding: 14px;
    font-size: 15px;
  }
  
  .mobile-user .avatar {
    width: 50px;
    height: 50px;
  }
}

@media (max-width: 360px) {
  .logo h1 {
    font-size: 15px;
  }
  
  .container {
    padding: 0 10px;
  }
  
  .mobile-nav .nav-link {
    padding: 12px 14px;
    font-size: 14px;
  }
  
  .mobile-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .mobile-actions .btn-ghost {
    width: 100%;
  }
}
</style>