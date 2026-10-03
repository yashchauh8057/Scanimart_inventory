(() => {
  'use strict';

  document.addEventListener('DOMContentLoaded', async () => {
    const { text, badge, readForm, fillForm } = window.InventoryUI;
    const tbody = document.querySelector('.table-card table tbody') || document.querySelector('table tbody');
    const addForm = document.querySelector('#addCategoryModal form');
    const editForm = document.querySelector('#editCategoryModal form');
    const editModal = document.getElementById('editCategoryModal');
    const deleteModal = document.getElementById('deleteCategoryModal');
    let records = [];
    let productCounts = {};
    let editTarget = null;
    let deleteTarget = null;

    if (addForm) addForm.dataset.pageManaged = 'true';
    if (editForm) editForm.dataset.pageManaged = 'true';
    if (deleteModal) deleteModal.dataset.pageManaged = 'true';

    const render = () => {
      if (!tbody) return;
      if (!records.length) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px">No categories in the database.</td></tr>`;
        return;
      }
      tbody.innerHTML = records.map(category => {
        const count = Number(productCounts[category.name] || 0);
        return `<tr data-id="${text(category.id)}" data-status="${text(category.status)}">
          <td>${text(category.id)}</td>
          <td>${text(category.name)}</td>
          <td>${text(category.description || '')}</td>
          <td>${count}</td>
          <td><span class="badge ${badge(category.status)}">${text(category.status)}</span></td>
          <td>
            <button class="action-btn view" data-action="view" title="View"><i class="fa-solid fa-eye"></i></button>
            <button class="action-btn edit" data-action="edit" title="Edit"><i class="fa-solid fa-pen"></i></button>
            <button class="action-btn delete" data-action="delete" title="Delete"><i class="fa-solid fa-trash"></i></button>
          </td>
        </tr>`;
      }).join('');
    };

    const load = async () => {
      try {
        records = await API.list('categories');
        const products = await API.list('products');
        productCounts = products.reduce((map, product) => {
          if (product.category) map[product.category] = (map[product.category] || 0) + 1;
          return map;
        }, {});
        render();
      } catch (error) {
        console.error(error);
        if (window.InventoryApp) window.InventoryApp.toast(error.message, 'error');
      }
    };

    if (addForm) addForm.addEventListener('submit', async event => {
      event.preventDefault();
      const values = readForm(addForm);
      const payload = { name: values.category_name, status: values.status || 'Active', description: values.description || '' };
      try {
        await API.create('categories', payload);
        if (window.InventoryApp) window.InventoryApp.closeModal(addForm.closest('.modal'));
        addForm.reset();
        await load();
        if (window.InventoryApp) window.InventoryApp.toast('Category saved.');
      } catch (error) {
        if (window.InventoryApp) window.InventoryApp.toast(error.message, 'error');
      }
    });

    if (editForm) editForm.addEventListener('submit', async event => {
      event.preventDefault();
      if (!editTarget) return;
      const values = readForm(editForm);
      const payload = { name: values.category_name, status: values.status, description: values.description || '' };
      try {
        await API.update('categories', editTarget.id, payload);
        if (window.InventoryApp) window.InventoryApp.closeModal(editModal);
        await load();
        if (window.InventoryApp) window.InventoryApp.toast('Category updated.');
      } catch (error) {
        if (window.InventoryApp) window.InventoryApp.toast(error.message, 'error');
      }
    });

    tbody && tbody.addEventListener('click', event => {
      const button = event.target.closest('button.action-btn');
      if (!button) return;
      const row = button.closest('tr');
      const category = records.find(record => record.id === (row && row.dataset.id));
      if (!category) return;
      if (button.dataset.action === 'edit') {
        editTarget = category;
        fillForm(editForm, category);
      } else if (button.dataset.action === 'delete') {
        deleteTarget = category;
      }
    });

    if (deleteModal) deleteModal.addEventListener('click', async event => {
      const confirmButton = event.target.closest('.danger-btn');
      if (!confirmButton) return;
      if (!deleteTarget) return;
      try {
        await API.remove('categories', deleteTarget.id);
        if (window.InventoryApp) window.InventoryApp.closeModal(deleteModal);
        deleteTarget = null;
        await load();
        if (window.InventoryApp) window.InventoryApp.toast('Category deleted.');
      } catch (error) {
        if (window.InventoryApp) window.InventoryApp.toast(error.message, 'error');
      }
    });

    await load();
  });
})();
