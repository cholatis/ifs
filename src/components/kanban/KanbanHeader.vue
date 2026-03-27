<script setup lang="ts">
defineEmits<{
  'add-task': []
  'toggle-dashboard': []
  'toggle-collapse': []
}>()

defineProps<{
  isCollapsed: boolean
}>()
</script>

<template>
  <VCard class="mb-6" elevation="2">
    <VCardText class="pa-6">
      <div class="d-flex justify-space-between align-center">
        <div>
          <h1 class="text-h4 font-weight-bold text-grey-darken-3 mb-2">
            📋 Kanban Board
          </h1>
          <p class="text-body-1 text-grey-darken-1 mb-0">
            Better visibility in seconds with drag-and-drop workflow
          </p>
        </div>
        <div class="d-flex gap-3">
          <VBtn
            color="info"
            variant="outlined"
            :prepend-icon="isCollapsed ? 'tabler-chevron-down' : 'tabler-chevron-up'"
            @click="$emit('toggle-collapse')"
            class="text-none font-weight-medium"
          >
            {{ isCollapsed ? 'Expand' : 'Collapse' }}
          </VBtn>
          <VBtn
            color="primary"
            variant="outlined"
            prepend-icon="tabler-chart-bar"
            @click="$emit('toggle-dashboard')"
            class="text-none font-weight-medium"
          >
            Dashboard
          </VBtn>
          <VBtn
            color="success"
            size="large"
            prepend-icon="tabler-plus"
            @click="$emit('add-task')"
            class="text-none font-weight-medium"
          >
            Add Task
          </VBtn>
        </div>
      </div>
    </VCardText>
  </VCard>
</template>
