(() => {
  'use strict';

  document.addEventListener('DOMContentLoaded', async () => {
    const { text, badge, readForm, fillForm } = window.InventoryUI;
    const tbody = document.querySelector('.table-card table tbody') || document.querySelector('table tbody');
    const addForm = document.querySelector('#addSupplierModal form');
    const editForm = document.querySelector('#editSupplierModal form');
    const editModal = document.getElementById('editSupplierModal');
    const detailModal = document.getElementById('supplierModal');
    const deleteModal = document.getElementById('deleteSupplierModal');
    const cardNumbers = [...document.querySelectorAll('.cards .card h2')];
    let records = [];
    let editTarget = null;
    let deleteTarget = null;

    if (addForm) addForm.dataset.pageManaged = 'true';
    if (editForm) editForm.dataset.pageManaged = 'true';
    if (deleteModal) deleteModal.dataset.pageManaged = 'true';

    const render = () => {
      if (!tbody) return;
      if (!records.length) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:24px">No suppliers in the database.</td></tr>`;
        return;
      }
      tbody.innerHTML = records.map(supplier => `<tr data-id="${text(supplier.id)}" data-status="${text(supplier.status)}" data-city="${text(supplier.city || '')}">
        <td><input type="checkbox"></td>
        <td>${text(supplier.name)}</td>
        <td>${text(supplier.company || '')}</td>
        <td>${text(supplier.email)}</td>
        <td>${text(supplier.phone)}</td>
        <td>${text(supplier.city || '')}</td>
        <td>${text(supplier.orders || 0)}</td>
        <td><span class="badge ${badge(supplier.status)}">${text(supplier.status)}</span></td>
        <td>
          <button class="action-btn view" data-action="view" title="View"><i class="fa-solid fa-eye"></i></button>
          <button class="action-btn edit" data-action="edit" title="Edit"><i class="fa-solid fa-pen"></i></button>
          <button class="action-btn delete" data-action="delete" title="Delete"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>`).join('');
      if (cardNumbers[0]) cardNumbers[0].textContent = records.length.toLocaleString('en-IN');
    };

    const showDetails = supplier => {
      if (!detailModal) return;
      const profile = detailModal.querySelector('.customer-profile');
      if (!profile) return;
      profile.innerHTML = `
        <img src="../assets/images/user.png" class="profile-image" alt="">
        <h3>${text(supplier.name)}</h3>
        <p>${text(supplier.company || '')}</p>
        <p>${text(supplier.email)}</p>
        <p>${text(supplier.phone || '')}</p>
        <p>${text(supplier.city || '')}</p>
        <p>Total Orders : ${text(supplier.orders || 0)}</p>
        <p>Status : ${text(supplier.status)}</p>`;
    };

    const load = async () => {
      try {
        records = await API.list('suppliers');
        render();
      } catch (error) {
        console.error(error);
        if (window.InventoryApp) window.InventoryApp.toast(error.message, 'error');
      }
    };

    if (addForm) addForm.addEventListener('submit', async event => {
      event.preventDefault();
      const values = readForm(addForm);
      const payload = {
        name: values.supplier_name,
        company: values.company,
        email: values.email,
        phone: values.phone,
        city: values.city,
        status: values.status || 'Active',
        address: values.address || '',
        orders: 0
      };
      try {
        await API.create('suppliers', payload);
        if (window.InventoryApp) window.InventoryApp.closeModal(addForm.closest('.modal'));
        addForm.reset();
        await load();
        if (window.InventoryApp) window.InventoryApp.toast('Supplier saved.');
      } catch (error) {
        if (window.InventoryApp) window.InventoryApp.toast(error.message, 'error');
      }
    });

    if (editForm) editForm.addEventListener('submit', async event => {
      event.preventDefault();
      if (!editTarget) return;
      const values = readForm(editForm);
      const payload = {
        name: values.supplier,
        company: values.company,
        email: values.email,
        phone: values.phone
      };
      try {
        await API.update('suppliers', editTarget.id, payload);
        if (window.InventoryApp) window.InventoryApp.closeModal(editModal);
        await load();
        if (window.InventoryApp) window.InventoryApp.toast('Supplier updated.');
      } catch (error) {
        if (window.InventoryApp) window.InventoryApp.toast(error.message, 'error');
      }
    });

    tbody && tbody.addEventListener('click', event => {
      const button = event.target.closest('button.action-btn');
      if (!button) return;
      const row = button.closest('tr');
      const supplier = records.find(record => record.id === (row && row.dataset.id));
      if (!supplier) return;
      if (button.dataset.action === 'view') showDetails(supplier);
      else if (button.dataset.action === 'edit') {
        editTarget = supplier;
        fillForm(editForm, supplier);
      } else if (button.dataset.action === 'delete') deleteTarget = supplier;
    });

    if (deleteModal) deleteModal.addEventListener('click', async event => {
      const confirmButton = event.target.closest('.danger-btn');
      if (!confirmButton) return;
      if (!deleteTarget) return;
      try {
        await API.remove('suppliers', deleteTarget.id);
        if (window.InventoryApp) window.InventoryApp.closeModal(deleteModal);
        deleteTarget = null;
        await load();
        if (window.InventoryApp) window.InventoryApp.toast('Supplier deleted.');
      } catch (error) {
        if (window.InventoryApp) window.InventoryApp.toast(error.message, 'error');
      }
    });

    await load();
  });
})();
