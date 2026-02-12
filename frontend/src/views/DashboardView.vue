<script>
import { onMounted, computed, onUnmounted, ref } from 'vue';
import { useServersStore } from '../stores/servers';
import StatusChart from '../components/StatusChart.vue';
import UsageChart from '../components/UsageChart.vue';
import filterMethods from '../helpers/filterMethods';

export default {
  name: 'DashboardView',
  components: {
    StatusChart,
    UsageChart
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
        refreshData();
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
      getStatusColor,
      autoRefreshEnabled,
      autoRefreshInterval,
      formatLastUpdated,
      refreshData,
      toggleAutoRefresh,
      updateAutoRefreshInterval,
      ...filterMethods
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

    <!-- Stats Overview -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div class="card p-6">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Servers</h3>
        <p class="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {{ serversStore.dashboardStats?.total_servers || 0 }}
        </p>
      </div>
      
      <div class="card p-6">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Online</h3>
        <p class="text-3xl font-bold text-green-600 dark:text-green-400">
          {{ statusCounts.online || 0 }}
        </p>
      </div>
      
      <div class="card p-6">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Offline</h3>
        <p class="text-3xl font-bold text-red-600 dark:text-red-400">
          {{ statusCounts.offline || 0 }}
        </p>
      </div>
      
      <div class="card p-6">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Maintenance</h3>
        <p class="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
          {{ statusCounts.maintenance || 0 }}
        </p>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div class="card p-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Server Status Distribution</h3>
        <StatusChart :data="statusCounts" />
      </div>
      
      <div class="card p-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Average Resource Usage</h3>
        <UsageChart :data="averageUsage" />
      </div>
    </div>

    <!-- Recent Servers -->
    <div class="card">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">Recent Servers</h3>
      </div>
      
      <div class="overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Server
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Location
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Usage
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Uptime
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="server in serversStore.servers.slice(0, 10)"
              :key="server.id"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div>
                  <div class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ server.name }}</div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">{{ server.hostname }}</div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">{{ server.ip_address }}</div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span 
                  class="inline-flex px-2 text-xs font-semibold rounded-full"
                  :class="getStatusColor(server.status)"
                >
                  {{ server.status }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                <div class="text-sm text-gray-900 dark:text-gray-100">{{ server.location }}</div>
                <div class="text-sm text-gray-500 dark:text-gray-400">{{ server.os }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                <div class="text-sm text-gray-900 dark:text-gray-100">
                  CPU: {{ formatPercent(server.cpu_usage) }}%
                </div>
                <div class="text-sm text-gray-900 dark:text-gray-100">
                  Memory: {{ formatPercent(server.memory_usage) }}%
                </div>
                <div class="text-sm text-gray-900 dark:text-gray-100">
                  Disk: {{ formatPercent(server.disk_usage) }}%
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                {{ formatUptime(server.uptime) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-right">
        <RouterLink 
          to="/servers"
          class="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300"
        >
          View all servers →
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
  #lastUpdatedWrap {
    width: 180px;
  }
</style>