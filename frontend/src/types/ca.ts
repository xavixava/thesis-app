import { z } from 'zod'

export const caStatusSchema = z.enum(['active', 'inactive', 'rolling_over', 'error'])

export type CAStatus = z.infer<typeof caStatusSchema>

export const connectivityAssociationSchema = z.object({
  name: z.string().min(1),
  caName: z.string().min(1),
  hostname: z.string().min(1),
  ipAddress: z.string().ip(),
  activeKeyName: z.string().min(1),
  cipherSuite: z.string().min(1),
  status: caStatusSchema,
  anysec: z.boolean().optional(),
  encryptionType: z.string().optional(),
  lastRollover: z.string().datetime().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
})

export type ConnectivityAssociation = z.infer<typeof connectivityAssociationSchema>

export const rolloverStatusSchema = z.enum(['pending', 'in_progress', 'completed', 'failed'])

export type RolloverStatus = z.infer<typeof rolloverStatusSchema>

export const rolloverResponseSchema = z.object({
  caName: z.string(),
  status: rolloverStatusSchema,
  activeKeyName: z.string().optional(),
  cipherSuite: z.string().optional(),
  message: z.string(),
  timestamp: z.string().optional(),
})

export type RolloverResponse = z.infer<typeof rolloverResponseSchema>

export interface RawCAFromBackend {
  'ca-name': string
  'admin-state': string
  'clear-tag-mode': string
  'cipher-suite': string
  anysec: boolean
  'static-cak': {
    'active-psk': number
    'mka-hello-interval': string
    'pre-shared-key': Array<{
      'psk-id': number
      'encryption-type': string
      cak: string
      'cak-name': string
    }>
  }
}

export type RawCAResponse = Record<string, RawCAFromBackend[]>

export type RawCASingleResponse = Record<string, RawCAFromBackend>

export interface CAStats {
  total: number
  enabled: number
  anysecTotal: number
  anysecEnabled: number
}

export interface MatchedCAGroup {
  id: string
  caName: string
  anysec: boolean
  hosts: string[]
  cipherSuite: string
  encryptionType: string
  cakName: string
}

export interface PreSharedKey {
  pskId: number
  encryptionType: string
  cak: string
  cakName: string
  isActive: boolean
}

export interface CADetailHostData {
  host: string
  caName: string
  adminState: string
  cipherSuite: string
  anysec: boolean
  clearTagMode: string
  activePskId: number
  activeEncryptionType: string
  mkaHelloInterval: string
  preSharedKeys: PreSharedKey[]
}

export interface CADetail {
  caName: string
  hosts: CADetailHostData[]
}
