document.addEventListener('DOMContentLoaded', () => {
  const apiBase = location.port === '3000' ? '' : 'http://127.0.0.1:3000';
  const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
  const text = value => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
  const statusClass = status => ({ Delivered: 'success', Pending: 'warning', Cancelled: 'danger' }[status] || 'warning');
  let salesChart;
  let sourceChart;

  function renderChart(canvas, type, data, existing, options) {
    if (!canvas || !window.Chart) return existing;
    if (existing) existing.destroy();
    return new Chart(canvas, { type, data, options: { responsive: true, maintainAspectRatio: false, ...options } });
  }

  function renderDashboard(data) {
    const { metrics, charts, recentOrders, lowStock, latestCustomers, activities } = data;
    document.getElementById('totalProducts').textContent = metrics.totalProducts.toLocaleString('en-IN');
    document.getElementById('orders').textContent = metrics.totalOrders.toLocaleString('en-IN');
    document.getElementById('customers').textContent = metrics.totalCustomers.toLocaleString('en-IN');
    document.getElementById('totalRevenue').textContent = money.format(metrics.totalRevenue);

    salesChart = renderChart(document.getElementById('salesChart'), 'line', {
      labels: charts.sales.labels,
      datasets: [{ label: 'Sales', data: charts.sales.values, borderColor: '#4f46e5', backgroundColor: 'rgba(79,70,229,.12)', fill: true, tension: .35 }]
    }, salesChart);
    sourceChart = renderChart(document.getElementById('pieChart'), 'doughnut', {
      labels: charts.sources.labels,
      datasets: [{ data: charts.sources.values, backgroundColor: ['#4f46e5', '#22c55e', '#f59e0b', '#ec4899', '#06b6d4'] }]
    }, sourceChart);

    document.getElementById('recentOrdersBody').innerHTML = recentOrders.map(order => `<tr><td>#${text(order.id)}</td><td>${text(order.customer)}</td><td>${text(order.product)}</td><td><span class="badge ${statusClass(order.status)}">${text(order.status)}</span></td><td>${money.format(order.total)}</td></tr>`).join('');
    document.getElementById('lowStockBody').innerHTML = lowStock.map(product => `<tr><td>${text(product.name)}</td><td>${text(product.sku)}</td><td>${text(product.stock)}</td><td><span class="badge ${Number(product.stock) <= 3 ? 'danger' : 'warning'}">${Number(product.stock) <= 3 ? 'Critical' : 'Low Stock'}</span></td></tr>`).join('');
    document.getElementById('latestCustomersBody').innerHTML = latestCustomers.map(customer => `<tr><td>${text(customer.name)}</td><td>${text(customer.email)}</td><td>${text(customer.orders || 0)}</td></tr>`).join('');
    document.getElementById('activityList').innerHTML = activities.map(activity => `<li><i class="fa-solid ${text(activity.icon || 'fa-circle-check')}"></i>${text(activity.message)}<span>${new Date(activity.createdAt).toLocaleDateString('en-IN')}</span></li>`).join('');
  }

  async function loadDashboard() {
    const response = await fetch(`${apiBase}/api/dashboard`);
    if (!response.ok) throw new Error('Dashboard data could not be loaded.');
    renderDashboard(await response.json());
  }

  loadDashboard().catch(error => console.error(error));
  const stream = new EventSource(`${apiBase}/api/dashboard/stream`);
  stream.onmessage = event => renderDashboard(JSON.parse(event.data));
  stream.onerror = () => stream.close();
});
