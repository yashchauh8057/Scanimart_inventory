import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { QrCode } from 'lucide-react';
import Header from '../components/Header';
import CartTab from '../components/CartTab';
import PaymentTab from '../components/PaymentTab';
import ExitTab from '../components/ExitTab';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { api } from '../lib/api';
import { loadRazorpay } from '../lib/razorpay';
import { RAZORPAY_KEY, GST_RATE } from '../lib/config';
import { useAuth } from '../lib/auth';

export default function CustomerPanel() {
  const { session } = useAuth();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [method, setMethod] = useState('upi');
  const [phase, setPhase] = useState('method');
  const [txnId, setTxnId] = useState('');
  const [receiptId, setReceiptId] = useState('');
  const [paying, setPaying] = useState(false);
  const [tab, setTab] = useState('cart');
  const pollTimer = useRef(null);

  useEffect(() => {
    api.products().then(setProducts).catch(e => toast.error(e.message));
  }, []);

  const totals = useMemo(() => {
    const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const savings = cart.reduce((s, i) => s + Math.max(0, i.mrp - i.price) * i.qty, 0);
    const gst = Math.round(subtotal * GST_RATE);
    return { subtotal, savings, gst, total: subtotal + gst };
  }, [cart]);

  const addProduct = useCallback(product => {
    setCart(c => {
      const existing = c.find(i => i.sku === product.sku);
      if (existing) return c.map(i => i.sku === product.sku ? { ...i, qty: i.qty + 1 } : i);
      return [...c, {
        sku: product.sku, name: product.name, emoji: product.emoji, brand: product.brand,
        category: product.category, price: Number(product.price) || 0, mrp: Number(product.mrp) || 0, qty: 1
      }];
    });
  }, []);

  const updateQty = useCallback((sku, delta) => {
    setCart(c => c.map(i => {
      if (i.sku !== sku) return i;
      const qty = i.qty + delta;
      return qty <= 0 ? { ...i, qty: 0 } : { ...i, qty };
    }).filter(i => i.qty > 0));
  }, []);

  const removeItem = useCallback(sku => setCart(c => c.filter(i => i.sku !== sku)), []);

  const startCashPolling = useCallback(id => {
    setPhase('cash-wait');
    setTxnId(id);
    clearInterval(pollTimer.current);
    pollTimer.current = setInterval(async () => {
      try {
        const latest = await api.storeReceipt(id);
        if (latest.paymentStatus === 'paid') {
          clearInterval(pollTimer.current);
          setPhase('success');
          setTxnId(`CASH-${id}`);
          confetti({ particleCount: 180, spread: 90, origin: { y: 0.55 }, colors: ['#5b21b6', '#8b5cf6', '#06b6d4', '#10b981'] });
        }
      } catch { }
    }, 2500);
  }, []);

  const startRazorpay = useCallback(async id => {
    const order = await api.razorpayOrder(id);
    const Razorpay = await loadRazorpay();
    return new Promise((resolve, reject) => {
      const options = {
        key: RAZORPAY_KEY, order_id: order.orderId, amount: order.amount, currency: order.currency,
        name: 'Scanimart Store', description: `Receipt ${id}`,
        prefill: { email: session?.email || '', name: session?.user || '' },
        method: method === 'upi' ? 'upi' : method === 'card' ? 'card' : 'wallet',
        theme: { color: '#5b21b6' },
        handler: async response => {
          try {
            const verified = await api.razorpayVerify({
              receiptId: id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            resolve(verified);
          } catch (error) { reject(error); }
        },
        modal: { ondismiss: () => resolve(null) }
      };
      const rzp = new Razorpay(options);
      rzp.on('payment.failed', () => reject(new Error('Payment failed. Please try again.')));
      rzp.open();
    });
  }, [method, session]);

  const handlePay = async selectedMethod => {
    setPaying(true);
    try {
      const items = cart.map(({ sku, qty }) => ({ sku, qty }));
      const isOnline = selectedMethod !== 'cash';
      const newReceipt = await api.checkout({ items, paymentMethod: isOnline ? 'razorpay' : 'cash', user: session?.user, userEmail: session?.email });
      setReceiptId(newReceipt.id);
      setCart([]);

      if (!isOnline) {
        startCashPolling(newReceipt.id);
      } else {
        const verified = await startRazorpay(newReceipt.id);
        if (!verified) return;
        setPhase('success');
        setTxnId(verified.razorpayPaymentId || verified.id);
        confetti({ particleCount: 180, spread: 90, origin: { y: 0.55 }, colors: ['#5b21b6', '#8b5cf6', '#06b6d4', '#10b981'] });
      }
    } catch (error) {
      toast.error(error.message || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  const resetSession = () => {
    clearInterval(pollTimer.current);
    setCart([]); setReceiptId(''); setTxnId(''); setPhase('method'); setMethod('upi'); setTab('cart');
    toast.info('New session started. Happy shopping!');
  };

  return (
    <div className="relative min-h-screen flex flex-col">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-32 -left-24 h-[480px] w-[480px] rounded-full bg-violet-400/30 blur-[100px] animate-float" />
        <div className="absolute -bottom-32 -right-20 h-[420px] w-[420px] rounded-full bg-cyan-400/25 blur-[100px] animate-float" style={{ animationDelay: '-5s' }} />
        <div className="absolute top-1/3 left-1/2 h-[340px] w-[340px] rounded-full bg-emerald-400/20 blur-[100px] animate-float" style={{ animationDelay: '-10s' }} />
        <div className="absolute top-20 right-10 h-[200px] w-[200px] rounded-full bg-rose-400/15 blur-[80px] animate-float" style={{ animationDelay: '-2s' }} />
      </div>

      <Header className="z-40 w-full" />

      <div className="relative z-10 flex-1 overflow-hidden w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <Tabs value={tab} onValueChange={v => {
          if (v === 'payment' && !cart.length && !receiptId) { toast.info('Add products to your cart first.'); return; }
          if (v === 'exit' && !receiptId) { toast.info('Complete a payment first.'); return; }
          setTab(v);
        }} className="h-full flex flex-col w-full">
          <TabsList className="flex-shrink-0 w-full mb-4" aria-label="Checkout steps">
            <TabsTrigger value="cart">Scan & Cart</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
            <TabsTrigger value="exit">Exit QR</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto w-full pr-1 scrollbar-hide">
            <TabsContent value="cart" className="h-full w-full">
              <CartTab products={products} cart={cart} addProduct={addProduct} updateQty={updateQty} removeItem={removeItem} totals={totals} onProceed={() => cart.length && setTab('payment')} />
            </TabsContent>

            <TabsContent value="payment" className="h-full w-full">
              <PaymentTab cart={cart} totals={totals} method={method} setMethod={setMethod} phase={phase} txnId={txnId} onPay={handlePay} onGetExit={() => setTab('exit')} paying={paying} />
            </TabsContent>

            <TabsContent value="exit" className="h-full w-full flex items-start justify-center py-8">
              <ExitTab receiptId={receiptId} onNewSession={resetSession} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}