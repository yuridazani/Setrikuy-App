import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/db';
import { Button } from '@/components/ui/Buttons';
import { Card } from '@/components/ui/Cards';
import { formatRupiah } from '@/lib/utils';
import {
  Printer,
  MessageCircle,
  ArrowLeft,
  CheckCircle,
  Clock,
  X,
  AlertTriangle,
  Calendar,
  Save,
  User,
  History,
  Gift,
} from 'lucide-react';
import { format, parseISO, addHours } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_FLOW = ['antrian', 'proses', 'selesai', 'diambil'];

const OrderDetail = () => {
  const { id: orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [storeProfile, setStoreProfile] = useState(null);
  const [customerData, setCustomerData] = useState(null); // ✅ TAMBAH STATE CUSTOMER
  const [loading, setLoading] = useState(true);

  const [showPreview, setShowPreview] = useState(false);
  const [damageNote, setDamageNote] = useState('');
  const [isWaModalOpen, setWaModalOpen] = useState(false);

  const [autoWa, setAutoWa] = useState(false);

  // ================= ✅ FIX 1: LOAD DATA + REALTIME REFRESH SETTINGS =================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const orderData = await api.orders.get(orderId);
        const profileData = await api.settings.get('main');

        if (orderData) {
          setOrder(orderData);
          setDamageNote(orderData.damageNote || '');
          setStoreProfile(
            profileData || { name: 'SETRIKUY', address: 'Alamat belum diatur', phone: '-' }
          );

          // ✅ LOAD CUSTOMER DATA UNTUK AMBIL STAMPS
          if (orderData.customerId) {
            const customer = await api.customers.get(orderData.customerId);
            setCustomerData(customer);
          }
        } else {
          toast.error('Order tidak ditemukan');
          navigate('/orders');
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [orderId, navigate]);

  // ✅ FIX 2: TAMBAH FUNCTION REFRESH SETTINGS (dipanggil sebelum print/preview)
  const refreshSettings = async () => {
    try {
      const profileData = await api.settings.get('main');
      if (profileData) {
        setStoreProfile(profileData);
      }
    } catch (error) {
      console.error('Error refreshing settings:', error);
    }
  };

  // ================= UPDATE STATUS + LOG + AUTO WA =================
  const handleStatusUpdate = async (newStatus) => {
    try {
      const newLog = {
        status: newStatus,
        date: new Date().toISOString(),
        updatedBy: 'Admin',
      };

      const updatedHistory = [...(order.statusHistory || []), newLog];

      await api.orders.update(order.id, {
        status: newStatus,
        statusHistory: updatedHistory,
      });

      setOrder({ ...order, status: newStatus, statusHistory: updatedHistory });
      toast.success(`Status Laundry: ${newStatus}`);

      if (autoWa) {
        let template = '';
        if (newStatus === 'proses') template = 'proses';
        if (newStatus === 'selesai') template = 'selesai';
        if (newStatus === 'diambil') template = 'ambil';

        if (template) {
          setTimeout(() => sendWA(template), 500);
          toast.info('Membuka WhatsApp...');
        }
      }
    } catch (e) {
      console.error(e);
      toast.error('Gagal update status');
    }
  };

  // ================= KONFIRMASI PEMBAYARAN =================
  const handlePaymentConfirm = async () => {
    if (confirm('Konfirmasi pembayaran sudah diterima?')) {
      const updatedPayment = { ...order.payment, status: 'paid' };
      await api.orders.update(order.id, {
        payment: updatedPayment,
        paymentStatus: 'paid',
      });
      setOrder({ ...order, payment: updatedPayment, paymentStatus: 'paid' });
      toast.success('Pembayaran dikonfirmasi: LUNAS!');
    }
  };

  // ================= SIMPAN CATATAN KERUSAKAN =================
  const handleSaveDamageNote = async () => {
    try {
      await api.orders.update(order.id, { damageNote });
      setOrder({ ...order, damageNote });
      toast.success('Catatan kerusakan disimpan');
    } catch {
      toast.error('Gagal menyimpan catatan');
    }
  };

  // ================= ESTIMASI SELESAI =================
  const getEstimation = () => {
    if (!order?.date || !order?.items) return null;
    const maxDuration = Math.max(...order.items.map(i => i.duration || 24));
    const targetDate = addHours(parseISO(order.date), maxDuration);
    return format(targetDate, 'dd MMM yyyy, HH:mm', { locale: id });
  };

  const isPaid = order?.payment?.status === 'paid';

  if (loading) return <div className="p-8 text-center text-gray-500">Memuat data...</div>;
  if (!order) return null;

  // ================= GENERATE RECEIPT TEXT =================
  const generateReceiptText = (isCopy = false) => {
    const WIDTH = 32;
    const rp = (n) => {
      const num = Math.round(Number(n || 0));
      const formatted = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      return `Rp${formatted}`;
    };

    const formatLine = (l, r) => l + ' '.repeat(Math.max(0, WIDTH - l.length - r.length)) + r;
    const center = (t) => ' '.repeat(Math.max(0, Math.floor((WIDTH - t.length) / 2))) + t;
    const dash = '-'.repeat(WIDTH);
    const dateStr = order.date ? format(parseISO(order.date), 'dd/MM/yy HH:mm') : '-';

    const payMethod = order.payment?.method?.toUpperCase() || 'CASH';
    const payStatus = order.payment?.status === 'paid' ? 'LUNAS' : 'BELUM LUNAS';

    let paymentDetails = '';
    if (order.payment?.method === 'cash') {
      paymentDetails =
        `${formatLine('BAYAR (TUNAI)', rp(order.payment.paidAmount))}\n` +
        `${formatLine('KEMBALI', rp(order.payment.change))}`;
    } else {
      paymentDetails =
        `${formatLine('METODE', payMethod)}\n` +
        `${formatLine('STATUS', payStatus)}`;
    }

    return `${center((storeProfile?.name || 'LAUNDRY').toUpperCase())}
${center(storeProfile?.address || '-')}
${center(storeProfile?.phone || '-')}
${dash}
${isCopy ? center('** COPY / SALINAN **') + '\n' : ''}No. Nota : ${order.invoiceNumber}
Tanggal  : ${dateStr}
Plg      : ${(order.customerName || 'Umum').toUpperCase().substring(0, 20)}
${dash}
${order.items.map(item => {
  const math = `${item.qty}x ${rp(item.price)}`;
  const total = rp(item.price * item.qty);
  return `${item.name.substring(0, WIDTH)}\n${formatLine(math, total)}`;
}).join('\n')}
${dash}
${order.delivery?.type === 'delivery' 
  ? `PENGIRIMAN: ${order.delivery.distance}km\n${formatLine('ONGKIR', rp(order.delivery.cost))}\n${dash}\n`
  : order.delivery?.type === 'dropoff' 
  ? `PENGAMBILAN: Drop-off\n${dash}\n`
  : `${dash}\n`
}${formatLine('SUBTOTAL', rp(order.subtotal || order.total))}
${order.discount > 0 ? formatLine('DISKON', `-${rp(order.discount)}`) : ''}
${formatLine('TOTAL TAGIHAN', rp(order.total))}
${dash}
${paymentDetails}
${order.damageNote ? `\n${dash}\nCATATAN KERUSAKAN:\n${order.damageNote}\n` : ''}
${dash}

${center('SYARAT & KETENTUAN:')}
- Wajib bawa nota saat ambil
- Promo 3k berlaku min 3kg
- Komplain max 1x24 jam
- Barang >30 hari hangus

${center('BAJU RAPI, HATI SANTUY.')}
${center('TERIMA KASIH')}
`;
  };

  // ================= ✅ FIX 3: PRINT RAWBT (REFRESH SETTINGS DULU!) =================
  const handlePrintRawBT = async () => {
    // ✅ REFRESH SETTINGS SEBELUM PRINT!
    await refreshSettings();
    
    const printCount = (order.printCount || 0) + 1;
    await api.orders.update(order.id, { printCount });
    setOrder({ ...order, printCount });

    const isCopy = printCount > 1;
    const receiptText = generateReceiptText(isCopy);
    const base64Data = btoa(receiptText);
    window.location.href = `rawbt:base64,${base64Data}`;
    setShowPreview(false);
  };

  // ================= SEND WHATSAPP TEMPLATE =================
  const sendWA = (type) => {
    const phone = order.customerPhone ? order.customerPhone.replace(/^0/, '62') : '';
    const name = order.customerName || 'Kak';
    const store = storeProfile?.name || 'Laundry Kami';
    const estimation = getEstimation();
    let msg = '';

    switch (type) {
      case 'masuk':
        msg = `Halo ${name}! Orderanmu sudah kami terima dgn nota *${order.invoiceNumber}*. Total: *${formatRupiah(order.total)}*. Estimasi selesai: ${estimation}. Terima kasih!`;
        break;
      case 'proses':
        msg = `Halo ${name}! Cucianmu sedang kami proses ya. Akan kami kabari jika sudah selesai. (${store})`;
        break;
      case 'selesai':
        msg = `Halo ${name}! Cucianmu sudah *SELESAI* & wangi. Silakan diambil ya! Total: *${formatRupiah(order.total)}*.`;
        break;
      case 'ambil':
        msg = `Halo ${name}! Terima kasih sudah mengambil cucian. Semoga puas dengan hasil setrika kami!`;
        break;
    }

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    setWaModalOpen(false);
  };

  const sendLoyaltyLink = async () => {
    const phone = order.customerPhone ? order.customerPhone.replace(/^0/, '62') : '';
    if (!phone) {
      toast.error('Nomor WhatsApp tidak tersedia');
      return;
    }
    
    let currentStamps = 0;
    let customerName = '';
    
    try {
      if (order.customerId) {
        const freshCustomer = await api.customers.get(order.customerId);
        if (freshCustomer) {
          currentStamps = freshCustomer.stamps || 0;
          customerName = freshCustomer.name || order.customerName || 'Kak';
          setCustomerData(freshCustomer); // Update state
        }
      }
    } catch (error) {
      console.error('Error fetching customer:', error);
      // Fallback ke data yang sudah ada
      currentStamps = customerData?.stamps || 0;
      customerName = order.customerName || 'Kak';
    }
    
    const loyaltyLink = `${window.location.origin}/loyalty/${order.customerId}`;
    
    const message = `Halo ${customerName}!\n\n*Cek Loyalty Card Kamu!*\n\nStamp Terkumpul: ${currentStamps}\n\nLink Card:\n${loyaltyLink}\n\nTerima kasih!`;
    
    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
    toast.success('Link loyalty card dikirim!');
    setWaModalOpen(false);
  };

  // ✅ TAMBAH HANDLER UNTUK REFRESH SETTINGS SEBELUM PREVIEW
  const handleShowPreview = async () => {
    await refreshSettings();
    setShowPreview(true);
  };

  return (
    <div className="min-h-screen bg-background pb-32 animate-slide-up">
      <div className="no-print p-6 space-y-6">
        {/* HEADER */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/orders')}>
            <ArrowLeft />
          </Button>
          <h1 className="text-xl font-bold">Detail Pesanan</h1>
        </div>

        {/* STATUS BAR */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-3 rounded-2xl border border-gray-100 flex flex-col justify-center items-center text-center">
            <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">
              Status Laundry
            </p>
            <div className="px-3 py-1 rounded-full text-xs font-bold capitalize bg-primary/10 text-primary">
              {order.status}
            </div>
          </div>

          <div
            onClick={!isPaid ? handlePaymentConfirm : undefined}
            className={`p-3 rounded-2xl border flex flex-col justify-center items-center text-center cursor-pointer ${
              isPaid
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            <p
              className={`text-[10px] uppercase font-bold mb-1 ${
                isPaid ? 'text-green-600' : 'text-red-600'
              }`}
            >
              Pembayaran
            </p>
            <div className="flex items-center gap-1">
              {isPaid ? (
                <CheckCircle size={16} className="text-green-600" />
              ) : (
                <Clock size={16} className="text-red-600" />
              )}
              <span
                className={`text-xs font-black ${
                  isPaid ? 'text-green-700' : 'text-red-700'
                }`}
              >
                {isPaid ? 'LUNAS' : 'PENDING'}
              </span>
            </div>
            {!isPaid && (
              <p className="text-[8px] text-red-500 mt-1">(Klik untuk konfirmasi)</p>
            )}
          </div>
        </div>

        {/* UPDATE STATUS FLOW */}
        <div className="bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Update Proses
            </p>

            <button
              onClick={() => setAutoWa(!autoWa)}
              className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${
                autoWa
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              Auto WA {autoWa ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {STATUS_FLOW.map((status) => (
              <button
                key={status}
                onClick={() => handleStatusUpdate(status)}
                className={`p-2 rounded-xl text-[10px] font-bold uppercase border-2 transition-all ${
                  order.status === status
                    ? 'border-primary bg-primary text-white'
                    : 'border-gray-100 text-gray-400 hover:border-primary/50 hover:text-primary'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* STATUS HISTORY */}
        <Card className="p-4 border-gray-100 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2 text-gray-700 font-bold text-sm">
              <History size={18} /> Riwayat Status
            </div>
          </div>

          <div className="space-y-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
            {order.statusHistory?.slice().reverse().map((log, idx) => (
              <div key={idx} className="flex justify-between text-xs">
                <span className="capitalize font-medium text-gray-800">
                  {log.status}
                </span>
                <span className="text-gray-400">
                  {format(parseISO(log.date), 'dd/MM HH:mm')}
                </span>
              </div>
            ))}
            {(!order.statusHistory || order.statusHistory.length === 0) && (
              <p className="text-center text-xs text-gray-300">
                Belum ada riwayat
              </p>
            )}
          </div>
        </Card>

        {/* RINCIAN NOTA */}
        <Card className="border-none shadow-lg shadow-gray-100/50">
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-dashed border-gray-200 pb-4">
              <div>
                <p className="text-xs text-text-muted">No. Nota</p>
                <p className="font-mono font-bold text-lg">
                  {order.invoiceNumber}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-text-muted">Metode Bayar</p>
                <p className="font-bold uppercase text-primary">
                  {order.payment?.method || '-'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-text-main">{item.name}</p>
                    <p className="text-xs text-text-muted">
                      {item.qty} x {formatRupiah(item.price)}
                    </p>
                  </div>
                  <p className="font-bold">
                    {formatRupiah(item.price * item.qty)}
                  </p>
                </div>
              ))}
            </div>

            {/* ESTIMASI */}
            <div className="bg-blue-50 p-3 rounded-xl flex items-center gap-3 border border-blue-100">
              <Calendar size={20} className="text-blue-600" />
              <div>
                <p className="text-xs text-blue-600 font-bold">Estimasi Selesai</p>
                <p className="text-sm font-black text-blue-800">
                  {getEstimation() || '-'}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t-2 border-gray-100 space-y-2">
              <div className="flex justify-between text-sm text-text-muted">
                <span>Subtotal</span>
                <span>{formatRupiah(order.subtotal || order.total)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600 font-bold">
                  <span>Diskon</span>
                  <span>- {formatRupiah(order.discount)}</span>
                </div>
              )}
              {order.delivery?.cost > 0 && (
                <div className="flex justify-between text-sm text-orange-600 font-bold">
                  <span>Ongkir ({order.delivery?.distance}km)</span>
                  <span>+ {formatRupiah(order.delivery.cost)}</span>
                </div>
              )}
              {order.delivery?.type === 'delivery' && order.delivery?.distance && (
                <p className="text-[10px] text-orange-500 flex items-center gap-1">
                  Pengiriman ke alamat customer
                </p>
              )}
              <div className="flex justify-between items-center pt-2">
                <span className="font-bold text-lg">Total Bayar</span>
                <span className="font-black text-2xl text-primary">
                  {formatRupiah(order.total)}
                </span>
              </div>

              {/* DETAIL PEMBAYARAN */}
              {order.payment?.method === 'cash' && (
                <div className="bg-gray-50 p-2 rounded-lg text-xs space-y-1 mt-2">
                  <div className="flex justify-between">
                    <span>Tunai Diterima:</span>
                    <span>{formatRupiah(order.payment.paidAmount)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-green-700">
                    <span>Kembalian:</span>
                    <span>{formatRupiah(order.payment.change)}</span>
                  </div>
                </div>
              )}

              {order.payment?.method !== 'cash' && order.payment && (
                <div className="bg-gray-50 p-2 rounded-lg text-xs space-y-1 mt-2">
                  <div className="flex justify-between">
                    <span>Metode:</span>
                    <span className="uppercase">{order.payment.method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span
                      className={
                        isPaid
                          ? 'text-green-600 font-bold'
                          : 'text-red-600 font-bold'
                      }
                    >
                      {isPaid ? 'LUNAS' : 'PENDING'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* CATATAN KERUSAKAN */}
        <Card className="p-4 space-y-3 border-orange-100 bg-orange-50/30">
          <div className="flex items-center gap-2 text-orange-700">
            <AlertTriangle size={18} />
            <h3 className="font-bold text-sm">Catatan Kerusakan / Khusus</h3>
          </div>
          <textarea
            className="w-full p-3 rounded-xl border border-orange-200 bg-white text-sm focus:ring-2 focus:ring-orange-400 outline-none"
            rows={2}
            placeholder="Contoh: Kancing lepas, noda tinta di kerah..."
            value={damageNote}
            onChange={(e) => setDamageNote(e.target.value)}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={handleSaveDamageNote}
            className="w-full border-orange-200 text-orange-700 hover:bg-orange-100"
          >
            <Save size={16} className="mr-2" /> Simpan Catatan
          </Button>
        </Card>

        {/* BUTTONS */}
        <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-lg border-t border-gray-100 p-4 pb-8 z-40 flex gap-3 max-w-md mx-auto right-0">
          <Button
            variant="outline"
            className="flex-1 gap-2 border-primary text-primary hover:bg-primary/5"
            onClick={handleShowPreview}
          >
            <Printer size={18} /> Print {(order.printCount || 0) > 0 ? `(${order.printCount}x)` : ''}
          </Button>
          <Button
            className="flex-1 gap-2 bg-green-600 hover:bg-green-700 shadow-green-600/30"
            onClick={() => setWaModalOpen(true)}
          >
            <MessageCircle size={18} /> WhatsApp
          </Button>
        </div>
      </div>

      {/* MODAL PREVIEW STRUK */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowPreview(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-t-3xl shadow-xl animate-slide-up">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h2 className="text-base font-bold">Preview Struk</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="mx-5 border-t border-gray-100" />

            <div className="mx-5 mt-4 mb-4 max-h-[55vh] overflow-y-auto">
              <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-4">
                <pre className="text-[11px] leading-normal text-gray-800 whitespace-pre font-mono tracking-tight">
                  {generateReceiptText((order.printCount || 0) > 0)}
                </pre>
              </div>
            </div>

            <div className="px-5 pb-8 pt-2 flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-gray-200 text-gray-600 hover:bg-gray-50"
                onClick={() => setShowPreview(false)}
              >
                Tutup
              </Button>
              <Button
                className="flex-1 gap-2 bg-primary hover:bg-primary/90 shadow-primary/30"
                onClick={handlePrintRawBT}
              >
                <Printer size={16} /> Cetak Sekarang
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PILIH TEMPLATE WA */}
      <AnimatePresence>
        {isWaModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-60 flex items-end justify-center backdrop-blur-sm"
            onClick={() => setWaModalOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white w-full max-w-md rounded-t-3xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">Pilih Pesan WhatsApp</h3>
                <button onClick={() => setWaModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => sendWA('masuk')}
                  className="p-4 bg-gray-50 hover:bg-green-50 border border-gray-200 rounded-xl text-left flex items-center gap-3 transition-colors"
                >
                  <div className="bg-green-100 text-green-600 p-2 rounded-full">
                    <MessageCircle size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Nota Order Masuk</p>
                    <p className="text-[10px] text-gray-500">
                      Kirim rincian nota & estimasi
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => sendWA('proses')}
                  className="p-4 bg-gray-50 hover:bg-blue-50 border border-gray-200 rounded-xl text-left flex items-center gap-3 transition-colors"
                >
                  <div className="bg-blue-100 text-blue-600 p-2 rounded-full">
                    <Clock size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Sedang Diproses</p>
                    <p className="text-[10px] text-gray-500">
                      Info cucian sedang dikerjakan
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => sendWA('selesai')}
                  className="p-4 bg-gray-50 hover:bg-purple-50 border border-gray-200 rounded-xl text-left flex items-center gap-3 transition-colors"
                >
                  <div className="bg-purple-100 text-purple-600 p-2 rounded-full">
                    <CheckCircle size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Order Selesai</p>
                    <p className="text-[10px] text-gray-500">
                      Info cucian siap diambil
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => sendWA('ambil')}
                  className="p-4 bg-gray-50 hover:bg-orange-50 border border-gray-200 rounded-xl text-left flex items-center gap-3 transition-colors"
                >
                  <div className="bg-orange-100 text-orange-600 p-2 rounded-full">
                    <User size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Sudah Diambil</p>
                    <p className="text-[10px] text-gray-500">
                      Ucapan terima kasih
                    </p>
                  </div>
                </button>

                <div className="border-t border-gray-200 pt-3 mt-2">
                  <button
                    onClick={sendLoyaltyLink}
                    className="w-full p-4 bg-linear-to-r from-orange-50 to-yellow-50 hover:from-orange-100 hover:to-yellow-100 border border-orange-200 rounded-xl text-left flex items-center gap-3 transition-colors"
                  >
                    <div className="bg-orange-200 text-orange-700 p-2 rounded-full">
                      <Gift size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-orange-900">Kirim Loyalty Card</p>
                      <p className="text-[10px] text-orange-700">
                        Link kartu member & stamp
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrderDetail;