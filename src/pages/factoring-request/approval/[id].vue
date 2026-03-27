<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { ref, computed } from 'vue'
import { useFactoringApproval } from '@/composables/useFactoringApproval'

definePage({
  meta: {
    layout: 'default',
  },
})

const route = useRoute()
const router = useRouter()
const id = route.params.id as string

const {
  application,
  isSubmitting,
  creditDiff,
  remainingAfterApprove,
  isAmountOverLimit,
  creditUsagePercentage,
  verifiedCount,
  totalDocs,
  updateStatus,
  requestAdditional,
} = useFactoringApproval(id)

// Dialog states
const isApproveDialogOpen = ref(false)
const isAdditionalDocsDialogOpen = ref(false)
const isRejectDialogOpen = ref(false)

// Select for additional docs
const selectedDocsForRequest = ref<number[]>([])
const additionalDocsMessage = ref('')

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('th-TH').format(value)
}

const handleApprove = async () => {
  const success = await updateStatus('approved')
  if (success) {
    isApproveDialogOpen.value = false
    router.push('/credit-application/list')
  }
}

const handleReject = async () => {
  if (!application.value.adminRemark) return
  const success = await updateStatus('rejected')
  if (success) {
    isRejectDialogOpen.value = false
    router.push('/credit-application/list')
  }
}

const handleRequestAdditional = async () => {
  if (selectedDocsForRequest.value.length === 0) return
  const success = await requestAdditional(selectedDocsForRequest.value, additionalDocsMessage.value)
  if (success) {
    isAdditionalDocsDialogOpen.value = false
    router.push('/credit-application/list')
  }
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    submitted: 'info',
    under_review: 'warning',
    approved: 'success',
    rejected: 'error',
    additional_required: 'warning',
  }
  return colors[status] || 'primary'
}
</script>

<template>
  <div class="factoring-approval-page">
    <!-- Page Header -->
    <VCard color="primary" class="pa-6 mb-6">
      <div class="d-flex align-center justify-space-between flex-wrap gap-4">
        <div class="d-flex align-center gap-4">
          <div class="bg-white rounded pa-2 d-flex align-center justify-center">
            <VIcon icon="tabler-clipboard-check" color="primary" size="32" />
          </div>
          <div>
            <h2 class="text-white mb-0">พิจารณาคำขอ Factoring ตามใบ PO</h2>
            <div class="d-flex align-center gap-2 mt-1">
              <VChip size="small" color="white" variant="tonal" class="text-uppercase">
                {{ application.requestId }}
              </VChip>
              <span class="text-white text-caption opacity-75">
                ยื่นเมื่อ: {{ application.submittedDate }}
              </span>
            </div>
          </div>
        </div>
        <div class="text-right">
          <VChip
            :color="getStatusColor(application.status)"
            size="large"
            variant="flat"
            class="text-uppercase font-weight-bold"
          >
            {{ application.status.replace('_', ' ') }}
          </VChip>
          <div class="text-white text-subtitle-1 mt-1">{{ application.companyName }}</div>
        </div>
      </div>
    </VCard>

    <!-- Action Toolbar -->
    <VCard class="mb-6 action-toolbar sticky-toolbar">
      <VCardText class="pa-3 d-flex align-center justify-space-between flex-wrap gap-3">
        <div class="d-flex gap-2">
          <VBtn
            color="success"
            prepend-icon="tabler-circle-check"
            :loading="isSubmitting"
            :disabled="isAmountOverLimit"
            @click="isApproveDialogOpen = true"
          >
            อนุมัติ
          </VBtn>
          <VBtn
            color="warning"
            prepend-icon="tabler-file-plus"
            :loading="isSubmitting"
            @click="isAdditionalDocsDialogOpen = true"
          >
            ขอเอกสารเพิ่มเติม
          </VBtn>
          <VBtn
            color="error"
            variant="tonal"
            prepend-icon="tabler-circle-x"
            :loading="isSubmitting"
            @click="isRejectDialogOpen = true"
          >
            ไม่อนุมัติ
          </VBtn>
        </div>
        <VBtn variant="outlined" color="secondary" prepend-icon="tabler-arrow-left" @click="router.back()">
          Back
        </VBtn>
      </VCardText>
    </VCard>

    <VRow>
      <!-- Left Column: Summary and Details -->
      <VCol cols="12" lg="8">
        <!-- Section 1: Credit Summary -->
        <VCard class="mb-6 credit-summary-card">
          <VCardItem title="สรุปวงเงิน และ ความเสี่ยง">
            <template #append>
              <RouterLink :to="`/credit-application/approval/${application.creditApplicationId}`" class="text-primary text-decoration-none text-caption">
                ดู Credit Application ที่อ้างอิง <VIcon icon="tabler-external-link" size="14" />
              </RouterLink>
            </template>
          </VCardItem>
          <VDivider />
          <VCardText>
            <div class="d-flex flex-wrap gap-3 mb-6">
              <VChip label color="primary" variant="tonal">
                <VIcon start icon="tabler-wallet" />
                วงเงินทั้งหมด: {{ formatCurrency(application.approvedCreditLimit) }}
              </VChip>
              <VChip label color="warning" variant="tonal">
                <VIcon start icon="tabler-chart-pie" />
                ใช้ไปแล้ว: {{ formatCurrency(application.usedCreditAmount) }}
              </VChip>
              <VChip label color="success" variant="tonal">
                <VIcon start icon="tabler-circle-check" />
                คงเหลือ: {{ formatCurrency(application.availableCreditAmount) }}
              </VChip>
              <VChip label color="info" variant="flat">
                <VIcon start icon="tabler-file-invoice" />
                รายการนี้ขอ: {{ formatCurrency(application.requestedAmount) }}
              </VChip>
            </div>

            <div class="mb-2 d-flex justify-space-between text-caption">
              <span>อัตราการใช้วงเงินรวม (Credit Utilization)</span>
              <span :class="creditUsagePercentage > 90 ? 'text-error' : 'text-primary'">
                {{ creditUsagePercentage.toFixed(1) }}%
              </span>
            </div>
            <VProgressLinear
              :model-value="creditUsagePercentage"
              height="8"
              rounded
              :color="creditUsagePercentage > 90 ? 'error' : 'primary'"
            />

            <VAlert
              v-if="isAmountOverLimit"
              type="warning"
              variant="tonal"
              class="mt-6"
              icon="tabler-alert-triangle"
              title="วงเงินไม่พอ"
            >
              ยอดที่ขอ ({{ formatCurrency(application.requestedAmount) }}) สูงกว่าวงเงินคงเหลือ ({{ formatCurrency(application.availableCreditAmount) }})
            </VAlert>
          </VCardText>
        </VCard>

        <!-- Section 2: PO & Invoice Info -->
        <VCard class="mb-6 details-card">
          <VCardItem title="ข้อมูล PO และ Invoice ที่นำมา Factoring" />
          <VDivider />
          <VCardText>
            <VRow>
              <!-- PO Column -->
              <VCol cols="12" md="6" class="border-sm-e">
                <div class="text-overline mb-4 text-primary">ข้อมูลใบสั่งซื้อ (PO)</div>
                <VList lines="one" class="bg-transparent pa-0">
                  <VListItem class="px-0">
                    <template #prepend><VIcon icon="tabler-hash" size="18" class="mr-2 opacity-50" /></template>
                    <VListItemTitle class="text-caption">เลขที่ PO</VListItemTitle>
                    <VListItemSubtitle class="text-body-1 font-weight-medium text-high-emphasis">
                      {{ application.poNumber }}
                    </VListItemSubtitle>
                  </VListItem>
                  <VListItem class="px-0">
                    <template #prepend><VIcon icon="tabler-calendar" size="18" class="mr-2 opacity-50" /></template>
                    <VListItemTitle class="text-caption">วันที่ PO</VListItemTitle>
                    <VListItemSubtitle class="text-body-1 text-high-emphasis">{{ application.poDate }}</VListItemSubtitle>
                  </VListItem>
                  <VListItem class="px-0">
                    <template #prepend><VIcon icon="tabler-currency-baht" size="18" class="mr-2 opacity-50" /></template>
                    <VListItemTitle class="text-caption">มูลค่า PO</VListItemTitle>
                    <VListItemSubtitle class="text-body-1 text-high-emphasis font-weight-bold">
                      {{ formatCurrency(application.poAmount) }} บาท
                    </VListItemSubtitle>
                  </VListItem>
                  <VDivider class="my-4" />
                  <VListItem class="px-0">
                    <template #prepend><VIcon icon="tabler-building" size="18" class="mr-2 opacity-50" /></template>
                    <VListItemTitle class="text-caption">ชื่อผู้ซื้อ (Buyer)</VListItemTitle>
                    <VListItemSubtitle class="text-body-1 text-high-emphasis">{{ application.buyerName }}</VListItemSubtitle>
                  </VListItem>
                  <VListItem class="px-0">
                    <template #prepend><VIcon icon="tabler-id" size="18" class="mr-2 opacity-50" /></template>
                    <VListItemTitle class="text-caption">Tax ID Buyer</VListItemTitle>
                    <VListItemSubtitle class="text-body-1 text-high-emphasis">{{ application.buyerTaxId }}</VListItemSubtitle>
                  </VListItem>
                </VList>
              </VCol>

              <!-- Invoice Column -->
              <VCol cols="12" md="6">
                <div class="text-overline mb-4 text-primary">ข้อมูลใบแจ้งหนี้ (Invoice)</div>
                <VList lines="one" class="bg-transparent pa-0">
                  <VListItem class="px-0">
                    <template #prepend><VIcon icon="tabler-file-text" size="18" class="mr-2 opacity-50" /></template>
                    <VListItemTitle class="text-caption">เลขที่ Invoice</VListItemTitle>
                    <VListItemSubtitle class="text-body-1 font-weight-medium text-high-emphasis">
                      {{ application.invoiceNumber }}
                    </VListItemSubtitle>
                  </VListItem>
                  <VListItem class="px-0">
                    <template #prepend><VIcon icon="tabler-calendar-event" size="18" class="mr-2 opacity-50" /></template>
                    <VListItemTitle class="text-caption">วันที่ Invoice</VListItemTitle>
                    <VListItemSubtitle class="text-body-1 text-high-emphasis">{{ application.invoiceDate }}</VListItemSubtitle>
                  </VListItem>
                  <VListItem class="px-0">
                    <template #prepend><VIcon icon="tabler-clock-hour-4" size="18" class="mr-2 opacity-50" /></template>
                    <VListItemTitle class="text-caption">วันครบกำหนดชำระ</VListItemTitle>
                    <VListItemSubtitle class="text-body-1 text-error font-weight-medium">
                      {{ application.invoiceDueDate }}
                    </VListItemSubtitle>
                  </VListItem>
                  
                  <div class="mt-8 pa-4 bg-light rounded text-center">
                    <div class="text-caption mb-1">วงเงินที่ขอกู้ (Requested Amount)</div>
                    <div class="text-h4 font-weight-black text-primary">
                      {{ formatCurrency(application.requestedAmount) }}
                    </div>
                  </div>
                </VList>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Right Column: Documents and Decision -->
      <VCol cols="12" lg="4">
        <!-- Section 3: Documents Checklist -->
        <VCard class="mb-6 document-card">
          <VCardItem title="เอกสารประกอบ">
            <template #append>
              <VChip size="x-small" :color="verifiedCount === application.documents.filter(d=>d.status==='uploaded').length ? 'success' : 'warning'">
                ตรวจสอบแล้ว {{ verifiedCount }}/{{ application.documents.filter(d=>d.status==='uploaded').length }}
              </VChip>
            </template>
          </VCardItem>
          <VDivider />
          <VList class="pa-0">
            <template v-for="(doc, index) in application.documents" :key="doc.id">
              <VListItem :class="{ 'verified-row': doc.verified }" class="py-3">
                <div class="d-flex align-center justify-space-between w-100">
                  <div class="d-flex align-center gap-3">
                    <VCheckbox v-model="doc.verified" density="compact" hide-details />
                    <div>
                      <div class="text-body-2 font-weight-medium">{{ doc.name }}</div>
                      <div class="d-flex gap-1 mt-1">
                        <VChip size="x-small" :color="doc.required ? 'error' : 'secondary'" variant="tonal">
                          {{ doc.required ? 'บังคับ' : 'ไม่บังคับ' }}
                        </VChip>
                        <VChip size="x-small" :color="doc.status === 'uploaded' ? 'success' : 'secondary'" variant="tonal">
                          {{ doc.status }}
                        </VChip>
                      </div>
                    </div>
                  </div>
                  <div class="d-flex gap-1">
                    <VBtn icon="tabler-eye" variant="text" size="x-small" color="primary" :disabled="doc.status !== 'uploaded'" />
                    <VBtn icon="tabler-download" variant="text" size="x-small" color="primary" :disabled="doc.status !== 'uploaded'" />
                  </div>
                </div>
              </VListItem>
              <VDivider v-if="index < application.documents.length - 1" />
            </template>
          </VList>
        </VCard>

        <!-- Section 4: Admin Decision -->
        <VCard class="decision-card" :class="`border-${getStatusColor(application.status)}`">
          <VCardItem title="ผลการพิจารณา (Admin Decision)" />
          <VDivider />
          <VCardText>
            <VTextField
              v-model.number="application.approvedAmount"
              label="ยอดที่อนุมัติ (บาท)"
              type="number"
              prefix="฿"
              variant="outlined"
              class="mb-4 mt-2"
              :error="isAmountOverLimit"
              :persistent-hint="true"
              hide-details="auto"
            >
              <template #details>
                <div v-if="creditDiff !== 0" :class="creditDiff > 0 ? 'text-success' : 'text-error'" class="mb-2">
                  <VIcon :icon="creditDiff > 0 ? 'tabler-trending-up' : 'tabler-trending-down'" size="16" />
                  ต่างจากเดิม: {{ formatCurrency(Math.abs(creditDiff)) }} บาท
                </div>
                <div class="text-caption">
                  วงเงินคงเหลือหลังอนุมัติ: 
                  <span :class="remainingAfterApprove < 0 ? 'text-error' : 'text-success'" class="font-weight-bold">
                    {{ formatCurrency(remainingAfterApprove) }} บาท
                  </span>
                </div>
              </template>
            </VTextField>

            <VTextarea
              v-model="application.adminRemark"
              label="หมายเหตุ / เหตุผล"
              variant="outlined"
              rows="4"
              placeholder="ระบุเหตุผลในการอนุมัติ หรือ ปฏิเสธ..."
              class="mt-8"
              hide-details
            />
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Dialogs -->
    
    <!-- Confirm Approve Dialog -->
    <VDialog v-model="isApproveDialogOpen" max-width="500">
      <VCard>
        <VCardText class="text-center pa-8">
          <VAvatar color="success" variant="tonal" size="72" class="mb-4">
            <VIcon icon="tabler-circle-check" size="48" />
          </VAvatar>
          <h3 class="text-h5 mb-4">ยืนยันการอนุมัติ Factoring</h3>
          <p class="text-body-1 mb-6">
            {{ application.companyName }}<br>
            <strong>PO:</strong> {{ application.poNumber }} / <strong>Invoice:</strong> {{ application.invoiceNumber }}<br>
            <span class="text-primary font-weight-bold text-h6 d-block mt-4">
              ยอดอนุมัติ: {{ formatCurrency(application.approvedAmount) }} บาท
            </span>
            <span class="text-caption d-block">
              วงเงินคงเหลือหลัง approve: {{ formatCurrency(remainingAfterApprove) }} บาท
            </span>
          </p>
          <div class="d-flex gap-4 justify-center">
            <VBtn color="secondary" variant="tonal" @click="isApproveDialogOpen = false">ยกเลิก</VBtn>
            <VBtn color="success" :loading="isSubmitting" @click="handleApprove">ยืนยันการอนุมัติ</VBtn>
          </div>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Request Additional Docs Dialog -->
    <VDialog v-model="isAdditionalDocsDialogOpen" max-width="600">
      <VCard>
        <VCardItem title="ขอเอกสารเพิ่มเติม" />
        <VDivider />
        <VCardText>
          <p class="text-caption mb-4">เลือกเอกสารที่ต้องการให้ผู้สมัครอัปโหลดใหม่หรืออัปโหลดเพิ่มเติม:</p>
          <VRow>
            <VCol v-for="doc in application.documents" :key="doc.id" cols="12" md="6" class="py-0">
              <VCheckbox
                v-model="selectedDocsForRequest"
                :label="doc.name"
                :value="doc.id"
                density="compact"
              />
            </VCol>
          </VRow>
          
          <VTextarea
            v-model="additionalDocsMessage"
            label="ข้อความแจ้งผู้สมัคร"
            placeholder="เช่น 'เอกสาร PO ไม่ชัดเจน รบกวนถ่ายรูปส่งมาใหม่ครับ'..."
            variant="outlined"
            class="mt-4"
          />
        </VCardText>
        <VCardText class="d-flex justify-end gap-3 pa-4 border-t">
          <VBtn variant="tonal" color="secondary" @click="isAdditionalDocsDialogOpen = false">ยกเลิก</VBtn>
          <VBtn
            color="warning"
            prepend-icon="tabler-send"
            :loading="isSubmitting"
            :disabled="selectedDocsForRequest.length === 0"
            @click="handleRequestAdditional"
          >
            ส่งแจ้งขอเอกสาร
          </VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Reject Dialog -->
    <VDialog v-model="isRejectDialogOpen" max-width="500">
      <VCard>
        <VCardText class="text-center pa-8">
          <VAvatar color="error" variant="tonal" size="72" class="mb-4">
            <VIcon icon="tabler-circle-x" size="48" />
          </VAvatar>
          <h3 class="text-h5 mb-4">ยืนยันการปฏิเสธคำขอ</h3>
          <p class="text-body-1 mb-6">คุณแน่ใจหรือไม่ที่จะปฏิเสธคำขอนี้?</p>
          
          <VTextarea
            v-model="application.adminRemark"
            label="ระบุเหตุผลในการปฏิเสธ"
            placeholder="จำเป็นต้องระบุเหตุผล..."
            variant="outlined"
            class="text-left mb-6"
            :error="!application.adminRemark && isSubmitting"
          />

          <div class="d-flex gap-4 justify-center">
            <VBtn color="secondary" variant="tonal" @click="isRejectDialogOpen = false">ยกเลิก</VBtn>
            <VBtn color="error" :loading="isSubmitting" :disabled="!application.adminRemark" @click="handleReject">
              ยืนยันการปฏิเสธ
            </VBtn>
          </div>
        </VCardText>
      </VCard>
    </VDialog>
  </div>
</template>

<style lang="scss">
.factoring-approval-page {
  .sticky-toolbar {
    position: sticky;
    top: 70px;
    z-index: 99;
  }

  .credit-summary-card {
    border-top: 4px solid rgb(var(--v-theme-primary));
  }

  .details-card {
    .bg-light {
      background-color: rgba(var(--v-theme-on-surface), 0.04);
    }
  }

  .verified-row {
    background-color: rgba(var(--v-theme-success), 0.08);
  }

  .decision-card {
    border-left: 4px solid;
    transition: border-color 0.3s ease;

    &.border-success { border-left-color: rgb(var(--v-theme-success)) !important; }
    &.border-warning { border-left-color: rgb(var(--v-theme-warning)) !important; }
    &.border-error { border-left-color: rgb(var(--v-theme-error)) !important; }
  }

  .v-list-item-title {
    font-size: 0.75rem !important;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
}
</style>
