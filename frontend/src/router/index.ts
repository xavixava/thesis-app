import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/devices',
      name: 'devices',
      component: () => import('../views/DevicesView.vue'),
    },
    {
      path: '/devices/add',
      name: 'devices-add',
      component: () => import('../views/DeviceAddView.vue'),
    },
    {
      path: '/ca',
      name: 'ca',
      component: () => import('../views/CARolloverView.vue'),
    },
    {
      path: '/ca/:name',
      name: 'ca-detail',
      component: () => import('../views/CADetailView.vue'),
    },
    {
      path: '/anysec',
      name: 'anysec',
      component: () => import('../views/AnySecView.vue'),
    },
  ],
})

export default router
