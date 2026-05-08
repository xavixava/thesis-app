import type { Device, DeviceCredentials } from '@/types/device'
import { deviceSchema, deviceCredentialsSchema } from '@/types/device'
import { api } from './api'

const DEVICES_STORAGE_KEY = 'key_rollover_devices'

function getStoredDevices(): Device[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(DEVICES_STORAGE_KEY)
  if (!stored) return []
  try {
    return JSON.parse(stored)
  } catch {
    return []
  }
}

function saveDevices(devices: Device[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(DEVICES_STORAGE_KEY, JSON.stringify(devices))
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export const deviceService = {
  async getDevices(): Promise<Device[]> {
    return getStoredDevices()
  },

  async addDevice(credentials: DeviceCredentials): Promise<Device> {
    const validation = deviceCredentialsSchema.safeParse(credentials)
    if (!validation.success) {
      throw new Error(`Validation failed: ${validation.error.message}`)
    }

    const devices = getStoredDevices()

    const existingDevice = devices.find((d) => d.ipAddress === credentials.ipAddress)
    if (existingDevice) {
      throw new Error(`Device with IP ${credentials.ipAddress} already exists`)
    }

    const newDevice: Device = {
      id: generateId(),
      ipAddress: credentials.ipAddress,
      hostname: credentials.hostname,
      adminUsername: credentials.adminUsername,
      status: 'unknown',
      createdAt: new Date().toISOString(),
    }

    devices.push(newDevice)
    saveDevices(devices)

    return deviceSchema.parse(newDevice)
  },

  async removeDevice(id: string): Promise<void> {
    const devices = getStoredDevices()
    const filtered = devices.filter((d) => d.id !== id)
    saveDevices(filtered)
  },

  async updateDeviceStatus(id: string, status: Device['status']): Promise<Device> {
    const devices = getStoredDevices()
    const index = devices.findIndex((d) => d.id === id)

    if (index === -1) {
      throw new Error(`Device with id ${id} not found`)
    }

    const device = devices[index]
    if (!device) {
      throw new Error(`Device with id ${id} not found`)
    }
    device.status = status
    saveDevices(devices)

    return deviceSchema.parse(device)
  },

  async testConnection(ipAddress: string): Promise<boolean> {
    try {
      await api.get(`${ipAddress}`)
      return true
    } catch {
      return false
    }
  },

  getDeviceCredentials(id: string): { username: string; password: string } | null {
    const devices = getStoredDevices()
    const device = devices.find((d) => d.id === id)
    if (!device) return null

    const creds: { username: string; password: string } = {
      username: device.adminUsername,
      password: '',
    }
    return creds
  },
}
