<script setup lang="ts">
definePage({
  meta: {
    layout: 'default',
  },
})
</script>

<template>
  <VCard class="text-center pa-10 ma-10">
    <VIcon size="100" color="success" icon="tabler-circle-check" class="mb-5" />
    <h2 class="text-h4 mb-2">ส่งคำขอสินเชื่อสำเร็จ!</h2>
    <p class="text-body-1 text-secondary mb-6">
      เจ้าหน้าที่จะตรวจสอบข้อมูลและเอกสารของคุณ และติดต่อกลับภายใน 1-3 วันทำการ
    </p>
    <div class="d-flex justify-center gap-4">
      <VBtn to="/dashboard" variant="outlined">กลับหน้าหลัก</VBtn>
      <VBtn to="/credit-application" color="primary">ดูคำขอของฉัน</VBtn>
    </div>
  </VCard>
</template>
