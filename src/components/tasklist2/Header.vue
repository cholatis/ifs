<script setup lang="ts">
defineEmits<{
  'import': []
  'export': []
  'add-task': []
}>()
</script>

<template>
  <VCard class="mb-6" elevation="2">
    <VCardText class="pa-6">
      <div class="d-flex justify-space-between align-center">
        <div>
          <h1 class="text-h4 font-weight-bold text-grey-darken-3 mb-2">📊 Workload Management</h1>
          <p class="text-body-1 text-grey-darken-1 mb-0">จัดการงานและ import ข้อมูลจาก Excel อย่างมีประสิทธิภาพ</p>
        </div>
        <div class="d-flex gap-3">
          <VBtn color="success" class="text-none" prepend-icon="tabler-file-import" @click="$emit('import')">Import Excel</VBtn>
          <VBtn color="purple" class="text-none" prepend-icon="tabler-file-export" @click="$emit('export')">Download Template</VBtn>
          <VBtn color="primary" class="text-none" prepend-icon="tabler-plus" @click="$emit('add-task')">เพิ่มงานใหม่</VBtn>
        </div>
      </div>
    </VCardText>
  </VCard>
</template>



