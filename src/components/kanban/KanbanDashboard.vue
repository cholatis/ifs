<script setup lang="ts">
import type { KanbanStats } from '@/types/kanban'

defineProps<{
  stats: KanbanStats
}>()
</script>

<template>
  <div class="mb-6">
    <h2 class="text-h5 font-weight-bold text-grey-darken-3 mb-6">
      📈 Real-time Insights
    </h2>
    
    <VRow class="mb-6">
      <VCol cols="12" sm="6" md="3">
        <VCard 
          class="h-100"
          style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);"
        >
          <VCardText class="pa-6 text-white">
            <h3 class="text-h6 font-weight-semibold mb-2">Total Tasks</h3>
            <p class="text-h3 font-weight-bold mb-0">{{ stats.total }}</p>
          </VCardText>
        </VCard>
      </VCol>
      
      <VCol cols="12" sm="6" md="3">
        <VCard 
          class="h-100"
          style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);"
        >
          <VCardText class="pa-6 text-white">
            <h3 class="text-h6 font-weight-semibold mb-2">Completed</h3>
            <p class="text-h3 font-weight-bold mb-0">{{ stats.completed }}</p>
          </VCardText>
        </VCard>
      </VCol>
      
      <VCol cols="12" sm="6" md="3">
        <VCard 
          class="h-100"
          style="background: linear-gradient(135deg, #fad961 0%, #f76b1c 100%);"
        >
          <VCardText class="pa-6 text-white">
            <h3 class="text-h6 font-weight-semibold mb-2">In Progress</h3>
            <p class="text-h3 font-weight-bold mb-0">{{ stats.inProgress }}</p>
          </VCardText>
        </VCard>
      </VCol>
      
      <VCol cols="12" sm="6" md="3">
        <VCard 
          class="h-100"
          style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);"
        >
          <VCardText class="pa-6 text-white">
            <h3 class="text-h6 font-weight-semibold mb-2">Efficiency</h3>
            <p class="text-h3 font-weight-bold mb-0">{{ stats.efficiency }}%</p>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
    
    <!-- Progress Overview -->
    <VCard elevation="2">
      <VCardText class="pa-6">
        <h3 class="text-h6 font-weight-semibold text-grey-darken-3 mb-4">
          Project Progress
        </h3>
        <div>
          <div class="d-flex justify-space-between align-center mb-2">
            <span class="text-caption text-grey-darken-1">Overall Completion</span>
            <span class="text-caption font-weight-medium text-grey-darken-2">
              {{ stats.efficiency }}%
            </span>
          </div>
          <VProgressLinear
            :model-value="stats.efficiency"
            color="primary"
            height="12"
            rounded
            class="mb-0"
          />
        </div>
      </VCardText>
    </VCard>
  </div>
</template>



