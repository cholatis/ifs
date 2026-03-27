<script setup lang="ts">
import type { Stats } from '@/types/tasklist2'
defineProps<{ stats: Stats }>()
</script>

<template>
  <VRow class="mb-6">
    <VCol cols="12" sm="6" md="3">
      <VCard elevation="2"><VCardText class="pa-6 d-flex align-center"><VAvatar color="primary" variant="tonal" class="me-4"><VIcon icon="tabler-clipboard-list"/></VAvatar><div><div class="text-caption text-grey-darken-1">งานทั้งหมด</div><div class="text-h5 font-weight-bold">{{ stats.total }}</div></div></VCardText></VCard>
    </VCol>
    <VCol cols="12" sm="6" md="3">
      <VCard elevation="2"><VCardText class="pa-6 d-flex align-center"><VAvatar color="success" variant="tonal" class="me-4"><VIcon icon="tabler-check"/></VAvatar><div><div class="text-caption text-grey-darken-1">เสร็จแล้ว</div><div class="text-h5 font-weight-bold text-success">{{ stats.completed }}</div></div></VCardText></VCard>
    </VCol>
    <VCol cols="12" sm="6" md="3">
      <VCard elevation="2"><VCardText class="pa-6 d-flex align-center"><VAvatar color="warning" variant="tonal" class="me-4"><VIcon icon="tabler-clock"/></VAvatar><div><div class="text-caption text-grey-darken-1">กำลังดำเนินการ</div><div class="text-h5 font-weight-bold text-warning">{{ stats.inProgress }}</div></div></VCardText></VCard>
    </VCol>
    <VCol cols="12" sm="6" md="3">
      <VCard elevation="2"><VCardText class="pa-6 d-flex align-center"><VAvatar color="error" variant="tonal" class="me-4"><VIcon icon="tabler-flame"/></VAvatar><div><div class="text-caption text-grey-darken-1">ความสำคัญสูง</div><div class="text-h5 font-weight-bold text-error">{{ stats.highPriority }}</div></div></VCardText></VCard>
    </VCol>
  </VRow>
</template>





