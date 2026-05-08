<script setup lang="ts">
import type { AnySecGroupStatistics } from '@/types/anysec'

interface Props {
  groupStatistics?: AnySecGroupStatistics[]
  loading?: boolean
  error?: string | null
}

defineProps<Props>()

function getEncryptionTypeLabel(type: string): string {
  if (type === 'service-encryption') return 'Service'
  if (type === 'tunnel-encryption') return 'Tunnel'
  return type
}
</script>

<template>
  <div class="card">
    <h2 class="text-xl font-semibold mb-4">ANYsec Statistics</h2>

    <div v-if="loading" class="text-center py-8" aria-live="polite">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
      <p class="mt-2 text-dark-muted">Loading statistics...</p>
    </div>

    <div
      v-else-if="error"
      class="bg-red-900/30 border border-red-800 text-red-200 px-4 py-3 rounded-md mb-4"
      role="alert"
    >
      {{ error }}
    </div>

    <div
      v-else-if="!groupStatistics || groupStatistics.length === 0"
      class="text-center py-8 text-dark-muted"
    >
      No statistics available.
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="stat in groupStatistics"
        :key="`${stat.host}-${stat.groupName}-${stat.encryptionType}`"
        class="border border-dark-border rounded-lg p-4"
      >
        <div class="flex items-center justify-between mb-3">
          <div>
            <h3 class="font-semibold text-dark-text">{{ stat.groupName }}</h3>
            <p class="text-sm text-dark-muted">
              Host: {{ stat.host }} | Type: {{ getEncryptionTypeLabel(stat.encryptionType) }}
            </p>
          </div>
          <span
            :class="stat.allPeersUp ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'"
            class="px-2 py-1 text-xs font-medium rounded-full"
          >
            {{ stat.allPeersUp ? 'All Peers Up' : 'Peers Down' }}
          </span>
        </div>

        <div class="grid grid-cols-6 gap-4 mb-3">
          <div class="text-center p-2 bg-dark-surface rounded">
            <p class="text-xs text-dark-muted uppercase">OK Packets</p>
            <p class="text-lg font-semibold text-green-400">
              {{ stat.peers.reduce((sum, p) => sum + p.totalOkPackets, 0) }}
            </p>
          </div>
          <div class="text-center p-2 bg-dark-surface rounded">
            <p class="text-xs text-dark-muted uppercase">Not Valid</p>
            <p
              class="text-lg font-semibold"
              :class="
                stat.peers.reduce((sum, p) => sum + p.totalNotValidPackets, 0) > 0
                  ? 'text-red-400'
                  : 'text-dark-muted'
              "
            >
              {{ stat.peers.reduce((sum, p) => sum + p.totalNotValidPackets, 0) }}
            </p>
          </div>
          <div class="text-center p-2 bg-dark-surface rounded">
            <p class="text-xs text-dark-muted uppercase">Peers</p>
            <p class="text-lg font-semibold text-dark-text">{{ stat.peers.length }}</p>
          </div>
          <div class="text-center p-2 bg-dark-surface rounded">
            <p class="text-xs text-dark-muted uppercase">Key Server</p>
            <p class="text-lg font-semibold text-dark-text">
              {{ stat.keyServer !== null ? (stat.keyServer ? 'Yes' : 'No') : 'N/A' }}
            </p>
          </div>
          <div class="text-center p-2 bg-dark-surface rounded">
            <p class="text-xs text-dark-muted uppercase">Key Number</p>
            <p class="text-lg font-semibold text-dark-text">
              {{ stat.keyNumber !== null ? stat.keyNumber : 'N/A' }}
            </p>
          </div>
          <div class="text-center p-2 bg-dark-surface rounded">
            <p class="text-xs text-dark-muted uppercase">Message Count</p>
            <p class="text-lg font-semibold text-dark-text">
              {{ stat.messageCount !== null ? stat.messageCount : 'N/A' }}
            </p>
          </div>
        </div>

        <div v-if="stat.peers.length > 0" class="mt-3 pt-3 border-t border-dark-border">
          <p class="text-xs text-dark-muted uppercase mb-2">Peer Details</p>
          <div class="space-y-2">
            <div
              v-for="peer in stat.peers"
              :key="peer.peerIp"
              class="flex items-center justify-between text-sm"
            >
              <span class="text-dark-muted">
                {{ peer.peerIp }}
                <span v-if="peer.encryptionLabel" class="text-dark-text">
                  (Label: {{ peer.encryptionLabel }})
                </span>
              </span>
              <span
                :class="peer.operState === 'up' ? 'text-green-400' : 'text-red-400'"
                class="font-medium"
              >
                {{ peer.operState }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
