import { ref, onMounted, onUnmounted } from 'vue'

export function usePolling(
  callback: () => Promise<void>,
  interval: number = 30000,
  immediate: boolean = true,
) {
  const isPolling = ref(false)
  const intervalId = ref<number | null>(null)
  const error = ref<string | null>(null)

  async function poll() {
    if (isPolling.value) return

    isPolling.value = true
    error.value = null

    try {
      await callback()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Polling error'
    } finally {
      isPolling.value = false
    }
  }

  function start() {
    if (intervalId.value) return

    if (immediate) {
      poll()
    }

    intervalId.value = window.setInterval(poll, interval)
  }

  function stop() {
    if (intervalId.value) {
      clearInterval(intervalId.value)
      intervalId.value = null
    }
  }

  function restart() {
    stop()
    start()
  }

  onMounted(() => {
    start()
  })

  onUnmounted(() => {
    stop()
  })

  return {
    isPolling: ref(isPolling),
    error: ref(error),
    start,
    stop,
    restart,
    poll,
  }
}
