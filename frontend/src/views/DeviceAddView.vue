<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useDeviceStore } from '@/stores/device'
import DeviceForm from '@/components/DeviceForm.vue'
import type { DeviceCredentials } from '@/types/device'

const router = useRouter()
const deviceStore = useDeviceStore()

async function handleSubmit(credentials: DeviceCredentials) {
  const device = await deviceStore.addDevice(credentials)
  if (device) {
    router.push('/devices')
  }
}

function handleCancel() {
  router.push('/devices')
}
</script>

<template>
  <div>
    <div class="mb-6">
      <button
        @click="handleCancel"
        class="text-primary-600 hover:text-primary-700 flex items-center text-sm"
      >
        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Devices
      </button>
    </div>

    <DeviceForm :error="deviceStore.error" @submit="handleSubmit" @cancel="handleCancel" />
  </div>
</template>
