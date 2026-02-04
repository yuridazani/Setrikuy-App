import { useState } from 'react';
import { api } from '@/lib/db';
import { useRealtime } from '@/lib/hooks';
import { Card } from '@/components/ui/Cards';
import { Button } from '@/components/ui/Buttons';
import { formatRupiah, generateInvoiceNumber } from '@/lib/utils';
import { toast } from 'sonner';
import {
  X,
  User,
  UserPlus,
  Wallet,
  CreditCard,
  Banknote,
  QrCode,
  Scale,
  TicketPercent,
  Check,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PosPage = () => {
  const servicesRaw = useRealtime('services');
  const customers = useRealtime('customers');
  const promosRaw = useRealtime('promos');

  const settings = useRealtime('settings');
  const invoicePrefix =
    settings?.find((s) => s.id === 'main')?.invoicePrefix || 'INV';

  const services = servicesRaw?.filter((s) => s.isActive !== false);
  const promos = promosRaw?.filter((p) => p.isActive !== false);

  const [cart, setCart] = useState([]);
  const [isSummaryOpen, setSummaryOpen] = useState(false);

  // ✅ MIN WEIGHT SWITCH
  const [useMinWeight, setUseMinWeight] = useState(true);

  // CUSTOMER
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isCustomerModalOpen, setCustomerModalOpen] = useState(false);

  // PROMO & NOTES
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [notes, setNotes] = useState('');

  // PAYMENT
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
        return prev.map((item) => {
          if (item.id === service.id) {
            const newQty = item.qty + 1;
            const adjustedQty =
              useMinWeight && item.unit === 'kg' && newQty < 3 ? 3 : newQty;
            return { ...item, qty: adjustedQty };
          }
          return item;
        });
      }
      const initialQty = useMinWeight && service.unit === 'kg' ? 3 : 1;
      return [...prev, { ...service, qty: initialQty }];
    });
    toast.success(`${service.name} +1`);
  };

  const updateQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = Math.max(0, item.qty + delta);
            if (useMinWeight && item.unit === 'kg' && newQty > 0 && newQty < 3) {
              return { ...item, qty: 3 };
            }
            return { ...item, qty: newQty };
          }
          return item;
        })
        .filter((item) => item.qty > 0)
    );
  };

  const toggleMinWeight = () => {
    const newValue = !useMinWeight;
    setUseMinWeight(newValue);
    if (newValue) {
      setCart((prev) =>
        prev.map((item) =>
          item.unit === 'kg' && item.qty < 3 ? { ...item, qty: 3 } : item
        )
      );
    }
  };

  // ================= TOTAL LOGIC =================
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const totalWeight = cart.reduce(
    (acc, item) => acc + (item.unit === 'kg' ? item.qty : 0),
    0
  );

  const eligiblePromos =
    promos?.filter((promo) => {
      if (promo.minType === 'weight' && totalWeight >= promo.minValue)
        return true;
      if (promo.minType === 'total' && subtotal >= promo.minValue) return true;
      return false;
    }) || [];

  const calculateDiscount = (promo) => {
    if (!promo) return 0;
    if (promo.type === 'percent') {
      return (subtotal * promo.value) / 100;
    }
    return promo.value;
  };

  const promoDiscount = selectedPromo ? calculateDiscount(selectedPromo) : 0;
  const finalTotal = Math.max(0, subtotal - promoDiscount);

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

    try {
      await api.orders.add({
        invoiceNumber: generateInvoiceNumber(invoicePrefix),
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        customerPhone: selectedCustomer.phone,
        items: cart,
        subtotal,
        discount: promoDiscount,
        promoDetails: selectedPromo
          ? {
              id: selectedPromo.id,
              name: selectedPromo.name,
              value: promoDiscount,
              type: 'manual',
            }
          : null,
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

      setCart([]);
      setSelectedCustomer(null);
      setSelectedPromo(null);
      setNotes('');
      setUseMinWeight(true);
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
            <div className="bg-primary/10 text-primary px-4 py-2 rounded-xl font-bold flex items-center gap-2 text-sm">
              <User size={16} /> {selectedCustomer.name}
            </div>
          ) : (
            <div className="bg-gray-100 text-gray-400 px-4 py-2 rounded-xl font-bold flex items-center gap-2 text-sm hover:bg-gray-200 transition-colors">
              <UserPlus size={16} /> Pilih Pelanggan
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
              <span className="block font-black text-primary">
                {formatRupiah(service.price).replace(',00', '')}
              </span>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ================= FLOATING BAR ================= */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-6 left-4 right-4 z-40 max-w-md mx-auto"
          >
            <div
              onClick={() => setSummaryOpen(true)}
              className="bg-gray-900 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between cursor-pointer hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="bg-white/20 h-10 w-10 rounded-full flex items-center justify-center font-bold">
                  {cart.reduce((a, b) => a + b.qty, 0)}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-400 font-medium">
                    Total Estimasi
                  </span>
                  <span className="font-bold text-lg leading-none">
                    {formatRupiah(finalTotal).replace(',00', '')}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 font-bold text-sm bg-white text-black px-4 py-2 rounded-xl">
                Bayar <ChevronRight size={16} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= 🔥 SUMMARY MODAL (CENTERED) ================= */}
      <AnimatePresence>
        {isSummaryOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm py-4 px-4 sm:p-4 safe-area-inset"
            onClick={() => setSummaryOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[85vh] mt-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* HEADER */}
              <div className="px-6 pt-4 pb-4 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
                <h2 className="text-lg font-bold text-gray-800">
                  Rincian Order
                </h2>
                <button
                  onClick={() => setSummaryOpen(false)}
                  className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* CONTENT */}
              <div className="flex-1 overflow-y-auto px-6 py-4 bg-gray-50/50">
                {/* SWITCH MIN 3KG */}
                <div className="mb-4 bg-white p-3 rounded-2xl flex items-center justify-between border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3 text-blue-800">
                    <div className="bg-blue-50 p-2 rounded-xl">
                      <Scale size={18} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-800">
                        Minimal 3KG
                      </p>
                      <p className="text-[10px] text-gray-400">
                        Auto set qty jadi 3kg
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={toggleMinWeight}
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

                {/* ITEMS */}
                <div className="space-y-3 mb-6">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center bg-white p-3 rounded-2xl border border-gray-100 shadow-sm"
                    >
                      <div className="flex-1 pr-4">
                        <h4 className="font-bold text-sm text-gray-800">
                          {item.name}
                        </h4>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatRupiah(item.price)} × {item.qty} {item.unit}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-1 border border-gray-100">
                        <button
                          onClick={() => updateQty(item.id, -1)}
                          className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-gray-600 font-bold hover:bg-gray-100"
                        >
                          -
                        </button>
                        <span className="w-4 text-center font-bold text-sm text-gray-800">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => updateQty(item.id, 1)}
                          className="w-8 h-8 flex items-center justify-center bg-blue-600 rounded-lg shadow-sm text-white font-bold hover:bg-blue-700"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* PROMO & NOTES */}
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                    <span>Promo & Catatan</span>
                    {eligiblePromos.length > 0 && (
                      <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-md">
                        {eligiblePromos.length} Tersedia
                      </span>
                    )}
                  </div>

                  {eligiblePromos.length > 0 ? (
                    <div className="space-y-2">
                      {eligiblePromos.map((promo) => {
                        const discount = calculateDiscount(promo);
                        const isSelected = selectedPromo?.id === promo.id;
                        return (
                          <button
                            key={promo.id}
                            onClick={() =>
                              setSelectedPromo(isSelected ? null : promo)
                            }
                            className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-all ${
                              isSelected
                                ? 'bg-green-50 border-green-500 text-green-700'
                                : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-green-300'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                  isSelected
                                    ? 'border-green-500 bg-green-500'
                                    : 'border-gray-300'
                                }`}
                              >
                                {isSelected && (
                                  <Check
                                    size={12}
                                    className="text-white"
                                    strokeWidth={3}
                                  />
                                )}
                              </div>
                              <span>{promo.name}</span>
                            </div>
                            <span>
                              -{formatRupiah(discount).replace(',00', '')}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-4 px-3 bg-gray-50 rounded-xl border border-gray-200">
                      <TicketPercent
                        size={24}
                        className="mx-auto mb-2 text-gray-400"
                      />
                      <p className="text-xs text-gray-500">
                        Belum ada promo yang memenuhi syarat
                      </p>
                    </div>
                  )}

                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    placeholder="Catatan tambahan..."
                    rows={2}
                  />
                </div>
              </div>

              {/* FOOTER */}
              <div className="p-5 border-t border-gray-100 bg-white shrink-0">
                <div className="space-y-1 mb-4">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Subtotal</span>
                    <span>{formatRupiah(subtotal)}</span>
                  </div>
                  {selectedPromo && (
                    <div className="flex justify-between text-sm text-green-600 font-medium">
                      <span>Diskon</span>
                      <span>-{formatRupiah(promoDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-end pt-2 border-t border-dashed border-gray-200 mt-2">
                    <span className="font-bold text-gray-800">
                      Total Bayar
                    </span>
                    <span className="text-2xl font-black text-gray-900">
                      {formatRupiah(finalTotal).replace(',00', '')}
                    </span>
                  </div>
                </div>
                <Button
                  size="lg"
                  className="w-full rounded-xl text-lg font-bold shadow-lg shadow-blue-500/30"
                  onClick={openPaymentModal}
                >
                  Lanjut Pembayaran
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= 🔥 PAYMENT MODAL (CENTERED) ================= */}
      <AnimatePresence>
        {isPaymentModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-60 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm py-4 px-4 sm:p-4"
            onClick={() => setPaymentModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[90vh] mt-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* HEADER */}
              <div className="px-6 pt-4 pb-4 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
                <h3 className="text-lg font-bold text-gray-800">
                  Metode Pembayaran
                </h3>
                <button
                  onClick={() => setPaymentModalOpen(false)}
                  className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* CONTENT */}
              <div className="flex-1 overflow-y-auto px-6 py-6 bg-white">
                <div className="bg-gray-900 text-white p-6 rounded-2xl text-center mb-6 shadow-xl shadow-gray-200">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">
                    Total Tagihan
                  </p>
                  <h2 className="text-4xl font-black">
                    {formatRupiah(finalTotal).replace(',00', '')}
                  </h2>
                </div>

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
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all border-2 ${
                        paymentMethod === m.id
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-100 text-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      <m.icon size={24} className="mb-1.5" />
                      <span className="text-[10px] font-bold">{m.label}</span>
                    </button>
                  ))}
                </div>

                {/* FORMS */}
                <div className="animate-slide-up">
                  {paymentMethod === 'cash' && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                          Uang Diterima
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                            Rp
                          </span>
                          <input
                            type="number"
                            autoFocus
                            className="w-full pl-10 p-4 text-2xl font-bold bg-gray-50 rounded-2xl border-2 border-gray-200 focus:border-blue-500 outline-none"
                            placeholder="0"
                            value={cashAmount}
                            onChange={(e) => setCashAmount(e.target.value)}
                          />
                        </div>
                      </div>
                      {cashAmount > 0 && (
                        <div className="flex justify-between items-center bg-green-50 p-4 rounded-2xl border border-green-200">
                          <span className="text-green-700 font-bold">
                            Kembalian
                          </span>
                          <span className="text-xl font-black text-green-700">
                            {formatRupiah(
                              Math.max(0, cashAmount - finalTotal)
                            )}
                          </span>
                        </div>
                      )}
                      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        {[finalTotal, 50000, 100000].map((amt) => (
                          <button
                            key={amt}
                            onClick={() => setCashAmount(amt)}
                            className="px-4 py-2 bg-gray-100 rounded-xl text-xs font-bold whitespace-nowrap hover:bg-gray-200 border border-gray-200"
                          >
                            {formatRupiah(amt)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'transfer' && (
                    <div className="space-y-3">
                      <div className="p-3 bg-blue-50 text-blue-700 rounded-xl text-sm border border-blue-100">
                        Info: Status order akan menjadi <b>Pending</b>.
                      </div>
                      <select
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold"
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
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl"
                        placeholder="Nama Pengirim"
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

                  {paymentMethod === 'ewallet' && (
                    <div className="space-y-3">
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
                            className={`p-3 rounded-xl border text-sm font-bold ${
                              paymentDetails.provider === p
                                ? 'bg-purple-50 border-purple-500 text-purple-700'
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                      <input
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl"
                        placeholder="Nomor / Akun"
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

                  {paymentMethod === 'qris' && (
                    <div className="text-center p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                      <QrCode
                        size={48}
                        className="mx-auto text-gray-400 mb-2"
                      />
                      <p className="text-sm text-gray-600 font-bold">
                        Scan QRIS di Meja Kasir
                      </p>
                      <input
                        className="mt-3 w-full p-3 bg-white border border-gray-200 rounded-xl text-center"
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
              </div>

              {/* FOOTER */}
              <div className="p-5 border-t border-gray-100 bg-white shrink-0">
                <Button
                  onClick={handleFinalPayment}
                  className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-blue-500/30"
                >
                  {paymentMethod === 'cash'
                    ? `Bayar & Selesai`
                    : 'Simpan Transaksi'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= CUSTOMER MODAL ================= */}
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
    <div
      className="fixed inset-0 z-70 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm py-4 px-4 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[80vh] mt-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-4 pb-4 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
          <h3 className="font-bold text-lg">Pilih Pelanggan</h3>
          <button
            onClick={onClose}
            className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {!isAdd ? (
            <>
              <input
                placeholder="Cari nama..."
                className="w-full p-3 bg-gray-50 rounded-xl mb-3 border-none focus:ring-2 focus:ring-blue-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="space-y-2 mb-4">
                {filtered?.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => onSelect(c)}
                    className="p-3 bg-gray-50 rounded-xl font-bold text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    {c.name}
                  </div>
                ))}
              </div>
              <Button
                onClick={() => setIsAdd(true)}
                variant="outline"
                className="w-full border-dashed border-2 py-6"
              >
                + Pelanggan Baru
              </Button>
            </>
          ) : (
            <div className="space-y-3">
              <input
                placeholder="Nama Lengkap"
                className="w-full p-3 bg-gray-50 rounded-xl"
                value={newC.name}
                onChange={(e) => setNewC({ ...newC, name: e.target.value })}
              />
              <input
                placeholder="Nomor HP"
                className="w-full p-3 bg-gray-50 rounded-xl"
                value={newC.phone}
                onChange={(e) => setNewC({ ...newC, phone: e.target.value })}
              />
              <Button onClick={saveNew} className="w-full h-12">
                Simpan & Pilih
              </Button>
              <Button
                variant="ghost"
                onClick={() => setIsAdd(false)}
                className="w-full"
              >
                Batal
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PosPage;