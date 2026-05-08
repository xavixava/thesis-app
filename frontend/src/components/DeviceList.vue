<script setup lang="ts">
import { ref } from 'vue'
import type { Device } from '@/types/device'

interface Props {
  devices?: Device[]
  loading?: boolean
  error?: string | null
}

defineProps<Props>()

const emit = defineEmits<{
  select: [device: Device]
  remove: [id: string]
  refresh: []
}>()

const searchQuery = ref('')

const filteredDevices = (devices: Device[] = []) => {
  if (!searchQuery.value) return devices
  const query = searchQuery.value.toLowerCase()
  return devices.filter(
    (d) => d.hostname.toLowerCase().includes(query) || d.ipAddress.toLowerCase().includes(query),
  )
}

function getStatusColor(status: Device['status']): string {
  switch (status) {
    case 'online':
      return 'bg-green-900 text-green-200'
    case 'offline':
      return 'bg-red-900 text-red-200'
    default:
      return 'bg-gray-800 text-gray-300'
  }
}

function handleSelect(device: Device) {
  emit('select', device)
}

function handleRemove(id: string) {
  if (confirm('Are you sure you want to remove this device?')) {
    emit('remove', id)
  }
}
</script>

<template>
  <div class="card">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-semibold text-dark-text">Devices</h2>
      <button @click="emit('refresh')" class="btn-secondary text-sm">Refresh</button>
    </div>

    <!-- Search -->
    <div class="mb-4">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search by hostname or IP..."
        class="input-field w-full"
      />
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="text-center py-8" aria-live="polite">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
      <p class="mt-2 text-dark-muted">Loading devices...</p>
    </div>

    <!-- Error state -->
    <div
      v-else-if="error"
      class="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-md mb-4"
      role="alert"
    >
      {{ error }}
    </div>

    <!-- Device list -->
    <div v-else-if="filteredDevices(devices).length === 0" class="text-center py-8 text-dark-muted">
      No devices found. Add a device to get started.
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="device in filteredDevices(devices)"
        :key="device.id"
        class="flex items-center justify-between p-4 border border-dark-border rounded-lg hover:bg-dark-border transition-colors"
      >
        <div class="flex-1 cursor-pointer" @click="handleSelect(device)">
          <div class="flex items-center space-x-3">
            <div>
              <p class="font-medium text-dark-text">{{ device.hostname }}</p>
              <p class="text-sm text-dark-muted">{{ device.ipAddress }}</p>
            </div>
            <span
              :class="getStatusColor(device.status)"
              class="px-2 py-1 text-xs font-medium rounded-full"
            >
              {{ device.status }}
            </span>
          </div>
        </div>

        <button
          @click.stop="handleRemove(device.id)"
          class="text-red-400 hover:text-red-300 text-sm ml-4"
          aria-label="Remove device"
        >
          Remove
        </button>
      </div>
    </div>
  </div>
</template>
