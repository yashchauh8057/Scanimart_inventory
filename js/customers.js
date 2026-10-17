(() => {
  'use strict';

  document.addEventListener('DOMContentLoaded', async () => {
    const { money, text, badge, readForm, fillForm } = window.InventoryUI;
    const tbody = document.querySelector('.table-card table tbody') || document.querySelector('table tbody');
    const addForm = document.querySelector('#addCustomerModal form');
    const editForm = document.querySelector('#editCustomerModal form');
    const editModal = document.getElementById('editCustomerModal');
    const detailModal = document.getElementById('customerModal');
    const deleteModal = document.getElementById('deleteModal');
    const cardNumbers = [...document.querySelectorAll('.cards .card h2')];
    let records = [];
    let editTarget = null;
    let deleteTarget = null;

    if (addForm) addForm.dataset.pageManaged = 'true';
    if (editForm) editForm.dataset.pageManaged = 'true';
    if (deleteModal) deleteModal.dataset.pageManaged = 'true';

    const membershipClass = membership => ({ Premium: 'premium', Gold: 'gold', Silver: 'silver', Regular: 'regular' })[membership] || 'regular';

    const renderStats = () => {
      const active = records.filter(customer => customer.status === 'Active').length;
      const google = records.filter(customer => customer.provider === 'google').length;
      const values = [records.length, active, google, active];
      cardNumbers.forEach((element, index) => { if (element && values[index] !== undefined) element.textContent = values[index].toLocaleString('en-IN'); });
    };

    const render = () => {
      if (!tbody) return;
      if (!records.length) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:24px">No customers in the database.</td></tr>`;
        return;
      }
      tbody.innerHTML = records.map(user => `<tr data-id="${text(user.id)}" data-status="${text(user.status || 'Active')}">
        <td><input type="checkbox"></td>
        <td><div class="user-cell"><img src="../assets/images/user1.jpg" class="avatar" alt=""><div><h4>${text(user.name)}</h4><small>${text(user.id)}</small></div></div></td>
        <td>${text(user.email)}</td>
        <td><span class="badge primary">${text(user.role || 'User')}</span></td>
        <td><span class="badge ${user.provider === 'google' ? 'success' : 'primary'}">${text(user.provider === 'google' ? 'Google' : 'Local')}</span></td>
        <td>${text(user.lastLogin ? new Date(user.lastLogin).toLocaleString('en-IN') : 'Never')}</td>
        <td><span class="badge ${badge(user.status || 'Active')}">${text(user.status || 'Active')}</span></td>
        <td>
          <button class="action-btn view" data-action="view" title="View"><i class="fa-solid fa-eye"></i></button>
          <button class="action-btn edit" data-action="edit" title="Edit"><i class="fa-solid fa-pen"></i></button>
          <button class="action-btn delete" data-action="delete" title="Delete"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>`).join('');
    };

    const showDetails = customer => {
      if (!detailModal) return;
      const profile = detailModal.querySelector('.customer-profile');
      if (!profile) return;
      profile.innerHTML = `
        <img src="../assets/images/user1.jpg" class="profile-image" alt="">
        <h3>${text(customer.name)}</h3>
        <p>${text(customer.email)}</p>
        <p>${text(customer.phone || '')}</p>
        <p>Role : ${text(customer.role || 'User')}</p>
        <p>Provider : ${text(customer.provider === 'google' ? 'Google' : 'Local')}</p>
        <p>Status : ${text(customer.status || 'Active')}</p>`;
    };

    const load = async () => {
      try {
        records = (await API.list('users')).filter(user => String(user.role || '').toLowerCase() === 'user');
        render();
        renderStats();
      } catch (error) {
        console.error(error);
        if (window.InventoryApp) window.InventoryApp.toast(error.message, 'error');
      }
    };

    if (addForm) addForm.addEventListener('submit', async event => {
      event.preventDefault();
      const values = readForm(addForm);
      const payload = {
        name: values.name,
        email: values.email,
        phone: values.phone || '',
        role: values.role || 'User',
        provider: values.provider || 'local',
        status: 'Active'
      };
      try {
        await API.create('users', payload);
        if (window.InventoryApp) window.InventoryApp.closeModal(addForm.closest('.modal'));
        addForm.reset();
        await load();
        if (window.InventoryApp) window.InventoryApp.toast('Customer saved.');
      } catch (error) {
        if (window.InventoryApp) window.InventoryApp.toast(error.message, 'error');
      }
    });

    if (editForm) editForm.addEventListener('submit', async event => {
      event.preventDefault();
      if (!editTarget) return;
      const values = readForm(editForm);
      const payload = { name: values.name, email: values.email, phone: values.phone || '', status: values.status };
      try {
        await API.update('users', editTarget.id, payload);
        if (window.InventoryApp) window.InventoryApp.closeModal(editModal);
        await load();
        if (window.InventoryApp) window.InventoryApp.toast('Customer updated.');
      } catch (error) {
        if (window.InventoryApp) window.InventoryApp.toast(error.message, 'error');
      }
    });

    tbody && tbody.addEventListener('click', event => {
      const button = event.target.closest('button.action-btn');
      if (!button) return;
      const row = button.closest('tr');
      const customer = records.find(record => record.id === (row && row.dataset.id));
      if (!customer) return;
      if (button.dataset.action === 'view') showDetails(customer);
      else if (button.dataset.action === 'edit') {
        editTarget = customer;
        fillForm(editForm, customer);
      } else if (button.dataset.action === 'delete') deleteTarget = customer;
    });

    if (deleteModal) deleteModal.addEventListener('click', async event => {
      const confirmButton = event.target.closest('.danger-btn');
      if (!confirmButton) return;
      if (!deleteTarget) return;
      try {
        await API.remove('users', deleteTarget.id);
        if (window.InventoryApp) window.InventoryApp.closeModal(deleteModal);
        deleteTarget = null;
        await load();
        if (window.InventoryApp) window.InventoryApp.toast('Customer deleted.');
      } catch (error) {
        if (window.InventoryApp) window.InventoryApp.toast(error.message, 'error');
      }
    });

    await load();
  });
})();
