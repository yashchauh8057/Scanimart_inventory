(() => {
  'use strict';

  document.addEventListener('DOMContentLoaded', async () => {
    const { text, badge, readForm } = window.InventoryUI;
    const tbody = document.querySelector('.table-card table tbody') || document.querySelector('table tbody');
    const addForm = document.querySelector('#addUserModal form');
    const addModal = document.getElementById('addUserModal');
    const detailModal = document.getElementById('userModal');
    const deleteModal = document.getElementById('deleteUserModal');
    let records = [];
    let deleteTarget = null;

    if (addForm) addForm.dataset.pageManaged = 'true';
    if (deleteModal) deleteModal.dataset.pageManaged = 'true';

    const render = () => {
      if (!tbody) return;
      if (!records.length) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:24px">No users in the database.</td></tr>`;
        return;
      }
      tbody.innerHTML = records.map(user => `<tr data-id="${text(user.id)}">
        <td>${text(user.id)}</td>
        <td>${text(user.name)}</td>
        <td>${text(user.email)}</td>
        <td>${text(user.role)}</td>
        <td><span class="badge ${badge(user.status)}">${text(user.status)}</span></td>
        <td>${text(user.lastLogin || '')}</td>
        <td>
          <button class="action-btn view" data-action="view" title="View"><i class="fa-solid fa-eye"></i></button>
          <button class="action-btn delete" data-action="delete" title="Delete"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>`).join('');
    };

    const showDetails = user => {
      if (!detailModal) return;
      const profile = detailModal.querySelector('.customer-profile');
      if (!profile) return;
      profile.innerHTML = `
        <img src="../assets/images/user.png" class="profile-image" alt="">
        <h3>${text(user.name)}</h3>
        <p>${text(user.email)}</p>
        <p>Role : ${text(user.role)}</p>
        <p>Status : ${text(user.status)}</p>
        <p>Last Login : ${text(user.lastLogin || 'Never')}</p>`;
      if (window.InventoryApp) window.InventoryApp.openModal(detailModal);
    };

    const load = async () => {
      try {
        records = await API.list('users');
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
        name: values.full_name,
        email: values.email,
        phone: values.phone || '',
        role: values.role,
        password: values.password || '',
        status: values.status || 'Active',
        lastLogin: 'Never'
      };
      try {
        await API.create('users', payload);
        if (window.InventoryApp) window.InventoryApp.closeModal(addModal);
        addForm.reset();
        await load();
        if (window.InventoryApp) window.InventoryApp.toast('User saved.');
      } catch (error) {
        if (window.InventoryApp) window.InventoryApp.toast(error.message, 'error');
      }
    });

    tbody && tbody.addEventListener('click', event => {
      const button = event.target.closest('button.action-btn');
      if (!button) return;
      const row = button.closest('tr');
      const user = records.find(record => record.id === (row && row.dataset.id));
      if (!user) return;
      if (button.dataset.action === 'view') showDetails(user);
      else if (button.dataset.action === 'delete') {
        deleteTarget = user;
        if (window.InventoryApp) window.InventoryApp.openModal(deleteModal);
      }
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
        if (window.InventoryApp) window.InventoryApp.toast('User deleted.');
      } catch (error) {
        if (window.InventoryApp) window.InventoryApp.toast(error.message, 'error');
      }
    });

    await load();
  });
})();
