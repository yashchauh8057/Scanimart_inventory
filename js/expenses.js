(() => {
  'use strict';

  document.addEventListener('DOMContentLoaded', async () => {
    const { money, text, badge, readForm } = window.InventoryUI;
    const tbody = document.querySelector('.table-card table tbody') || document.querySelector('table tbody');
    const form = document.querySelector('#expenseModal form');
    const expenseModal = document.getElementById('expenseModal');
    const detailModal = document.getElementById('viewExpenseModal');
    const deleteModal = document.getElementById('deleteExpenseModal');
    let records = [];
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
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:24px">No expenses in the database.</td></tr>`;
        return;
      }
      tbody.innerHTML = records.map(expense => `<tr data-id="${text(expense.id)}">
        <td>${text(expense.id)}</td>
        <td>${text(expense.category)}</td>
        <td>${text(expense.description || '')}</td>
        <td>${money(expense.amount || 0)}</td>
        <td>${text(fmtDate(expense.date))}</td>
        <td>${text(expense.method || '')}</td>
        <td><span class="badge ${badge(expense.status)}">${text(expense.status)}</span></td>
        <td>
          <button class="action-btn view" data-action="view" title="View"><i class="fa-solid fa-eye"></i></button>
          <button class="action-btn delete" data-action="delete" title="Delete"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>`).join('');
    };

    const showDetails = expense => {
      if (!detailModal) return;
      detailModal.innerHTML = `<div class="modal-content">
        <div class="modal-header"><h2>Expense Details</h2><button class="close">&times;</button></div>
        <p><strong>ID :</strong> ${text(expense.id)}</p>
        <p><strong>Category :</strong> ${text(expense.category)}</p>
        <p><strong>Description :</strong> ${text(expense.description || '')}</p>
        <p><strong>Amount :</strong> ${money(expense.amount || 0)}</p>
        <p><strong>Date :</strong> ${text(fmtDate(expense.date))}</p>
        <p><strong>Payment :</strong> ${text(expense.method || '')}</p>
        <p><strong>Status :</strong> ${text(expense.status)}</p>
        <div class="modal-footer"><button class="primary-btn">Close</button></div>
      </div>`;
      if (window.InventoryApp) window.InventoryApp.openModal(detailModal);
    };

    const load = async () => {
      try {
        records = await API.list('expenses');
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
        category: values.category,
        description: values.description || '',
        amount: values.amount || 0,
        date: values.date || new Date().toISOString().slice(0, 10),
        method: values.payment_method,
        status: 'Paid'
      };
      try {
        await API.create('expenses', payload);
        if (window.InventoryApp) window.InventoryApp.closeModal(expenseModal);
        form.reset();
        await load();
        if (window.InventoryApp) window.InventoryApp.toast('Expense saved.');
      } catch (error) {
        if (window.InventoryApp) window.InventoryApp.toast(error.message, 'error');
      }
    });

    tbody && tbody.addEventListener('click', event => {
      const button = event.target.closest('button.action-btn');
      if (!button) return;
      const row = button.closest('tr');
      const expense = records.find(record => record.id === (row && row.dataset.id));
      if (!expense) return;
      if (button.dataset.action === 'view') showDetails(expense);
      else if (button.dataset.action === 'delete') {
        deleteTarget = expense;
        if (window.InventoryApp) window.InventoryApp.openModal(deleteModal);
      }
    });

    if (deleteModal) deleteModal.addEventListener('click', async event => {
      const confirmButton = event.target.closest('.danger-btn');
      if (!confirmButton) return;
      if (!deleteTarget) return;
      try {
        await API.remove('expenses', deleteTarget.id);
        if (window.InventoryApp) window.InventoryApp.closeModal(deleteModal);
        deleteTarget = null;
        await load();
        if (window.InventoryApp) window.InventoryApp.toast('Expense deleted.');
      } catch (error) {
        if (window.InventoryApp) window.InventoryApp.toast(error.message, 'error');
      }
    });

    await load();
  });
})();
