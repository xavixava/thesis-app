import { ref, readonly } from 'vue'
import { defineStore } from 'pinia'
import type { Device, DeviceCredentials } from '@/types/device'
import { deviceService } from '@/services/device'

export const useDeviceStore = defineStore('device', () => {
  const devices = ref<Device[]>([])
  const selectedDevice = ref<Device | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchDevices(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      devices.value = await deviceService.getDevices()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch devices'
    } finally {
      loading.value = false
    }
  }

  async function addDevice(credentials: DeviceCredentials): Promise<Device | null> {
    loading.value = true
    error.value = null
    try {
      const newDevice = await deviceService.addDevice(credentials)
      devices.value.push(newDevice)
      return newDevice
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to add device'
      return null
    } finally {
      loading.value = false
    }
  }

  async function removeDevice(id: string): Promise<boolean> {
    loading.value = true
    error.value = null
    try {
      await deviceService.removeDevice(id)
      devices.value = devices.value.filter((d) => d.id !== id)
      if (selectedDevice.value?.id === id) {
        selectedDevice.value = null
      }
      return true
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to remove device'
      return false
    } finally {
      loading.value = false
    }
  }

  function selectDevice(device: Device | null): void {
    selectedDevice.value = device
  }

  function getDeviceByIp(ipAddress: string): Device | undefined {
    return devices.value.find((d) => d.ipAddress === ipAddress)
  }

  function getHostnameByIp(ipAddress: string): string {
    const device = getDeviceByIp(ipAddress)
    return device?.hostname || ipAddress
  }

  function clearError(): void {
    error.value = null
  }

  return {
    devices: readonly(devices),
    selectedDevice: readonly(selectedDevice),
    loading: readonly(loading),
    error: readonly(error),
    fetchDevices,
    addDevice,
    removeDevice,
    selectDevice,
    getDeviceByIp,
    getHostnameByIp,
    clearError,
  }
})
