<script>
import { useServersStore } from '../stores/servers';
import filterMethods from '../helpers/filterMethods';

export default {
  name: 'ServersTable',
  props: {
    servers: {
      type: Array,
      required: true
    },
    maxRows: {
      type: Number,
      default: null
    },
    showActions: {
      type: Boolean,
      default: false
    },
    showSorting: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: ''
    }
  },
  emits: ['edit', 'delete'],
  setup(props, { emit }) {
    const serversStore = useServersStore();

    const getStatusColor = (status) => {
      const colors = {
        online: 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
        offline: 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30',
        maintenance: 'text-yellow-700 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30',
        error: 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30'
      };
      return colors[status] || 'text-gray-700 bg-gray-100 dark:text-gray-400 dark:bg-gray-800';
    };

    const handleSort = (field, event) => {
      if (!props.showSorting) return;
      serversStore.setSortField(field);
      event.currentTarget.blur();
    };

    const getSortIcon = (field) => {
      if (!props.showSorting || serversStore.sortConfig.field !== field) {
        return '↕';
      }
      return serversStore.sortConfig.direction === 'asc' ? '↑' : '↓';
    };

    const displayedServers = () => {
      if (props.maxRows) {
        return props.servers.slice(0, props.maxRows);
      }
      return props.servers;
    };

    const handleEdit = (server) => {
      emit('edit', server);
    };

    const handleDelete = (server) => {
      emit('delete', server);
    };

    return {
      serversStore,
      getStatusColor,
      handleSort,
      getSortIcon,
      displayedServers,
      handleEdit,
      handleDelete,
      ...filterMethods
    };
  }
};
</script>

<template>
  <div class="card overflow-hidden">
    <div v-if="title" class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">{{ title }}</h3>
      <div v-if="maxRows" class="text-sm text-gray-500 dark:text-gray-400">Showing {{ displayedServers().length }} servers</div>
    </div>

    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th 
              @click="handleSort('name', $event)"
              :class="[
                'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider select-none',
                showSorting ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600' : ''
              ]"
            >
              <div class="flex items-center gap-1">
                Server
                <span v-if="showSorting" class="text-xs">{{ getSortIcon('name') }}</span>
              </div>
            </th>
            <th 
              @click="handleSort('status', $event)"
              :class="[
                'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider select-none',
                showSorting ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600' : ''
              ]"
            >
              <div class="flex items-center gap-1">
                Status
                <span v-if="showSorting" class="text-xs">{{ getSortIcon('status') }}</span>
              </div>
            </th>
            <th 
              @click="handleSort('location', $event)"
              :class="[
                'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider select-none',
                showSorting ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600' : ''
              ]"
            >
              <div class="flex items-center gap-1">
                Location
                <span v-if="showSorting" class="text-xs">{{ getSortIcon('location') }}</span>
              </div>
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Usage
            </th>
            <th 
              @click="handleSort('healthScore', $event)"
              :class="[
                'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider select-none',
                showSorting ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600' : ''
              ]"
            >
              <div class="flex items-center gap-1">
                Health
                <span v-if="showSorting" class="text-xs">{{ getSortIcon('healthScore') }}</span>
              </div>
            </th>
            <th 
              @click="handleSort('uptime', $event)"
              :class="[
                'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider select-none',
                showSorting ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600' : ''
              ]"
            >
              <div class="flex items-center gap-1">
                Uptime
                <span v-if="showSorting" class="text-xs">{{ getSortIcon('uptime') }}</span>
              </div>
            </th>
            <th v-if="showActions" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          <tr
            v-for="server in displayedServers()"
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
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-900 dark:text-gray-100">{{ server.location }}</div>
              <div class="text-sm text-gray-500 dark:text-gray-400">{{ server.os }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
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
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center gap-2">
                <span class="text-lg font-bold" :class="getHealthColor(server.healthScore)">
                  {{ server.healthScore }}
                </span>
                <div class="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    class="h-2 rounded-full transition-all"
                    :class="{
                      'bg-green-600 dark:bg-green-400': server.healthScore >= 70,
                      'bg-yellow-600 dark:bg-yellow-400': server.healthScore >= 40 && server.healthScore < 70,
                      'bg-red-600 dark:bg-red-400': server.healthScore < 40
                    }"
                    :style="{ width: server.healthScore + '%' }"
                  ></div>
                </div>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
              {{ formatUptime(server.uptime) }}
            </td>
            <td v-if="showActions" class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <button
                @click="handleEdit(server)"
                class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 mr-3"
              >
                Edit
              </button>
              <button
                @click="handleDelete(server)"
                class="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
              >
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="servers.length === 0"
      class="text-center py-12"
    >
      <p class="text-gray-500 dark:text-gray-400">No servers found.</p>
    </div>

    <!-- Optional footer slot -->
    <slot name="footer"></slot>
  </div>
</template>
