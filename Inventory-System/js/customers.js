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
      const premium = records.filter(customer => customer.membership === 'Premium').length;
      const values = [records.length, active, active, premium];
      cardNumbers.forEach((element, index) => { if (element && values[index] !== undefined) element.textContent = values[index].toLocaleString('en-IN'); });
    };

    const render = () => {
      if (!tbody) return;
      if (!records.length) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:24px">No customers in the database.</td></tr>`;
        return;
      }
      tbody.innerHTML = records.map(customer => `<tr data-id="${text(customer.id)}" data-status="${text(customer.status)}">
        <td><input type="checkbox"></td>
        <td><div class="user-cell"><img src="../assets/images/user1.jpg" class="avatar" alt=""><div><h4>${text(customer.name)}</h4><small>${text(customer.id)}</small></div></div></td>
        <td>${text(customer.email)}</td>
        <td>${text(customer.phone)}</td>
        <td><span class="badge ${membershipClass(customer.membership)}">${text(customer.membership || 'Regular')}</span></td>
        <td>${text(customer.orders || 0)}</td>
        <td>${money(customer.totalPurchase || 0)}</td>
        <td><span class="badge ${badge(customer.status)}">${text(customer.status)}</span></td>
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
        <p>Total Orders : ${text(customer.orders || 0)}</p>
        <p>Total Purchase : ${money(customer.totalPurchase || 0)}</p>
        <p>Membership : ${text(customer.membership || 'Regular')}</p>`;
    };

    const load = async () => {
      try {
        records = await API.list('customers');
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
        phone: values.phone,
        membership: values.membership || 'Regular',
        address: values.address || '',
        orders: 0,
        totalPurchase: 0,
        status: 'Active'
      };
      try {
        await API.create('customers', payload);
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
      const payload = { name: values.name, email: values.email, phone: values.phone, status: values.status };
      try {
        await API.update('customers', editTarget.id, payload);
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
        await API.remove('customers', deleteTarget.id);
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
