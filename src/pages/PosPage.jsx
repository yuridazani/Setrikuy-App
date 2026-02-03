import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Card } from '@/components/ui/Cards';
import { Button } from '@/components/ui/Buttons';
import { formatRupiah, generateInvoiceNumber } from '@/lib/utils';
import { toast } from 'sonner';
import { Minus, Plus, ShoppingBag, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PosPage = () => {
  const services = useLiveQuery(() => db.services.toArray());
  const [cart, setCart] = useState([]);
  const [isSummaryOpen, setSummaryOpen] = useState(false); // Bottom Sheet Logic (Manual)

  // -- LOGIC CART --
  const addToCart = (service) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === service.id);
      if (existing) {
        return prev.map(item => item.id === service.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...service, qty: 1 }];
    });
    toast.success(`${service.name} ditambahkan`, { duration: 1000 });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, qty: Math.max(0, item.qty + delta) };
      }
      return item;
    }).filter(item => item.qty > 0));
  };

  const calculateTotal = () => cart.reduce((acc, item) => acc + (item.price * item.qty), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return toast.error("Keranjang kosong!");
    try {
      await db.orders.add({
        invoiceNumber: generateInvoiceNumber(),
        items: cart,
        total: calculateTotal(),
        status: 'antrian',
        date: new Date(),
        paymentStatus: 'unpaid'
      });
      toast.success("Order Berhasil Disimpan!");
      setCart([]);
      setSummaryOpen(false);
    } catch (error) {
      toast.error("Gagal menyimpan order");
    }
  };

  return (
    <div className="p-6 pb-32 animate-slide-up">
      <h2 className="text-xl font-bold mb-6">Pilih Layanan</h2>
      
      {/* Service Grid - Big Cards for Touch */}
      <div className="grid grid-cols-1 gap-4">
        {services?.map(service => (
          <motion.div whileTap={{ scale: 0.98 }} key={service.id}>
            <Card 
              className="p-5 flex items-center justify-between cursor-pointer border-2 border-transparent hover:border-primary/20 transition-all active:bg-gray-50"
              onClick={() => addToCart(service)}
            >
              <div>
                <h3 className="font-bold text-lg text-text-main">{service.name}</h3>
                <p className="text-sm text-text-muted font-medium mt-1">{service.duration} Jam • {service.type}</p>
              </div>
              <div className="text-right">
                <span className="block font-extrabold text-primary text-lg">{formatRupiah(service.price).replace(',00', '')}</span>
                <span className="text-xs text-text-muted">/ {service.unit}</span>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Sticky Bottom Summary Bar */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div 
            initial={{ y: 100 }} 
            animate={{ y: 0 }} 
            exit={{ y: 100 }}
            className="fixed bottom-24 left-0 w-full px-4 z-40 max-w-md mx-auto right-0"
          >
            <div className="bg-black text-white p-4 rounded-[1.5rem] shadow-2xl flex items-center justify-between cursor-pointer" onClick={() => setSummaryOpen(true)}>
              <div className="flex items-center gap-3">
                <div className="bg-white/20 h-10 w-10 rounded-full flex items-center justify-center font-bold">
                  {cart.reduce((a, b) => a + b.qty, 0)}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-400 font-medium">Total Estimasi</span>
                  <span className="font-bold text-lg">{formatRupiah(calculateTotal()).replace(',00', '')}</span>
                </div>
              </div>
              <Button size="sm" className="bg-white text-black hover:bg-gray-200 font-bold rounded-xl px-4">
                Bayar &rarr;
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Summary Sheet (Manual Overlay) */}
      <AnimatePresence>
        {isSummaryOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center backdrop-blur-sm"
          >
            <motion.div 
              initial={{ y: "100%" }} 
              animate={{ y: 0 }} 
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white w-full max-w-md rounded-t-4xl p-6 h-[85vh] flex flex-col"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Rincian Order</h2>
                <Button size="icon" variant="ghost" onClick={() => setSummaryOpen(false)}>
                  <X />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl">
                    <div>
                      <h4 className="font-bold text-text-main">{item.name}</h4>
                      <p className="text-sm text-text-muted">{formatRupiah(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-1">
                      <button onClick={() => updateQty(item.id, -1)} className="h-8 w-8 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-gray-200">-</button>
                      <span className="font-bold w-4 text-center">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="h-8 w-8 flex items-center justify-center bg-primary text-white rounded-lg hover:bg-primary/90">+</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-4 mt-4 space-y-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Bayar</span>
                  <span className="text-primary">{formatRupiah(calculateTotal())}</span>
                </div>
                <Button size="lg" className="w-full text-lg" onClick={handleCheckout}>
                  Simpan Transaksi
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PosPage;