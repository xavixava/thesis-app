<script setup lang="ts">
import { onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCAStore } from '@/stores/ca'
import { useDeviceStore } from '@/stores/device'
import RolloverButton from '@/components/RolloverButton.vue'

const route = useRoute()
const router = useRouter()
const caStore = useCAStore()
const deviceStore = useDeviceStore()

const caName = computed(() => route.params.name as string)
const hostsFromQuery = computed(() => {
  const hostsParam = route.query.hosts as string
  if (hostsParam) {
    return hostsParam.split(',').map((h) => h.trim())
  }
  return undefined
})

function getHostname(ipAddress: string): string {
  return deviceStore.getHostnameByIp(ipAddress)
}

onMounted(() => {
  caStore.selectCA(caName.value, hostsFromQuery.value)
})

watch(
  () => route.params.name,
  (newName) => {
    if (newName) {
      caStore.selectCA(newName as string, hostsFromQuery.value)
    }
  },
)

watch(
  () => route.query.hosts,
  () => {
    caStore.selectCA(caName.value, hostsFromQuery.value)
  },
)

async function handleRollover() {
  await caStore.performRollover(caName.value, hostsFromQuery.value)
}

function goBack() {
  router.push('/ca')
}

function getAdminStateColor(state: string): string {
  return state === 'enable' ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
}

function getAdminStateText(state: string): string {
  return state === 'enable' ? 'Enabled' : 'Disabled'
}
</script>

<template>
  <div>
    <button
      @click="goBack"
      class="text-primary-600 hover:text-primary-700 flex items-center text-sm mb-6"
    >
      <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      Back to CAs
    </button>

    <div v-if="caStore.detailLoading && !caStore.selectedCA" class="text-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
      <p class="mt-4 text-dark-muted">Loading CA details...</p>
    </div>

    <div v-else-if="caStore.error && !caStore.selectedCA" class="card">
      <div
        class="bg-red-900/30 border border-red-800 text-red-200 px-4 py-3 rounded-md"
        role="alert"
      >
        {{ caStore.error }}
      </div>
      <button @click="caStore.selectCA(caName, hostsFromQuery)" class="btn-secondary mt-4">
        Retry
      </button>
    </div>

    <div v-else-if="caStore.selectedCA" class="space-y-6">
      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-dark-text">
              {{ caStore.selectedCA.caName }}
            </h1>
            <p class="text-dark-muted">Connectivity Association Details</p>
          </div>
          <div v-if="caStore.detailLoading" class="flex items-center text-dark-muted">
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
            <span class="text-sm">Refreshing...</span>
          </div>
        </div>
      </div>

      <div class="card">
        <h2 class="text-lg font-semibold text-dark-text mb-4">ANYsec Configurations</h2>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-dark-border">
                <th class="text-left py-2 px-3 text-dark-muted">Host</th>
                <th class="text-center py-2 px-3 text-dark-muted">Admin State</th>
                <th class="text-center py-2 px-3 text-dark-muted">MACsec Cipher Suite</th>
                <th class="text-center py-2 px-3 text-dark-muted">MKA Cipher Suite</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="hostData in caStore.selectedCA.hosts"
                :key="hostData.host"
                class="border-b border-dark-border"
              >
                <td class="py-2 px-3 text-dark-text">
                  {{ getHostname(hostData.host) }} ({{ hostData.host }})
                </td>
                <td class="text-center py-2 px-3">
                  <span
                    :class="getAdminStateColor(hostData.adminState)"
                    class="px-2 py-1 text-xs font-medium rounded-full"
                  >
                    {{ getAdminStateText(hostData.adminState) }}
                  </span>
                </td>
                <td class="text-center py-2 px-3 text-dark-text">{{ hostData.cipherSuite }}</td>
                <td class="text-center py-2 px-3 text-dark-text">
                  {{ hostData.activeEncryptionType }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-for="hostData in caStore.selectedCA.hosts" :key="hostData.host" class="card">
        <h2 class="text-lg font-semibold text-dark-text mb-4">
          Pre-Shared Keys on {{ getHostname(hostData.host) }} ({{ hostData.host }})
        </h2>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-dark-border">
                <th class="text-left py-2 px-3 text-dark-muted">PSK ID</th>
                <th class="text-left py-2 px-3 text-dark-muted">CAK Name</th>
                <th class="text-left py-2 px-3 text-dark-muted">CAK</th>
                <th class="text-center py-2 px-3 text-dark-muted">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="psk in hostData.preSharedKeys"
                :key="psk.pskId"
                class="border-b border-dark-border"
              >
                <td class="py-2 px-3 text-dark-text">{{ psk.pskId }}</td>
                <td class="py-2 px-3 font-mono text-dark-text">{{ psk.cakName }}</td>
                <td class="py-2 px-3 font-mono text-dark-text text-xs break-all">{{ psk.cak }}</td>
                <td class="text-center py-2 px-3">
                  <span
                    :class="
                      psk.isActive ? 'bg-green-900 text-green-200' : 'bg-gray-800 text-gray-300'
                    "
                    class="px-2 py-1 text-xs font-medium rounded-full"
                  >
                    {{ psk.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <h2 class="text-lg font-semibold text-dark-text mb-4">Actions</h2>
        <RolloverButton
          :loading="caStore.rolloverLoading"
          :disabled="caStore.rolloverLoading"
          @click="handleRollover"
        />
      </div>

      <div v-if="caStore.currentRollover" class="card">
        <h2 class="text-lg font-semibold text-dark-text mb-4">Rollover Result</h2>
        <div class="flex items-center space-x-3">
          <span
            :class="
              caStore.currentRollover.status === 'completed'
                ? 'bg-green-900 text-green-200'
                : 'bg-red-900 text-red-200'
            "
            class="px-3 py-1 text-sm font-medium rounded-full"
          >
            {{ caStore.currentRollover.status }}
          </span>
          <span class="text-dark-muted">{{ caStore.currentRollover.message }}</span>
        </div>
        <div v-if="caStore.currentRollover.activeKeyName" class="mt-4">
          <p class="text-sm text-dark-muted">New Active Key:</p>
          <p class="font-mono bg-dark-border px-3 py-2 rounded mt-1 text-dark-text">
            {{ caStore.currentRollover.activeKeyName }}
          </p>
        </div>
        <div v-if="caStore.currentRollover.cipherSuite" class="mt-4">
          <p class="text-sm text-dark-muted">Cipher Suite:</p>
          <p class="font-mono bg-dark-border px-3 py-2 rounded mt-1 text-dark-text">
            {{ caStore.currentRollover.cipherSuite }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
