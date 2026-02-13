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
      confirmDelete,
      deleteServer,
      editServer,
      handleEditClose,
      handleEditSaved
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
     
    <!-- Servers Table -->
    <ServersTable
      :servers="servers"
      :show-actions="true"
      :show-sorting="true"
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
  </div>
</template>
