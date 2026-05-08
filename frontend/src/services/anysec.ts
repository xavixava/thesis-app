import type {
  AnySecStatistics,
  AnySecState,
  RawAnySecResponse,
  RawEncryptionGroup,
  AnySecGroupWithHost,
  EncryptionType,
  RawAnySecStatisticsResponse,
  AnySecStatisticsWithHost,
  RawAnySecStateResponse,
  AnySecGroupStatistics,
  RawEncryptionState,
} from '@/types/anysec'
import { anySecStateSchema } from '@/types/anysec'
import { api } from './api'

function extractEncryptionGroups(
  host: string,
  data: RawAnySecResponse[string],
): AnySecGroupWithHost[] {
  const groups: AnySecGroupWithHost[] = []

  const processEncryptionGroups = (
    encryptionGroups: RawEncryptionGroup[] | undefined,
    encryptionType: EncryptionType,
  ) => {
    if (!encryptionGroups) return
    for (const group of encryptionGroups) {
      const peerCount = group.peer?.length || 0
      const securedPeers = group.peer?.filter((p) => p['admin-state'] === 'enable').length || 0

      groups.push({
        host,
        groupName: group['group-name'],
        caName: group['ca-name'],
        encryptionType,
        adminState: group['admin-state'],
        encryptionLabel: group['encryption-label'],
        peerCount,
        securedPeers,
      })
    }
  }

  processEncryptionGroups(data['service-encryption']?.['encryption-group'], 'service-encryption')
  processEncryptionGroups(data['tunnel-encryption']?.['encryption-group'], 'tunnel-encryption')

  return groups
}

function extractGroupStatistics(
  host: string,
  encryptionType: EncryptionType,
  encryptionState: RawEncryptionState,
): AnySecGroupStatistics[] {
  const groups: AnySecGroupStatistics[] = []
  const encryptionGroups = encryptionState['encryption-group']
  if (!encryptionGroups) return groups

  for (const group of encryptionGroups) {
    const groupName = group['group-name'] || 'Unknown'
    const peers = group.peer || []

    const allPeersUp = peers.length > 0 && peers.every((p) => p['oper-state'] === 'up')

    let totalOkPackets = 0
    let totalNotValidPackets = 0
    let keyServer: boolean | null = null
    let keyNumber: number | null = null
    let messageCount: number | null = null

    const peerStats = peers.map((peer) => {
      const okPackets = parseInt(peer['rx-sc']?.['ok-packets'] || '0', 10)
      const notValidPackets = parseInt(peer['rx-sc']?.['not-valid-packets'] || '0', 10)
      totalOkPackets += okPackets
      totalNotValidPackets += notValidPackets

      const mka = peer['mka']?.[0]
      if (mka) {
        if (keyServer === null && mka['key-server'] !== undefined) {
          keyServer = mka['key-server']
        }
        if (keyNumber === null && mka['key-number'] !== undefined) {
          keyNumber = mka['key-number']
        }
        if (messageCount === null && mka['message-count'] !== undefined) {
          messageCount = mka['message-count']
        }
      }

      return {
        peerIp: peer['peer-ip-address'] || 'Unknown',
        encryptionLabel: peer['encryption-label'] || 0,
        operState: peer['oper-state'] || 'unknown',
        totalOkPackets: okPackets,
        totalNotValidPackets: notValidPackets,
      }
    })

    groups.push({
      host,
      groupName,
      encryptionType,
      allPeersUp,
      peers: peerStats,
      keyServer,
      keyNumber,
      messageCount,
    })
  }

  return groups
}

export const anySecService = {
  async getGroups(hosts: string[] = []): Promise<AnySecGroupWithHost[]> {
    if (hosts.length === 0) return []
    const data = await api.getWithHosts<RawAnySecResponse>('/anysec', hosts)

    const allGroups: AnySecGroupWithHost[] = []
    for (const [host, hostData] of Object.entries(data)) {
      const groups = extractEncryptionGroups(host, hostData)
      allGroups.push(...groups)
    }
    return allGroups
  },

  async getAllStatistics(hosts: string[] = []): Promise<AnySecStatisticsWithHost[]> {
    if (hosts.length === 0) return []
    const data = await api.getWithHosts<RawAnySecStatisticsResponse>('/state/anysec', hosts)

    const statistics: AnySecStatisticsWithHost[] = []
    for (const [host, hostStats] of Object.entries(data)) {
      for (const [groupName, stats] of Object.entries(hostStats)) {
        statistics.push({
          host,
          groupName,
          securedLinks: stats['secured-links'] || 0,
          unsecuredLinks: stats['unsecured-links'] || 0,
          encryptionStatus: stats['encryption-status'] || 'unknown',
          lastUpdated: stats['last-updated'] || new Date().toISOString(),
        })
      }
    }
    return statistics
  },

  async getDetailedGroupStatistics(hosts: string[] = []): Promise<AnySecGroupStatistics[]> {
    if (hosts.length === 0) return []
    const data = await api.getWithHosts<RawAnySecStateResponse>('/state/anysec', hosts)

    const statistics: AnySecGroupStatistics[] = []
    for (const [host, hostState] of Object.entries(data)) {
      if (hostState['service-encryption']) {
        const serviceGroups = extractGroupStatistics(
          host,
          'service-encryption',
          hostState['service-encryption'],
        )
        statistics.push(...serviceGroups)
      }
      if (hostState['tunnel-encryption']) {
        const tunnelGroups = extractGroupStatistics(
          host,
          'tunnel-encryption',
          hostState['tunnel-encryption'],
        )
        statistics.push(...tunnelGroups)
      }
    }
    return statistics
  },

  async getGroupStatistics(
    groupName: string,
    hosts: string[] = [],
  ): Promise<AnySecStatistics | null> {
    if (hosts.length === 0) return null
    const data = await api.getWithHosts<AnySecState>(`/state/anysec/${groupName}`, hosts)
    return anySecStateSchema.parse(data)
  },

  async getGroupOperState(
    groupName: string,
    encryptionType: 'service-encryption' | 'tunnel-encryption',
    hosts: string[] = [],
  ): Promise<Record<string, string>> {
    if (hosts.length === 0) return {}
    const type = encryptionType === 'service-encryption' ? 'service' : 'tunnel'
    const data = await api.getWithHosts<Record<string, string>>(
      `/anysec/${groupName}/oper-state?type=${type}`,
      hosts,
    )
    return data
  },
}
