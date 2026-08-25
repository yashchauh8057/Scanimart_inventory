(() => {
  'use strict';

  document.addEventListener('DOMContentLoaded', async () => {
    const { money, text, badge, readForm, fillForm } = window.InventoryUI;
    const tbody = document.querySelector('.table-card table tbody') || document.querySelector('table tbody');
    const form = document.querySelector('#purchaseModal form');
    const modal = document.getElementById('purchaseModal');
    let records = [];
    let editTarget = null;

    if (form) form.dataset.pageManaged = 'true';

    const fmtDate = date => {
      if (!date) return '';
      const d = new Date(date);
      return isNaN(d) ? date : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const render = () => {
      if (!tbody) return;
      if (!records.length) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:24px">No purchases in the database.</td></tr>`;
        return;
      }
      tbody.innerHTML = records.map((purchase, index) => `<tr data-id="${text(purchase.id)}">
        <td>${index + 1}</td>
        <td>${text(purchase.invoice || purchase.id)}</td>
        <td>${text(purchase.supplier)}</td>
        <td>${text(fmtDate(purchase.date))}</td>
        <td>${text(purchase.items || 0)}</td>
        <td>${money(purchase.total || 0)}</td>
        <td><span class="badge ${badge(purchase.payment)}">${text(purchase.payment)}</span></td>
        <td><span class="badge ${badge(purchase.status)}">${text(purchase.status)}</span></td>
        <td>
          <button class="action-btn view" data-action="view" title="View"><i class="fa-solid fa-eye"></i></button>
          <button class="action-btn edit" data-action="edit" title="Edit"><i class="fa-solid fa-pen"></i></button>
          <button class="action-btn delete" data-action="delete" title="Delete"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>`).join('');
    };

    const load = async () => {
      try {
        records = await API.list('purchases');
        render();
      } catch (error) {
        console.error(error);
        if (window.InventoryApp) window.InventoryApp.toast(error.message, 'error');
      }
    };

    if (form) form.addEventListener('submit', async event => {
      event.preventDefault();
      const values = readForm(form);
      const payload = {
        invoice: values.invoice || editTarget?.id,
        supplier: values.supplier,
        date: values.date || new Date().toISOString().slice(0, 10),
        payment: values.payment,
        remarks: values.remarks || ''
      };
      try {
        if (editTarget) {
          await API.update('purchases', editTarget.id, payload);
          if (window.InventoryApp) window.InventoryApp.toast('Purchase updated.');
        } else {
          await API.create('purchases', payload);
          if (window.InventoryApp) window.InventoryApp.toast('Purchase saved.');
        }
        if (window.InventoryApp) window.InventoryApp.closeModal(modal);
        form.reset();
        editTarget = null;
        await load();
      } catch (error) {
        if (window.InventoryApp) window.InventoryApp.toast(error.message, 'error');
      }
    });

    tbody && tbody.addEventListener('click', async event => {
      const button = event.target.closest('button.action-btn');
      if (!button) return;
      const row = button.closest('tr');
      const purchase = records.find(record => record.id === (row && row.dataset.id));
      if (!purchase) return;
      if (button.dataset.action === 'edit') {
        editTarget = purchase;
        fillForm(form, purchase);
        if (window.InventoryApp) window.InventoryApp.openModal(modal);
      } else if (button.dataset.action === 'delete') {
        const confirmed = window.confirm(`Delete purchase ${purchase.invoice || purchase.id}?`);
        if (!confirmed) return;
        try {
          await API.remove('purchases', purchase.id);
          await load();
          if (window.InventoryApp) window.InventoryApp.toast('Purchase deleted.');
        } catch (error) {
          if (window.InventoryApp) window.InventoryApp.toast(error.message, 'error');
        }
      } else if (button.dataset.action === 'view') {
        if (window.InventoryApp) window.InventoryApp.toast(`PO ${purchase.invoice || purchase.id} · Total ${money(purchase.total || 0)}`, 'info');
      }
    });

    await load();
  });
})();
