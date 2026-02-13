<script>
import { onMounted, onUnmounted, computed, ref } from 'vue';
import { useServersStore } from '../stores/servers';
import StatusChart from '../components/StatusChart.vue';
import UsageChart from '../components/UsageChart.vue';
import ServerFilters from '../components/ServerFilters.vue';
import ServersTable from '../components/ServersTable.vue';

export default {
  name: 'DashboardView',
  components: {
    StatusChart,
    UsageChart,
    ServerFilters,
    ServersTable
  },
  setup() {
    const serversStore = useServersStore();
    const autoRefreshEnabled = ref(true); // Auto-refresh is enabled by default at 30 seconds
    const autoRefreshInterval = ref(30); // seconds
    const refreshIntervalId = ref(null); // To store the interval ID for auto-refresh
    const displayTimeIntervalId = ref(null); // To store the interval ID for updating display time
    const currentTime = ref(Date.now());

    const statusCounts = computed(() => {
      if (!serversStore.dashboardStats) return {};
      return serversStore.dashboardStats.status_breakdown;
    });

    const averageUsage = computed(() => {
      if (!serversStore.dashboardStats) return {};
      return serversStore.dashboardStats.average_usage;
    });

    const filteredStatusCounts = computed(() => {
      const grouped = serversStore.filteredServersByStatus;
      return {
        online: grouped.online.length,
        offline: grouped.offline.length,
        maintenance: grouped.maintenance.length,
        error: grouped.error.length
      };
    });

    const filteredAverageUsage = computed(() => {
      const servers = serversStore.filteredServers;
      if (servers.length === 0) return { cpu: 0, memory: 0, disk: 0 };
      
      const avgCpu = servers.reduce((sum, s) => sum + (s.cpu_usage || 0), 0) / servers.length;
      const avgMemory = servers.reduce((sum, s) => sum + (s.memory_usage || 0), 0) / servers.length;
      const avgDisk = servers.reduce((sum, s) => sum + (s.disk_usage || 0), 0) / servers.length;
      
      return {
        cpu: Math.round(avgCpu * 100) / 100,
        memory: Math.round(avgMemory * 100) / 100,
        disk: Math.round(avgDisk * 100) / 100
      };
    });

    const getStatusColor = (status) => {
      const colors = {
        online: 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
        offline: 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30',
        maintenance: 'text-yellow-700 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30',
        error: 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30'
      };
      return colors[status] || 'text-gray-700 bg-gray-100 dark:text-gray-400 dark:bg-gray-800';
    };

    const formatLastUpdated = (date) => {
      if (!date) return 'Never';
      let diff = Math.floor((currentTime.value - date.getTime()) / 1000); // seconds
      diff = diff < 0 ? 0 : diff; // Handle future timestamps gracefully, prevents from showing -1 for a second.
      
      if (diff < 60) return `${diff}s ago`;
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return date.toLocaleTimeString();
    };

    // Manual refresh function
    const refreshData = async () => {
      // Refresh both servers and dashboard stats
      await serversStore.refreshDashboard();
    };

    // Toggle auto-refresh on and off
    const toggleAutoRefresh = () => {
      autoRefreshEnabled.value = !autoRefreshEnabled.value;
      
      if (autoRefreshEnabled.value) {
        startAutoRefresh();
      } else {
        stopAutoRefresh();
      }
    };

    // Start the auto-refresh interval
    const startAutoRefresh = () => {
      stopAutoRefresh(); // Clear any existing interval
      refreshIntervalId.value = setInterval(() => {
        refreshData();
      }, autoRefreshInterval.value * 1000);
    };

    // Stop the auto-refresh interval
    const stopAutoRefresh = () => {
      if (refreshIntervalId.value) {
        clearInterval(refreshIntervalId.value);
        refreshIntervalId.value = null;
      }
    };

    // Update auto-refresh interval
    const updateAutoRefreshInterval = (seconds) => {
      autoRefreshInterval.value = seconds;
      if (autoRefreshEnabled.value) {
        startAutoRefresh(); // Restart with new interval
      }
    };

    onMounted(async () => {
      await refreshData();
      
      // Update display time every second to keep "X ago" text current
      displayTimeIntervalId.value = setInterval(() => {
        currentTime.value = Date.now();
      }, 1000);
      
      // Start auto-refresh if enabled
      if (autoRefreshEnabled.value) {
        startAutoRefresh();
      }
    });

    onUnmounted(() => {
      // Clean up intervals
      stopAutoRefresh();
      if (displayTimeIntervalId.value) {
        clearInterval(displayTimeIntervalId.value);
      }
    });

    return {
      serversStore,
      statusCounts,
      averageUsage,
      filteredStatusCounts,
      filteredAverageUsage,
      autoRefreshEnabled,
      autoRefreshInterval,
      getStatusColor,
      formatLastUpdated,
      refreshData,
      toggleAutoRefresh,
      updateAutoRefreshInterval
    };
  }
};
</script>

<template>
  <div class="px-6 py-8">
    <div class="mb-8">
      <div class="flex justify-between items-start">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p class="text-gray-600 dark:text-gray-400">Monitor your server infrastructure</p>
        </div>
        
        <!-- Refresh Controls -->
        <div class="flex flex-col items-start gap-2">
          <div class="flex items-center gap-2">
            <!-- Auto-refresh Toggle -->
            <div class="flex items-center gap-2">
              <label
                class="text-sm text-gray-700 dark:text-gray-300 cursor-pointer py-2"
                role="button"
                tabindex="0"
                @click="toggleAutoRefresh"
                @keydown.enter.prevent="toggleAutoRefresh"
                @keydown.space.prevent="toggleAutoRefresh"
              >
                Auto-refresh:
              </label>
              <button
                @click="toggleAutoRefresh"
                :class="[
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer',
                  autoRefreshEnabled ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                ]"
              >
                <span
                  :class="[
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    autoRefreshEnabled ? 'translate-x-6' : 'translate-x-1'
                  ]"
                />
              </button>
              
              <!-- Interval Selector -->
              <select
                v-if="autoRefreshEnabled"
                v-model.number="autoRefreshInterval"
                @change="updateAutoRefreshInterval(autoRefreshInterval)"
                class="text-sm rounded-md py-1 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              >
                <option :value="15">15s</option>
                <option :value="30">30s</option>
                <option :value="60">60s</option>
                <option :value="120">2m</option>
              </select>
            </div>
            
          </div>
          <div class="flex items-center gap-2">
            <!-- Last Updated -->
            <div id="lastUpdatedWrap" class="text-sm text-gray-500 dark:text-gray-300">
              Last updated: {{ formatLastUpdated(serversStore.lastUpdated) }}
            </div>
            <!-- Manual Refresh Button -->
            <button
              @click="refreshData"
              :disabled="serversStore.isLoading"
              class="btn-primary rounded px-2 py-1 flex items-center gap-2 text-white cursor-pointer"
            >
              <svg
                :class="['w-4 h-4', serversStore.isLoading ? 'animate-spin' : '']"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {{ serversStore.isLoading ? 'Refreshing...' : 'Refresh' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Server Filters -->
    <ServerFilters :showing-max="10" />

    <!-- Stats Overview -->
    <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
      <div class="card p-6">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Servers</h3>
        <p class="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {{ serversStore.filteredServers.length }}
        </p>
      </div>
      
      <div class="card p-6">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Online</h3>
        <p class="text-3xl font-bold text-green-600 dark:text-green-400">
          {{ filteredStatusCounts.online || 0 }}
        </p>
      </div>
      
      <div class="card p-6">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Offline</h3>
        <p class="text-3xl font-bold text-red-600 dark:text-red-400">
          {{ filteredStatusCounts.offline || 0 }}
        </p>
      </div>
      
      <div class="card p-6">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Maintenance</h3>
        <p class="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
          {{ filteredStatusCounts.maintenance || 0 }}
        </p>
      </div>
      <div class="card p-6">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Error</h3>
        <p class="text-3xl font-bold text-red-600 dark:text-red-400">
          {{ filteredStatusCounts.error || 0 }}
        </p>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div class="card p-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Server Status Distribution</h3>
        <StatusChart :data="filteredStatusCounts" />
      </div>
      
      <div class="card p-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Average Resource Usage</h3>
        <UsageChart :data="filteredAverageUsage" />
      </div>
    </div>

    <!-- Recent Servers Table -->
    <ServersTable
      :servers="serversStore.filteredServers"
      :max-rows="10"
      :show-sorting="true"
      :title="(serversStore.filters.status || serversStore.filters.location) ? 'Recent Servers (Filtered)' : 'Recent Servers'"
    >
      <template #footer>
        <div class="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-right">
          <RouterLink 
            to="/servers"
            class="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300"
          >
            View all servers →
          </RouterLink>
        </div>
      </template>
    </ServersTable>
  </div>
</template>

<style scoped>
  #lastUpdatedWrap {
    width: 180px;
  }
</style>
