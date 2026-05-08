import { ref, readonly } from 'vue'
import { defineStore } from 'pinia'
import type { RolloverResponse, CAStats, MatchedCAGroup, CADetail } from '@/types/ca'
import { caService, type CAWithHost } from '@/services/ca'
import { useDeviceStore } from './device'

export const useCAStore = defineStore('ca', () => {
  const connectivityAssociations = ref<CAWithHost[]>([])
  const caStats = ref<Record<string, CAStats>>({})
  const caMatches = ref<MatchedCAGroup[]>([])
  const selectedCA = ref<CADetail | null>(null)
  const currentRollover = ref<RolloverResponse | null>(null)
  const lastRolloverHistory = ref<RolloverResponse | null>(null)
  const loading = ref(false)
  const detailLoading = ref(false)
  const rolloverLoading = ref(false)
  const error = ref<string | null>(null)

  function getHosts(): string[] {
    const deviceStore = useDeviceStore()
    return deviceStore.devices.map((d) => d.ipAddress)
  }

  async function fetchAllCA(): Promise<void> {
    const deviceStore = useDeviceStore()
    if (deviceStore.devices.length === 0) {
      await deviceStore.fetchDevices()
    }

    const hosts = getHosts()
    if (hosts.length === 0) {
      connectivityAssociations.value = []
      caStats.value = {}
      caMatches.value = []
      return
    }

    loading.value = true
    error.value = null
    try {
      const result = await caService.getAllCA(hosts)
      connectivityAssociations.value = result.caList
      caStats.value = result.stats
      caMatches.value = result.matches
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch connectivity associations'
    } finally {
      loading.value = false
    }
  }

  async function fetchCADetail(name: string, hosts: string[]): Promise<void> {
    if (hosts.length === 0) {
      selectedCA.value = null
      return
    }

    detailLoading.value = true
    error.value = null
    try {
      selectedCA.value = await caService.getCAByName(name, hosts)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch CA details'
      selectedCA.value = null
    } finally {
      detailLoading.value = false
    }
  }

  async function selectCA(name: string, hosts?: string[]): Promise<void> {
    const deviceStore = useDeviceStore()
    if (deviceStore.devices.length === 0) {
      await deviceStore.fetchDevices()
    }

    const targetHosts = hosts || getHosts()
    await fetchCADetail(name, targetHosts)
  }

  async function performRollover(
    name: string,
    hosts?: string[],
    xpn: boolean = true,
  ): Promise<RolloverResponse | null> {
    const deviceStore = useDeviceStore()
    if (deviceStore.devices.length === 0) {
      await deviceStore.fetchDevices()
    }

    const targetHosts = hosts || getHosts()
    if (targetHosts.length === 0) {
      error.value = 'No devices configured. Please add devices first.'
      return null
    }

    rolloverLoading.value = true
    error.value = null
    currentRollover.value = null

    let rolloverResponse: RolloverResponse | null = null

    try {
      rolloverResponse = await caService.initiateRollover(name, targetHosts, xpn)
      currentRollover.value = rolloverResponse
      lastRolloverHistory.value = rolloverResponse
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to initiate rollover'
    }

    await fetchCADetail(name, targetHosts)

    rolloverLoading.value = false
    return rolloverResponse
  }

  function clearSelection(): void {
    selectedCA.value = null
    currentRollover.value = null
  }

  function clearError(): void {
    error.value = null
  }

  function clearHistory(): void {
    lastRolloverHistory.value = null
  }

  return {
    connectivityAssociations: readonly(connectivityAssociations),
    caStats: readonly(caStats),
    caMatches: readonly(caMatches),
    selectedCA: readonly(selectedCA),
    currentRollover: readonly(currentRollover),
    lastRolloverHistory: readonly(lastRolloverHistory),
    loading: readonly(loading),
    detailLoading: readonly(detailLoading),
    rolloverLoading: readonly(rolloverLoading),
    error: readonly(error),
    fetchAllCA,
    fetchCADetail,
    selectCA,
    performRollover,
    clearSelection,
    clearError,
    clearHistory,
  }
})
