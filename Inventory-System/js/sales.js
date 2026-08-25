(() => {
  'use strict';

  document.addEventListener('DOMContentLoaded', async () => {
    const { money, text, badge, readForm, fillForm } = window.InventoryUI;
    const tbody = document.querySelector('.table-card table tbody') || document.querySelector('table tbody');
    const form = document.querySelector('#saleModal form');
    const saleModal = document.getElementById('saleModal');
    const invoiceModal = document.getElementById('invoiceModal');
    const deleteModal = document.getElementById('deleteSaleModal');
    let records = [];
    let editTarget = null;
    let deleteTarget = null;

    if (form) form.dataset.pageManaged = 'true';
    if (deleteModal) deleteModal.dataset.pageManaged = 'true';

    const fmtDate = date => {
      if (!date) return '';
      const d = new Date(date);
      return isNaN(d) ? date : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const render = () => {
      if (!tbody) return;
      if (!records.length) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:24px">No sales in the database.</td></tr>`;
        return;
      }
      tbody.innerHTML = records.map((sale, index) => `<tr data-id="${text(sale.id)}">
        <td>${index + 1}</td>
        <td>${text(sale.invoice || sale.id)}</td>
        <td>${text(sale.customer)}</td>
        <td>${text(fmtDate(sale.date))}</td>
        <td>${text(sale.items || 0)}</td>
        <td>${money(sale.total || 0)}</td>
        <td><span class="badge ${badge(sale.payment)}">${text(sale.payment)}</span></td>
        <td>
          <button class="action-btn view" data-action="view" title="View"><i class="fa-solid fa-eye"></i></button>
          <button class="action-btn edit" data-action="edit" title="Edit"><i class="fa-solid fa-pen"></i></button>
          <button class="action-btn delete" data-action="delete" title="Delete"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>`).join('');
    };

    const showInvoice = sale => {
      if (!invoiceModal) return;
      const box = invoiceModal.querySelector('.invoice-box');
      if (!box) return;
      box.innerHTML = `
        <p><strong>Invoice:</strong> ${text(sale.invoice || sale.id)}</p>
        <p><strong>Customer:</strong> ${text(sale.customer)}</p>
        <p><strong>Date:</strong> ${text(fmtDate(sale.date))}</p>
        <p><strong>Total:</strong> ${money(sale.total || 0)}</p>
        <p><strong>Status:</strong> ${text(sale.payment)}</p>`;
      if (window.InventoryApp) window.InventoryApp.openModal(invoiceModal);
    };

    const load = async () => {
      try {
        records = await API.list('sales');
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
        invoice: values.invoice_no || editTarget?.id,
        customer: values.customer,
        date: values.date || new Date().toISOString().slice(0, 10),
        payment: values.payment,
        remarks: values.remarks || ''
      };
      try {
        if (editTarget) {
          await API.update('sales', editTarget.id, payload);
          if (window.InventoryApp) window.InventoryApp.toast('Sale updated.');
        } else {
          await API.create('sales', payload);
          if (window.InventoryApp) window.InventoryApp.toast('Sale saved.');
        }
        if (window.InventoryApp) window.InventoryApp.closeModal(saleModal);
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
      const sale = records.find(record => record.id === (row && row.dataset.id));
      if (!sale) return;
      if (button.dataset.action === 'view') showInvoice(sale);
      else if (button.dataset.action === 'edit') {
        editTarget = sale;
        fillForm(form, sale);
        if (window.InventoryApp) window.InventoryApp.openModal(saleModal);
      } else if (button.dataset.action === 'delete') {
        deleteTarget = sale;
        if (window.InventoryApp) window.InventoryApp.openModal(deleteModal);
      }
    });

    if (deleteModal) deleteModal.addEventListener('click', async event => {
      const confirmButton = event.target.closest('.danger-btn');
      if (!confirmButton) return;
      if (!deleteTarget) return;
      try {
        await API.remove('sales', deleteTarget.id);
        if (window.InventoryApp) window.InventoryApp.closeModal(deleteModal);
        deleteTarget = null;
        await load();
        if (window.InventoryApp) window.InventoryApp.toast('Sale deleted.');
      } catch (error) {
        if (window.InventoryApp) window.InventoryApp.toast(error.message, 'error');
      }
    });

    await load();
  });
})();
