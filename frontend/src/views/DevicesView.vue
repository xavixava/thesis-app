<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDeviceStore } from '@/stores/device'
import DeviceList from '@/components/DeviceList.vue'
import type { Device } from '@/types/device'

const router = useRouter()
const deviceStore = useDeviceStore()

onMounted(() => {
  deviceStore.fetchDevices()
})

function handleSelect(device: Device) {
  router.push(`/devices/${device.id}`)
}

async function handleRemove(id: string) {
  await deviceStore.removeDevice(id)
}

function handleRefresh() {
  deviceStore.fetchDevices()
}

function handleAddDevice() {
  router.push('/devices/add')
}
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-dark-text">Devices</h1>
      <button @click="handleAddDevice" class="btn-primary">Add Device</button>
    </div>

    <DeviceList
      :devices="deviceStore.devices"
      :loading="deviceStore.loading"
      :error="deviceStore.error"
      @select="handleSelect"
      @remove="handleRemove"
      @refresh="handleRefresh"
    />
  </div>
</template>
