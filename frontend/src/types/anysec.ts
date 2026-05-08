import { z } from 'zod'

export const anySecEncryptionStatusSchema = z.enum(['enabled', 'disabled', 'partial'])

export type AnySecEncryptionStatus = z.infer<typeof anySecEncryptionStatusSchema>

export const anySecGroupSchema = z.object({
  name: z.string().min(1),
  groupName: z.string().min(1),
  enabled: z.boolean(),
  cipherSuite: z.string().optional(),
  memberCount: z.number().int().nonnegative().default(0),
})

export type AnySecGroup = z.infer<typeof anySecGroupSchema>

export const anySecStatisticsSchema = z.object({
  groupName: z.string().min(1),
  securedLinks: z.number().int().nonnegative(),
  unsecuredLinks: z.number().int().nonnegative(),
  lastUpdated: z.string().datetime(),
  encryptionStatus: anySecEncryptionStatusSchema,
})

export type AnySecStatistics = z.infer<typeof anySecStatisticsSchema>

export const anySecStateSchema = z.object({
  groupName: z.string().min(1),
  securedLinks: z.number().int().nonnegative(),
  unsecuredLinks: z.number().int().nonnegative(),
  lastUpdated: z.string().datetime(),
  encryptionStatus: anySecEncryptionStatusSchema,
})

export type AnySecState = z.infer<typeof anySecStateSchema>

export type EncryptionType = 'service-encryption' | 'tunnel-encryption'

export interface RawEncryptionGroup {
  'group-name': string
  'admin-state': string
  'security-termination-policy'?: string
  'encryption-label'?: number
  'ca-name': string
  peer?: Array<{
    'peer-ip-address': string
    'admin-state': string
  }>
}

export interface RawAnySecHostData {
  'reserved-label-block'?: string
  'mka-over-ip'?: {
    'mka-udp-port'?: number
  }
  'security-termination-policies'?: {
    policy?: Array<{
      'policy-name': string
      'admin-state'?: string
      'local-address'?: string
      'rx-must-be-encrypted'?: boolean
      protocol?: string
      'igp-instance-id'?: number
    }>
  }
  'service-encryption'?: {
    'encryption-group'?: RawEncryptionGroup[]
  }
  'tunnel-encryption'?: {
    'encryption-group'?: RawEncryptionGroup[]
  }
}

export type RawAnySecResponse = Record<string, RawAnySecHostData>

export interface AnySecGroupWithHost {
  host: string
  groupName: string
  caName: string
  encryptionType: EncryptionType
  adminState: string
  encryptionLabel?: number
  peerCount: number
  securedPeers: number
}

export interface AnySecGroupWithCA extends AnySecGroupWithHost {
  operState?: string
  caInfo?: {
    activeKeyName: string
    cipherSuite: string
    status: string
  }
}

export interface RawAnySecStatistics {
  'secured-links'?: number
  'unsecured-links'?: number
  'encryption-status'?: string
  'last-updated'?: string
}

export type RawAnySecStatisticsResponse = Record<string, RawAnySecStatistics>

export interface RawMKAState {
  ckn?: string
  'member-id'?: string
  'outbound-sci'?: string
  'message-count'?: number
  'key-number'?: number
  'key-server'?: boolean
  'latest-sak-an'?: number
  'previous-sak-an'?: number
  'latest-sak-ki'?: string
  'previous-sak-ki'?: string
  'oper-state'?: string
  'oper-cipher'?: string
  'latest-sak-lpn'?: string
  'previous-sak-lpn'?: string
}

export interface RawPeerState {
  'peer-ip-address'?: string
  'encryption-label'?: number
  'oper-state'?: string
  'oper-down-reason'?: string
  'rx-sc'?: {
    'ok-packets'?: string
    'not-valid-packets'?: string
    'delayed-packets'?: string
    'unchecked-packets'?: string
  }
  'tx-sc'?: {
    'encrypted-packets'?: string
    'octets-encrypted'?: string
  }
  mka?: RawMKAState[]
}

export interface RawEncryptionGroupState {
  'group-name'?: string
  'group-id'?: number
  peer?: RawPeerState[]
}

export interface RawEncryptionState {
  'encryption-group'?: RawEncryptionGroupState[]
}

export interface RawAnySecHostState {
  'mka-udp-port-oper-state'?: string
  'security-termination-policies'?: {
    policy?: Array<{
      'policy-name'?: string
      'terminating-label'?: number
    }>
  }
  'service-encryption'?: RawEncryptionState
  'tunnel-encryption'?: RawEncryptionState
}

export type RawAnySecStateResponse = Record<string, RawAnySecHostState>

export interface PeerStatistics {
  peerIp: string
  encryptionLabel: number
  operState: string
  totalOkPackets: number
  totalNotValidPackets: number
}

export interface AnySecGroupStatistics {
  host: string
  groupName: string
  encryptionType: EncryptionType
  allPeersUp: boolean
  peers: PeerStatistics[]
  keyServer: boolean | null
  keyNumber: number | null
  messageCount: number | null
}

export interface AnySecStatisticsWithHost {
  host: string
  groupName: string
  securedLinks: number
  unsecuredLinks: number
  encryptionStatus: string
  lastUpdated: string
}
