(() => {
  'use strict';

  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
  const normalise = value => (value || '').toString().trim().toLowerCase();

  function toast(message, type = 'success') {
    let holder = $('#appToast');
    if (!holder) {
      holder = document.createElement('div');
      holder.id = 'appToast';
      holder.setAttribute('role', 'status');
      holder.style.cssText = 'position:fixed;right:20px;bottom:20px;z-index:10001;padding:12px 18px;border-radius:10px;color:#fff;background:#16a34a;box-shadow:0 10px 25px rgba(0,0,0,.2);transition:.2s';
      document.body.append(holder);
    }
    holder.textContent = message;
    holder.style.background = type === 'error' ? '#dc2626' : type === 'info' ? '#2563eb' : '#16a34a';
    holder.hidden = false;
    clearTimeout(holder._timer);
    holder._timer = setTimeout(() => { holder.hidden = true; }, 2600);
  }

  function openModal(modal) {
    if (!modal) return;
    modal.classList.add('show');
    const input = $('input:not([type="hidden"]), select, textarea', modal);
    if (input) setTimeout(() => input.focus(), 100);
  }
  function closeModal(modal) { if (modal) modal.classList.remove('show'); }
  function closeAllModals() { $$('.modal.show').forEach(closeModal); }

  function modalForButton(button) {
    const text = normalise(button.textContent);
    const page = document.body.dataset.page || location.pathname.split('/').pop().replace('.html', '');
    if (button.classList.contains('view')) return $(`#${page.replace(/s$/, '')}Modal, #productModal, #customerModal, #supplierModal, #userModal`);
    if (button.classList.contains('edit')) return $(`#edit${page.charAt(0).toUpperCase()}${page.slice(1).replace(/s$/, '')}Modal, #editProductModal, #editCustomerModal, #editSupplierModal`);
    if (button.classList.contains('delete')) return $('#deleteModal, #deleteProductModal, #deleteCustomerModal, #deleteSupplierModal, #deleteUserModal, #deleteCategoryModal, #deleteStockModal');
    if (text.includes('add product')) return $('#addProductModal');
    if (text.includes('add customer')) return $('#addCustomerModal');
    if (text.includes('add supplier')) return $('#addSupplierModal');
    if (text.includes('add user')) return $('#addUserModal');
    if (text.includes('add categor')) return $('#addCategoryModal');
    if (text.includes('add expense')) return $('#expenseModal');
    if (text.includes('add stock') || text.includes('adjust stock') || text.includes('stock adjustment')) return $('#stockModal');
    if (text.includes('add purchase') || text.includes('new purchase')) return $('#purchaseModal');
    if (text.includes('add sale') || text.includes('new sale')) return $('#saleModal');
    if (text.includes('backup')) return $('#backupModal');
    if (text.includes('logo')) return $('#logoModal');
    if (text.includes('password')) return $('#passwordModal');
    return null;
  }

  function installModals() {
    document.addEventListener('click', event => {
      const button = event.target.closest('button');
      if (!button) return;
      const modal = button.closest('.modal');
      if (button.classList.contains('close') || button.classList.contains('secondary-btn') || /^close$/i.test(button.textContent.trim())) {
        if (modal) { event.preventDefault(); closeModal(modal); }
        return;
      }
      if (button.classList.contains('danger-btn') && modal && modal.dataset.pageManaged !== 'true') {
        event.preventDefault();
        closeModal(modal);
        toast('Deleted successfully.');
        return;
      }
      const target = modalForButton(button);
      if (target) { event.preventDefault(); openModal(target); }
      if (/^print$/i.test(button.textContent.trim())) window.print();
      if (/download|export/i.test(button.textContent)) exportFirstTable();
    });
    $$('.modal').forEach(modal => modal.addEventListener('click', event => {
      if (event.target === modal) closeModal(modal);
    }));
    document.addEventListener('keydown', event => { if (event.key === 'Escape') closeAllModals(); });
  }

  function installFiltering() {
    $$('input[placeholder*="Search" i]').forEach(input => {
      const scope = input.closest('.content, section, main') || document;
      const table = $('table', scope);
      if (!table) return;
      input.addEventListener('input', () => {
        const query = normalise(input.value);
        $$('tbody tr', table).forEach(row => { row.hidden = !normalise(row.textContent).includes(query); });
      });
    });
    $$('table').forEach(table => {
      const master = $('thead input[type="checkbox"]', table);
      if (master) master.addEventListener('change', () => $$('tbody input[type="checkbox"]', table).forEach(box => { box.checked = master.checked; }));
    });
    $$('.pagination').forEach(pagination => pagination.addEventListener('click', event => {
      const button = event.target.closest('.page-btn');
      if (!button || !button.textContent.trim()) return;
      $$('.page-btn', pagination).forEach(item => item.classList.remove('active'));
      button.classList.add('active');
    }));
  }

  function installForms() {
    $$('form').forEach(form => form.addEventListener('submit', event => {
      event.preventDefault();
      if (form.id === 'loginForm') return;
      if (form.dataset.pageManaged === 'true') return;
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const modal = form.closest('.modal');
      if (modal) closeModal(modal);
      form.reset();
      toast('Saved successfully.');
    }));
  }

  function exportFirstTable() {
    const table = $('table');
    if (!table) { toast('There is no table to export.', 'error'); return; }
    const rows = $$('tr', table).filter(row => !row.hidden).map(row =>
      $$('th, td', row).map(cell => `"${cell.innerText.replace(/"/g, '""').replace(/\n/g, ' ')}"`).join(','));
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${location.pathname.split('/').pop().replace('.html', '') || 'inventory'}-export.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast('CSV export downloaded.');
  }

  function installTheme() {
    const saved = localStorage.getItem('inventoryTheme');
    if (saved === 'dark') document.body.classList.add('dark-theme');
    $$('.icon').forEach(button => {
      if (!$('.fa-moon, .fa-sun', button)) return;
      button.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark-theme');
        localStorage.setItem('inventoryTheme', isDark ? 'dark' : 'light');
      });
    });
  }

  function installLogin() {
    const password = $('#password');
    const toggle = $('#togglePassword');
    if (password && toggle) toggle.addEventListener('click', () => {
      password.type = password.type === 'password' ? 'text' : 'password';
      const icon = $('i', toggle); if (icon) icon.classList.toggle('fa-eye-slash');
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    installModals(); installFiltering(); installForms(); installTheme(); installLogin();
    window.InventoryApp = { toast, openModal, closeModal, exportFirstTable };
  });
})();
