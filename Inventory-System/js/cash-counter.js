(() => {
  'use strict';

  document.addEventListener('DOMContentLoaded', async () => {
    const session = window.AppAuth.requireRole(['staff', 'admin']);
    if (!session) return;
    const { money } = window.InventoryUI;

    const elements = {
      userName: document.getElementById('userName'),
      logoutBtn: document.getElementById('logoutBtn'),
      codeInput: document.getElementById('codeInput'),
      lookupBtn: document.getElementById('lookupBtn'),
      receiptCard: document.getElementById('receiptCard'),
      receiptId: document.getElementById('receiptId'),
      receiptStatus: document.getElementById('receiptStatus'),
      receiptCustomer: document.getElementById('receiptCustomer'),
      receiptDate: document.getElementById('receiptDate'),
      receiptItems: document.getElementById('receiptItems'),
      receiptSubtotal: document.getElementById('receiptSubtotal'),
      receiptTax: document.getElementById('receiptTax'),
      receiptTotal: document.getElementById('receiptTotal'),
      confirmBtn: document.getElementById('confirmBtn'),
      successState: document.getElementById('successState'),
      successReceiptId: document.getElementById('successReceiptId'),
      nextBtn: document.getElementById('nextBtn')
    };

    let current = null;

    elements.userName.textContent = session.user;

    const toast = (message, type = 'error') => {
      const holder = document.createElement('div');
      holder.className = `toast ${type}`;
      holder.textContent = message;
      document.body.append(holder);
      setTimeout(() => holder.remove(), 2600);
    };

    const fmtDate = date => {
      if (!date) return '';
      const d = new Date(date);
      return isNaN(d) ? date : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const reset = async () => {
      current = null;
      elements.receiptCard.hidden = true;
      elements.successState.hidden = true;
      elements.codeInput.value = '';
      try {
        await window.StoreScanner.start('qrReader', handleScan, () => {});
      } catch { /* camera unavailable - manual entry only */ }
    };

    const handleScan = payload => {
      const parsed = window.StoreScanner.parse(payload);
      const id = parsed ? parsed.receiptId : payload.trim().toUpperCase();
      if (id) showReceipt(id);
    };

    const showReceipt = async id => {
      try {
        const receipt = await API.storeReceipt(id);
        current = receipt;
        elements.receiptId.textContent = receipt.id;
        elements.receiptCustomer.textContent = `Customer: ${receipt.user}${receipt.userEmail ? ' · ' + receipt.userEmail : ''}`;
        elements.receiptDate.textContent = fmtDate(receipt.createdAt);
        elements.receiptItems.innerHTML = receipt.items.map(item =>
          `<li><span>${item.qty} × ${item.name}</span><span>${money(item.price * item.qty)}</span></li>`).join('');
        elements.receiptSubtotal.textContent = money(receipt.subtotal || 0);
        elements.receiptTax.textContent = money(receipt.tax || 0);
        elements.receiptTotal.textContent = money(receipt.total || 0);

        const paid = receipt.paymentStatus === 'paid';
        elements.receiptStatus.textContent = paid ? 'Paid' : 'Pending';
        elements.receiptStatus.className = 'qr-status ' + (paid ? 'done' : 'waiting');
        elements.confirmBtn.hidden = paid;
        elements.receiptCard.hidden = false;
        elements.successState.hidden = !paid;
        if (paid) elements.successReceiptId.textContent = receipt.id;
      } catch (error) {
        toast(error.message || 'Receipt not found', 'error');
      }
    };

    elements.lookupBtn.addEventListener('click', () => {
      const id = elements.codeInput.value.trim().toUpperCase();
      if (id) showReceipt(id);
    });
    elements.codeInput.addEventListener('keydown', event => {
      if (event.key === 'Enter') elements.lookupBtn.click();
    });

    elements.confirmBtn.addEventListener('click', async () => {
      if (!current) return;
      elements.confirmBtn.disabled = true;
      try {
        const updated = await API.storeCollectCash(current.id);
        current = updated;
        elements.successState.hidden = false;
        elements.receiptCard.hidden = true;
        elements.successReceiptId.textContent = updated.id;
        toast('Payment marked as done.', 'success');
      } catch (error) {
        toast(error.message, 'error');
      } finally {
        elements.confirmBtn.disabled = false;
      }
    });

    elements.nextBtn.addEventListener('click', reset);
    elements.logoutBtn.addEventListener('click', () => window.AppAuth.logout());

    await reset();
  });
})();
