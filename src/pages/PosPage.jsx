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
  Wallet,
  CreditCard,
  Banknote,
  QrCode,
  Scale,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PosPage = () => {
  const servicesRaw = useRealtime('services');
  const customers = useRealtime('customers');
  const services = servicesRaw?.filter((s) => s.isActive !== false);

  const [cart, setCart] = useState([]);
  const [isSummaryOpen, setSummaryOpen] = useState(false);

  // ✅ MIN WEIGHT SWITCH (DEFAULT ON)
  const [useMinWeight, setUseMinWeight] = useState(true);

  // --- CUSTOMER ---
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isCustomerModalOpen, setCustomerModalOpen] = useState(false);

  // --- DISCOUNT ---
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('nominal');
  const [isDiscountModalOpen, setDiscountModalOpen] = useState(false);

  // --- NOTES ---
  const [notes, setNotes] = useState('');

  // --- PAYMENT ---
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashAmount, setCashAmount] = useState('');
  const [paymentDetails, setPaymentDetails] = useState({
    bank: 'BCA',
    senderName: '',
    provider: 'Dana',
    walletName: '',
    refNumber: '',
  });

  // ================= CART LOGIC =================
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

  // ================= TOTAL LOGIC (WITH SWITCH) =================
  const calculateItemTotal = (item) => {
    let billedQty = item.qty;
    if (useMinWeight && item.unit === 'kg' && item.qty < 3 && item.qty > 0) {
      billedQty = 3;
    }
    return item.price * billedQty;
  };

  const subtotal = cart.reduce((acc, item) => acc + calculateItemTotal(item), 0);
  const discountAmount =
    discountType === 'percent' ? (subtotal * discount) / 100 : discount;
  const finalTotal = Math.max(0, subtotal - discountAmount);

  // ================= FLOW =================
  const openPaymentModal = () => {
    if (cart.length === 0) return toast.error('Keranjang kosong!');
    if (!selectedCustomer) {
      toast.warning('Pilih pelanggan dulu!');
      setCustomerModalOpen(true);
      return;
    }
    setPaymentModalOpen(true);
    setCashAmount('');
  };

  const handleFinalPayment = async () => {
    let status = 'pending';
    let paidAmount = 0;
    let change = 0;

    if (paymentMethod === 'cash') {
      const cash = Number(cashAmount) || 0;
      if (cash < finalTotal) return toast.error('Uang tunai kurang!');
      paidAmount = cash;
      change = cash - finalTotal;
      status = 'paid';
    } else if (paymentMethod === 'qris') {
      paidAmount = finalTotal;
      status = 'paid';
    } else {
      paidAmount = finalTotal;
      status = 'pending';
    }

    // ✅ SIMPAN ITEM DENGAN INFO (Min 3kg jika aktif)
    const itemsToSave = cart.map((item) => {
      const isMinApplied =
        useMinWeight && item.unit === 'kg' && item.qty < 3;
      const billedQty = isMinApplied ? 3 : item.qty;

      return {
        ...item,
        qty: billedQty,
        realQty: item.qty,
        name: isMinApplied ? `${item.name} (Min 3kg)` : item.name,
      };
    });

    try {
      await api.orders.add({
        invoiceNumber: generateInvoiceNumber(),
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        customerPhone: selectedCustomer.phone,
        items: itemsToSave,
        subtotal,
        discount: discountAmount,
        total: finalTotal,
        notes,
        date: new Date().toISOString(),
        payment: {
          method: paymentMethod,
          status,
          paidAmount,
          change,
          details: paymentDetails,
        },
        status: 'antrian',
        paymentStatus: status,
      });

      toast.success(
        status === 'paid'
          ? 'LUNAS! Transaksi disimpan.'
          : 'Disimpan! Menunggu pembayaran.'
      );

      // RESET
      setCart([]);
      setSelectedCustomer(null);
      setDiscount(0);
      setNotes('');
      setUseMinWeight(true); // reset ke default aman
      setSummaryOpen(false);
      setPaymentModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('Gagal menyimpan order');
    }
  };

  return (
    <div className="p-6 pb-32 animate-slide-up space-y-6">
      {/* ================= HEADER ================= */}
      <div className="flex items-center justify-between">
        <div onClick={() => setCustomerModalOpen(true)} className="cursor-pointer">
          <p className="text-xs text-text-muted font-bold uppercase mb-1">
            Pelanggan
          </p>
          {selectedCustomer ? (
            <div className="bg-primary/10 text-primary px-4 py-2 rounded-xl font-bold flex items-center gap-2">
              <User size={18} /> {selectedCustomer.name}
            </div>
          ) : (
            <div className="bg-gray-100 text-gray-400 px-4 py-2 rounded-xl font-bold flex items-center gap-2">
              <UserPlus size={18} /> Pilih Pelanggan
            </div>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-text-muted font-bold uppercase">Layanan</p>
          <p className="text-lg font-bold">{services?.length || 0} Tersedia</p>
        </div>
      </div>

      {/* ================= SERVICE GRID ================= */}
      <div className="grid grid-cols-1 gap-3">
        {services?.map((service) => (
          <motion.div whileTap={{ scale: 0.98 }} key={service.id}>
            <Card
              className="p-4 flex items-center justify-between cursor-pointer border-2 border-transparent hover:border-primary/20 active:bg-gray-50 transition-all"
              onClick={() => addToCart(service)}
            >
              <div>
                <h3 className="font-bold text-text-main">{service.name}</h3>
                <p className="text-xs text-text-muted font-medium mt-0.5">
                  {service.duration} Jam • {service.type}
                </p>
              </div>
              <div className="text-right">
                <span className="block font-black text-primary">
                  {formatRupiah(service.price).replace(',00', '')}
                </span>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ================= STICKY BAR ================= */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-24 left-4 right-4 z-40 max-w-md mx-auto"
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
                Bayar →
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

              {/* ===== SWITCH MIN 3KG ===== */}
              <div className="mb-4 bg-blue-50 p-3 rounded-xl flex items-center justify-between border border-blue-100">
                <div className="flex items-center gap-2 text-blue-800">
                  <Scale size={20} />
                  <div>
                    <p className="font-bold text-sm">Minimal 3KG</p>
                    <p className="text-[10px] opacity-70">
                      Otomatis bulatkan ke 3kg
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setUseMinWeight(!useMinWeight)}
                  className={`w-12 h-7 rounded-full p-1 transition-all ${
                    useMinWeight ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow-md transition-all ${
                      useMinWeight ? 'ml-5' : 'ml-0'
                    }`}
                  />
                </button>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {cart.map((item) => {
                  const isMinApplied =
                    useMinWeight && item.unit === 'kg' && item.qty < 3 && item.qty > 0;
                  const totalHargaItem = calculateItemTotal(item);

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between bg-gray-50 p-3 rounded-2xl"
                    >
                      <div>
                        <h4 className="font-bold text-text-main text-sm">
                          {item.name}
                          {isMinApplied && (
                            <span className="text-[10px] text-red-500 ml-1 font-bold">
                              (Min 3kg)
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-text-muted">
                          {formatRupiah(item.price)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
                          <button
                            onClick={() => updateQty(item.id, -1)}
                            className="h-8 w-8 flex items-center justify-center bg-gray-100 rounded-lg font-bold"
                          >
                            -
                          </button>
                          <span className="font-bold w-4 text-center text-sm">
                            {item.qty}
                          </span>
                          <button
                            onClick={() => updateQty(item.id, 1)}
                            className="h-8 w-8 flex items-center justify-center bg-primary text-white rounded-lg font-bold"
                          >
                            +
                          </button>
                        </div>
                        <span className="font-bold text-sm min-w-[60px] text-right">
                          {formatRupiah(totalHargaItem)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Discount & Notes */}
              <div className="space-y-3 mt-4">
                <div
                  onClick={() => setDiscountModalOpen(true)}
                  className="flex items-center justify-between bg-orange/10 p-3 rounded-xl cursor-pointer border border-orange/20"
                >
                  <div className="flex items-center gap-2 text-orange-700">
                    <Tag size={18} />{' '}
                    <span className="font-bold text-sm">Diskon</span>
                  </div>
                  <span className="font-bold text-orange-700">
                    {discount > 0
                      ? `- ${formatRupiah(discountAmount)}`
                      : 'Pilih >'}
                  </span>
                </div>
                <textarea
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Catatan (Mis: Jangan dilipat)"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Total */}
              <div className="border-t border-gray-100 pt-4 mt-4 space-y-4">
                <div className="flex justify-between text-lg font-black">
                  <span>Total Akhir</span>
                  <span className="text-primary">
                    {formatRupiah(finalTotal)}
                  </span>
                </div>
                <Button
                  size="lg"
                  className="w-full text-lg shadow-xl shadow-primary/30"
                  onClick={openPaymentModal}
                >
                  Lanjut Pembayaran
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= PAYMENT MODAL ================= */}
      <AnimatePresence>
        {isPaymentModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-60 flex items-end justify-center backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white w-full max-w-md rounded-t-4xl p-6 max-h-[90vh] flex flex-col"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-xl">Metode Pembayaran</h3>
                <Button
                  variant="ghost"
                  onClick={() => setPaymentModalOpen(false)}
                >
                  <X />
                </Button>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl text-center mb-6 border border-gray-200">
                <p className="text-xs text-gray-500 font-bold uppercase mb-1">
                  Total Tagihan
                </p>
                <h2 className="text-3xl font-black text-primary">
                  {formatRupiah(finalTotal)}
                </h2>
              </div>

              {/* Tabs */}
              <div className="grid grid-cols-4 gap-2 mb-6">
                {[
                  { id: 'cash', icon: Banknote, label: 'Tunai' },
                  { id: 'transfer', icon: CreditCard, label: 'Transfer' },
                  { id: 'ewallet', icon: Wallet, label: 'E-Wallet' },
                  { id: 'qris', icon: QrCode, label: 'QRIS' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all border-2 ${
                      paymentMethod === m.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-gray-100 text-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    <m.icon size={24} className="mb-1" />
                    <span className="text-[10px] font-bold">{m.label}</span>
                  </button>
                ))}
              </div>

              {/* Forms */}
              <div className="flex-1 overflow-y-auto mb-4">
                {/* CASH */}
                {paymentMethod === 'cash' && (
                  <div className="space-y-4 animate-slide-up">
                    <div>
                      <label className="text-sm font-bold text-gray-500 mb-1 block">
                        Uang Diterima
                      </label>
                      <input
                        type="number"
                        autoFocus
                        className="w-full p-4 text-xl font-bold bg-gray-50 rounded-xl border-2 border-primary/20 focus:border-primary outline-none"
                        placeholder="0"
                        value={cashAmount}
                        onChange={(e) => setCashAmount(e.target.value)}
                      />
                    </div>
                    <div className="flex justify-between items-center bg-green-50 p-4 rounded-xl border border-green-100">
                      <span className="text-green-700 font-bold">
                        Kembalian
                      </span>
                      <span className="text-xl font-black text-green-700">
                        {cashAmount
                          ? formatRupiah(
                              Math.max(0, cashAmount - finalTotal)
                            )
                          : 'Rp 0'}
                      </span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {[finalTotal, 50000, 100000].map((amt) => (
                        <button
                          key={amt}
                          onClick={() => setCashAmount(amt)}
                          className="px-4 py-2 bg-gray-100 rounded-lg text-xs font-bold whitespace-nowrap hover:bg-gray-200"
                        >
                          {formatRupiah(amt)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* TRANSFER */}
                {paymentMethod === 'transfer' && (
                  <div className="space-y-4 animate-slide-up">
                    <div className="p-4 bg-blue-50 text-blue-700 rounded-xl text-sm border border-blue-100 mb-4">
                      Transfer ke rekening toko. Status akan menjadi{' '}
                      <b>Pending</b> sampai dikonfirmasi.
                    </div>
                    <select
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl"
                      value={paymentDetails.bank}
                      onChange={(e) =>
                        setPaymentDetails({
                          ...paymentDetails,
                          bank: e.target.value,
                        })
                      }
                    >
                      <option value="BCA">BCA</option>
                      <option value="BRI">BRI</option>
                      <option value="Mandiri">Mandiri</option>
                    </select>
                    <input
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl"
                      placeholder="Nama Pengirim (Opsional)"
                      value={paymentDetails.senderName}
                      onChange={(e) =>
                        setPaymentDetails({
                          ...paymentDetails,
                          senderName: e.target.value,
                        })
                      }
                    />
                  </div>
                )}

                {/* E-WALLET */}
                {paymentMethod === 'ewallet' && (
                  <div className="space-y-4 animate-slide-up">
                    <div className="p-4 bg-purple-50 text-purple-700 rounded-xl text-sm border border-purple-100 mb-4">
                      Terima pembayaran via Dana / OVO / GoPay / ShopeePay.
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {['Dana', 'OVO', 'GoPay', 'ShopeePay'].map((p) => (
                        <button
                          key={p}
                          onClick={() =>
                            setPaymentDetails({
                              ...paymentDetails,
                              provider: p,
                            })
                          }
                          className={`p-3 rounded-xl border ${
                            paymentDetails.provider === p
                              ? 'bg-purple-100 border-purple-500 text-purple-700'
                              : 'bg-white border-gray-200'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                    <input
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl"
                      placeholder="Nomor / Nama Akun"
                      value={paymentDetails.walletName}
                      onChange={(e) =>
                        setPaymentDetails({
                          ...paymentDetails,
                          walletName: e.target.value,
                        })
                      }
                    />
                  </div>
                )}

                {/* QRIS */}
                {paymentMethod === 'qris' && (
                  <div className="space-y-4 animate-slide-up text-center">
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-blue-800 text-sm">
                      <p className="font-bold mb-1">🔍 Scan Manual</p>
                      <p>
                        Tunjukkan <b>Stiker QRIS</b> toko.
                      </p>
                    </div>
                    <input
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl text-center font-bold"
                      placeholder="No. Ref (Opsional)"
                      value={paymentDetails.refNumber}
                      onChange={(e) =>
                        setPaymentDetails({
                          ...paymentDetails,
                          refNumber: e.target.value,
                        })
                      }
                    />
                  </div>
                )}
              </div>

              <Button
                onClick={handleFinalPayment}
                className="w-full h-14 text-lg shadow-xl shadow-primary/20"
              >
                {paymentMethod === 'cash'
                  ? `Bayar & Terima ${formatRupiah(Number(cashAmount || 0))}`
                  : 'Simpan Transaksi'}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        onSelect={(c) => {
          setSelectedCustomer(c);
          setCustomerModalOpen(false);
        }}
        customers={customers}
        onAdd={async (newC) => await api.customers.add(newC)}
      />

      {/* ================= DISCOUNT MODAL ================= */}
      <AnimatePresence>
        {isDiscountModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-60 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <div className="bg-white w-full max-w-sm rounded-4xl p-6 shadow-2xl">
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
                  Rp
                </button>
                <button
                  onClick={() => setDiscountType('percent')}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                    discountType === 'percent'
                      ? 'bg-white shadow text-black'
                      : 'text-gray-500'
                  }`}
                >
                  %
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
    </div>
  );
};

// ================= CUSTOMER MODAL =================
const CustomerModal = ({ isOpen, onClose, onSelect, customers, onAdd }) => {
  if (!isOpen) return null;
  const [search, setSearch] = useState('');
  const [isAdd, setIsAdd] = useState(false);
  const [newC, setNewC] = useState({ name: '', phone: '' });
  const filtered = customers?.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );
  const saveNew = async () => {
    if (!newC.name) return;
    const id = await onAdd(newC);
    onSelect({ ...newC, id });
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl max-h-[80vh] flex flex-col">
        <div className="flex justify-between mb-4">
          <h3 className="font-bold">Pilih Pelanggan</h3>
          <button onClick={onClose}>
            <X />
          </button>
        </div>
        {!isAdd ? (
          <>
            <input
              placeholder="Cari..."
              className="w-full p-3 bg-gray-50 rounded-xl mb-2"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="flex-1 overflow-y-auto space-y-2">
              {filtered?.map((c) => (
                <div
                  key={c.id}
                  onClick={() => onSelect(c)}
                  className="p-3 bg-gray-50 rounded-xl font-bold text-sm cursor-pointer hover:bg-primary/10"
                >
                  {c.name}
                </div>
              ))}
            </div>
            <Button
              onClick={() => setIsAdd(true)}
              variant="outline"
              className="mt-4 border-dashed w-full"
            >
              + Baru
            </Button>
          </>
        ) : (
          <div className="space-y-3">
            <input
              placeholder="Nama"
              className="w-full p-3 bg-gray-50 rounded-xl"
              value={newC.name}
              onChange={(e) => setNewC({ ...newC, name: e.target.value })}
            />
            <input
              placeholder="HP"
              className="w-full p-3 bg-gray-50 rounded-xl"
              value={newC.phone}
              onChange={(e) => setNewC({ ...newC, phone: e.target.value })}
            />
            <Button onClick={saveNew} className="w-full">
              Simpan
            </Button>
            <Button
              variant="ghost"
              onClick={() => setIsAdd(false)}
              className="w-full"
            >
              Kembali
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PosPage;