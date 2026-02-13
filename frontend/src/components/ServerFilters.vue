<script>
import { ref } from 'vue';
import { useServersStore } from '../stores/servers';

export default {
  name: 'ServerFilters',
  props: {
    showingMax: {
      type: Number,
      default: 0
    }
  },
  setup(props) {
    const serversStore = useServersStore();
    const showingMax = ref(props.showingMax > 0 ? props.showingMax : serversStore.filteredServers.length);

    return {
      serversStore,
      showingMax
    };
  },
}
</script>

<template>
  <!-- Filters -->
  <div class="card px-3 py-2 mb-6">
    <div class="flex flex-col gap-4">
      <div class="flex items-center gap-4 flex-wrap">
        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Filters:</label>
        
        <!-- Search Text Filter -->
        <div class="flex-1 min-w-[200px]">
          <input
            type="text"
            :value="serversStore.filters.searchText"
            @input="serversStore.setFilter('searchText', $event.target.value)"
            placeholder="Search by server name..."
            class="w-full text-sm rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 px-3 py-1.5"
          />
        </div>
        
        <!-- IP Address Filter -->
        <div class="flex-1 min-w-[200px]">
          <input
            type="text"
            :value="serversStore.filters.ipAddress"
            @input="serversStore.setFilter('ipAddress', $event.target.value)"
            placeholder="Search by IP address..."
            class="w-full text-sm rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 px-3 py-1.5"
          />
        </div>
        
        <!-- Status Filter -->
        <div>
          <select
            :value="serversStore.filters.status"
            @change="serversStore.setFilter('status', $event.target.value)"
            class="text-sm rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="">All Statuses</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
            <option value="maintenance">Maintenance</option>
            <option value="error">Error</option>
          </select>
        </div>
        
        <!-- Location Filter -->
        <div>
          <select
            :value="serversStore.filters.location"
            @change="serversStore.setFilter('location', $event.target.value)"
            class="text-sm rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="">All Locations</option>
            <option v-for="location in serversStore.uniqueLocations" :key="location" :value="location">
              {{ location }}
            </option>
          </select>
        </div>

        <!-- Clear Filters -->
        <button
          v-if="serversStore.filters.status || serversStore.filters.location || serversStore.filters.searchText || serversStore.filters.ipAddress"
          @click="serversStore.clearFilters()"
          class="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
        >
          Clear filters
        </button>
        
        <!-- Filter Summary -->
        <div class="text-sm text-gray-500 dark:text-gray-400 ml-auto">
          Showing {{ Math.min(showingMax, serversStore.filteredServers.length) || 0 }} of {{ serversStore.servers.length }} servers
        </div>
      </div>
    </div>
  </div>
</template>
