<script setup lang="ts">
import type { TaskStats } from '@/types/task'

defineProps<{
  stats: TaskStats
}>()
</script>

<template>
  <VRow class="mb-6">
    <VCol cols="12" sm="6" md="3">
      <VCard elevation="2" class="h-100">
        <VCardText class="pa-6">
          <div class="d-flex align-center">
            <VAvatar
              color="primary"
              variant="tonal"
              size="48"
              class="me-4"
            >
              <VIcon icon="tabler-clipboard-list" size="24" />
            </VAvatar>
            <div>
              <p class="text-caption text-grey-darken-1 mb-1">งานทั้งหมด</p>
              <h3 class="text-h4 font-weight-bold text-grey-darken-3 mb-0">
                {{ stats.total }}
              </h3>
            </div>
          </div>
        </VCardText>
      </VCard>
    </VCol>
    
    <VCol cols="12" sm="6" md="3">
      <VCard elevation="2" class="h-100">
        <VCardText class="pa-6">
          <div class="d-flex align-center">
            <VAvatar
              color="success"
              variant="tonal"
              size="48"
              class="me-4"
            >
              <VIcon icon="tabler-check" size="24" />
            </VAvatar>
            <div>
              <p class="text-caption text-grey-darken-1 mb-1">เสร็จแล้ว</p>
              <h3 class="text-h4 font-weight-bold text-success mb-0">
                {{ stats.completed }}
              </h3>
            </div>
          </div>
        </VCardText>
      </VCard>
    </VCol>
    
    <VCol cols="12" sm="6" md="3">
      <VCard elevation="2" class="h-100">
        <VCardText class="pa-6">
          <div class="d-flex align-center">
            <VAvatar
              color="warning"
              variant="tonal"
              size="48"
              class="me-4"
            >
              <VIcon icon="tabler-clock" size="24" />
            </VAvatar>
            <div>
              <p class="text-caption text-grey-darken-1 mb-1">กำลังดำเนินการ</p>
              <h3 class="text-h4 font-weight-bold text-warning mb-0">
                {{ stats.inProgress }}
              </h3>
            </div>
          </div>
        </VCardText>
      </VCard>
    </VCol>
    
    <VCol cols="12" sm="6" md="3">
      <VCard elevation="2" class="h-100">
        <VCardText class="pa-6">
          <div class="d-flex align-center">
            <VAvatar
              color="error"
              variant="tonal"
              size="48"
              class="me-4"
            >
              <VIcon icon="tabler-flame" size="24" />
            </VAvatar>
            <div>
              <p class="text-caption text-grey-darken-1 mb-1">ความสำคัญสูง</p>
              <h3 class="text-h4 font-weight-bold text-error mb-0">
                {{ stats.highPriority }}
              </h3>
            </div>
          </div>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>
