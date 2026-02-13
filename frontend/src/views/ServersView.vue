<script>
import { ref, onMounted, computed } from 'vue';
import { useServersStore } from '../stores/servers';
import EditServerModal from '../components/EditServerModal.vue';
import ServerFilters from '../components/ServerFilters.vue';
import ServersTable from '../components/ServersTable.vue';

export default {
  name: 'ServersView',
  components: {
    EditServerModal,
    ServerFilters,
    ServersTable
  },
  setup() {
    const serversStore = useServersStore();
    const servers = computed(() => serversStore.filteredServers);
    const showDeleteModal = ref(false);
    const serverToDelete = ref(null);
    const showEditModal = ref(false);
    const serverToEdit = ref(null);
    const showBulkDeleteModal = ref(false);
    const showBulkStatusModal = ref(false);
    const bulkStatusValue = ref('');

    const selectedCount = computed(() => serversStore.selectedServerIds.size);

    const confirmDelete = (server) => {
      serverToDelete.value = server;
      showDeleteModal.value = true;
    };

    const deleteServer = async () => {
      if (serverToDelete.value) {
        try {
          await serversStore.deleteServer(serverToDelete.value.id);
          showDeleteModal.value = false;
          serverToDelete.value = null;
        } catch (error) {
          console.error('Failed to delete server:', error);
        }
      }
    };

    const editServer = (server) => {
      serverToEdit.value = server;
      showEditModal.value = true;
    };

    const handleEditClose = () => {
      showEditModal.value = false;
      serverToEdit.value = null;
    };

    const handleEditSaved = (updatedServer) => {
      // The store will automatically update the servers list
      // but we can add any additional logic here if needed
      console.warn('Server updated:', updatedServer);
      // Plan to place a success notification here in the future
    };

    const confirmBulkDelete = () => {
      showBulkDeleteModal.value = true;
    };

    const executeBulkDelete = async () => {
      try {
        await serversStore.bulkDeleteServers();
        showBulkDeleteModal.value = false;
      } catch (error) {
        console.error('Failed to delete servers:', error);
      }
    };

    const openBulkStatusModal = () => {
      bulkStatusValue.value = '';
      showBulkStatusModal.value = true;
    };

    const executeBulkStatusUpdate = async () => {
      if (!bulkStatusValue.value) return;
      
      try {
        await serversStore.bulkUpdateStatus(bulkStatusValue.value);
        showBulkStatusModal.value = false;
        bulkStatusValue.value = '';
      } catch (error) {
        console.error('Failed to update server status:', error);
      }
    };

    onMounted(() => {
      serversStore.fetchServers();
    });

    return {
      serversStore,
      servers,
      showDeleteModal,
      serverToDelete,
      showEditModal,
      serverToEdit,
      showBulkDeleteModal,
      showBulkStatusModal,
      bulkStatusValue,
      selectedCount,
      confirmDelete,
      deleteServer,
      editServer,
      handleEditClose,
      handleEditSaved,
      confirmBulkDelete,
      executeBulkDelete,
      openBulkStatusModal,
      executeBulkStatusUpdate
    };
  }
};
</script>

<template>
  <div class="px-6 py-8">
    <div class="mb-8">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Servers</h1>
          <p class="text-gray-600 dark:text-gray-400">Manage your server infrastructure</p>
        </div>
        <RouterLink
          to="/servers/new"
          class="btn btn-primary"
        >
          Add Server
        </RouterLink>
      </div>
    </div>

    <!-- Server Filters -->
     <ServerFilters :showing-max="servers.length" />
     
    <!-- Bulk Operations Toolbar -->
    <div v-if="selectedCount > 0" class="mb-4 px-4 py-2 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <span class="text-sm font-medium text-gray-900 dark:text-gray-100">
            {{ selectedCount }} server{{ selectedCount > 1 ? 's' : '' }} selected
          </span>
          <button
            @click="serversStore.clearSelection()"
            class="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            Clear selection
          </button>
        </div>
        <div class="flex gap-2">
          <button
            @click="openBulkStatusModal"
            class="btn btn-secondary flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Update Status
          </button>
          <button
            @click="confirmBulkDelete"
            class="btn btn-danger flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        </div>
      </div>
    </div>

    <!-- Servers Table -->
    <ServersTable
      :servers="servers"
      :show-actions="true"
      :show-sorting="true"
      :show-bulk-selection="true"
      @edit="editServer"
      @delete="confirmDelete"
    />

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 bg-gray-600 dark:bg-gray-900 bg-opacity-50 dark:bg-opacity-75 overflow-y-auto h-full w-full z-50"
    >
      <div class="relative top-20 mx-auto p-5 border dark:border-gray-600 w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div class="mt-3 text-center">
          <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">Delete Server</h3>
          <div class="mt-2 px-7 py-3">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to delete <strong class="text-gray-900 dark:text-gray-100">{{ serverToDelete?.name }}</strong>?
              This action cannot be undone.
            </p>
          </div>
          <div class="flex justify-center space-x-4 mt-4">
            <button
              @click="showDeleteModal = false"
              class="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              @click="deleteServer"
              class="btn btn-danger"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Server Modal -->
    <EditServerModal
      v-if="serverToEdit"
      :server="serverToEdit"
      :is-visible="showEditModal"
      @close="handleEditClose"
      @saved="handleEditSaved"
    />

    <!-- Bulk Delete Confirmation Modal -->
    <div
      v-if="showBulkDeleteModal"
      class="fixed inset-0 bg-gray-600 dark:bg-gray-900 bg-opacity-50 dark:bg-opacity-75 overflow-y-auto h-full w-full z-50"
    >
      <div class="relative top-20 mx-auto p-5 border dark:border-gray-600 w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div class="mt-3 text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30">
            <svg class="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mt-4">Delete Multiple Servers</h3>
          <div class="mt-2 px-7 py-3">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to delete <strong class="text-gray-900 dark:text-gray-100">{{ selectedCount }} server{{ selectedCount > 1 ? 's' : '' }}</strong>?
              This action cannot be undone.
            </p>
          </div>
          <div class="flex justify-center space-x-4 mt-4">
            <button
              @click="showBulkDeleteModal = false"
              class="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              @click="executeBulkDelete"
              class="btn btn-danger"
              :disabled="serversStore.isLoading"
            >
              {{ serversStore.isLoading ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Bulk Status Update Modal -->
    <div
      v-if="showBulkStatusModal"
      class="fixed inset-0 bg-gray-600 dark:bg-gray-900 bg-opacity-50 dark:bg-opacity-75 overflow-y-auto h-full w-full z-50"
    >
      <div class="relative top-20 mx-auto p-5 border dark:border-gray-600 w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 text-center">Update Server Status</h3>
          <div class="mt-4 px-7 py-3">
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Select the new status for <strong class="text-gray-900 dark:text-gray-100">{{ selectedCount }} server{{ selectedCount > 1 ? 's' : '' }}</strong>:
            </p>
            <select
              v-model="bulkStatusValue"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">Select status...</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="maintenance">Maintenance</option>
              <option value="error">Error</option>
            </select>
          </div>
          <div class="flex justify-center space-x-4 mt-4">
            <button
              @click="showBulkStatusModal = false"
              class="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              @click="executeBulkStatusUpdate"
              class="btn btn-primary"
              :disabled="!bulkStatusValue || serversStore.isLoading"
            >
              {{ serversStore.isLoading ? 'Updating...' : 'Update' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
