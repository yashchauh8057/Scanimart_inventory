(() => {
  'use strict';

  document.addEventListener('DOMContentLoaded', async () => {
    const session = window.AppAuth.requireRole(['security', 'admin']);
    if (!session) return;

    const elements = {
      userName: document.getElementById('userName'),
      logoutBtn: document.getElementById('logoutBtn'),
      codeInput: document.getElementById('codeInput'),
      lookupBtn: document.getElementById('lookupBtn'),
      allowedState: document.getElementById('allowedState'),
      allowedReceiptId: document.getElementById('allowedReceiptId'),
      blockedState: document.getElementById('blockedState'),
      blockedReason: document.getElementById('blockedReason'),
      nextBtn: document.getElementById('nextBtn'),
      nextBtn2: document.getElementById('nextBtn2')
    };

    elements.userName.textContent = session.user;

    const toast = (message, type = 'error') => {
      const holder = document.createElement('div');
      holder.className = `toast ${type}`;
      holder.textContent = message;
      document.body.append(holder);
      setTimeout(() => holder.remove(), 2600);
    };

    const reset = async () => {
      elements.allowedState.hidden = true;
      elements.blockedState.hidden = true;
      elements.codeInput.value = '';
      try {
        await window.StoreScanner.start('qrReader', handleScan, () => {});
      } catch { /* camera unavailable - manual entry only */ }
    };

    const handleScan = payload => {
      const parsed = window.StoreScanner.parse(payload);
      const id = parsed ? parsed.receiptId : payload.trim().toUpperCase();
      if (id) verify(id);
    };

    const verify = async id => {
      try {
        const result = await API.storeVerifyExit(id);
        if (result.allowed) {
          elements.allowedReceiptId.textContent = result.receipt.id;
          elements.allowedState.hidden = false;
          elements.blockedState.hidden = true;
        } else {
          elements.blockedReason.textContent = `Receipt ${result.receipt.id} is not paid. Payment status: ${result.receipt.paymentStatus}. Escort to the cash counter.`;
          elements.blockedState.hidden = false;
          elements.allowedState.hidden = true;
        }
      } catch (error) {
        elements.blockedReason.textContent = error.message || 'Receipt not found.';
        elements.blockedState.hidden = false;
        elements.allowedState.hidden = true;
      }
    };

    elements.lookupBtn.addEventListener('click', () => {
      const id = elements.codeInput.value.trim().toUpperCase();
      if (id) verify(id);
    });
    elements.codeInput.addEventListener('keydown', event => {
      if (event.key === 'Enter') elements.lookupBtn.click();
    });

    elements.nextBtn.addEventListener('click', reset);
    elements.nextBtn2.addEventListener('click', reset);
    elements.logoutBtn.addEventListener('click', () => window.AppAuth.logout());

    await reset();
  });
})();
