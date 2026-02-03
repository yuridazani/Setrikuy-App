import { useState } from 'react';
import { api } from '@/lib/db';
import { useRealtime } from '@/lib/hooks';
import { Card } from '@/components/ui/Cards';
import { Button } from '@/components/ui/Buttons';
import { formatRupiah, generateInvoiceNumber } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Minus,
  Plus,
  X,
  User,
  Search,
  UserPlus,
  Tag,
  Percent,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PosPage = () => {
  const services = useRealtime('services');
  const customers = useRealtime('customers');

  const [cart, setCart] = useState([]);
  const [isSummaryOpen, setSummaryOpen] = useState(false);

  // --- CUSTOMER ---
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isCustomerModalOpen, setCustomerModalOpen] = useState(false);

  // --- DISCOUNT ---
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('nominal'); // nominal | percent
  const [isDiscountModalOpen, setDiscountModalOpen] = useState(false);

  // --- CART LOGIC ---
  const addToCart = (service) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === service.id);
      if (existing) {
        return prev.map((item) =>
          item.id === service.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...service, qty: 1 }];
    });
    toast.success(`${service.name} +1`);
  };

  const updateQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, qty: Math.max(0, item.qty + delta) } : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const discountAmount =
    discountType === 'percent' ? (subtotal * discount) / 100 : discount;
  const finalTotal = Math.max(0, subtotal - discountAmount);

  // --- CHECKOUT ---
  const handleCheckout = async () => {
    if (cart.length === 0) return toast.error('Keranjang kosong!');
    if (!selectedCustomer) {
      toast.warning('Pilih pelanggan dulu!');
      setCustomerModalOpen(true);
      return;
    }

    try {
      await api.orders.add({
        invoiceNumber: generateInvoiceNumber(),
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        customerPhone: selectedCustomer.phone,
        items: cart,
        subtotal,
        discount: discountAmount,
        total: finalTotal,
        status: 'antrian',
        paymentStatus: 'unpaid',
      });

      toast.success('Order Berhasil!');
      setCart([]);
      setSelectedCustomer(null);
      setDiscount(0);
      setSummaryOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('Gagal menyimpan order');
    }
  };

  return (
    <div className="p-6 pb-32 animate-slide-up space-y-6">
      {/* ================= HEADER POS ================= */}
      <div className="flex items-center justify-between">
        <div>
          {selectedCustomer ? (
            <div
              onClick={() => setCustomerModalOpen(true)}
              className="cursor-pointer"
            >
              <p className="text-xs text-text-muted font-bold uppercase">
                Pelanggan
              </p>
              <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                {selectedCustomer.name} <User size={16} />
              </h3>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCustomerModalOpen(true)}
              className="gap-2 rounded-xl"
            >
              <UserPlus size={18} /> Pilih Pelanggan
            </Button>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-text-muted font-bold uppercase">Layanan</p>
          <p className="text-lg font-bold">{services?.length || 0} Tersedia</p>
        </div>
      </div>

      {/* ================= SERVICE GRID ================= */}
      <div className="grid grid-cols-1 gap-4">
        {services?.map((service) => (
          <motion.div whileTap={{ scale: 0.98 }} key={service.id}>
            <Card
              className="p-5 flex items-center justify-between cursor-pointer border-2 border-transparent hover:border-primary/20 transition-all active:bg-gray-50"
              onClick={() => addToCart(service)}
            >
              <div>
                <h3 className="font-bold text-lg text-text-main">
                  {service.name}
                </h3>
                <p className="text-sm text-text-muted font-medium mt-1">
                  {service.duration} Jam • {service.type}
                </p>
              </div>
              <div className="text-right">
                <span className="block font-extrabold text-primary text-lg">
                  {formatRupiah(service.price).replace(',00', '')}
                </span>
                <span className="text-xs text-text-muted">/ {service.unit}</span>
              </div>
            </Card>
          </motion.div>
        ))}
        {services?.length === 0 && (
          <p className="text-center text-gray-400 py-10">
            Belum ada layanan. Tambah di Pengaturan.
          </p>
        )}
      </div>

      {/* ================= STICKY BOTTOM BAR ================= */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-24 left-0 w-full px-4 z-40 max-w-md mx-auto right-0"
          >
            <div
              className="bg-black text-white p-4 rounded-[1.5rem] shadow-2xl flex items-center justify-between cursor-pointer"
              onClick={() => setSummaryOpen(true)}
            >
              <div className="flex items-center gap-3">
                <div className="bg-white/20 h-10 w-10 rounded-full flex items-center justify-center font-bold">
                  {cart.reduce((a, b) => a + b.qty, 0)}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-400 font-medium">
                    Total (+Diskon)
                  </span>
                  <span className="font-bold text-lg">
                    {formatRupiah(finalTotal).replace(',00', '')}
                  </span>
                </div>
              </div>
              <Button
                size="sm"
                className="bg-white text-black hover:bg-gray-200 font-bold rounded-xl px-4"
              >
                Bayar &rarr;
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= SUMMARY SHEET ================= */}
      <AnimatePresence>
        {isSummaryOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white w-full max-w-md rounded-t-4xl p-6 h-[85vh] flex flex-col"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Rincian Order</h2>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setSummaryOpen(false)}
                >
                  <X />
                </Button>
              </div>

              {/* Customer Preview */}
              <div
                className="mb-4 p-4 rounded-2xl border border-primary/20 bg-primary/5 flex items-center justify-between cursor-pointer"
                onClick={() => setCustomerModalOpen(true)}
              >
                <div>
                  <p className="text-xs text-text-muted font-bold uppercase">
                    Pelanggan
                  </p>
                  <p className="font-bold text-primary">
                    {selectedCustomer
                      ? selectedCustomer.name
                      : 'Belum dipilih'}
                  </p>
                </div>
                <User size={18} className="text-primary" />
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl"
                  >
                    <div>
                      <h4 className="font-bold text-text-main">{item.name}</h4>
                      <p className="text-sm text-text-muted">
                        {formatRupiah(item.price)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-1">
                      <button
                        onClick={() => updateQty(item.id, -1)}
                        className="h-8 w-8 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-gray-200"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="font-bold w-4 text-center">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => updateQty(item.id, 1)}
                        className="h-8 w-8 flex items-center justify-center bg-primary text-white rounded-lg hover:bg-primary/90"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* DISCOUNT */}
              <div className="border-t border-gray-100 pt-4 mt-2">
                <div
                  onClick={() => setDiscountModalOpen(true)}
                  className="flex items-center justify-between bg-orange/10 p-3 rounded-xl cursor-pointer border border-orange/20 active:scale-95 transition-transform"
                >
                  <div className="flex items-center gap-2 text-orange-700">
                    <Tag size={18} />
                    <span className="font-bold text-sm">Diskon / Promo</span>
                  </div>
                  <span className="font-bold text-orange-700">
                    {discount > 0
                      ? `- ${formatRupiah(discountAmount)}`
                      : 'Pilih >'}
                  </span>
                </div>
              </div>

              {/* TOTAL */}
              <div className="border-t border-gray-100 pt-4 mt-4 space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Subtotal</span>
                    <span>{formatRupiah(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-black">
                    <span>Total Akhir</span>
                    <span className="text-primary">
                      {formatRupiah(finalTotal)}
                    </span>
                  </div>
                </div>
                <Button
                  size="lg"
                  className="w-full text-lg shadow-xl shadow-primary/30"
                  onClick={handleCheckout}
                >
                  Simpan Transaksi
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= DISCOUNT MODAL ================= */}
      <AnimatePresence>
        {isDiscountModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl">
              <h3 className="font-bold text-lg mb-4">Atur Potongan Harga</h3>

              <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
                <button
                  onClick={() => setDiscountType('nominal')}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                    discountType === 'nominal'
                      ? 'bg-white shadow text-black'
                      : 'text-gray-500'
                  }`}
                >
                  Rp (Nominal)
                </button>
                <button
                  onClick={() => setDiscountType('percent')}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                    discountType === 'percent'
                      ? 'bg-white shadow text-black'
                      : 'text-gray-500'
                  }`}
                >
                  % (Persen)
                </button>
              </div>

              <div className="relative mb-6">
                <div className="absolute left-4 top-3.5 text-gray-400 font-bold">
                  {discountType === 'nominal' ? 'Rp' : '%'}
                </div>
                <input
                  type="number"
                  className="w-full pl-12 p-3 bg-gray-50 rounded-xl font-bold text-lg outline-none focus:ring-2 focus:ring-primary"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  autoFocus
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setDiscountModalOpen(false)}
                  className="flex-1"
                >
                  Batal
                </Button>
                <Button
                  onClick={() => setDiscountModalOpen(false)}
                  className="flex-1"
                >
                  Simpan
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= CUSTOMER MODAL ================= */}
      <AnimatePresence>
        {isCustomerModalOpen && (
          <CustomerModal
            onClose={() => setCustomerModalOpen(false)}
            onSelect={(cust) => {
              setSelectedCustomer(cust);
              setCustomerModalOpen(false);
            }}
            customers={customers}
            onAdd={async (newC) => {
              const id = await api.customers.add(newC);
              return id;
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ================= CUSTOMER MODAL =================
const CustomerModal = ({ onClose, onSelect, customers, onAdd }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newCust, setNewCust] = useState({ name: '', phone: '' });

  const filtered = customers?.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = async () => {
    if (!newCust.name) return;
    const id = await onAdd(newCust);
    onSelect({ ...newCust, id });
    toast.success('Pelanggan baru dibuat!');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
    >
      <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Pilih Pelanggan</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>

        {/* Search */}
        <div className="bg-gray-50 p-3 rounded-xl flex items-center gap-2 mb-4 border border-gray-200">
          <Search size={18} className="text-gray-400" />
          <input
            className="bg-transparent outline-none w-full text-sm"
            placeholder="Cari nama..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filtered?.map((c) => (
            <div
              key={c.id}
              onClick={() => onSelect(c)}
              className="p-3 hover:bg-primary/5 rounded-xl cursor-pointer border border-transparent hover:border-primary/20 transition-all"
            >
              <p className="font-bold text-text-main">{c.name}</p>
              <p className="text-xs text-text-muted">{c.phone || '-'}</p>
            </div>
          ))}
          {filtered?.length === 0 && !isAdding && (
            <p className="text-center text-gray-400 text-sm py-4">
              Tidak ditemukan
            </p>
          )}
        </div>

        {/* Add New */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          {isAdding ? (
            <div className="space-y-3 animate-slide-up">
              <input
                placeholder="Nama Pelanggan"
                className="w-full p-3 bg-gray-50 rounded-xl text-sm border border-gray-200"
                autoFocus
                value={newCust.name}
                onChange={(e) =>
                  setNewCust({ ...newCust, name: e.target.value })
                }
              />
              <input
                placeholder="No HP (Opsional)"
                className="w-full p-3 bg-gray-50 rounded-xl text-sm border border-gray-200"
                type="tel"
                value={newCust.phone}
                onChange={(e) =>
                  setNewCust({ ...newCust, phone: e.target.value })
                }
              />
              <Button onClick={handleAdd} className="w-full">
                Simpan & Pilih
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full border-dashed"
              onClick={() => setIsAdding(true)}
            >
              + Pelanggan Baru
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default PosPage;
