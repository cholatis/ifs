<script setup lang="ts">
import type { Filters } from '@/types/tasklist2'

const props = defineProps<{ 
  filters: Filters,
  projectItems?: Array<{ title: string; value: string }>,
  loadingProjects?: boolean,
  employeeItems?: Array<{ title: string; value: string }>,
  loadingEmployees?: boolean,
}>()
const emit = defineEmits<{ 'update:filters': [filters: Filters], 'clear': [] }>()

const update = (patch: Partial<Filters>) => {
  emit('update:filters', { ...props.filters, ...patch })
}
</script>

<template>
  <VCard class="mb-6" elevation="2">
    <VCardText class="pa-6">
      <VRow>
        <VCol cols="12" sm="6" md="3">
          <VLabel class="text-caption mb-1 d-block">กรองตามโปรเจกต์</VLabel>
          <VSelect
            :items="projectItems || [{ title: 'ทั้งหมด', value: 'all' }]"
            :loading="loadingProjects"
            :model-value="filters.project || 'all'"
            density="compact"
            variant="outlined"
            hide-details
            @update:model-value="v => update({ project: v as any })"
          />
        </VCol>
        <VCol cols="12" sm="6" md="3">
          <VLabel class="text-caption mb-1 d-block">กรองตามผู้มอบหมาย</VLabel>
          <VSelect
            :items="employeeItems || [{ title: 'ทั้งหมด', value: 'all' }]"
            :loading="loadingEmployees"
            :model-value="filters.assigner || 'all'"
            density="compact"
            variant="outlined"
            hide-details
            @update:model-value="v => update({ assigner: v as any })"
          />
        </VCol>
        <VCol cols="12" sm="6" md="3">
          <VLabel class="text-caption mb-1 d-block">กรองตามสถานะ</VLabel>
          <VSelect :model-value="filters.status" :items="[
            { title: 'ทั้งหมด', value: 'all' },
            { title: 'รอดำเนินการ', value: 'todo' },
            { title: 'กำลังดำเนินการ', value: 'in-progress' },
            { title: 'เสร็จแล้ว', value: 'completed' }
          ]" density="compact" variant="outlined" hide-details @update:model-value="v => update({ status: v })"/>
        </VCol>
        <VCol cols="12" sm="6" md="3">
          <VLabel class="text-caption mb-1 d-block">กรองตามความสำคัญ</VLabel>
          <VSelect :model-value="filters.priority" :items="[
            { title: 'ทั้งหมด', value: 'all' },
            { title: 'สูง', value: 'high' },
            { title: 'ปานกลาง', value: 'medium' },
            { title: 'ต่ำ', value: 'low' }
          ]" density="compact" variant="outlined" hide-details @update:model-value="v => update({ priority: v })"/>
        </VCol>
        <VCol cols="12" sm="6" md="3">
          <VLabel class="text-caption mb-1 d-block">เรียงตาม</VLabel>
          <VSelect :model-value="filters.sortBy" :items="[
            { title: 'วันที่สร้าง', value: 'created' },
            { title: 'ความสำคัญ', value: 'priority' },
            { title: 'กำหนดส่ง', value: 'deadline' },
            { title: 'ความคืบหน้า', value: 'progress' }
          ]" density="compact" variant="outlined" hide-details @update:model-value="v => update({ sortBy: v })"/>
        </VCol>
        <VCol cols="12" sm="6" md="3" class="d-flex align-end">
          <VBtn color="error" variant="tonal" class="w-100" prepend-icon="tabler-trash" @click="$emit('clear')">ล้างข้อมูลทั้งหมด</VBtn>
        </VCol>
      </VRow>
    </VCardText>
  </VCard>
</template>



