<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCreditLineApproval } from '@/composables/useCreditLineApproval'
import { requiredValidator } from '@core/utils/validators'

definePage({
  meta: {
    layout: 'default',
  },
})

const route = useRoute()
const router = useRouter()
const applicationId = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id

const {
  application,
  isSubmitting,
  getDocStats,
  creditDiff,
  updateStatus,
  requestAdditional,
} = useCreditLineApproval(applicationId as string)

const currentTab = ref(0)
const isConfirmDialogOpen = ref(false)
const isAdditionalDialogOpen = ref(false)
const confirmAction = ref<'approved' | 'rejected' | ''>('')
const selectedAdditionalDocs = ref<number[]>([])
const additionalMessage = ref('')

// Tabs definition
const tabs = [
  { title: 'เอกสารบริษัท', category: 'company' },
  { title: 'เอกสารการเงิน', category: 'financial' },
  { title: 'เอกสารกรรมการ', category: 'director' },
]

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('th-TH').format(value)
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'submitted': return 'info'
    case 'under_review': return 'warning'
    case 'additional_required': return 'orange'
    case 'approved': return 'success'
    case 'rejected': return 'error'
    default: return 'primary'
  }
}

const handleAction = (action: 'approved' | 'rejected') => {
  confirmAction.value = action
  isConfirmDialogOpen.value = true
}

const onConfirmAction = async () => {
  if (confirmAction.value === 'approved' || confirmAction.value === 'rejected') {
    const success = await updateStatus(confirmAction.value)
    if (success) {
      isConfirmDialogOpen.value = false
      router.push('/credit-application/list')
    }
  }
}

const onSendAdditional = async () => {
  const success = await requestAdditional(selectedAdditionalDocs.value, additionalMessage.value)
  if (success) {
    isAdditionalDialogOpen.value = false
    router.push('/credit-application/list')
  }
}
</script>

<template>
  <VRow>
    <!-- Page Header -->
    <VCol cols="12">
      <VCard color="primary" class="pa-4 d-flex align-center justify-space-between flex-wrap gap-4 elevation-2 header-card">
        <div class="d-flex align-center gap-2">
          <h2 class="text-white mb-0">พิจารณาคำขอวงเงิน Factoring</h2>
          <VBadge color="white" :content="application.applicationId" inline class="app-id-badge" />
          <VChip :color="getStatusColor(application.status)" size="small" class="text-uppercase ml-2" variant="flat">
            {{ application.status.replace('_', ' ') }}
          </VChip>
        </div>
        <div class="text-white text-right">
          <div class="text-caption">วันที่ยื่น: {{ application.submittedDate }}</div>
          <div class="text-caption">ผู้ยื่น: {{ application.companyName }}</div>
        </div>
      </VCard>
    </VCol>

    <!-- Action Toolbar -->
    <VCol cols="12">
      <VCard class="pa-2 d-flex gap-3 align-center flex-wrap elevation-1">
        <VBtn
          color="success"
          prepend-icon="tabler-circle-check"
          @click="handleAction('approved')"
          :loading="isSubmitting"
        >
          อนุมัติ
        </VBtn>
        <VBtn
          color="warning"
          prepend-icon="tabler-file-plus"
          @click="isAdditionalDialogOpen = true"
          :loading="isSubmitting"
        >
          ขอเอกสารเพิ่มเติม
        </VBtn>
        <VBtn
          color="error"
          prepend-icon="tabler-circle-x"
          @click="handleAction('rejected')"
          :loading="isSubmitting"
        >
          ไม่อนุมัติ
        </VBtn>
        <VSpacer />
        <VBtn
          variant="tonal"
          color="secondary"
          prepend-icon="tabler-arrow-left"
          to="/credit-application/list"
        >
          Back
        </VBtn>
      </VCard>
    </VCol>

    <!-- Section 1: Company Info Summary -->
    <VCol cols="12">
      <VCard class="elevation-1">
        <VCardText>
          <VRow>
            <VCol cols="12" md="4">
              <div class="text-caption mb-1">ชื่อบริษัท / Tax ID</div>
              <div class="text-h6 font-weight-bold">{{ application.companyName }}</div>
              <div class="text-subtitle-2 text-secondary">{{ application.taxId }}</div>
              <div class="mt-2">
                <VChip size="small" variant="tonal" color="primary">{{ application.businessType }}</VChip>
              </div>
            </VCol>
            <VCol cols="12" md="4" class="text-center">
              <div class="text-caption mb-1">วงเงินที่ขอ (บาท)</div>
              <div class="text-h3 font-weight-bold text-primary">{{ formatCurrency(application.requestedCreditLimit) }}</div>
            </VCol>
            <VCol cols="12" md="4">
              <div class="d-flex flex-column gap-1">
                <div class="d-flex justify-space-between text-caption">
                  <span>ระยะเวลาเครดิต:</span>
                  <span class="font-weight-bold">{{ application.creditPeriod }} วัน</span>
                </div>
                <div class="d-flex justify-space-between text-caption">
                  <span>ประเภทการชำระ:</span>
                  <span class="font-weight-bold text-uppercase">{{ application.paymentType }}</span>
                </div>
                <div class="d-flex justify-space-between text-caption border-top pt-1 mt-1">
                  <span>เงื่อนไขวางบิล:</span>
                  <span class="font-weight-bold">{{ application.billingSchedule }}</span>
                </div>
              </div>
            </VCol>
          </VRow>
        </VCardText>
      </VCard>
    </VCol>

    <!-- Section 2: Document Components -->
    <VCol cols="12" md="8">
      <VCard class="elevation-1 h-100">
        <VTabs v-model="currentTab" grow border-color="primary">
          <VTab v-for="(tab, index) in tabs" :key="index" :value="index">
            {{ tab.title }}
            <VBadge
              color="primary"
              :content="`${getDocStats(tab.category).verified}/${getDocStats(tab.category).total}`"
              inline
              class="ml-2"
            />
          </VTab>
        </VTabs>

        <VTabsWindow v-model="currentTab" class="pa-4">
          <VTabsWindowItem v-for="(tab, index) in tabs" :key="index" :value="index">
            <div class="d-flex flex-column gap-3">
              <div
                v-for="doc in application.documents.filter(d => d.category === tab.category)"
                :key="doc.id"
                class="doc-item pa-3 border rounded d-flex align-center justify-space-between transition-swing"
                :class="{
                  'verified-bg': doc.verified,
                  'pending-critical': doc.required && doc.status === 'pending'
                }"
              >
                <div class="d-flex align-center gap-3">
                  <VCheckbox v-model="doc.verified" density="compact" hide-details />
                  <div>
                    <div class="text-subtitle-2 font-weight-bold">{{ doc.name }}</div>
                    <div class="d-flex gap-2 align-center mt-1">
                      <VChip :color="doc.required ? 'error' : 'secondary'" size="x-small" label>
                        {{ doc.required ? 'บังคับ' : 'ไม่บังคับ' }}
                      </VChip>
                      <VChip :color="doc.status === 'uploaded' ? 'success' : 'grey'" size="x-small" variant="tonal">
                        {{ doc.status }}
                      </VChip>
                    </div>
                  </div>
                </div>
                <div class="d-flex gap-2">
                  <VBtn icon="tabler-eye" size="small" variant="text" color="primary" :disabled="doc.status === 'pending'" />
                  <VBtn icon="tabler-download" size="small" variant="text" color="primary" :disabled="doc.status === 'pending'" />
                </div>
              </div>
            </div>
          </VTabsWindowItem>
        </VTabsWindow>
      </VCard>
    </VCol>

    <!-- Section 3: Admin Decision -->
    <VCol cols="12" md="4">
      <VCard
        title="Admin Decision"
        class="elevation-1 decision-card"
        :class="`border-status-${confirmAction || application.status}`"
      >
        <VCardText>
          <VForm @submit.prevent>
            <VRow>
              <VCol cols="12">
                <VTextField
                  v-model.number="application.approvedCreditLimit"
                  label="วงเงินที่อนุมัติ (บาท)"
                  type="number"
                  placeholder="0.00"
                  :rules="[requiredValidator]"
                />
                <div v-if="creditDiff !== 0" class="text-caption mt-1" :class="creditDiff < 0 ? 'text-error' : 'text-success'">
                  <VIcon :icon="creditDiff < 0 ? 'tabler-trending-down' : 'tabler-trending-up'" size="14" />
                  ต่างจากเดิม: {{ formatCurrency(Math.abs(creditDiff)) }} บาท
                </div>
              </VCol>
              <VCol cols="12">
                <VSelect
                  v-model="application.creditPeriod"
                  label="ระยะเวลาเครดิตที่อนุมัติ"
                  :items="[30, 45, 60, 90, 120]"
                  suffix="วัน"
                />
              </VCol>
              <VCol cols="12">
                <VTextarea
                  v-model="application.adminRemark"
                  label="หมายเหตุ / เหตุผล"
                  rows="4"
                  :rules="[requiredValidator]"
                />
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>

  <!-- Confirm Action Dialog -->
  <VDialog v-model="isConfirmDialogOpen" max-width="500">
    <VCard>
      <VCardTitle class="pa-4 bg-primary text-white">ยืนยันการทำรายการ</VCardTitle>
      <VCardText class="pa-6 text-center">
        <VIcon
          :icon="confirmAction === 'approved' ? 'tabler-circle-check' : 'tabler-circle-x'"
          :color="confirmAction === 'approved' ? 'success' : 'error'"
          size="64"
          class="mb-4"
        />
        <div class="text-h6">
          ยืนยันการ{{ confirmAction === 'approved' ? 'อนุมัติวงเงิน ' + formatCurrency(application.approvedCreditLimit) + ' บาท' : 'ปฏิเสธคำขอ' }}
        </div>
        <div class="text-subtitle-1 mt-2">ให้กับ {{ application.companyName }}?</div>
      </VCardText>
      <VCardActions class="pa-4 pt-0">
        <VSpacer />
        <VBtn variant="tonal" color="secondary" @click="isConfirmDialogOpen = false">ยกเลิก</VBtn>
        <VBtn
          :color="confirmAction === 'approved' ? 'success' : 'error'"
          @click="onConfirmAction"
          :loading="isSubmitting"
        >
          ยืนยัน
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>

  <!-- Additional Documents Dialog -->
  <VDialog v-model="isAdditionalDialogOpen" max-width="600">
    <VCard>
      <VCardTitle class="pa-4 bg-warning text-white d-flex align-center gap-2">
        <VIcon icon="tabler-file-plus" color="white" />
        ขอเอกสารเพิ่มเติม
      </VCardTitle>
      <VCardText class="pa-6">
        <div class="text-subtitle-2 mb-3">เลือกเอกสารที่ต้องการให้ผู้สมัครอัปโหลดเพิ่ม:</div>
        <VRow dense>
          <VCol v-for="doc in application.documents" :key="doc.id" cols="12" sm="6">
            <VCheckbox
              v-model="selectedAdditionalDocs"
              :value="doc.id"
              :label="doc.name"
              density="compact"
              hide-details
            />
          </VCol>
        </VRow>
        <VTextarea
          v-model="additionalMessage"
          label="ข้อความแจ้งผู้สมัคร"
          placeholder="ระบุรายละเอียดที่ต้องการให้แก้ไขหรือเพิ่มเติม..."
          class="mt-4"
          rows="3"
        />
      </VCardText>
      <VCardActions class="pa-4 pt-0">
        <VSpacer />
        <VBtn variant="tonal" color="secondary" @click="isAdditionalDialogOpen = false">ยกเลิก</VBtn>
        <VBtn
          color="warning"
          prepend-icon="tabler-send"
          @click="onSendAdditional"
          :loading="isSubmitting"
          :disabled="selectedAdditionalDocs.length === 0"
        >
          ส่งแจ้ง
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style lang="scss">
.header-card {
  border-radius: 12px !important;
}

.app-id-badge {
  .v-badge__badge {
    background-color: white !important;
    color: rgb(var(--v-theme-primary)) !important;
    font-weight: 700;
    font-size: 0.85rem;
    padding: 6px 10px;
    height: auto;
  }
}

.doc-item {
  transition: all 0.2s ease;
  
  &:hover {
    background-color: rgba(var(--v-theme-primary), 0.02);
  }
  
  &.verified-bg {
    background-color: #f6fff6;
    border-color: #69db7c !important;
  }
  
  &.pending-critical {
    border-left: 4px solid rgb(var(--v-theme-error)) !important;
  }
}

.decision-card {
  border-left: 5px solid #ddd;
  
  &.border-status-approved { border-left-color: rgb(var(--v-theme-success)) !important; }
  &.border-status-rejected { border-left-color: rgb(var(--v-theme-error)) !important; }
  &.border-status-additional_required { border-left-color: rgb(var(--v-theme-warning)) !important; }
  &.border-status-under_review { border-left-color: rgb(var(--v-theme-warning)) !important; }
}
</style>
