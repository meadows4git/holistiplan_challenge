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


export default {
  formatPercent,
  formatUptime
};
