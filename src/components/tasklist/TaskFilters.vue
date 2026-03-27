<script setup lang="ts">
import type { TaskFilters } from '@/types/task'

const props = defineProps<{
  filters: TaskFilters
}>()

const emit = defineEmits<{
  'update:filters': [filters: Partial<TaskFilters>]
}>()

const handleFilterChange = (key: keyof TaskFilters, value: string) => {
  emit('update:filters', { [key]: value })
}
</script>

<template>
  <VCard class="mb-6" elevation="2">
    <VCardText class="pa-6">
      <VRow>
        <VCol cols="12" sm="6" md="4">
          <VLabel class="text-caption text-grey-darken-1 mb-2 d-block">
            กรองตามสถานะ
          </VLabel>
          <VSelect
            :model-value="filters.status"
            @update:model-value="(value) => handleFilterChange('status', value)"
            :items="[
              { title: 'ทั้งหมด', value: 'all' },
              { title: 'รอดำเนินการ', value: 'todo' },
              { title: 'กำลังดำเนินการ', value: 'in-progress' },
              { title: 'เสร็จแล้ว', value: 'completed' }
            ]"
            variant="outlined"
            density="compact"
            hide-details
          />
        </VCol>
        
        <VCol cols="12" sm="6" md="4">
          <VLabel class="text-caption text-grey-darken-1 mb-2 d-block">
            กรองตามความสำคัญ
          </VLabel>
          <VSelect
            :model-value="filters.priority"
            @update:model-value="(value) => handleFilterChange('priority', value)"
            :items="[
              { title: 'ทั้งหมด', value: 'all' },
              { title: 'สูง', value: 'high' },
              { title: 'ปานกลาง', value: 'medium' },
              { title: 'ต่ำ', value: 'low' }
            ]"
            variant="outlined"
            density="compact"
            hide-details
          />
        </VCol>
        
        <VCol cols="12" sm="6" md="4">
          <VLabel class="text-caption text-grey-darken-1 mb-2 d-block">
            เรียงตาม
          </VLabel>
          <VSelect
            :model-value="filters.sortBy"
            @update:model-value="(value) => handleFilterChange('sortBy', value)"
            :items="[
              { title: 'วันที่สร้าง', value: 'created' },
              { title: 'ความสำคัญ', value: 'priority' },
              { title: 'กำหนดส่ง', value: 'deadline' },
              { title: 'ความคืบหน้า', value: 'progress' }
            ]"
            variant="outlined"
            density="compact"
            hide-details
          />
        </VCol>
      </VRow>
    </VCardText>
  </VCard>
</template>
