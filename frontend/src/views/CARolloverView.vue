<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCAStore } from '@/stores/ca'
import { useDeviceStore } from '@/stores/device'
import type { MatchedCAGroup } from '@/types/ca'

const router = useRouter()
const caStore = useCAStore()
const deviceStore = useDeviceStore()

const anysecMatches = computed(() => caStore.caMatches.filter((m) => m.anysec))

function getHostname(ipAddress: string): string {
  return deviceStore.getHostnameByIp(ipAddress)
}

function handleSelectMatch(match: MatchedCAGroup) {
  const hostsQuery = match.hosts.join(',')
  router.push(`/ca/${match.caName}?hosts=${hostsQuery}`)
}

function handleRefresh() {
  caStore.fetchAllCA()
}

onMounted(() => {
  caStore.fetchAllCA()
})
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-dark-text">Connectivity Associations</h1>
      <button @click="handleRefresh" class="btn-secondary">Refresh</button>
    </div>

    <div v-if="!caStore.loading && Object.keys(caStore.caStats).length > 0" class="mb-6 space-y-4">
      <div class="card">
        <h2 class="text-lg font-semibold text-dark-text mb-3">Statistics</h2>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-dark-border">
                <th class="text-left py-2 px-3 text-dark-muted">Host</th>
                <th class="text-center py-2 px-3 text-dark-muted">Total CAs</th>
                <th class="text-center py-2 px-3 text-dark-muted">ANYsec CAs</th>
                <th class="text-center py-2 px-3 text-dark-muted">Enable ANYsec CAs</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(stats, ip) in caStore.caStats"
                :key="ip"
                class="border-b border-dark-border"
              >
                <td class="py-2 px-3 text-dark-text">{{ getHostname(ip) }} ({{ ip }})</td>
                <td class="text-center py-2 px-3 text-dark-text">{{ stats.total }}</td>
                <td class="text-center py-2 px-3 text-dark-text">{{ stats.anysecTotal }}</td>
                <td class="text-center py-2 px-3 text-dark-text">{{ stats.anysecEnabled }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="anysecMatches.length > 0" class="card">
        <h2 class="text-lg font-semibold text-dark-text mb-3">ANYsec Connectivity Associations</h2>
        <div class="space-y-3">
          <div
            v-for="match in anysecMatches"
            :key="match.id"
            class="flex items-center justify-between p-4 border border-dark-border rounded-lg hover:bg-dark-surface transition-colors cursor-pointer"
            @click="handleSelectMatch(match)"
          >
            <div class="flex-1">
              <p class="font-medium text-dark-text">{{ match.caName }}</p>
              <p class="text-sm text-dark-muted">
                Encryption: {{ match.cipherSuite }} | Cipher: {{ match.encryptionType }}
              </p>
              <p class="text-sm text-dark-muted">CAK Name: {{ match.cakName }}</p>
              <p class="text-sm text-dark-muted mt-1">
                Hosts: {{ match.hosts.map((h) => getHostname(h)).join(', ') }}
              </p>
            </div>
            <div class="flex items-center space-x-2">
              <span class="badge badge-info">{{ match.hosts.length }} hosts</span>
              <svg
                class="w-5 h-5 text-dark-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-else-if="!caStore.loading && Object.keys(caStore.caStats).length === 0 && !caStore.error"
      class="text-center py-8 text-dark-muted"
    >
      No connectivity associations found.
    </div>

    <div
      v-if="caStore.error"
      class="bg-red-900/30 border border-red-800 text-red-200 px-4 py-3 rounded-md"
    >
      {{ caStore.error }}
    </div>
  </div>
</template>
