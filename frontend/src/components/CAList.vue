<script setup lang="ts">
import type { ConnectivityAssociation } from '@/types/ca'

interface Props {
  caList?: ConnectivityAssociation[]
  loading?: boolean
  error?: string | null
}

defineProps<Props>()

const emit = defineEmits<{
  select: [ca: ConnectivityAssociation]
}>()

function getStatusColor(status: ConnectivityAssociation['status']): string {
  switch (status) {
    case 'active':
      return 'bg-green-900 text-green-200'
    case 'inactive':
      return 'bg-gray-800 text-gray-300'
    case 'rolling_over':
      return 'bg-yellow-900 text-yellow-200'
    case 'error':
      return 'bg-red-900 text-red-200'
    default:
      return 'bg-gray-800 text-gray-300'
  }
}

function getStatusText(status: ConnectivityAssociation['status']): string {
  switch (status) {
    case 'active':
      return 'Active'
    case 'inactive':
      return 'Inactive'
    case 'rolling_over':
      return 'Rolling Over'
    case 'error':
      return 'Error'
    default:
      return status
  }
}
</script>

<template>
  <div class="card">
    <h2 class="text-xl font-semibold mb-4">Connectivity Associations</h2>

    <!-- Loading state -->
    <div v-if="loading" class="text-center py-8" aria-live="polite">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
      <p class="mt-2 text-dark-muted">Loading CAs...</p>
    </div>

    <!-- Error state -->
    <div
      v-else-if="error"
      class="bg-red-900/30 border border-red-800 text-red-200 px-4 py-3 rounded-md mb-4"
      role="alert"
    >
      {{ error }}
    </div>

    <!-- Empty state -->
    <div v-else-if="!caList || caList.length === 0" class="text-center py-8 text-dark-muted">
      No connectivity associations found.
    </div>

    <!-- CA List -->
    <div v-else class="space-y-3">
      <div
        v-for="ca in caList"
        :key="ca.name"
        class="flex items-center justify-between p-4 border border-dark-border rounded-lg hover:bg-dark-surface transition-colors cursor-pointer"
        @click="emit('select', ca)"
      >
        <div class="flex-1">
          <div class="flex items-center space-x-3">
            <div>
              <p class="font-medium text-dark-text">{{ ca.caName || ca.name }}</p>
              <p class="text-sm text-dark-muted">{{ ca.hostname }} ({{ ca.ipAddress }})</p>
            </div>
            <span
              :class="getStatusColor(ca.status)"
              class="px-2 py-1 text-xs font-medium rounded-full"
            >
              {{ getStatusText(ca.status) }}
            </span>
          </div>
          <div class="mt-2 text-sm text-dark-muted">
            <span
              >Key: <code class="bg-dark-border px-1 rounded">{{ ca.activeKeyName }}</code></span
            >
            <span class="ml-3"
              >Cipher: <code class="bg-dark-border px-1 rounded">{{ ca.cipherSuite }}</code></span
            >
          </div>
        </div>

        <svg class="w-5 h-5 text-dark-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  </div>
</template>
