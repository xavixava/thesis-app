import { ref, readonly } from 'vue'
import { defineStore } from 'pinia'
import type {
  AnySecGroupWithHost,
  AnySecGroupWithCA,
  AnySecStatisticsWithHost,
  AnySecGroupStatistics,
} from '@/types/anysec'
import { anySecService } from '@/services/anysec'
import { caService } from '@/services/ca'
import { useDeviceStore } from './device'

const POLL_INTERVAL = 30000

export const useAnySecStore = defineStore('anysec', () => {
  const groups = ref<AnySecGroupWithHost[]>([])
  const groupsWithCA = ref<AnySecGroupWithCA[]>([])
  const statistics = ref<AnySecStatisticsWithHost[]>([])
  const groupStatistics = ref<AnySecGroupStatistics[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pollIntervalId = ref<number | null>(null)

  function getHosts(): string[] {
    const deviceStore = useDeviceStore()
    return deviceStore.devices.map((d) => d.ipAddress)
  }

  async function fetchGroups(): Promise<void> {
    const deviceStore = useDeviceStore()
    if (deviceStore.devices.length === 0) {
      await deviceStore.fetchDevices()
    }

    const hosts = getHosts()
    if (hosts.length === 0) {
      groups.value = []
      groupsWithCA.value = []
      return
    }

    loading.value = true
    error.value = null
    try {
      const anySecGroups = await anySecService.getGroups(hosts)
      groups.value = anySecGroups

      const caResult = await caService.getAllCA(hosts)
      const caMap = new Map<string, (typeof caResult.caList)[0]>()
      for (const ca of caResult.caList) {
        const key = `${ca.host}:${ca.caName}`
        caMap.set(key, ca)
      }

      const operStateMap = new Map<string, string>()
      await Promise.all(
        anySecGroups.map(async (group) => {
          try {
            const operStates = await anySecService.getGroupOperState(
              group.groupName,
              group.encryptionType,
              hosts,
            )
            for (const [host, state] of Object.entries(operStates)) {
              const key = `${host}:${group.groupName}:${group.encryptionType}`
              operStateMap.set(key, state)
            }
          } catch {
            // Ignore errors for individual group oper-state fetch
          }
        }),
      )

      groupsWithCA.value = anySecGroups.map((group) => {
        const caKey = `${group.host}:${group.caName}`
        const caInfo = caMap.get(caKey)
        const operKey = `${group.host}:${group.groupName}:${group.encryptionType}`
        return {
          ...group,
          operState: operStateMap.get(operKey),
          caInfo: caInfo
            ? {
                activeKeyName: caInfo.activeKeyName,
                cipherSuite: caInfo.cipherSuite,
                status: caInfo.status,
              }
            : undefined,
        }
      })
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch AnySec groups'
    } finally {
      loading.value = false
    }
  }

  async function fetchStatistics(): Promise<void> {
    const hosts = getHosts()
    if (hosts.length === 0) {
      statistics.value = []
      groupStatistics.value = []
      return
    }

    error.value = null
    try {
      const [stats, detailedStats] = await Promise.all([
        anySecService.getAllStatistics(hosts),
        anySecService.getDetailedGroupStatistics(hosts),
      ])
      statistics.value = stats
      groupStatistics.value = detailedStats
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch AnySec statistics'
    }
  }

  function startPolling(): void {
    if (pollIntervalId.value) return

    const hosts = getHosts()
    if (hosts.length === 0) return

    fetchStatistics()
    pollIntervalId.value = window.setInterval(() => {
      fetchStatistics()
    }, POLL_INTERVAL)
  }

  function stopPolling(): void {
    if (pollIntervalId.value) {
      clearInterval(pollIntervalId.value)
      pollIntervalId.value = null
    }
  }

  async function fetchAll(): Promise<void> {
    await Promise.all([fetchGroups(), fetchStatistics()])
  }

  function clearError(): void {
    error.value = null
  }

  return {
    groups: readonly(groups),
    groupsWithCA: readonly(groupsWithCA),
    statistics: readonly(statistics),
    groupStatistics: readonly(groupStatistics),
    loading: readonly(loading),
    error: readonly(error),
    fetchGroups,
    fetchStatistics,
    fetchAll,
    startPolling,
    stopPolling,
    clearError,
  }
})
