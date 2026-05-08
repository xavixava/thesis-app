<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCAStore } from '@/stores/ca'
import { useAnySecStore } from '@/stores/anysec'

const router = useRouter()
const caStore = useCAStore()
const anySecStore = useAnySecStore()

onMounted(async () => {
  await Promise.all([caStore.fetchAllCA(), anySecStore.fetchAll()])
})

function navigateTo(path: string) {
  router.push(path)
}

function getStatusSummary() {
  const cas = caStore.connectivityAssociations
  return {
    total: cas.length,
    active: cas.filter((c) => c.status === 'active').length,
    error: cas.filter((c) => c.status === 'error').length,
  }
}

function getAnySecSummary() {
  const groups = anySecStore.groups
  const stats = anySecStore.statistics
  return {
    totalGroups: groups.length,
    enabled: groups.filter((g) => g.enabled).length,
    securedLinks: stats.reduce((sum, s) => sum + s.securedLinks, 0),
    unsecuredLinks: stats.reduce((sum, s) => sum + s.unsecuredLinks, 0),
  }
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-dark-text mb-6">Dashboard</h1>

    <!-- Quick Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div
        class="card cursor-pointer hover:shadow-lg transition-shadow py-8 min-h-32"
        @click="navigateTo('/ca')"
      >
        <p class="text-sm text-dark-muted">Total CAs</p>
        <p class="text-3xl font-bold text-dark-text">{{ getStatusSummary().total }}</p>
      </div>
      <div
        class="card cursor-pointer hover:shadow-lg transition-shadow py-8 min-h-32"
        @click="navigateTo('/ca')"
      >
        <p class="text-sm text-dark-muted">Active</p>
        <p class="text-3xl font-bold text-green-400">{{ getStatusSummary().active }}</p>
      </div>
      <div
        class="card cursor-pointer hover:shadow-lg transition-shadow py-8 min-h-32"
        @click="navigateTo('/anysec')"
      >
        <p class="text-sm text-dark-muted">ANYsec Groups</p>
        <p class="text-3xl font-bold text-blue-400">{{ getAnySecSummary().totalGroups }}</p>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <button
        @click="navigateTo('/devices')"
        class="card flex items-center justify-center py-10 min-h-40 hover:bg-dark-border transition-colors"
      >
        <div class="text-center">
          <svg
            class="w-10 h-10 mx-auto text-dark-muted mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          <p class="font-medium text-dark-text">Manage Devices</p>
          <p class="text-sm text-dark-muted">Add or remove devices</p>
        </div>
      </button>
      <button
        @click="navigateTo('/ca')"
        class="card flex items-center justify-center py-10 min-h-40 hover:bg-dark-border transition-colors"
      >
        <div class="text-center">
          <svg
            class="w-10 h-10 mx-auto text-dark-muted mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <p class="font-medium text-dark-text">Connectivity Associations</p>
          <p class="text-sm text-dark-muted">
            Check the CA configurations and trigger key rollover
          </p>
        </div>
      </button>
      <button
        @click="navigateTo('/anysec')"
        class="card flex items-center justify-center py-10 min-h-40 hover:bg-dark-border transition-colors"
      >
        <div class="text-center">
          <svg
            class="w-10 h-10 mx-auto text-dark-muted mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <p class="font-medium text-dark-text">ANYsec Config</p>
          <p class="text-sm text-dark-muted">
            Check the ANYsec group configurations and statistics
          </p>
        </div>
      </button>
    </div>

    <!-- Last Rollover -->
    <div v-if="caStore.lastRolloverHistory" class="card mb-8">
      <h2 class="text-lg font-semibold text-dark-text mb-4">Last Rollover</h2>
      <div class="flex items-center space-x-4">
        <span
          :class="
            caStore.lastRolloverHistory.status === 'completed'
              ? 'bg-green-900 text-green-200'
              : 'bg-red-900 text-red-200'
          "
          class="px-3 py-1 text-sm font-medium rounded-full"
        >
          {{ caStore.lastRolloverHistory.status }}
        </span>
        <span class="text-dark-muted">{{ caStore.lastRolloverHistory.message }}</span>
      </div>
    </div>
  </div>
</template>
