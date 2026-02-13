import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { serversAPI, dashboardAPI } from '../services/api';

export const useServersStore = defineStore('servers', () => {
  const servers = ref([]);
  const dashboardStats = ref(null);
  const isLoading = ref(false);
  const error = ref(null);
  const lastUpdated = ref(null);

  // Dashboard filters
  const filters = ref({
    location: '',
    status: '',
    searchText: '',
    ipAddress: ''
  });

  // Sorting
  const sortConfig = ref({
    field: '',
    direction: '' // 'asc' or 'desc'
  });

  // Bulk operations - selected server IDs
  const selectedServerIds = ref(new Set());

  const serversByStatus = computed(() => {
    const grouped = {
      online: [],
      offline: [],
      maintenance: [],
      error: []
    };

    servers.value.forEach(server => {
      if (grouped[server.status]) {
        grouped[server.status].push(server);
      }
    });

    return grouped;
  });

  const totalServers = computed(() => servers.value.length);
  // Calculate health score for a server (0-100, higher is better)
  // Formula: (100 - CPU*40) + (100 - Memory*40) + (100 - Disk*20)
  // Where CPU, Memory, Disk are percentages (0-100)
  const calculateHealthScore = (server) => {
    // Handle missing or invalid data
    const cpu = typeof server.cpu_usage === 'number'
      ? Math.min(100, Math.max(0, server.cpu_usage * 100))
      : 0;
    const memory = typeof server.memory_usage === 'number'
      ? Math.min(100, Math.max(0, server.memory_usage))
      : 0;
    const disk = typeof server.disk_usage === 'number'
      ? Math.min(100, Math.max(0, server.disk_usage * 100))
      : 0;

    // Calculate weighted health score (lower resource usage = higher health)
    const cpuHealth = (100 - cpu) * 0.40;
    const memoryHealth = (100 - memory) * 0.40;
    const diskHealth = (100 - disk) * 0.20;

    const healthScore = cpuHealth + memoryHealth + diskHealth;

    return Math.round(healthScore);
  };

  // Add health scores to servers
  const serversWithHealth = computed(() => {
    return servers.value.map(server => ({
      ...server,
      healthScore: calculateHealthScore(server)
    }));
  });

  // Calculate average health score
  const averageHealthScore = computed(() => {
    if (serversWithHealth.value.length === 0) return 0;
    // Average health score across all servers
    const total = serversWithHealth.value.reduce((sum, s) => sum + s.healthScore, 0);
    return Math.round(total / serversWithHealth.value.length);
  });

  // Apply filters and sorting to get the final list of servers to display
  const filteredServers = computed(() => {
    let filtered = serversWithHealth.value;

    // Apply filters
    if (filters.value.location) {
      filtered = filtered.filter(s => s.location === filters.value.location);
    }

    if (filters.value.status) {
      filtered = filtered.filter(s => s.status === filters.value.status);
    }

    if (filters.value.searchText) {
      const search = filters.value.searchText.toLowerCase();
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(search)
      );
    }

    if (filters.value.ipAddress) {
      const ipSearch = filters.value.ipAddress.toLowerCase();
      filtered = filtered.filter(s =>
        s.ip_address.toLowerCase().includes(ipSearch)
      );
    }

    // Apply sorting
    if (sortConfig.value.field) {
      filtered = [...filtered].sort((a, b) => {
        let aVal = a[sortConfig.value.field];
        let bVal = b[sortConfig.value.field];

        // Handle case-insensitive string comparison
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }

        if (aVal < bVal) return sortConfig.value.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.value.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  });

  // Group the filtered servers by status for easier display in the UI
  const filteredServersByStatus = computed(() => {
    const grouped = {
      online: [],
      offline: [],
      maintenance: [],
      error: []
    };

    filteredServers.value.forEach(server => {
      if (grouped[server.status]) {
        grouped[server.status].push(server);
      }
    });

    return grouped;
  });

  // Get unique locations for filter dropdown
  const uniqueLocations = computed(() => {
    const locations = new Set(servers.value.map(s => s.location));
    return Array.from(locations).sort();
  });

  const fetchServers = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await serversAPI.getServers();
      servers.value = response.data.servers;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch servers';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await dashboardAPI.getStats();
      dashboardStats.value = response.data;
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    }
  };

  const refreshDashboard = async () => {
    isLoading.value = true;
    try {
      await Promise.all([
        fetchServers(),
        fetchDashboardStats()
      ]);
      lastUpdated.value = new Date();
    } catch (err) {
      error.value = err.message || 'Failed to refresh dashboard';
    } finally {
      isLoading.value = false;
    }
  };

  const setFilter = (filterType, value) => {
    filters.value[filterType] = value;
  };

  const clearFilters = () => {
    filters.value = {
      location: '',
      status: '',
      searchText: '',
      ipAddress: ''
    };
  };

  // Sorting logic: clicking the same field toggles between asc, desc, and no sorting
  const setSortField = (field) => {
    if (sortConfig.value.field === field) {
      // Toggle direction
      if (sortConfig.value.direction === 'asc') {
        sortConfig.value.direction = 'desc';
      } else if (sortConfig.value.direction === 'desc') {
        // Clear sorting
        sortConfig.value.field = '';
        sortConfig.value.direction = '';
      }
    } else {
      // Set new field, default to ascending
      sortConfig.value.field = field;
      sortConfig.value.direction = 'asc';
    }
  };

  const clearSort = () => {
    sortConfig.value = {
      field: '',
      direction: ''
    };
  };

  const createServer = async (serverData) => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await serversAPI.createServer(serverData);
      servers.value.push(response.data.server);
      return response.data.server;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to create server';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const updateServer = async (id, serverData) => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await serversAPI.updateServer(id, serverData);
      const index = servers.value.findIndex(s => s.id === id);
      if (index !== -1) {
        servers.value[index] = response.data.server;
      }
      return response.data.server;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to update server';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Remove the server from the list, but revert if the API call fails
  const deleteServer = async (id) => {
    isLoading.value = true;
    error.value = null;

    try {
      await serversAPI.deleteServer(id);
      servers.value = servers.value.filter(s => s.id !== id);
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to delete server';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };
  // Bulk operations
  const toggleServerSelection = (serverId) => {
    if (selectedServerIds.value.has(serverId)) {
      selectedServerIds.value.delete(serverId);
    } else {
      selectedServerIds.value.add(serverId);
    }
  };

  const toggleAllServers = (serverIds) => {
    if (selectedServerIds.value.size === serverIds.length) {
      selectedServerIds.value.clear();
    } else {
      selectedServerIds.value = new Set(serverIds);
    }
  };

  const clearSelection = () => {
    selectedServerIds.value.clear();
  };

  const bulkDeleteServers = async () => {
    if (selectedServerIds.value.size === 0) return;

    isLoading.value = true;
    error.value = null;

    try {
      const ids = Array.from(selectedServerIds.value);
      await serversAPI.bulkDelete(ids);
      servers.value = servers.value.filter(s => !selectedServerIds.value.has(s.id));
      clearSelection();
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to delete servers';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const bulkUpdateStatus = async (newStatus) => {
    if (selectedServerIds.value.size === 0) return;

    isLoading.value = true;
    error.value = null;

    try {
      const ids = Array.from(selectedServerIds.value);
      await serversAPI.bulkUpdateStatus(ids, newStatus);

      // Update the status in local state
      servers.value = servers.value.map(server => {
        if (selectedServerIds.value.has(server.id)) {
          return { ...server, status: newStatus };
        }
        return server;
      });

      clearSelection();
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to update servers';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };
  const getServerById = (id) => {
    return servers.value.find(s => s.id === parseInt(id));
  };

  const clearError = () => {
    error.value = null;
  };

  return {
    servers,
    dashboardStats,
    isLoading,
    error,
    lastUpdated,
    filters,
    sortConfig,
    serversByStatus,
    totalServers,
    serversWithHealth,
    averageHealthScore,
    calculateHealthScore,
    filteredServers,
    filteredServersByStatus,
    uniqueLocations,
    selectedServerIds,
    fetchServers,
    fetchDashboardStats,
    refreshDashboard,
    setFilter,
    clearFilters,
    setSortField,
    clearSort,
    createServer,
    updateServer,
    deleteServer,
    toggleServerSelection,
    toggleAllServers,
    clearSelection,
    bulkDeleteServers,
    bulkUpdateStatus,
    getServerById,
    clearError
  };
});
