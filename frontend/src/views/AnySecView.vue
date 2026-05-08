<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useAnySecStore } from '@/stores/anysec'
import AnySecGroupList from '@/components/AnySecGroupList.vue'
import StatisticsPanel from '@/components/StatisticsPanel.vue'

const anySecStore = useAnySecStore()

onMounted(async () => {
  await anySecStore.fetchAll()
  anySecStore.startPolling()
})

onUnmounted(() => {
  anySecStore.stopPolling()
})

function handleRefresh() {
  anySecStore.fetchAll()
}
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-dark-text">ANYsec Configuration</h1>
      <button @click="handleRefresh" class="btn-secondary">Refresh</button>
    </div>

    <div class="grid grid-cols-1 gap-6">
      <AnySecGroupList
        :groups="anySecStore.groupsWithCA"
        :loading="anySecStore.loading"
        :error="anySecStore.error"
      />

      <StatisticsPanel
        :group-statistics="anySecStore.groupStatistics"
        :loading="anySecStore.loading"
        :error="anySecStore.error"
      />
    </div>
  </div>
</template>
