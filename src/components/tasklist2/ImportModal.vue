<script setup lang="ts">
const props = defineProps<{ show: boolean }>()
const emit = defineEmits<{ 'update:show': [v: boolean], 'import:file': [file: File] }>()
const show = computed({ get: () => props.show, set: v => emit('update:show', v) })

const onFile = (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) emit('import:file', file)
}
</script>

<template>
  <VDialog v-model="show" max-width="640" persistent>
    <VCard>
      <VCardTitle class="text-h6 font-weight-bold">📥 Import ข้อมูลจาก Excel</VCardTitle>
      <VCardText>
        <div class="text-body-2 mb-4">รองรับไฟล์ .xlsx/.xls และต้องมี Sheet ชื่อ "Tasks"</div>
        <VFileInput accept=".xlsx,.xls" label="เลือกไฟล์ Excel" variant="outlined" prepend-icon="tabler-file-spreadsheet" @change="onFile" />
      </VCardText>
      <VCardActions>
        <VBtn color="grey" variant="outlined" @click="show = false">ปิด</VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>





