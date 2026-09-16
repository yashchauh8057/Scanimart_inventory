(() => {
  'use strict';

  const GST_RATE = 0.05;

  document.addEventListener('DOMContentLoaded', async () => {
    const session = window.AppAuth.requireRole(['user', 'staff', 'security', 'admin']);
    if (!session) return;
    const { money } = window.InventoryUI;

    const $ = id => document.getElementById(id);
    const elements = {
      userName: $('userName'), logoutBtn: $('logoutBtn'), notifBtn: $('notifBtn'), notifDrop: $('notifDrop'),
      tabs: [...document.querySelectorAll('.tab')],
      tabCart: $('tabCart'), tabPayment: $('tabPayment'), tabExit: $('tabExit'),
      searchInput: $('searchInput'), searchDrop: $('searchDrop'), scanBtn: $('scanBtn'),
      chipRow: $('chipRow'), cartList: $('cartList'), cartCount: $('cartCount'),
      sumSubtotal: $('sumSubtotal'), sumSavings: $('sumSavings'), sumGst: $('sumGst'), sumTotal: $('sumTotal'),
      savingsBar: $('savingsBar'), savingsText: $('savingsText'), checkoutBtn: $('checkoutBtn'),
      payCount: $('payCount'), payItems: $('payItems'), paySubtotal: $('paySubtotal'),
      paySavings: $('paySavings'), payGst: $('payGst'), payTotal: $('payTotal'), payBtnAmount: $('payBtnAmount'),
      methodCards: [...document.querySelectorAll('.pay-card')],
      detailUpi: $('detailUpi'), detailCard: $('detailCard'), detailCash: $('detailCash'), detailWallet: $('detailWallet'),
      upiId: $('upiId'), cardNo: $('cardNo'), cardExp: $('cardExp'), cardCvv: $('cardCvv'),
      appChips: [...document.querySelectorAll('.app-chip')], walletItems: [...document.querySelectorAll('.wallet-item')],
      cashWait: $('cashWait'), cashQr: $('cashQr'), cashStatus: $('cashStatus'),
      payBtn: $('payBtn'), methodSection: $('methodSection'), successScreen: $('successScreen'),
      txnId: $('txnId'), getExitBtn: $('getExitBtn'),
      exitQr: $('exitQr'), exitName: $('exitName'), exitSession: $('exitSession'), newSessionBtn: $('newSessionBtn'),
      scanOverlay: $('scanOverlay'), closeScanBtn: $('closeScanBtn')
    };

    let products = [];
    let cart = [];
    let receipt = null;
    let method = 'upi';
    let selectedWallet = 'Paytm';
    let pollTimer = null;

    elements.userName.textContent = session.user;

    /* ---------------- helpers ---------------- */
    const toast = (message, type = 'success') => {
      const holder = document.createElement('div');
      holder.className = `toast ${type}`;
      holder.innerHTML = `${type === 'error' ? '<i class="fa-solid fa-circle-xmark"></i>' : type === 'info' ? '<i class="fa-solid fa-circle-info"></i>' : '<i class="fa-solid fa-circle-check"></i>'} ${message}`;
      document.body.append(holder);
      setTimeout(() => holder.remove(), 2800);
    };

    const linePrices = () => cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const lineSavings = () => cart.reduce((sum, item) => sum + Math.max(0, (item.mrp - item.price)) * item.qty, 0);
    const gstOf = subtotal => Math.round(subtotal * GST_RATE);
    const totalOf = subtotal => subtotal + gstOf(subtotal);
    const discountPct = item => item.mrp > item.price ? Math.round((1 - item.price / item.mrp) * 100) : 0;
    const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[c]);

    const renderQr = (element, value) => {
      if (!element || !window.QRCode) return;
      element.replaceChildren();
      new QRCode(element, { text: value, width: 190, height: 190, correctLevel: QRCode.CorrectLevel.M });
    };

    const showTab = name => {
      elements.tabCart.hidden = name !== 'cart';
      elements.tabPayment.hidden = name !== 'payment';
      elements.tabExit.hidden = name !== 'exit';
      elements.tabs.forEach(tab => tab.classList.toggle('active', tab.dataset.tab === name));
      if (name === 'payment') renderPayment();
      if (name === 'exit' && !receipt) { toast('Complete payment first.', 'info'); showTab('cart'); }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    /* ---------------- tab 1: products & cart ---------------- */
    const renderChips = () => {
      const featured = products.filter(p => p.featured).slice(0, 6);
      if (!featured.length) return;
      elements.chipRow.innerHTML = featured.map(p => `
        <button class="chip" data-sku="${esc(p.sku)}">
          <span class="chip-em">${p.emoji || '🛒'}</span>${esc(p.name.replace(/\s+\d.*$/, ''))}
        </button>`).join('');
    };

    const renderSearch = () => {
      const query = elements.searchInput.value.trim().toLowerCase();
      elements.searchDrop.hidden = !query;
      if (!query) return;
      const matches = products.filter(p =>
        p.name.toLowerCase().includes(query) || String(p.sku).toLowerCase().includes(query) || String(p.brand || '').toLowerCase().includes(query)).slice(0, 6);
      elements.searchDrop.innerHTML = matches.length
        ? matches.map(p => `
          <button class="sd-item" data-sku="${esc(p.sku)}">
            <span class="em">${p.emoji || '🛒'}</span>
            <span>
              <span class="sd-name">${esc(p.name)}</span>
              <span class="sd-sub">${esc(p.brand || '')} · ${esc(p.category || '')}</span>
            </span>
            <span class="sd-price">${money(p.price)}${p.mrp > p.price ? `<small>${money(p.mrp)}</small>` : ''}</span>
          </button>`).join('')
        : `<div class="empty-cart" style="padding:18px;">No products found for "${esc(query)}"</div>`;
    };

    const cartItemRow = (item, index) => `
      <li class="cart-item" data-index="${index}">
        <div class="ci-emoji">${item.emoji || '🛒'}</div>
        <div class="ci-main">
          <div class="ci-name">${esc(item.name)}</div>
          <div class="ci-sub">${esc(item.brand || '')} · ${esc(item.category || '')}</div>
          <div class="ci-badges">
            ${discountPct(item) ? `<span class="disc-badge">${discountPct(item)}% OFF</span>` : ''}
            <span class="cat-chip">${esc(item.category || '')}</span>
          </div>
        </div>
        <div class="ci-side">
          <div class="qty-ctrl">
            <button data-act="dec">−</button><span>${item.qty}</span><button data-act="inc">+</button>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <div>
              <div class="ci-price">${money(item.price * item.qty)}</div>
              ${item.mrp > item.price ? `<div class="ci-mrp">${money(item.mrp * item.qty)}</div>` : ''}
            </div>
            <button class="ci-remove" data-act="remove" title="Remove"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>
      </li>`;

    const renderCart = () => {
      const count = cart.reduce((s, i) => s + i.qty, 0);
      elements.cartCount.textContent = `${count} item${count === 1 ? '' : 's'}`;
      elements.cartList.innerHTML = cart.length
        ? cart.map(cartItemRow).join('')
        : `<li class="empty-cart"><i class="fa-solid fa-cart-shopping"></i><div>Your cart is empty<br><small style="color:var(--muted)">Add products to get started</small></div></li>`;

      const subtotal = linePrices();
      const savings = lineSavings();
      elements.sumSubtotal.textContent = money(subtotal);
      elements.sumSavings.textContent = `- ${money(savings)}`;
      elements.sumGst.textContent = money(gstOf(subtotal));
      elements.sumTotal.textContent = money(totalOf(subtotal));

      if (savings > 0) {
        elements.savingsBar.hidden = false;
        elements.savingsText.textContent = `You save ${money(savings)} today!`;
      } else elements.savingsBar.hidden = true;

      elements.checkoutBtn.disabled = !cart.length;
    };

    const renderPayment = () => {
      elements.payCount.textContent = `${cart.reduce((s, i) => s + i.qty, 0)} item(s)`;
      elements.payItems.innerHTML = cart.map(cartItemRow).join('') || `<li class="empty-cart"><i class="fa-solid fa-cart-shopping"></i>Cart is empty</li>`;
      const subtotal = linePrices();
      elements.paySubtotal.textContent = money(subtotal);
      elements.paySavings.textContent = `- ${money(lineSavings())}`;
      elements.payGst.textContent = money(gstOf(subtotal));
      const total = totalOf(subtotal);
      elements.payTotal.textContent = money(total);
      elements.payBtnAmount.textContent = money(total);
    };

    const addToCart = product => {
      const existing = cart.find(i => i.sku === product.sku);
      if (existing) existing.qty += 1;
      else cart.push({ sku: product.sku, name: product.name, emoji: product.emoji, brand: product.brand, category: product.category, price: Number(product.price) || 0, mrp: Number(product.mrp) || 0, qty: 1 });
      renderCart();
      renderPayment();
    };

    /* ---------------- scanner ---------------- */
    const startScanner = async () => {
      if (!elements.scanOverlay) return;
      elements.scanOverlay.hidden = false;
      try {
        await window.StoreScanner.start('qrReader', async decoded => {
          elements.scanOverlay.hidden = true;
          const rawCode = String(decoded).trim();
          const parsed = window.StoreScanner.parse(rawCode);
          const code = parsed?.type === 'PRODUCT'
            ? parsed.receiptId.trim().toUpperCase()
            : rawCode.toUpperCase();
          let product = products.find(p =>
            String(p.sku || '').toUpperCase() === code ||
            String(p.id || '').toUpperCase() === code ||
            String(p.qrValue || '').toUpperCase() === rawCode.toUpperCase()
          );

          // Refresh from Firebase once if the product was added after POS loaded.
          if (!product) {
            try {
              products = await API.list('products');
              renderChips();
              product = products.find(p => String(p.sku || '').toUpperCase() === code || String(p.id || '').toUpperCase() === code);
            } catch { /* show the not-found message below */ }
          }
          if (product) { addToCart(product); toast(`${product.emoji || ''} ${product.name} added`); }
          else toast(`Product QR "${rawCode}" not found in Firebase`, 'error');
        }, () => {});
      } catch (error) {
        elements.scanOverlay.hidden = true;
        toast(error.message || 'Unable to start camera', 'error');
      }
    };

    /* ---------------- payment ---------------- */
    const selectMethod = name => {
      method = name;
      elements.methodCards.forEach(card => card.classList.toggle('selected', card.dataset.method === name));
      elements.detailUpi.hidden = name !== 'upi';
      elements.detailCard.hidden = name !== 'card';
      elements.detailCash.hidden = name !== 'cash';
      elements.detailWallet.hidden = name !== 'wallet';
      elements.cashWait.hidden = true;
    };

    const renderCashQr = id => {
      elements.cashWait.hidden = false;
      elements.cashStatus.textContent = 'Waiting for staff confirmation...';
      renderQr(elements.cashQr, window.StoreScanner.build('STAFF', id));
      clearInterval(pollTimer);
      pollTimer = setInterval(async () => {
        try {
          const latest = await API.storeReceipt(id);
          if (latest.paymentStatus === 'paid') {
            clearInterval(pollTimer);
            showSuccess(id, `CASH-${id}`);
          }
        } catch { /* keep waiting */ }
      }, 2500);
    };

    const showSuccess = (id, txn) => {
      receipt = id;
      elements.methodSection.hidden = true;
      elements.successScreen.hidden = false;
      elements.txnId.textContent = txn;
    };

    const loadRazorpay = () => new Promise((resolve, reject) => {
      if (window.Razorpay) return resolve(window.Razorpay);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(window.Razorpay);
      script.onerror = () => reject(new Error('Could not load Razorpay SDK'));
      document.head.append(script);
    });

    const razorpayOptions = (key, order, total) => {
      const options = {
        key, order_id: order.orderId, amount: order.amount, currency: order.currency,
        name: 'Scanimart Store', description: `Receipt ${receipt}`,
        prefill: { email: session.email || '', name: session.user || '' }
      };
      if (method === 'upi') options.method = 'upi';
      if (method === 'card') options.method = 'card';
      if (method === 'wallet') options.method = 'wallet';
      return options;
    };

    const startRazorpayFlow = async newReceipt => {
      const key = window.APP_CONFIG && window.APP_CONFIG.razorpay.key;
      if (!key) throw new Error('Razorpay is not configured. Add your Razorpay Key ID in js/app-config.js');
      const order = await API.razorpayOrder(newReceipt);
      const Razorpay = await loadRazorpay();
      return new Promise((resolve, reject) => {
        const instance = new Razorpay(razorpayOptions(key, order, newReceipt.total));
        instance.on('payment.failed', () => reject(new Error('Payment failed. Please try again.')));
        instance.open();
      });
    };

    elements.payBtn.addEventListener('click', async () => {
      if (!cart.length) return toast('Your cart is empty.', 'error');
      if (method === 'upi' && !elements.upiId.value.trim()) return toast('Enter your UPI ID.', 'error');
      if (method === 'card' && (!elements.cardNo.value.trim() || !elements.cardExp.value.trim() || !elements.cardCvv.value.trim())) return toast('Enter your card details.', 'error');

      elements.payBtn.disabled = true;
      elements.payBtn.querySelector('i.fa-lock').classList.add('fa-spin');
      try {
        const items = cart.map(({ sku, qty }) => ({ sku, qty }));
        const isOnline = method !== 'cash';
        const newReceipt = await API.storeCheckout({ items, paymentMethod: isOnline ? 'razorpay' : 'cash', user: session.user, userEmail: session.email });
        receipt = newReceipt.id;

        if (method === 'cash') {
          cart = []; renderCart();
          renderCashQr(receipt);
        } else {
          const verified = await startRazorpayFlow(newReceipt);
          if (!verified) { elements.payBtn.disabled = false; return; }
          cart = []; renderCart();
          showSuccess(receipt, verified.razorpayPaymentId || verified.id);
        }
      } catch (error) {
        toast(error.message || 'Payment failed', 'error');
      } finally {
        elements.payBtn.disabled = false;
        const lock = elements.payBtn.querySelector('i.fa-lock');
        if (lock) lock.classList.remove('fa-spin');
      }
    });

    /* ---------------- exit tab ---------------- */
    const showExit = () => {
      showTab('exit');
      elements.exitName.textContent = session.user;
      elements.exitSession.textContent = `Session ID: ${receipt} · Thank you for your purchase`;
      renderQr(elements.exitQr, window.StoreScanner.build('SECURITY', receipt));
    };

    elements.getExitBtn.addEventListener('click', showExit);

    const startNewSession = () => {
      cart = []; receipt = null;
      clearInterval(pollTimer);
      elements.methodSection.hidden = false;
      elements.successScreen.hidden = true;
      elements.searchInput.value = '';
      elements.searchDrop.hidden = true;
      renderCart(); renderChips(); renderPayment();
      selectMethod('upi');
      showTab('cart');
      toast('New session started. Happy shopping!', 'info');
    };

    /* ---------------- events ---------------- */
    elements.tabs.forEach(tab => tab.addEventListener('click', () => {
      const name = tab.dataset.tab;
      if (name === 'payment' && !cart.length && !receipt) return toast('Add products to your cart first.', 'info');
      showTab(name);
    }));

    elements.searchInput.addEventListener('input', renderSearch);
    elements.searchDrop.addEventListener('click', event => {
      const item = event.target.closest('.sd-item');
      if (!item) return;
      const product = products.find(p => p.sku === item.dataset.sku);
      if (product) { addToCart(product); toast(`${product.emoji || ''} ${product.name} added`); }
      elements.searchInput.value = '';
      renderSearch();
    });

    elements.chipRow.addEventListener('click', event => {
      const chip = event.target.closest('.chip');
      if (!chip) return;
      const product = products.find(p => p.sku === chip.dataset.sku);
      if (product) addToCart(product);
    });

    elements.cartList.addEventListener('click', event => {
      const row = event.target.closest('li[data-index]');
      if (!row) return;
      const item = cart[Number(row.dataset.index)];
      if (!item) return;
      const act = event.target.closest('[data-act]');
      if (!act) return;
      if (act.dataset.act === 'inc') item.qty += 1;
      else if (act.dataset.act === 'dec') { item.qty -= 1; if (item.qty <= 0) cart.splice(cart.indexOf(item), 1); }
      else if (act.dataset.act === 'remove') cart.splice(cart.indexOf(item), 1);
      renderCart(); renderPayment();
    });

    elements.methodCards.forEach(card => card.addEventListener('click', () => selectMethod(card.dataset.method)));
    elements.appChips.forEach(chip => chip.addEventListener('click', () => {
      elements.appChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      if (!elements.upiId.value.trim()) elements.upiId.value = chip.dataset.app === 'Google Pay' ? 'user@gpay' : `user@${chip.dataset.app.toLowerCase().replace(/\s/g, '')}`;
    }));
    elements.walletItems.forEach(item => item.addEventListener('click', () => {
      elements.walletItems.forEach(w => w.classList.remove('active'));
      item.classList.add('active');
      selectedWallet = item.dataset.wallet;
    }));

    elements.scanBtn.addEventListener('click', startScanner);
    elements.closeScanBtn.addEventListener('click', async () => {
      elements.scanOverlay.hidden = true;
      await window.StoreScanner.stop();
    });
    elements.checkoutBtn.addEventListener('click', () => { if (cart.length) showTab('payment'); });
    elements.newSessionBtn.addEventListener('click', startNewSession);

    elements.notifBtn.addEventListener('click', event => {
      event.stopPropagation();
      elements.notifDrop.hidden = !elements.notifDrop.hidden;
    });
    document.addEventListener('click', () => { elements.notifDrop.hidden = true; });

    elements.cardNo.addEventListener('input', e => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
    });
    elements.cardExp.addEventListener('input', e => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4).replace(/(\d{2})(\d)/, '$1/$2');
    });
    elements.cardCvv.addEventListener('input', e => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4); });

    elements.logoutBtn.addEventListener('click', () => window.AppAuth.logout());

    /* ---------------- init ---------------- */
    try {
      products = await API.list('products');
      renderChips();
      renderCart();
      renderPayment();
    } catch (error) {
      toast(error.message, 'error');
    }
  });
})();
