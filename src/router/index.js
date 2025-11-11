import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../components/Home.vue'
import Profile from '../components/Profile.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/profile', component: Profile },
  { 
    path: '/guide/:id', 
    name: 'GuideDetail',
    component: () => import('../components/GuideDetail.vue') // 动态导入
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router