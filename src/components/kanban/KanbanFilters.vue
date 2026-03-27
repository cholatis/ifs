<script setup lang="ts">
import type { KanbanFilters } from '@/types/kanban'

const props = defineProps<{
  filters: KanbanFilters
  assignees: string[]
}>()

const emit = defineEmits<{
  'update:filters': [filters: Partial<KanbanFilters>]
}>()

const handleFilterChange = (key: keyof KanbanFilters, value: string) => {
  emit('update:filters', { [key]: value })
}
</script>

<template>
  <VCard class="mb-6" elevation="2">
    <VCardText class="pa-6">
      <VRow>
        <VCol cols="12" sm="6" md="4">
          <VLabel class="text-caption text-grey-darken-1 mb-2 d-block">
            Filter by Priority
          </VLabel>
          <VSelect
            :model-value="filters.priority"
            @update:model-value="(value) => handleFilterChange('priority', value)"
            :items="[
              { title: 'All Priorities', value: '' },
              { title: '🔴 High Priority', value: 'high' },
              { title: '🟡 Medium Priority', value: 'medium' },
              { title: '🟢 Low Priority', value: 'low' }
            ]"
            variant="outlined"
            density="compact"
            hide-details
          />
        </VCol>
        
        <VCol cols="12" sm="6" md="4">
          <VLabel class="text-caption text-grey-darken-1 mb-2 d-block">
            Filter by Assignee
          </VLabel>
          <VSelect
            :model-value="filters.assignee"
            @update:model-value="(value) => handleFilterChange('assignee', value)"
            :items="[
              { title: 'All Team Members', value: '' },
              ...assignees.map(assignee => ({ title: `👤 ${assignee}`, value: assignee }))
            ]"
            variant="outlined"
            density="compact"
            hide-details
          />
        </VCol>
        
        <VCol cols="12" sm="6" md="4">
          <VLabel class="text-caption text-grey-darken-1 mb-2 d-block">
            Search Tasks
          </VLabel>
          <VTextField
            :model-value="filters.search"
            @update:model-value="(value) => handleFilterChange('search', value)"
            placeholder="Search by title..."
            variant="outlined"
            density="compact"
            hide-details
            prepend-inner-icon="tabler-search"
          />
        </VCol>
      </VRow>
    </VCardText>
  </VCard>
</template>



