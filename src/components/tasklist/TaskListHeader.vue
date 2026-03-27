<script setup lang="ts">
defineEmits<{
  'add-task': []
}>()
</script>

<template>
  <VCard class="mb-6" elevation="2">
    <VCardText class="pa-6">
      <div class="d-flex justify-space-between align-center">
        <div>
          <h1 class="text-h4 font-weight-bold text-grey-darken-3 mb-2">
            📊 Workload Management
          </h1>
          <p class="text-body-1 text-grey-darken-1 mb-0">
            จัดการงานและติดตามความคืบหน้าอย่างมีประสิทธิภาพ
          </p>
        </div>
        <VBtn
          color="primary"
          size="large"
          prepend-icon="tabler-plus"
          @click="$emit('add-task')"
          class="text-none font-weight-medium"
        >
          เพิ่มงานใหม่
        </VBtn>
      </div>
    </VCardText>
  </VCard>
</template>
