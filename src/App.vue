<template>
  <div id="app">
    <Header 
      :user="user" 
      @login="showLoginModal = true" 
      @logout="handleLogout"
      @register="showRegisterModal = true"
      @edit-avatar="openEditAvatarModal"
      @avatar-updated="handleAvatarUpdated"
    />
    
    <main class="main-content">
      <router-view 
        :user="user" 
        @login-required="showLoginModal = true" 
      />
    </main>

    <!-- 登录模态框 -->
    <div v-if="showLoginModal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>登录</h3>
          <button class="close" @click="closeLoginModal">&times;</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="handleLogin">
            <div class="form-group">
              <label>邮箱:</label>
              <input type="email" class="form-control" v-model="loginForm.email" required>
            </div>
            <div class="form-group">
              <label>密码:</label>
              <input type="password" class="form-control" v-model="loginForm.password" required>
            </div>
            <div class="form-group text-center">
              <button type="submit" class="btn btn-primary" :disabled="loading">
                {{ loading ? '登录中...' : '登录' }}
              </button>
              <button type="button" class="btn btn-secondary" @click="closeLoginModal" style="margin-left: 10px;">
                取消
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- 注册模态框 -->
    <div v-if="showRegisterModal" class="modal">
      <div class="modal-content">
        <div class="modal-header">  
          <h3>注册</h3>
          <button class="close" @click="closeRegisterModal">&times;</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="handleRegister">
            <div class="form-group">
              <label>用户名:</label>
              <input type="text" class="form-control" v-model="registerForm.username" required>
            </div>
            <div class="form-group">
              <label>邮箱:</label>
              <input type="email" class="form-control" v-model="registerForm.email" required>
            </div>
            <div class="form-group">
              <label>密码:</label>
              <input type="password" class="form-control" v-model="registerForm.password" required>
            </div>
            
            <!-- 头像选择部分 -->
            <div class="form-group">
              <label>选择头像:</label>
              <div class="default-avatar-selector">
                <div class="avatar-grid">
                  <div 
                    v-for="(avatar, index) in defaultAvatars" 
                    :key="index"
                    class="avatar-option"
                    :class="{ 'selected': registerForm.avatar === avatar }"
                    @click="selectRegisterAvatar(avatar)"
                  >
                    <img :src="avatar" :alt="`头像 ${index + 1}`" class="avatar-preview">
                    <div class="avatar-check" v-if="registerForm.avatar === avatar">✓</div>
                  </div>
                </div>
                <div class="avatar-hint">
                  点击选择默认头像
                </div>
              </div>
            </div>

            <div class="form-group text-center">
              <button type="submit" class="btn btn-success" :disabled="loading">
                {{ loading ? '注册中...' : '注册' }}
              </button>
              <button type="button" class="btn btn-secondary" @click="closeRegisterModal" style="margin-left: 10px;">
                取消
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- 修改头像模态框 -->
    <div v-if="showEditAvatarModal" class="modal">
      <div class="modal-content">
        <div class="modal-header">  
          <h3>修改头像</h3>
          <button class="close" @click="closeEditAvatarModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="avatar-selector-container">
            <div class="current-avatar">
              <h4>当前头像</h4>
              <img :src="user?.avatar || defaultAvatars[0]" alt="当前头像" class="current-avatar-img">
            </div>
            
            <div class="new-avatar-selection">
              <h4>选择新头像</h4>
              <div class="avatar-grid">
                <div 
                  v-for="(avatar, index) in defaultAvatars" 
                  :key="index"
                  class="avatar-option"
                  :class="{ 'selected': selectedAvatar === avatar }"
                  @click="selectedAvatar = avatar"
                >
                  <img :src="avatar" :alt="`头像 ${index + 1}`" class="avatar-preview">
                  <div class="avatar-check" v-if="selectedAvatar === avatar">✓</div>
                </div>
              </div>
            </div>

            <div class="avatar-actions">
              <button 
                class="btn btn-success" 
                @click="handleUpdateAvatar" 
                :disabled="avatarLoading || !selectedAvatar"
              >
                {{ avatarLoading ? '更新中...' : '确认更换' }}
              </button>
              <button 
                class="btn btn-secondary" 
                @click="closeEditAvatarModal"
                style="margin-left: 10px;"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 全局消息提示 -->
    <div v-if="globalMessage.show" class="global-message" :class="globalMessage.type">
      {{ globalMessage.text }}
    </div>

    <div v-if="error" class="error">
      {{ error }}
    </div>
  </div>
</template>

<script>
import Header from './components/Header.vue'

export default {
  name: 'App',
  components: {
    Header
  },
  data() {
    return {
      user: null,
      showLoginModal: false,
      showRegisterModal: false,
      showEditAvatarModal: false,
      loading: false,
      avatarLoading: false,
      error: null,
      selectedAvatar: null,
      globalMessage: {
        show: false,
        type: 'success',
        text: ''
      },
      loginForm: {
        email: '',
        password: ''
      },
      registerForm: {
        username: '',
        email: '',
        password: '',
        avatar: '/images/f.jpg' // 默认第一个头像
      },
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
    // 检查本地存储的登录状态
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    if (token && userData) {
      try {
        this.user = JSON.parse(userData)
        console.log('✅ 从本地存储恢复用户信息:', this.user)
      } catch (error) {
        console.error('❌ 解析用户数据失败:', error)
        this.clearLocalStorage()
      }
    }
  },
  methods: {
    // 选择注册时的头像
    selectRegisterAvatar(avatar) {
      this.registerForm.avatar = avatar
    },
    
    // 打开修改头像模态框
    openEditAvatarModal() {
      this.showEditAvatarModal = true
      this.selectedAvatar = this.user?.avatar || this.defaultAvatars[0]
    },
    
    // 关闭修改头像模态框
    closeEditAvatarModal() {
      this.showEditAvatarModal = false
      this.selectedAvatar = null
      this.error = null
    },
    
    // 处理头像更新
    async handleUpdateAvatar() {
      if (!this.selectedAvatar) {
        this.showMessage('请选择新头像', 'error')
        return
      }

      console.log('🔄 开始更新头像...')
      this.avatarLoading = true
      this.error = null
      
      try {
        const response = await this.$api.put('/user/avatar', {
          avatar: this.selectedAvatar
        })

        if (response && response.user) {
          console.log('✅ 头像更新成功:', response.user.avatar)
          
          // 更新本地用户数据
          this.user.avatar = response.user.avatar
          localStorage.setItem('user', JSON.stringify(this.user))
          
          this.showEditAvatarModal = false
          this.selectedAvatar = null
          
          this.showMessage('头像更换成功！', 'success')
        } else {
          throw new Error('头像更新响应格式错误')
        }
      } catch (error) {
        console.error('❌ 头像更新失败:', error)
        this.showMessage('头像更换失败，请重试', 'error')
      } finally {
        this.avatarLoading = false
      }
    },
    
    // 处理头像更新事件（从Header组件）
    handleAvatarUpdated(updatedUser) {
      this.user = { ...this.user, ...updatedUser }
      localStorage.setItem('user', JSON.stringify(this.user))
      this.showMessage('头像更换成功！', 'success')
    },
    
    // 显示全局消息
    showMessage(text, type = 'success') {
      this.globalMessage = {
        show: true,
        type,
        text
      }
      setTimeout(() => {
        this.globalMessage.show = false
      }, 3000)
    },
    
    async handleLogin() {
      console.log('🔍 开始登录流程...')
      this.loading = true
      this.error = null
      
      try {
        console.log('📤 发送登录请求:', this.loginForm)
        
        const response = await fetch('http://localhost:3000/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(this.loginForm)
        })
        
        console.log('📥 收到响应，状态:', response.status)
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        console.log('📦 响应数据:', data)
        
        if (data.message === '登录成功') {
          localStorage.setItem('token', data.token)
          localStorage.setItem('user', JSON.stringify(data.user))
          this.user = data.user
          this.showLoginModal = false
          this.loginForm = { email: '', password: '' }
          this.error = null
          console.log('✅ 登录成功')
          this.showMessage('登录成功！', 'success')
        } else {
          throw new Error(data.error || '登录失败')
        }
      } catch (error) {
        console.error('❌ 登录错误:', error)
        this.error = error.message || '登录失败，请检查网络连接'
        this.showMessage(this.error, 'error')
      } finally {
        this.loading = false
      }
    },
    
    async handleRegister() {
      console.log('🔍 开始注册流程...')
      this.loading = true
      this.error = null
      
      try {
        console.log('📤 发送注册请求:', this.registerForm)
        
        const response = await fetch('http://localhost:3000/api/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(this.registerForm)
        })
        
        console.log('📥 收到响应，状态:', response.status)
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        console.log('📦 响应数据:', data)
        
        if (data.message === '注册成功') {
          localStorage.setItem('token', data.token)
          localStorage.setItem('user', JSON.stringify(data.user))
          this.user = data.user
          this.showRegisterModal = false
          this.resetRegisterForm()
          this.error = null
          console.log('✅ 注册成功')
          this.showMessage('注册成功！', 'success')
        } else {
          throw new Error(data.error || '注册失败')
        }
      } catch (error) {
        console.error('❌ 注册错误:', error)
        this.error = error.message || '注册失败，请检查网络连接'
        this.showMessage(this.error, 'error')
      } finally {
        this.loading = false
      }
    },
    
    closeLoginModal() {
      this.showLoginModal = false
      this.loginForm = { email: '', password: '' }
      this.error = null
    },
    
    closeRegisterModal() {
      this.showRegisterModal = false
      this.resetRegisterForm()
      this.error = null
    },
    
    resetRegisterForm() {
      this.registerForm = { 
        username: '', 
        email: '', 
        password: '',
        avatar: '/images/f.jpg'
      }
    },
    
    handleLogout() {
      this.clearLocalStorage()
      this.user = null
      this.showMessage('已退出登录', 'success')
      if (this.$route.path === '/profile') {
        this.$router.push('/')
      }
    },
    
    clearLocalStorage() {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  },
  provide() {
          return {
            $api: {
              get: async (url) => {
                try {
                  const response = await fetch(`http://localhost:3000/api${url}`, {
                    headers: {
                      'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                  })
                  
                  if (!response.ok) {
                    const errorData = await response.json()
                    throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
                  }
                  
                  return await response.json()
                } catch (error) {
                  console.error('GET请求失败:', error)
                  throw error
                }
              },
              
              post: async (url, data, config = {}) => {
                try {
                  const headers = {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                  }
                  
                  // 如果是 FormData，不设置 Content-Type，让浏览器自动设置
                  if (data instanceof FormData) {
                    console.log('📤 ��送 FormData 请求')
                    const response = await fetch(`http://localhost:3000/api${url}`, {
                      method: 'POST',
                      headers: headers,
                      body: data,
                      ...config
                    })
                    
                    if (!response.ok) {
                      const errorData = await response.json()
                      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
                    }
                    
                    return await response.json()
                  } else {
                    // 如果是普通对象，设置为 JSON
                    headers['Content-Type'] = 'application/json'
                    const response = await fetch(`http://localhost:3000/api${url}`, {
                      method: 'POST',
                      headers: headers,
                      body: JSON.stringify(data),
                      ...config
                    })
                    
                    if (!response.ok) {
                      const errorData = await response.json()
                      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
                    }
                    
                    return await response.json()
                  }
                } catch (error) {
                  console.error('POST请求失败:', error)
                  throw error
                }
              },
              
              put: async (url, data) => {
                try {
                  const response = await fetch(`http://localhost:3000/api${url}`, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(data)
                  })
                  
                  if (!response.ok) {
                    const errorData = await response.json()
                    throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
                  }
                  
                  return await response.json()
                } catch (error) {
                  console.error('PUT请求失败:', error)
                  throw error
                }
              },
              
              delete: async (url) => {
                try {
                  const response = await fetch(`http://localhost:3000/api${url}`, {
                    method: 'DELETE',
                    headers: {
                      'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                  })
                  
                  if (!response.ok) {
                    const errorData = await response.json()
                    throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
                  }
                  
                  return await response.json()
                } catch (error) {
                  console.error('DELETE请求失败:', error)
                  throw error
                }
              }
            }
          }
        }
}
</script>

<style scoped>
.main-content {
  min-height: calc(100vh - 80px);
  
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
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 10px;
  width: 90%;
  max-width: 500px;
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

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #555;
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

/* 头像选择器样式 */
.avatar-selector-container {
  text-align: center;
}

.current-avatar {
  margin-bottom: 25px;
}

.current-avatar h4 {
  margin-bottom: 10px;
  color: #555;
}

.current-avatar-img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #3498db;
}

.new-avatar-selection h4 {
  margin-bottom: 15px;
  color: #555;
}

.avatar-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
  max-height: 300px;
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
  border-color: #27ae60;
  box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
}

.avatar-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.avatar-check {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 20px;
  height: 20px;
  background: #27ae60;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.avatar-hint {
  font-size: 12px;
  color: #999;
  text-align: center;
  margin-top: 10px;
}

.avatar-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.default-avatar-selector {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 15px;
  background: #fafafa;
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

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2980b9;
}

.btn-success {
  background-color: #27ae60;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background-color: #219a52;
}

.btn-secondary {
  background-color: #95a5a6;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #7f8c8d;
}

.text-center {
  text-align: center;
}

.error {
  background-color: #ffeaea;
  border: 1px solid #e74c3c;
  color: #c0392b;
  padding: 15px;
  border-radius: 5px;
  margin: 20px;
  text-align: center;
}

/* 全局消息样式 */
.global-message {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 20px;
  border-radius: 5px;
  color: white;
  font-weight: 500;
  z-index: 2000;
  animation: slideIn 0.3s ease;
}

.global-message.success {
  background: #27ae60;
  border: 1px solid #219a52;
}

.global-message.error {
  background: #e74c3c;
  border: 1px solid #c0392b;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .avatar-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  
  .modal-content {
    width: 95%;
    margin: 20px;
  }
  
  .avatar-actions {
    flex-direction: column;
  }
  
  .avatar-actions .btn {
    width: 100%;
    margin-bottom: 10px;
  }
  
  .global-message {
    top: 10px;
    right: 10px;
    left: 10px;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .avatar-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
  
  .current-avatar-img {
    width: 60px;
    height: 60px;
  }
}
</style>