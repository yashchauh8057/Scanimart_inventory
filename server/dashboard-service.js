const asArray = value => Object.entries(value || {}).map(([id, item]) => ({ id, ...item }));
const number = value => Number(value) || 0;
const dateValue = value => new Date(value || 0).getTime() || 0;
const byNewest = (a, b) => dateValue(b.createdAt) - dateValue(a.createdAt);

function monthlySales(orders) {
  const now = new Date();
  const months = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 6 + index, 1);
    return { key: `${date.getFullYear()}-${date.getMonth()}`, label: date.toLocaleString('en-IN', { month: 'short' }), total: 0 };
  });
  const lookup = new Map(months.map(month => [month.key, month]));
  orders.filter(order => order.status !== 'Cancelled').forEach(order => {
    const date = new Date(order.createdAt);
    const month = lookup.get(`${date.getFullYear()}-${date.getMonth()}`);
    if (month) month.total += number(order.total);
  });
  return { labels: months.map(month => month.label), values: months.map(month => month.total) };
}

function dashboardFromData(data) {
  const products = asArray(data.products);
  const customers = asArray(data.customers);
  const orders = asArray(data.orders).sort(byNewest);
  const activities = asArray(data.activities).sort(byNewest);
  const completedOrders = orders.filter(order => order.status !== 'Cancelled');
  const sources = new Map();
  completedOrders.forEach(order => sources.set(order.category || 'Other', (sources.get(order.category || 'Other') || 0) + number(order.total)));
  const sourceEntries = [...sources.entries()];

  return {
    metrics: {
      totalProducts: products.length,
      totalOrders: orders.length,
      totalCustomers: customers.length,
      totalRevenue: completedOrders.reduce((sum, order) => sum + number(order.total), 0)
    },
    charts: {
      sales: monthlySales(orders),
      sources: { labels: sourceEntries.map(([label]) => label), values: sourceEntries.map(([, value]) => value) }
    },
    recentOrders: orders.slice(0, 5),
    lowStock: products.filter(product => number(product.stock) <= number(product.reorderLevel || 10)).sort((a, b) => number(a.stock) - number(b.stock)).slice(0, 5),
    latestCustomers: customers.sort(byNewest).slice(0, 5),
    activities: activities.slice(0, 6)
  };
}

module.exports = { dashboardFromData };
