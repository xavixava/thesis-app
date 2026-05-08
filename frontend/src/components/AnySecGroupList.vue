<script setup lang="ts">
import type { AnySecGroupWithCA } from '@/types/anysec'

interface Props {
  groups?: AnySecGroupWithCA[]
  loading?: boolean
  error?: string | null
}

defineProps<Props>()

function getOperStateColor(operState: string | undefined): string {
  if (operState === 'Up') return 'bg-green-900 text-green-200'
  if (operState === 'Down') return 'bg-red-900 text-red-200'
  return 'bg-gray-800 text-gray-300'
}

function getOperStateText(operState: string | undefined): string {
  if (operState === 'Up') return 'Up'
  if (operState === 'Down') return 'Down'
  return operState || 'Unknown'
}

function getEncryptionTypeLabel(type: string): string {
  if (type === 'service-encryption') return 'Service'
  if (type === 'tunnel-encryption') return 'Tunnel'
  return type
}
</script>

<template>
  <div class="card">
    <h2 class="text-xl font-semibold mb-4">ANYsec Groups</h2>

    <div v-if="loading" class="text-center py-8" aria-live="polite">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
      <p class="mt-2 text-dark-muted">Loading ANYsec groups...</p>
    </div>

    <div
      v-else-if="error"
      class="bg-red-900/30 border border-red-800 text-red-200 px-4 py-3 rounded-md mb-4"
      role="alert"
    >
      {{ error }}
    </div>

    <div v-else-if="!groups || groups.length === 0" class="text-center py-8 text-dark-muted">
      No ANYsec groups found.
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="group in groups"
        :key="`${group.host}-${group.groupName}-${group.encryptionType}`"
        class="flex items-center justify-between p-4 border border-dark-border rounded-lg"
      >
        <div class="flex-1">
          <div class="flex items-center space-x-3">
            <div>
              <div class="flex items-center gap-2">
                <p class="font-medium text-dark-text">{{ group.groupName }}</p>
                <span class="badge badge-info">
                  {{ getEncryptionTypeLabel(group.encryptionType) }}
                </span>
              </div>
              <p class="text-sm text-dark-muted">Host: {{ group.host }}</p>
              <p class="text-sm text-dark-muted">
                CA: {{ group.caName }}
                <span v-if="group.caInfo" class="text-dark-text">
                  | Key: {{ group.caInfo.activeKeyName }}
                </span>
                <span v-else class="text-yellow-500"> (CA not found)</span>
              </p>
              <p v-if="group.encryptionLabel" class="text-sm text-dark-muted">
                Label: {{ group.encryptionLabel }} | Peers: {{ group.securedPeers }}/{{
                  group.peerCount
                }}
              </p>
            </div>
            <span
              :class="getOperStateColor(group.operState)"
              class="px-2 py-1 text-xs font-medium rounded-full"
            >
              {{ getOperStateText(group.operState) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
