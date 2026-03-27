<template>
  <VAlert type="warning" variant="tonal" class="mb-6">
    <div class="mb-3 text-subtitle-1 font-weight-medium">📋 รูปแบบไฟล์ Excel ที่รองรับ (Sheet เดียว)</div>
    <VCard variant="outlined" class="mb-4">
      <VCardText>
        <div class="text-body-2 mb-3">Sheet "Tasks" - ใส่ทั้งงานหลักและงานย่อยใน Sheet เดียวกัน</div>
        <VRow>
          <VCol cols="12" md="6">
            <div class="text-caption font-weight-medium mb-2">คอลัมน์หลัก</div>
            <ul class="text-caption">
              <li>• task_id — รหัสงาน (เลขเฉพาะ)</li>
              <li>• title — ชื่องาน/งานย่อย</li>
              <li>• description — รายละเอียด (ไม่บังคับ)</li>
              <li>• parent_task_id — รหัสงานหลัก (สำหรับงานย่อย)</li>
            </ul>
          </VCol>
          <VCol cols="12" md="6">
            <div class="text-caption font-weight-medium mb-2">คอลัมน์เพิ่มเติม</div>
            <ul class="text-caption">
              <li>• priority — high/medium/low</li>
              <li>• status — todo/in-progress/completed</li>
              <li>• deadline — YYYY-MM-DD</li>
              <li>• completed — true/false (เฉพาะงานย่อย)</li>
            </ul>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>
    <div class="text-caption">💡 งานหลัก: ใส่ task_id และปล่อย parent_task_id ว่าง • งานย่อย: ใส่ parent_task_id เป็นรหัสงานหลัก</div>
  </VAlert>
</template>





