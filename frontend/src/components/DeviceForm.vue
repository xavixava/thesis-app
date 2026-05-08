<script setup lang="ts">
import { ref } from 'vue'
import type { DeviceCredentials } from '@/types/device'
import { deviceCredentialsSchema } from '@/types/device'

const emit = defineEmits<{
  submit: [credentials: DeviceCredentials]
  cancel: []
}>()

const form = ref<DeviceCredentials>({
  ipAddress: '',
  hostname: '',
  adminUsername: '',
  adminPassword: '',
})

const errors = ref<Record<string, string>>({})
const loading = ref(false)

function validate(): boolean {
  errors.value = {}

  const validation = deviceCredentialsSchema.safeParse(form.value)
  if (!validation.success) {
    validation.error.errors.forEach((err) => {
      const field = err.path.join('.')
      errors.value[field] = err.message
    })
    return false
  }
  return true
}

async function handleSubmit() {
  if (!validate()) return

  loading.value = true
  try {
    emit('submit', { ...form.value })
  } finally {
    loading.value = false
  }
}

function handleIpInput(event: Event) {
  const target = event.target as HTMLInputElement
  form.value.ipAddress = target.value
}

function handleHostnameInput(event: Event) {
  const target = event.target as HTMLInputElement
  form.value.hostname = target.value
}

function handleUsernameInput(event: Event) {
  const target = event.target as HTMLInputElement
  form.value.adminUsername = target.value
}

function handlePasswordInput(event: Event) {
  const target = event.target as HTMLInputElement
  form.value.adminPassword = target.value
}
</script>

<template>
  <div class="card">
    <h2 class="text-xl font-semibold mb-6">Add New Device</h2>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label for="ipAddress" class="block text-sm font-medium text-dark-text mb-1">
          IP Address
        </label>
        <input
          id="ipAddress"
          type="text"
          :value="form.ipAddress"
          @input="handleIpInput"
          class="input-field w-full"
          placeholder="192.168.1.1"
          :disabled="loading"
        />
        <p v-if="errors.ipAddress" class="text-red-400 text-sm mt-1">{{ errors.ipAddress }}</p>
      </div>

      <div>
        <label for="hostname" class="block text-sm font-medium text-dark-text mb-1">
          Hostname
        </label>
        <input
          id="hostname"
          type="text"
          :value="form.hostname"
          @input="handleHostnameInput"
          class="input-field w-full"
          placeholder="switch-01"
          :disabled="loading"
        />
        <p v-if="errors.hostname" class="text-red-400 text-sm mt-1">{{ errors.hostname }}</p>
      </div>

      <div>
        <label for="adminUsername" class="block text-sm font-medium text-dark-text mb-1">
          Admin Username
        </label>
        <input
          id="adminUsername"
          type="text"
          :value="form.adminUsername"
          @input="handleUsernameInput"
          class="input-field w-full"
          placeholder="admin"
          :disabled="loading"
        />
        <p v-if="errors.adminUsername" class="text-red-400 text-sm mt-1">
          {{ errors.adminUsername }}
        </p>
      </div>

      <div>
        <label for="adminPassword" class="block text-sm font-medium text-dark-text mb-1">
          Admin Password
        </label>
        <input
          id="adminPassword"
          type="password"
          :value="form.adminPassword"
          @input="handlePasswordInput"
          class="input-field w-full"
          placeholder="••••••••"
          :disabled="loading"
        />
        <p v-if="errors.adminPassword" class="text-red-400 text-sm mt-1">
          {{ errors.adminPassword }}
        </p>
      </div>

      <div class="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          @click="emit('cancel')"
          class="px-4 py-2 border border-dark-border rounded-md text-dark-text hover:bg-dark-surface transition-colors"
          :disabled="loading"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="btn-primary"
          :disabled="loading"
          :class="{ 'opacity-50 cursor-not-allowed': loading }"
        >
          {{ loading ? 'Adding...' : 'Add Device' }}
        </button>
      </div>
    </form>
  </div>
</template>
