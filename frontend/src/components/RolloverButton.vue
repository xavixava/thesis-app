<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  loading?: boolean
  disabled?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  click: []
}>()

const buttonText = computed(() => {
  if (props.loading) return 'Rolling over...'
  return 'Trigger Rollover'
})
</script>

<template>
  <button
    @click="emit('click')"
    :disabled="disabled || loading"
    class="btn-primary flex items-center justify-center space-x-2"
    :class="{
      'opacity-50 cursor-not-allowed': disabled || loading,
      'bg-yellow-500 hover:bg-yellow-600': !disabled && !loading,
    }"
    :aria-busy="loading"
  >
    <svg
      v-if="loading"
      class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      ></circle>
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
    <span>{{ buttonText }}</span>
  </button>
</template>
