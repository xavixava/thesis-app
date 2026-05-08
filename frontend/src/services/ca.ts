import type {
  ConnectivityAssociation,
  RolloverResponse,
  RawCAResponse,
  RawCASingleResponse,
  CAStats,
  MatchedCAGroup,
  CADetail,
  CADetailHostData,
  PreSharedKey,
} from '@/types/ca'
import { rolloverResponseSchema } from '@/types/ca'
import { api } from './api'

export interface CAWithHost extends ConnectivityAssociation {
  host: string
}

export interface CAFetchResult {
  caList: CAWithHost[]
  stats: Record<string, CAStats>
  matches: MatchedCAGroup[]
}

function getActiveKeyInfo(ca: {
  'static-cak': {
    'active-psk': number
    'pre-shared-key': Array<{ 'psk-id': number; 'cak-name': string; 'encryption-type': string }>
  }
}): { keyName: string; encryptionType: string } | null {
  const activePskId = ca['static-cak']['active-psk']
  const activeKey = ca['static-cak']['pre-shared-key'].find((k) => k['psk-id'] === activePskId)
  if (!activeKey) return null
  return {
    keyName: activeKey['cak-name'],
    encryptionType: activeKey['encryption-type'],
  }
}

function buildMatchId(
  caName: string,
  cakName: string,
  cipherSuite: string,
  encryptionType: string,
): string {
  return `${caName}:${cakName}:${cipherSuite}:${encryptionType}`
}

export const caService = {
  async getAllCA(hosts: string[] = []): Promise<CAFetchResult> {
    if (hosts.length === 0) {
      return { caList: [], stats: {}, matches: [] }
    }

    const rawData = await api.getWithHosts<RawCAResponse>('/CA', hosts)

    const caList: CAWithHost[] = []
    const stats: Record<string, CAStats> = {}
    const matchGroups: Map<string, MatchedCAGroup> = new Map()

    for (const [host, caArray] of Object.entries(rawData)) {
      let total = 0
      let enabled = 0
      let anysecTotal = 0
      let anysecEnabled = 0

      for (const ca of caArray) {
        total++
        const isEnabled = ca['admin-state'] === 'enabled' || ca['admin-state'] === 'enable'
        if (isEnabled) {
          enabled++
        }

        if (ca.anysec) {
          anysecTotal++
          if (isEnabled) {
            anysecEnabled++
          }
        }

        const keyInfo = getActiveKeyInfo(ca)
        if (!keyInfo) continue

        const transformedCA = {
          name: ca['ca-name'],
          caName: ca['ca-name'],
          hostname: host,
          ipAddress: host,
          activeKeyName: keyInfo.keyName,
          cipherSuite: ca['cipher-suite'],
          status: ca['admin-state'] === 'enable' ? ('active' as const) : ('inactive' as const),
          anysec: ca.anysec,
          encryptionType: keyInfo.encryptionType,
          host,
        }
        caList.push(transformedCA)

        const matchId = buildMatchId(
          ca['ca-name'],
          keyInfo.keyName,
          ca['cipher-suite'],
          keyInfo.encryptionType,
        )

        if (matchGroups.has(matchId)) {
          const existing = matchGroups.get(matchId)!
          if (!existing.hosts.includes(host)) {
            existing.hosts.push(host)
          }
        } else {
          matchGroups.set(matchId, {
            id: matchId,
            caName: ca['ca-name'],
            anysec: ca.anysec,
            hosts: [host],
            cipherSuite: ca['cipher-suite'],
            encryptionType: keyInfo.encryptionType,
            cakName: keyInfo.keyName,
          })
        }
      }

      stats[host] = { total, enabled, anysecTotal, anysecEnabled }
    }

    const matches = Array.from(matchGroups.values())

    return { caList, stats, matches }
  },

  async getCAByName(name: string, hosts: string[] = []): Promise<CADetail | null> {
    if (hosts.length === 0) return null
    const data = await api.getWithHosts<RawCASingleResponse>(`/CA/${name}`, hosts)

    const hostsData: CADetailHostData[] = []
    for (const [host, caData] of Object.entries(data)) {
      const activePskId = caData['static-cak']['active-psk']
      const preSharedKeys: PreSharedKey[] = caData['static-cak']['pre-shared-key'].map((psk) => ({
        pskId: psk['psk-id'],
        encryptionType: psk['encryption-type'],
        cak: psk.cak,
        cakName: psk['cak-name'],
        isActive: psk['psk-id'] === activePskId,
      }))

      const activeKey = caData['static-cak']['pre-shared-key'].find(
        (psk) => psk['psk-id'] === activePskId,
      )
      const activeEncryptionType = activeKey?.['encryption-type'] || ''

      hostsData.push({
        host,
        caName: caData['ca-name'],
        adminState: caData['admin-state'],
        cipherSuite: caData['cipher-suite'],
        anysec: caData.anysec,
        clearTagMode: caData['clear-tag-mode'],
        activePskId,
        activeEncryptionType,
        mkaHelloInterval: caData['static-cak']['mka-hello-interval'],
        preSharedKeys,
      })
    }

    if (hostsData.length === 0) return null

    return {
      caName: name,
      hosts: hostsData,
    }
  },

  async initiateRollover(
    name: string,
    hosts: string[] = [],
    xpn: boolean = true,
  ): Promise<RolloverResponse | null> {
    if (hosts.length === 0) return null
    const payload = { XPN: xpn }
    const data = await api.postWithHostsInHeader<RolloverResponse>(
      `/CA/${name}/rollover`,
      hosts,
      payload,
    )
    return rolloverResponseSchema.parse(data)
  },

  async getCAWithRetry(
    name: string,
    hosts: string[],
    maxRetries: number = 3,
  ): Promise<CADetail | null> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.getCAByName(name, hosts)
      } catch (error) {
        if (i === maxRetries - 1) throw error
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)))
      }
    }
    throw new Error('Failed to get CA after retries')
  },
}
