<script setup lang="ts">
import { useFactoringRequestList, type RequestStatus, type UserRole } from '@/composables/useFactoringRequestList'
// VDataTable is usually auto-imported in this setup, or should be from 'vuetify/components'

definePage({
  meta: {
    layout: 'default',
  },
})

// Mock Auth Store
const userRole = ref<UserRole>('admin') // Toggle to 'customer' to see behavior
const isFilterVisible = ref(false)

const { filters, filteredRequests, clearFilters, deleteRequest } = useFactoringRequestList(userRole.value)

const headers = computed(() => {
  const baseHeaders = [
    { title: 'Action', key: 'action', sortable: false, align: 'center', width: '80px', fixed: true },
    { title: 'Request ID', key: 'id', sortable: true },
    { title: 'Type', key: 'type', sortable: true, width: '100px' },
  ]

  if (userRole.value === 'admin') {
    baseHeaders.push({ title: 'Company', key: 'companyName', sortable: true })
  }

  baseHeaders.push(
    { title: 'PO / Ref', key: 'poNumber', sortable: true },
    { title: 'Buyer / Purpose', key: 'buyerName', sortable: true },
    { title: 'วงเงินที่ขอ', key: 'requestedAmount', sortable: true },
    { title: 'ระยะเวลา', key: 'creditPeriod', sortable: true },
    { title: 'สถานะ', key: 'status', sortable: true },
    { title: 'วันที่ยื่น', key: 'submittedDate', sortable: true },
    { title: 'แก้ไข/ลบ', key: 'edit_delete', sortable: false, align: 'center', width: '100px', fixed: true }
  )

  return baseHeaders
})

const getStatusColor = (status: RequestStatus) => {
  switch (status) {
    case 'draft': return 'secondary'
    case 'submitted': return 'info'
    case 'under_review': return '#FF9800' // Orange
    case 'additional_required': return '#FFC107' // Yellow
    case 'approved': return 'success'
    case 'rejected': return 'error'
    default: return 'primary'
  }
}

const getStatusText = (status: RequestStatus) => {
  const map: Record<RequestStatus, string> = {
    draft: 'Draft',
    submitted: 'Submitted',
    under_review: 'Under Review',
    additional_required: 'Additional Required',
    approved: 'Approved',
    rejected: 'Rejected',
  }
  return map[status]
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('th-TH').format(value)
}

const formatDate = (date: string | null) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('th-TH')
}

const statusOptions = [
  { title: 'All', value: 'all' },
  { title: 'Draft', value: 'draft' },
  { title: 'Submitted', value: 'submitted' },
  { title: 'Under Review', value: 'under_review' },
  { title: 'Additional Required', value: 'additional_required' },
  { title: 'Approved', value: 'approved' },
  { title: 'Rejected', value: 'rejected' },
]

const itemsPerPageOptions = [
  { value: 10, title: '10' },
  { value: 25, title: '25' },
  { value: 50, title: '50' },
  { value: 100, title: '100' },
]

const onRefresh = () => {
  console.log('Refreshing data...')
}

const onExport = () => {
  console.log('Exporting data...')
}

const onToggleColumns = () => {
  console.log('Toggling columns...')
}
</script>

<template>
  <div class="credit-application-list">
    <!-- Header Section -->
    <VCard color="primary" class="pa-4 mb-4 d-flex align-center justify-space-between flex-wrap gap-4">
      <div class="d-flex align-center gap-2">
        <VIcon icon="tabler-clipboard-list" color="white" size="32" />
        <h2 class="text-white mb-0">Factoring Credit Application Request</h2>
      </div>
      
      <div class="d-flex gap-2">
        <VBtn variant="tonal" color="white" prepend-icon="tabler-download" @click="onExport">
          Export
        </VBtn>
        <VBtn variant="tonal" color="white" prepend-icon="tabler-columns" @click="onToggleColumns">
          Column
        </VBtn>
      </div>
    </VCard>

    <!-- Action Toolbar -->
    <VCard class="mb-4">
      <VCardText class="pa-3 d-flex align-center justify-space-between">
        <div class="d-flex gap-2">
          <VBtn color="primary" prepend-icon="tabler-plus" to="/credit-application/line-application">
            Create Credit Line
          </VBtn>
          <VBtn variant="outlined" color="primary" prepend-icon="tabler-plus" to="/factoring-request">
            Create Factoring
          </VBtn>
          <VBtn variant="outlined" color="secondary" prepend-icon="tabler-refresh" @click="onRefresh">
            Refresh
          </VBtn>
        </div>
        <div>
          <VBtn 
            :variant="isFilterVisible ? 'elevated' : 'outlined'" 
            color="secondary" 
            prepend-icon="tabler-filter" 
            @click="isFilterVisible = !isFilterVisible"
          >
            Filter
          </VBtn>
        </div>
      </VCardText>

      <!-- Filter Panel -->
      <VExpandTransition>
        <div v-show="isFilterVisible">
          <VDivider />
          <VCardText class="bg-light">
            <VRow>
              <VCol cols="12" md="4">
                <VTextField
                  v-model="filters.search"
                  label="ค้นหา"
                  placeholder="Request ID / ชื่อบริษัท / PO Number"
                  prepend-inner-icon="tabler-search"
                  hide-details
                  density="compact"
                />
              </VCol>
              <VCol cols="12" md="2">
                <VSelect
                  v-model="filters.status"
                  label="สถานะ"
                  :items="statusOptions"
                  hide-details
                  density="compact"
                />
              </VCol>
              <VCol cols="12" md="2">
                <VTextField
                  v-model.number="filters.minAmount"
                  label="วงเงินขั้นต่ำ"
                  type="number"
                  hide-details
                  density="compact"
                />
              </VCol>
              <VCol cols="12" md="2">
                <VTextField
                  v-model.number="filters.maxAmount"
                  label="วงเงินสูงสุด"
                  type="number"
                  hide-details
                  density="compact"
                />
              </VCol>
              <VCol cols="12" md="2">
                <!-- VDatePicker Range simplified as TextField for demo if complex picker isn't ready -->
                <VTextField
                  v-model="filters.dateFrom"
                  label="ตั้งแต่"
                  type="date"
                  hide-details
                  density="compact"
                />
              </VCol>
              <VCol cols="12" md="2">
                <VTextField
                  v-model="filters.dateTo"
                  label="ถึง"
                  type="date"
                  hide-details
                  density="compact"
                />
              </VCol>
              <VCol cols="12" class="d-flex justify-end gap-2 mt-2">
                <VBtn variant="outlined" color="secondary" prepend-icon="tabler-x" @click="clearFilters">
                  ล้างตัวกรอง
                </VBtn>
                <VBtn color="primary" prepend-icon="tabler-search">
                  ค้นหา
                </VBtn>
              </VCol>
            </VRow>
          </VCardText>
        </div>
      </VExpandTransition>
    </VCard>

    <!-- Data Table -->
    <VCard>
      <VDataTable
        :headers="headers"
        :items="filteredRequests"
        :items-per-page="10"
        class="factoring-table"
        hover
      >
        <!-- Action Column -->
        <template #item.action="{ item }">
          <div class="d-flex gap-1 justify-center">
            <VBtn
              v-if="userRole === 'admin' && (item.status === 'submitted' || item.status === 'under_review')"
              icon="tabler-clipboard-check"
              variant="text"
              color="success"
              size="small"
              title="Review Application"
              :to="item.type === 'LINE' ? `/credit-application/approval/${item.id}` : `/factoring-request/approval/${item.id}`"
            />
            <VBtn
              icon="tabler-folder-open"
              variant="text"
              color="primary"
              size="small"
              title="View Details"
              :to="item.type === 'LINE' ? `/credit-application/line-application?id=${item.id}` : `/credit-application/detail/${item.id}`"
            />
          </div>
        </template>

        <!-- Type Column -->
        <template #item.type="{ item }">
          <VChip
            :color="item.type === 'LINE' ? 'warning' : 'primary'"
            size="x-small"
            variant="tonal"
            class="text-uppercase"
          >
            {{ item.type === 'LINE' ? 'Credit Line Approval' : 'Factoring' }}
          </VChip>
        </template>

        <!-- Amount Column -->
        <template #item.requestedAmount="{ item }">
          <span class="font-weight-bold">{{ formatCurrency(item.requestedAmount) }}</span>
        </template>

        <!-- Credit Period -->
        <template #item.creditPeriod="{ item }">
          {{ item.creditPeriod }} วัน
        </template>

        <!-- Status Column -->
        <template #item.status="{ item }">
          <VChip
            :color="getStatusColor(item.status)"
            size="small"
            class="text-uppercase font-weight-bold status-pill"
            variant="flat"
          >
            {{ getStatusText(item.status) }}
          </VChip>
        </template>

        <!-- Date Column -->
        <template #item.submittedDate="{ item }">
          {{ formatDate(item.submittedDate) }}
        </template>

        <!-- Edit/Delete Column -->
        <template #item.edit_delete="{ item }">
          <div v-if="item.status === 'draft'" class="d-flex gap-1 justify-center">
            <VBtn
              icon="tabler-edit"
              variant="text"
              color="info"
              size="small"
              :to="item.type === 'LINE' ? `/credit-application/line-application?id=${item.id}` : `/credit-application/edit/${item.id}`"
            />
            <VBtn
              icon="tabler-trash"
              variant="text"
              color="error"
              size="small"
              @click="deleteRequest(item.id)"
            />
          </div>
          <div v-else class="text-caption text-secondary">Locked</div>
        </template>

        <!-- Custom Table Footer for Items Per Page -->
        <template #bottom>
          <VDivider />
          <div class="d-flex align-center justify-space-between pa-4">
            <div class="d-flex align-center gap-2">
              <span class="text-caption">Rows per page:</span>
              <VSelect
                :items="itemsPerPageOptions"
                density="compact"
                hide-details
                variant="outlined"
                style="width: 80px"
              />
              <span class="text-caption ml-4">Showing {{ filteredRequests.length }} requests</span>
            </div>
            <!-- Built-in pagination will show if items exceed itemsPerPage -->
          </div>
        </template>
      </VDataTable>
    </VCard>
  </div>
</template>

<style lang="scss">
.credit-application-list {
  .bg-light {
    background-color: rgba(var(--v-theme-on-surface), 0.02);
  }

  .status-pill {
    border-radius: 100px !important;
    min-width: 90px;
    justify-content: center;
  }

  .factoring-table {
    .v-data-table-header {
      background-color: #f8f9fa !important;
      
      th {
        font-weight: 600 !important;
        text-transform: uppercase;
        font-size: 0.75rem !important;
        color: var(--v-theme-on-surface) !important;
        border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important;
        
        &:last-child {
          border-right: none !important;
        }
      }
    }

    // Zebra Stripes
    .v-data-table__tr:nth-child(even) {
      background-color: rgba(var(--v-theme-on-surface), 0.02);
    }

    // Hover effect
    .v-data-table__tr:hover {
      background-color: rgba(var(--v-theme-primary), 0.05) !important;
    }

    // Sticky columns
    .v-data-table__td--fixed-left,
    .v-data-table__td--fixed-right {
      background: inherit;
      z-index: 1;
    }
  }
}

// User role toggle for demo
.admin-badge {
  position: fixed;
  top: 10px;
  right: 10px;
  z-index: 9999;
}
</style>
