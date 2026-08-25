(() => {
  'use strict';

  document.addEventListener('DOMContentLoaded', async () => {
    const { money, text, badge, readForm, fillForm } = window.InventoryUI;
    const tbody = document.querySelector('.table-card table tbody') || document.querySelector('table tbody');
    const addForm = document.querySelector('#addProductModal form');
    const editForm = document.querySelector('#editProductModal form');
    const editModal = document.getElementById('editProductModal');
    const deleteModal = document.getElementById('deleteModal');
    const qrModal = document.getElementById('qrModal');
    const qrTarget = document.getElementById('qrcode');
    const qrName = qrModal && qrModal.querySelector('h3');
    const qrSku = qrModal && qrModal.querySelector('p');
    const categoryFilter = document.querySelector('.filter-container select');
    let records = [];
    let editTarget = null;
    let deleteTarget = null;

    if (addForm) addForm.dataset.pageManaged = 'true';
    if (editForm) editForm.dataset.pageManaged = 'true';
    if (deleteModal) deleteModal.dataset.pageManaged = 'true';

    const statusOf = product => {
      const stock = Number(product.stock);
      if (stock <= 0) return 'Out Of Stock';
      if (stock <= Number(product.reorderLevel || 10)) return 'Low Stock';
      return product.status === 'Inactive' ? 'Inactive' : 'Active';
    };

    const render = () => {
      if (!tbody) return;
      if (!records.length) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:24px">No products in the database.</td></tr>`;
        return;
      }
      tbody.innerHTML = records.map(product => {
        const status = statusOf(product);
        return `<tr data-id="${text(product.id)}" data-category="${text(product.category || '')}" data-status="${text(status)}">
          <td><input type="checkbox"></td>
          <td><img src="../assets/images/laptop.png" class="product-img" alt=""></td>
          <td>${text(product.name)}</td>
          <td>${text(product.sku || product.id)}</td>
          <td>${text(product.category)}</td>
          <td>${money(product.price)}</td>
          <td>${text(product.stock)}</td>
          <td><span class="badge ${badge(status)}">${text(status)}</span></td>
          <td>
            <button class="action-btn view" data-action="view" title="View"><i class="fa-solid fa-eye"></i></button>
            <button class="action-btn edit" data-action="edit" title="Edit"><i class="fa-solid fa-pen"></i></button>
            <button class="action-btn qr" data-action="qr" title="QR"><i class="fa-solid fa-qrcode"></i></button>
            <button class="action-btn delete" data-action="delete" title="Delete"><i class="fa-solid fa-trash"></i></button>
          </td>
        </tr>`;
      }).join('');
    };

    const load = async () => {
      try {
        records = await API.list('products');
        render();
        const categories = [...new Set(records.map(product => product.category).filter(Boolean))];
        if (categoryFilter) {
          categoryFilter.innerHTML = '<option value="">All Categories</option>' + categories.map(category => `<option>${text(category)}</option>`).join('');
          categoryFilter.onchange = () => {
            const value = categoryFilter.value;
            [...tbody.querySelectorAll('tr')].forEach(row => {
              row.hidden = value && row.dataset.category !== value;
            });
          };
        }
      } catch (error) {
        console.error(error);
        if (window.InventoryApp) window.InventoryApp.toast(error.message, 'error');
      }
    };

    if (addForm) addForm.addEventListener('submit', async event => {
      event.preventDefault();
      const values = readForm(addForm);
      const payload = {
        name: values.product_name,
        sku: values.sku || values.product_name.toUpperCase().replace(/\s+/g, '_'),
        category: values.category,
        price: values.price || 0,
        stock: values.stock || 0,
        status: values.status || 'Active',
        description: values.description || '',
        reorderLevel: 10
      };
      try {
        await API.create('products', payload);
        if (window.InventoryApp) window.InventoryApp.closeModal(addForm.closest('.modal'));
        addForm.reset();
        await load();
        if (window.InventoryApp) window.InventoryApp.toast('Product saved.');
      } catch (error) {
        if (window.InventoryApp) window.InventoryApp.toast(error.message, 'error');
      }
    });

    if (editForm) editForm.addEventListener('submit', async event => {
      event.preventDefault();
      if (!editTarget) return;
      const values = readForm(editForm);
      const payload = {
        name: values.product_name,
        sku: values.sku,
        price: values.price || 0,
        stock: values.stock || 0
      };
      try {
        await API.update('products', editTarget.id, payload);
        if (window.InventoryApp) window.InventoryApp.closeModal(editModal);
        await load();
        if (window.InventoryApp) window.InventoryApp.toast('Product updated.');
      } catch (error) {
        if (window.InventoryApp) window.InventoryApp.toast(error.message, 'error');
      }
    });

    tbody && tbody.addEventListener('click', event => {
      const button = event.target.closest('button.action-btn');
      if (!button) return;
      const row = button.closest('tr');
      const product = records.find(record => record.id === (row && row.dataset.id));
      if (!product) return;
      if (button.dataset.action === 'edit') {
        editTarget = product;
        fillForm(editForm, product);
      } else if (button.dataset.action === 'qr') {
        if (qrName) qrName.textContent = product.name;
        if (qrSku) qrSku.textContent = `SKU : ${product.sku || product.id}`;
        if (window.InventoryQR && qrTarget) window.InventoryQR(qrTarget, `${product.sku || product.id}|${product.name}`);
      } else if (button.dataset.action === 'delete') {
        deleteTarget = product;
      }
    });

    if (deleteModal) deleteModal.addEventListener('click', async event => {
      const confirmButton = event.target.closest('.danger-btn');
      if (!confirmButton) return;
      if (!deleteTarget) return;
      try {
        await API.remove('products', deleteTarget.id);
        if (window.InventoryApp) window.InventoryApp.closeModal(deleteModal);
        deleteTarget = null;
        await load();
        if (window.InventoryApp) window.InventoryApp.toast('Product deleted.');
      } catch (error) {
        if (window.InventoryApp) window.InventoryApp.toast(error.message, 'error');
      }
    });

    await load();
  });
})();
