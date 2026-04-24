<script setup lang="ts">
import poListData from '@/assets/mock-data/po-list.json'

definePage({
  meta: {
    layout: 'default',
  },
})

const search = ref('')

const headers = [
  { title: 'PO Number', key: 'po_no', sortable: true },
  { title: 'PO Date', key: 'po_date', sortable: true },
  { title: 'Supplier', key: 'supplier_name', sortable: true },
  { title: 'Buyer', key: 'buyer_name', sortable: true },
  { title: 'Total Amount', key: 'amount_incl_vat', sortable: true, align: 'end' },
  { title: 'Term (Days)', key: 'po_payment_term', sortable: true, align: 'center' },
  { title: 'Status', key: 'status', sortable: true, align: 'center' },
]

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('th-TH', { 
    style: 'currency', 
    currency: 'THB',
    minimumFractionDigits: 2 
  }).format(value)
}

const formatDate = (timestamp: number) => {
  if (!timestamp) return '-'
  return new Date(timestamp).toLocaleDateString('th-TH')
}

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'invoiced': return 'success'
    case 'pending': return 'warning'
    case 'cancelled': return 'error'
    default: return 'primary'
  }
}

const itemsPerPageOptions = [
  { value: 10, title: '10' },
  { value: 25, title: '25' },
  { value: 50, title: '50' },
  { value: 100, title: '100' },
]
</script>

<template>
  <div class="po-list-page">
    <!-- Header Section -->
    <VCard color="primary" class="pa-4 mb-4 d-flex align-center justify-space-between flex-wrap gap-4 elevation-2">
      <div class="d-flex align-center gap-2">
        <VIcon icon="tabler-file-invoice" color="white" size="32" />
        <h2 class="text-white mb-0">Purchase Order List</h2>
      </div>
      
      <div class="d-flex gap-2">
        <VBtn variant="tonal" color="white" prepend-icon="tabler-download">
          Export Excel
        </VBtn>
      </div>
    </VCard>

    <!-- Filter & Search Toolbar -->
    <VCard class="mb-4">
      <VCardText class="pa-4">
        <VRow>
          <VCol cols="12" md="6">
            <VTextField
              v-model="search"
              label="Search"
              placeholder="PO Number / Supplier / Buyer"
              prepend-inner-icon="tabler-search"
              hide-details
              density="compact"
            />
          </VCol>
          <VCol cols="12" md="6" class="d-flex justify-end gap-2">
             <VBtn variant="outlined" color="secondary" prepend-icon="tabler-refresh">
              Refresh
            </VBtn>
            <VBtn color="primary" prepend-icon="tabler-plus" to="/factoring-request">
              Create Factoring
            </VBtn>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Data Table -->
    <VCard class="elevation-1">
      <VDataTable
        :headers="headers"
        :items="poListData"
        :search="search"
        :items-per-page="10"
        class="po-table"
        hover
      >
        <!-- PO Date Column -->
        <template #item.po_date="{ item }">
          {{ formatDate(item.po_date) }}
        </template>

        <!-- Amount Column -->
        <template #item.amount_incl_vat="{ item }">
          <span class="font-weight-bold text-primary">{{ formatCurrency(item.amount_incl_vat) }}</span>
        </template>

        <!-- Status Column -->
        <template #item.status="{ item }">
          <VChip
            :color="getStatusColor(item.status)"
            size="small"
            class="text-uppercase font-weight-bold"
            variant="flat"
          >
            {{ item.status }}
          </VChip>
        </template>

        <!-- Custom Table Footer -->
        <template #bottom>
          <VDivider />
          <div class="d-flex align-center justify-space-between pa-4 bg-surface">
            <div class="d-flex align-center gap-2">
              <span class="text-caption">Rows per page:</span>
              <VSelect
                :items="itemsPerPageOptions"
                density="compact"
                hide-details
                variant="outlined"
                style="width: 80px"
              />
              <span class="text-caption ml-4">Total {{ poListData.length }} items</span>
            </div>
          </div>
        </template>
      </VDataTable>
    </VCard>
  </div>
</template>

<style lang="scss">
.po-table {
  .v-data-table-header {
    background-color: rgba(var(--v-theme-on-surface), 0.04) !important;
    
    th {
      font-weight: 700 !important;
      text-transform: uppercase;
      font-size: 0.75rem !important;
      letter-spacing: 0.5px;
    }
  }

  .v-data-table__tr:nth-child(even) {
    background-color: rgba(var(--v-theme-on-surface), 0.01);
  }

  .v-data-table__tr:hover {
    background-color: rgba(var(--v-theme-primary), 0.05) !important;
  }
}
</style>
