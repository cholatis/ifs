<script setup lang="ts">
import { useCreditApplication } from '@/composables/useCreditApplication'
import { useRouter } from 'vue-router'
import { requiredValidator, lengthValidator } from '@core/utils/validators'

definePage({
  meta: {
    layout: 'default',
  },
})

const router = useRouter()
const { 
  form, 
  isSaving, 
  lastSaved, 
  uploadProgress, 
  isFormValid, 
  saveDraft, 
  submitApplication,
  updateDocFiles 
} = useCreditApplication()

const creditPeriodOptions = [30, 45, 60, 90, 120]
const paymentTypeOptions = [
  { title: 'เช็ค', value: 'cheque' },
  { title: 'โอน', value: 'transfer' },
]

const currentTab = ref('company')

const onSubmit = async () => {
  const success = await submitApplication()
  if (success) {
    router.push('/credit-application/request')
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'draft': return 'secondary'
    case 'submitted': return 'info'
    case 'approved': return 'success'
    case 'rejected': return 'error'
    default: return 'primary'
  }
}

const getDocGroupCount = (group: string) => {
  const docs = form.value.documents.filter(d => d.docGroup === group)
  const uploaded = docs.filter(d => d.uploadStatus === 'uploaded').length
  return `${uploaded}/${docs.length}`
}

const isTabComplete = (group: string) => {
  const docs = form.value.documents.filter(d => d.docGroup === group && d.required)
  return docs.every(d => d.uploadStatus === 'uploaded')
}
</script>

<template>
  <VForm @submit.prevent="onSubmit">
    <VRow>
      <!-- Page Header -->
      <VCol cols="12">
        <VCard color="primary" class="pa-4 d-flex align-center justify-space-between flex-wrap gap-4">
          <div class="d-flex align-center gap-2">
            <h2 class="text-white mb-0">คำขอสินเชื่อ Factoring</h2>
            <VBadge
              color="white"
              :content="form.requestId"
              inline
              class="request-id-badge"
            />
            <VChip
              :color="getStatusColor(form.status)"
              size="small"
              class="text-uppercase ml-2"
            >
              {{ form.status }}
            </VChip>
          </div>
          
          <div class="d-flex gap-3">
            <div v-if="lastSaved" class="text-white text-caption d-flex align-center mr-2">
              Auto-saved: {{ lastSaved.toLocaleTimeString() }}
            </div>
            <VBtn
              variant="tonal"
              color="white"
              prepend-icon="tabler-device-floppy"
              @click="saveDraft"
              :loading="isSaving"
            >
              บันทึก Draft
            </VBtn>
            <VBtn
              color="white"
              class="text-primary"
              prepend-icon="tabler-send"
              type="submit"
              :disabled="!isFormValid"
            >
              ส่งคำขอ
            </VBtn>
          </div>
        </VCard>
      </VCol>

      <!-- Section 1: PO & Amount -->
      <VCol cols="12" md="6">
        <VCard title="Section 1 — ข้อมูล PO และวงเงินที่ขอ" class="h-100">
          <VCardText>
            <VRow>
              <VCol cols="12" sm="6">
                <VTextField
                  v-model="form.poNumber"
                  label="เลขที่ PO"
                  placeholder="เช่น PO-2024-XXXX"
                  :rules="[requiredValidator]"
                  required
                />
              </VCol>
              <VCol cols="12" sm="6">
                <VTextField
                  v-model.number="form.poAmount"
                  label="มูลค่า PO (บาท)"
                  type="number"
                  placeholder="8,500,000"
                  :rules="[requiredValidator]"
                  required
                />
              </VCol>
              <VCol cols="12">
                <VTextField
                  v-model="form.buyerName"
                  label="ชื่อ Buyer / ลูกค้า"
                  placeholder="ระบุชื่อบริษัทลูกค้า"
                  :rules="[requiredValidator]"
                  required
                />
              </VCol>
              <VCol cols="12" sm="6">
                <VTextField
                  v-model="form.buyerTaxId"
                  label="เลขประจำตัวผู้เสียภาษี Buyer"
                  placeholder="01075XXXXXXXX"
                  :rules="[requiredValidator, lengthValidator(form.buyerTaxId, 13)]"
                  maxlength="13"
                  required
                />
              </VCol>
              <VCol cols="12" sm="3">
                <VTextField
                  v-model.number="form.requestedAmount"
                  label="วงเงินที่ขอ (บาท)"
                  type="number"
                  placeholder="7,000,000"
                  :rules="[requiredValidator]"
                  required
                />
              </VCol>
              <VCol cols="12" sm="3">
                <VSelect
                  v-model="form.creditPeriod"
                  label="ระยะเวลาสินเชื่อ"
                  :items="creditPeriodOptions"
                  suffix="วัน"
                  :rules="[requiredValidator]"
                  required
                />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Section 2: Billing & Payment -->
      <VCol cols="12" md="6">
        <VCard title="Section 2 — เงื่อนไขการวางบิลและชำระเงิน" class="h-100">
          <VCardText>
            <VRow>
              <VCol cols="12" sm="6">
                <VTextField
                  v-model="form.billingSchedule"
                  label="กำหนดการวางบิล"
                  placeholder="เช่น ทุกวันที่ 25 ของเดือน"
                  :rules="[requiredValidator]"
                  required
                />
              </VCol>
              <VCol cols="12" sm="6">
                <VTextField
                  v-model="form.paymentDueDate"
                  label="กำหนดการชำระเงิน"
                  placeholder="เช่น 30 วันหลังวางบิล"
                  :rules="[requiredValidator]"
                  required
                />
              </VCol>
              <VCol cols="12" sm="6">
                <VSelect
                  v-model="form.paymentType"
                  label="ประเภทการชำระ"
                  :items="paymentTypeOptions"
                  :rules="[requiredValidator]"
                  required
                />
              </VCol>
              <VCol cols="12" sm="6">
                <VTextField
                  label="สถานที่รับชำระ"
                  placeholder="ระบุสถานที่ (ถ้ามี)"
                />
              </VCol>
              <VCol cols="12">
                <VTextarea
                  label="ระเบียบวางบิล/ชำระเงิน (ถ้ามี)"
                  rows="2"
                  placeholder="รายละเอียดเพิ่มเติม..."
                />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Section 3: Document Upload -->
      <VCol cols="12">
        <VCard title="Section 3 — Upload เอกสาร">
          <VTabs v-model="currentTab" grow>
            <VTab value="company">
              <VIcon v-if="isTabComplete('company')" start icon="tabler-circle-check" color="success" />
              เอกสารบริษัท ({{ getDocGroupCount('company') }})
            </VTab>
            <VTab value="financial">
              <VIcon v-if="isTabComplete('financial')" start icon="tabler-circle-check" color="success" />
              เอกสารการเงิน ({{ getDocGroupCount('financial') }})
            </VTab>
            <VTab value="director">
              <VIcon v-if="isTabComplete('director')" start icon="tabler-circle-check" color="success" />
              เอกสารกรรมการ ({{ getDocGroupCount('director') }})
            </VTab>
          </VTabs>

          <VCardText class="pa-0">
            <VTabsWindow v-model="currentTab">
              <VTabsWindowItem value="company">
                <div class="doc-list pa-4">
                  <VRow v-for="doc in form.documents.filter(d => d.docGroup === 'company')" :key="doc.docId" 
                    class="doc-row align-center py-2 px-3 mb-2 rounded border"
                    :class="{ 'uploaded-bg': doc.uploadStatus === 'uploaded', 'required-border': doc.required && doc.uploadStatus === 'pending' }"
                  >
                    <VCol cols="12" sm="5">
                      <div class="d-flex align-center gap-2">
                        <span class="text-subtitle-2">{{ doc.docId }}. {{ doc.docName }}</span>
                        <VChip v-if="doc.required" color="error" size="x-small">บังคับ</VChip>
                        <VChip v-else color="secondary" size="x-small" variant="tonal">ไม่บังคับ</VChip>
                      </div>
                    </VCol>
                    <VCol cols="12" sm="5">
                      <VFileInput
                        label="เลือกไฟล์ (PDF, Image)"
                        accept="application/pdf,image/*"
                        multiple
                        density="compact"
                        hide-details
                        prepend-icon="tabler-paperclip"
                        @update:model-value="(files) => updateDocFiles(doc.docId, files as File[])"
                      />
                    </VCol>
                    <VCol cols="12" sm="2" class="text-right">
                      <VChip
                        :color="doc.uploadStatus === 'uploaded' ? 'success' : 'grey'"
                        size="small"
                        variant="flat"
                      >
                        {{ doc.uploadStatus }}
                      </VChip>
                    </VCol>
                  </VRow>
                </div>
              </VTabsWindowItem>

              <VTabsWindowItem value="financial">
                <div class="doc-list pa-4">
                  <VAlert color="warning" variant="tonal" class="mb-4" icon="tabler-alert-circle">
                    รายการที่ 9: กรณียังไม่ปิดงบปี 66 ให้แนบ ภ.พ.30 ม.ค.–ธ.ค.66 แทน
                  </VAlert>
                  <VRow v-for="doc in form.documents.filter(d => d.docGroup === 'financial')" :key="doc.docId" 
                    class="doc-row align-center py-2 px-3 mb-2 rounded border"
                    :class="{ 'uploaded-bg': doc.uploadStatus === 'uploaded', 'required-border': doc.required && doc.uploadStatus === 'pending' }"
                  >
                    <VCol cols="12" sm="5">
                      <div class="d-flex align-center gap-2">
                        <span class="text-subtitle-2">{{ doc.docId }}. {{ doc.docName }}</span>
                        <VChip v-if="doc.required" color="error" size="x-small">บังคับ</VChip>
                      </div>
                    </VCol>
                    <VCol cols="12" sm="5">
                      <VFileInput
                        label="เลือกไฟล์"
                        accept="application/pdf,image/*"
                        multiple
                        density="compact"
                        hide-details
                        @update:model-value="(files) => updateDocFiles(doc.docId, files as File[])"
                      />
                    </VCol>
                    <VCol cols="12" sm="2" class="text-right">
                      <VChip :color="doc.uploadStatus === 'uploaded' ? 'success' : 'grey'" size="small">
                        {{ doc.uploadStatus }}
                      </VChip>
                    </VCol>
                  </VRow>
                </div>
              </VTabsWindowItem>

              <VTabsWindowItem value="director">
                <div class="doc-list pa-4">
                  <VAlert color="info" variant="tonal" class="mb-4" icon="tabler-info-circle">
                    รายการที่ 13: เอกสารเครดิตบูโรต้องมีอายุไม่เกิน 1 เดือน
                  </VAlert>
                  <VRow v-for="doc in form.documents.filter(d => d.docGroup === 'director')" :key="doc.docId" 
                    class="doc-row align-center py-2 px-3 mb-2 rounded border"
                    :class="{ 'uploaded-bg': doc.uploadStatus === 'uploaded', 'required-border': doc.required && doc.uploadStatus === 'pending' }"
                  >
                    <VCol cols="12" sm="5">
                      <div class="d-flex align-center gap-2">
                        <span class="text-subtitle-2">{{ doc.docId }}. {{ doc.docName }}</span>
                        <VChip v-if="doc.required" color="error" size="x-small">บังคับ</VChip>
                      </div>
                    </VCol>
                    <VCol cols="12" sm="5">
                      <VFileInput
                        label="เลือกไฟล์"
                        accept="application/pdf,image/*"
                        multiple
                        density="compact"
                        hide-details
                        @update:model-value="(files) => updateDocFiles(doc.docId, files as File[])"
                      />
                    </VCol>
                    <VCol cols="12" sm="2" class="text-right">
                      <VChip :color="doc.uploadStatus === 'uploaded' ? 'success' : 'grey'" size="small">
                        {{ doc.uploadStatus }}
                      </VChip>
                    </VCol>
                  </VRow>
                </div>
              </VTabsWindowItem>
            </VTabsWindow>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Sticky Bottom Progress Bar -->
    <div class="sticky-bottom-bar bg-white border-top pa-4 elevation-10">
      <div class="container mx-auto d-flex align-center justify-space-between gap-6 px-0 px-md-10">
        <div class="flex-grow-1">
          <div class="d-flex justify-space-between mb-1">
            <span class="text-subtitle-2">ความคืบหน้าเอกสารบังคับ</span>
            <span class="text-primary font-weight-bold">
              อัปโหลดแล้ว {{ uploadProgress.current }}/{{ uploadProgress.total }} รายการ ({{ uploadProgress.percentage }}%)
            </span>
          </div>
          <VProgressLinear
            :model-value="uploadProgress.percentage"
            color="primary"
            height="10"
            rounded
          />
        </div>
        <div class="d-flex gap-4">
          <VBtn variant="outlined" color="secondary" @click="saveDraft" :loading="isSaving">บันทึก Draft</VBtn>
          <VBtn color="primary" type="submit" :disabled="!isFormValid" :loading="isSaving">
            ส่งคำขอสินเชื่อ <VIcon end icon="tabler-send" />
          </VBtn>
        </div>
      </div>
    </div>
  </VForm>
</template>

<style lang="scss">
.sticky-bottom-bar {
  position: sticky;
  bottom: 0;
  z-index: 99;
  margin-left: -2rem;
  margin-right: -2rem;
  margin-bottom: -2rem;
  width: calc(100% + 4rem);
}

.request-id-badge {
  .v-badge__badge {
    color: var(--v-primary-base) !important;
    font-weight: bold;
    font-size: 0.9rem;
    padding: 4px 8px;
  }
}

.doc-row {
  transition: all 0.2s ease-in-out;
  border-color: #eee !important;
  
  &:hover {
    background-color: rgba(var(--v-theme-primary), 0.05);
    border-color: rgba(var(--v-theme-primary), 0.3) !important;
  }
}

.uploaded-bg {
  background-color: #f0faf0;
  border-color: #c8e6c9 !important;
}

.required-border {
  border-left: 3px solid rgb(var(--v-theme-error)) !important;
}

@media (max-width: 600px) {
  .sticky-bottom-bar {
    flex-direction: column;
    padding: 1rem;
    
    .container {
      flex-direction: column;
      gap: 1rem !important;
    }
  }
}
</style>
