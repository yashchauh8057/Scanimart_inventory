(() => {
  'use strict';

  document.addEventListener('DOMContentLoaded', async () => {
    const { text, badge, readForm, fillForm } = window.InventoryUI;
    const tbody = document.querySelector('.table-card table tbody') || document.querySelector('table tbody');
    const form = document.querySelector('#stockModal form');
    const stockModal = document.getElementById('stockModal');
    const detailModal = document.getElementById('productModal');
    const deleteModal = document.getElementById('deleteStockModal');
    let records = [];
    let editTarget = null;
    let deleteTarget = null;

    if (form) form.dataset.pageManaged = 'true';
    if (deleteModal) deleteModal.dataset.pageManaged = 'true';

    const statusOf = item => {
      const available = Number(item.available);
      if (available <= 0) return 'Out Of Stock';
      if (available <= Number(item.minimum)) return 'Low Stock';
      return 'In Stock';
    };

    const render = () => {
      if (!tbody) return;
      if (!records.length) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:24px">No stock records in the database.</td></tr>`;
        return;
      }
      tbody.innerHTML = records.map(item => {
        const status = statusOf(item);
        return `<tr data-id="${text(item.id)}" data-product="${text(item.product || '')}">
          <td>${text(item.id)}</td>
          <td>${text(item.product)}</td>
          <td>${text(item.category || '')}</td>
          <td>${text(item.available)}</td>
          <td>${text(item.minimum)}</td>
          <td>${text(item.warehouse || '')}</td>
          <td><span class="badge ${badge(status)}">${text(status)}</span></td>
          <td>
            <button class="action-btn view" data-action="view" title="View"><i class="fa-solid fa-eye"></i></button>
            <button class="action-btn edit" data-action="edit" title="Edit"><i class="fa-solid fa-pen"></i></button>
            <button class="action-btn delete" data-action="delete" title="Delete"><i class="fa-solid fa-trash"></i></button>
          </td>
        </tr>`;
      }).join('');
    };

    const showDetails = item => {
      if (!detailModal) return;
      detailModal.innerHTML = `<div class="modal-content">
        <div class="modal-header"><h2>Stock Details</h2><button class="close">&times;</button></div>
        <p><strong>Product:</strong> ${text(item.product)}</p>
        <p><strong>Category:</strong> ${text(item.category || '')}</p>
        <p><strong>Available:</strong> ${text(item.available)}</p>
        <p><strong>Minimum:</strong> ${text(item.minimum)}</p>
        <p><strong>Warehouse:</strong> ${text(item.warehouse || '')}</p>
        <p><strong>Status:</strong> ${text(statusOf(item))}</p>
        <div class="modal-footer"><button class="primary-btn">Close</button></div>
      </div>`;
      if (window.InventoryApp) window.InventoryApp.openModal(detailModal);
    };

    const load = async () => {
      try {
        records = await API.list('stock');
        render();
        if (form) {
          const productSelect = form.querySelector('select');
          if (productSelect) {
            const names = [...new Set(records.map(item => item.product).filter(Boolean))];
            productSelect.innerHTML = names.map(name => `<option>${text(name)}</option>`).join('');
          }
        }
      } catch (error) {
        console.error(error);
        if (window.InventoryApp) window.InventoryApp.toast(error.message, 'error');
      }
    };

    if (form) form.addEventListener('submit', async event => {
      event.preventDefault();
      const values = readForm(form);
      const quantity = values.quantity || 0;
      try {
        if (editTarget) {
          const add = values.adjustment_type === 'Remove Stock' ? -quantity : quantity;
          const available = Math.max(0, Number(editTarget.available) + add);
          await API.update('stock', editTarget.id, {
            available,
            warehouse: values.warehouse || editTarget.warehouse,
            product: values.product,
            status: statusOf({ ...editTarget, available })
          });
          if (window.InventoryApp) window.InventoryApp.toast('Stock adjusted.');
        } else {
          const existing = records.find(item => item.product === values.product);
          const add = values.adjustment_type === 'Remove Stock' ? -quantity : quantity;
          if (existing) {
            const available = Math.max(0, Number(existing.available) + add);
            await API.update('stock', existing.id, { available, warehouse: values.warehouse, status: statusOf({ ...existing, available }) });
            if (window.InventoryApp) window.InventoryApp.toast('Stock adjusted.');
          } else {
            const available = Math.max(0, add);
            await API.create('stock', { product: values.product, category: '', available, minimum: 10, warehouse: values.warehouse || 'W1', status: statusOf({ available, minimum: 10 }) });
            if (window.InventoryApp) window.InventoryApp.toast('Stock record created.');
          }
        }
        if (window.InventoryApp) window.InventoryApp.closeModal(stockModal);
        form.reset();
        editTarget = null;
        await load();
      } catch (error) {
        if (window.InventoryApp) window.InventoryApp.toast(error.message, 'error');
      }
    });

    tbody && tbody.addEventListener('click', event => {
      const button = event.target.closest('button.action-btn');
      if (!button) return;
      const row = button.closest('tr');
      const item = records.find(record => record.id === (row && row.dataset.id));
      if (!item) return;
      if (button.dataset.action === 'view') showDetails(item);
      else if (button.dataset.action === 'edit') {
        editTarget = item;
        fillForm(form, item);
        if (window.InventoryApp) window.InventoryApp.openModal(stockModal);
      } else if (button.dataset.action === 'delete') {
        deleteTarget = item;
        if (window.InventoryApp) window.InventoryApp.openModal(deleteModal);
      }
    });

    if (deleteModal) deleteModal.addEventListener('click', async event => {
      const confirmButton = event.target.closest('.danger-btn');
      if (!confirmButton) return;
      if (!deleteTarget) return;
      try {
        await API.remove('stock', deleteTarget.id);
        if (window.InventoryApp) window.InventoryApp.closeModal(deleteModal);
        deleteTarget = null;
        await load();
        if (window.InventoryApp) window.InventoryApp.toast('Stock record deleted.');
      } catch (error) {
        if (window.InventoryApp) window.InventoryApp.toast(error.message, 'error');
      }
    });

    await load();
  });
})();
