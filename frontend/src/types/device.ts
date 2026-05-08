import { z } from 'zod'

export const deviceSchema = z.object({
  id: z.string().uuid(),
  ipAddress: z.string().ip(),
  hostname: z.string().min(1).max(255),
  adminUsername: z.string().min(1).max(100),
  status: z.enum(['online', 'offline', 'unknown']).default('unknown'),
  createdAt: z.string().datetime(),
})

export type Device = z.infer<typeof deviceSchema>

export const createDeviceSchema = deviceSchema.omit({ id: true, status: true, createdAt: true })

export type CreateDeviceRequest = z.infer<typeof createDeviceSchema>

export const deviceCredentialsSchema = z.object({
  ipAddress: z.string().ip(),
  hostname: z.string().min(1).max(255),
  adminUsername: z.string().min(1).max(100),
  adminPassword: z.string().min(1).max(100),
})

export type DeviceCredentials = z.infer<typeof deviceCredentialsSchema>
