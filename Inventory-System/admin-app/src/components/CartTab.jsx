import { useMemo, useRef, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Search, Camera, Plus, Minus, Trash2, ShoppingCart, ArrowRight, PackageOpen, X, Barcode } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Scanner } from './scanner';
import { money } from '../lib/utils';

export default function CartTab({ products, cart, addProduct, updateQty, removeItem, totals, onProceed }) {
  const [query, setQuery] = useState('');
  const [scanOpen, setScanOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const featured = useMemo(() => products.filter(p => p.featured).slice(0, 8), [products]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products.filter(p =>
      p.name.toLowerCase().includes(q) || String(p.sku).toLowerCase().includes(q) || String(p.brand || '').toLowerCase().includes(q)
    ).slice(0, 6);
  }, [products, query]);

  const add = product => {
    addProduct(product);
    toast.success(`${product.emoji || '🛒'} ${product.name} added to cart`, { duration: 1500 });
    setQuery('');
    setShowDropdown(false);
  };

  const handleScan = code => {
    setScanOpen(false);
    const product = products.find(p => String(p.sku).toUpperCase() === String(code).trim().toUpperCase());
    if (product) add(product);
    else toast.error(`Product "${code}" not found`);
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) && inputRef.current !== e.target) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="grid gap-4 animate-in">
      <Card variant="default">
        <div className="relative">
          <div className="flex gap-2.5">
            <div className="relative flex-1">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <Search size={17} className="text-muted-foreground/60" />
              </div>
              <Input
                ref={inputRef}
                className="pl-12 pr-12 h-13 text-base"
                placeholder="Search products by name, SKU, or brand..."
                value={query}
                onChange={e => { setQuery(e.target.value); setShowDropdown(true); }}
                onFocus={() => query && setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                autoComplete="off"
              />
              <Button
                variant="ghost"
                size="iconSm"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                onClick={() => { setQuery(''); setShowDropdown(false); }}
                aria-label="Clear search"
              >
                <X size={15} />
              </Button>

              {(matches.length > 0 || (query && matches.length === 0)) && showDropdown && (
                <div ref={dropdownRef} className="absolute left-0 right-0 top-full mt-2 z-50 max-h-80 overflow-auto glass-strong rounded-2xl p-2 shadow-[0_20px_60px_-16px_rgba(30,27,75,.15)] border border-white/50 animate-in">
                  {matches.length > 0 ? (
                    matches.map(p => (
                      <button
                        key={p.sku}
                        onClick={() => add(p)}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all duration-200 hover:bg-white/80 hover:scale-[1.01] active:scale-[.99]"
                      >
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 text-2xl">{p.emoji || '🛒'}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13.5px] font-semibold">{p.name}</span>
                          <span className="block text-[11.5px] text-muted-foreground">{p.brand} · {p.category}</span>
                        </span>
                        <span className="text-right shrink-0">
                          <span className="block font-bold text-primary text-[14px]">{money(p.price)}</span>
                          {p.mrp > p.price && <span className="block text-[10.5px] text-muted-foreground line-through">{money(p.mrp)}</span>}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="py-6 text-center">
                      <Barcode size={28} className="mx-auto mb-2 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">No products found for "{query}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <Button
              variant="accent"
              size="icon"
              onClick={() => setScanOpen(true)}
              className="relative h-13"
              aria-label="Scan barcode"
            >
              <div className="relative flex items-center justify-center">
                <Camera size={20} />
                <span className="pointer-events-none absolute inset-0 rounded-xl border-2 border-cyan-400/50 animate-scan" />
              </div>
            </Button>
          </div>

          {featured.length > 0 && (
            <div className="mt-5 animate-in" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Quick Add</p>
                <span className="text-[10.5px] text-muted-foreground/70">{featured.length} featured</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {featured.map(p => (
                  <button
                    key={p.sku}
                    onClick={() => add(p)}
                    className="flex shrink-0 items-center gap-2 rounded-xl border border-white/60 bg-white/80 px-4 py-2.5 text-[13px] font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:scale-102 hover:border-primary hover:shadow-lg active:scale-98"
                  >
                    <span className="text-xl">{p.emoji || '🛒'}</span>
                    <span className="hidden sm:inline">{p.name.replace(/\s+\d.*$/, '')}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card variant="default">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-white">
              <ShoppingCart size={18} />
            </div>
            Your Cart
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            {cart.reduce((s, i) => s + i.qty, 0)} item{cart.reduce((s, i) => s + i.qty, 0) !== 1 ? 's' : ''}
          </span>
        </CardHeader>

        {cart.length === 0 ? (
          <div className="py-12 text-center animate-in">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-lavender">
              <PackageOpen size={32} className="text-primary/60" />
            </div>
            <p className="text-base font-medium">Your cart is empty</p>
            <p className="text-sm text-muted-foreground mt-1">Scan a barcode or search for products to begin</p>
          </div>
        ) : (
          <ul className="grid gap-2.5 max-h-[400px] overflow-y-auto pr-1 scrollbar-hide">
            {cart.map((item, index) => {
              const discount = item.mrp > item.price ? Math.round((1 - item.price / item.mrp) * 100) : 0;
              return (
                <li key={item.sku} className="flex items-center gap-3 rounded-xl border border-white/60 bg-white/70 p-3 transition-all duration-300 hover:bg-white/90 hover:border-primary/20 animate-in" style={{ animationDelay: `${index * 50}ms` }}>
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 text-2xl">{item.emoji || '🛒'}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-bold leading-tight">{item.name}</p>
                    <p className="text-[12px] text-muted-foreground">{item.brand} · {item.category}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {discount > 0 && <Badge variant="gradient">{discount}% OFF</Badge>}
                      <Badge variant="lavender">{item.category}</Badge>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2.5">
                    <div className="flex items-center gap-0.5 rounded-full border border-border bg-white/80 p-0.5">
                      <Button variant="ghost" size="iconSm" onClick={() => updateQty(item.sku, -1)} className="h-7 w-7 text-primary hover:bg-primary/10" aria-label="Decrease quantity">
                        <Minus size={14} />
                      </Button>
                      <span className="w-8 text-center text-[14px] font-bold tabular-nums">{item.qty}</span>
                      <Button variant="ghost" size="iconSm" onClick={() => updateQty(item.sku, 1)} className="h-7 w-7 text-primary hover:bg-primary/10" aria-label="Increase quantity">
                        <Plus size={14} />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-right shrink-0">
                        <span className="block text-[15px] font-extrabold text-primary tabular-nums">{money(item.price * item.qty)}</span>
                        {item.mrp > item.price && <span className="block text-[10.5px] text-muted-foreground line-through">{money(item.mrp * item.qty)}</span>}
                      </span>
                      <Button variant="ghost" size="iconSm" onClick={() => removeItem(item.sku)} className="h-8 w-8 text-muted-foreground hover:bg-red-50 hover:text-red-500 rounded-lg" aria-label="Remove item">
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card variant="lavender">
        <div className="grid gap-2.5 text-[14px]">
          <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span className="font-medium">{money(totals.subtotal)}</span></div>
          <div className="flex justify-between font-bold text-emerald-600"><span>You save</span><span>- {money(totals.savings)}</span></div>
          <div className="flex justify-between text-muted-foreground"><span>GST (5%)</span><span>{money(totals.gst)}</span></div>
          <div className="mt-1 flex justify-between border-t border-lavender-border pt-3 font-display text-lg font-extrabold"><span>Total</span><span>{money(totals.total)}</span></div>
        </div>

        {totals.savings > 0 && (
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-gradient-to-r from-emerald-50 to-lime-50 px-4 py-3 text-[13px] font-semibold text-emerald-700 border border-emerald-100 animate-in">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-100 text-emerald-600 shrink-0" aria-hidden="true">🎉</span>
            <span>You save <strong>{money(totals.savings)}</strong> today!</span>
          </div>
        )}

        <Button variant="accent" size="lg" className="mt-4" disabled={!cart.length} onClick={onProceed}>
          Proceed to Payment
          <ArrowRight size={16} />
        </Button>
      </Card>

      {scanOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in">
          <div className="glass-strong w-full max-w-sm rounded-3xl p-5 shadow-[0_32px_80px_-20px_rgba(30,27,75,.4)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">Scan Product Barcode</h3>
              <Button variant="ghost" size="iconSm" onClick={() => setScanOpen(false)} aria-label="Close scanner"><X size={18} /></Button>
            </div>
            <Scanner onScan={handleScan} onError={msg => { setScanOpen(false); toast.error(msg); }} />
            <p className="mt-4 text-center text-sm text-muted-foreground">Point camera at a product barcode</p>
          </div>
        </div>
      )}
    </div>
  );
}