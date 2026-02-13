const formatPercent = (value) => {
  if (value === null || isNaN(value)) return 'N/A';
  return Math.round(value * 100);
};

const formatUptime = (seconds) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h`;
  return `${Math.floor(seconds / 60)}m`;
};

const getHealthColor = (health) => {
  if (health >= 70) return 'text-green-600 dark:text-green-400';
  if (health >= 40) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
};

export default {
  formatPercent,
  formatUptime,
  getHealthColor
};
