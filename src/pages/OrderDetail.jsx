import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/db';
import { Button } from '@/components/ui/Buttons';
import { Card } from '@/components/ui/Cards';
import { formatRupiah } from '@/lib/utils';
import { Printer, MessageCircle, ArrowLeft, CheckCircle, Clock, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';

const OrderDetail = () => {
  const { id: orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [storeProfile, setStoreProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false); // ← state baru

  // ================= LOAD DATA =================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const orderData = await api.orders.get(orderId);
        const profileData = await api.settings.get('store_profile');

        if (orderData) {
          setOrder(orderData);
          setStoreProfile(
            profileData || { name: 'SETRIKUY', address: 'Alamat belum diatur', phone: '-' }
          );
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

  // ================= UPDATE STATUS LAUNDRY =================
  const handleStatusUpdate = async (newStatus) => {
    try {
      await api.orders.update(order.id, { status: newStatus });
      setOrder({ ...order, status: newStatus });
      toast.success(`Status Laundry: ${newStatus}`);
    } catch {
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

  const STATUS_FLOW = ['antrian', 'proses', 'selesai', 'diambil'];

  if (loading) return <div className="p-8 text-center text-gray-500">Memuat data...</div>;
  if (!order) return null;

  const isPaid = order.payment?.status === 'paid';

  // ================= GENERATE RECEIPT TEXT (dipake preview + print) =================
  const generateReceiptText = () => {
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
No. Nota : ${order.invoiceNumber}
Tanggal  : ${dateStr}
Plg      : ${(order.customerName || 'Umum').toUpperCase().substring(0, 20)}
${dash}
${order.items.map(item => {
  const math = `${item.qty}x ${rp(item.price)}`;
  const total = rp(item.price * item.qty);
  return `${item.name.substring(0, WIDTH)}\n${formatLine(math, total)}`;
}).join('\n')}
${dash}
${formatLine('SUBTOTAL', rp(order.subtotal || order.total))}
${order.discount > 0 ? formatLine('DISKON', `-${rp(order.discount)}`) : ''}
${formatLine('TOTAL TAGIHAN', rp(order.total))}
${dash}
${paymentDetails}
${dash}
${order.notes ? `Catatan:\n${order.notes}` : ''}

${center('SYARAT & KETENTUAN:')}
- Wajib bawa nota saat ambil
- Promo 3k berlaku min 3kg
- Komplain max 1x24 jam
- Barang >30 hari hangus

${center('BAJU RAPI, HATI SANTUY.')}
${center('TERIMA KASIH')}
`;
  };

  // ================= PRINT RAWBT =================
  const handlePrintRawBT = () => {
    const receiptText = generateReceiptText();
    const base64Data = btoa(receiptText);
    window.location.href = `rawbt:base64,${base64Data}`;
    setShowPreview(false); // tutup modal setelah print
  };

  // ================= SEND WHATSAPP =================
  const handleSendWA = () => {
    const customerPhone = order.customerPhone
      ? order.customerPhone.replace(/^0/, '62')
      : '';
    const customerName = order.customerName || 'Pelanggan';
    const dateStr = order.date
      ? format(parseISO(order.date), 'dd MMM yyyy', { locale: id })
      : '-';

    const itemsList = order.items
      .map(
        (item) =>
          `- ${item.name} (${item.qty}x) : ${formatRupiah(item.price * item.qty)}`
      )
      .join('%0a');

    const message =
      `Halo Kak *${customerName}*! 👋%0a%0a` +
      `Terima kasih sudah laundry di *${storeProfile?.name || 'SETRIKUY'}*.%0a` +
      `Berikut detail pesanan kakak:%0a%0a` +
      `🧾 No. Nota: *${order.invoiceNumber}*%0a` +
      `📅 Tgl: ${dateStr}%0a%0a` +
      `*Rincian:*%0a${itemsList}%0a` +
      `--------------------------------%0a` +
      `*TOTAL: ${formatRupiah(order.total)}*%0a` +
      `--------------------------------%0a%0a` +
      `Status Laundry: *${order.status.toUpperCase()}*%0a` +
      `Status Bayar: *${isPaid ? 'LUNAS' : 'PENDING'}*%0a%0a` +
      `Simpan struk ini untuk pengambilan ya kak! ✨`;

    window.open(`https://wa.me/${customerPhone}?text=${message}`, '_blank');
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
          {/* Status Laundry */}
          <div className="bg-white p-3 rounded-2xl border border-gray-100 flex flex-col justify-center items-center text-center">
            <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">
              Status Laundry
            </p>
            <div className="px-3 py-1 rounded-full text-xs font-bold capitalize bg-primary/10 text-primary">
              {order.status}
            </div>
          </div>

          {/* Status Pembayaran */}
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
          <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">
            Update Proses
          </p>
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

              {order.notes && (
                <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded-lg mt-2">
                  Catatan: {order.notes}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* BUTTONS */}
        <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-lg border-t border-gray-100 p-4 pb-8 z-40 flex gap-3 max-w-md mx-auto right-0">
          <Button
            variant="outline"
            className="flex-1 gap-2 border-primary text-primary hover:bg-primary/5"
            onClick={() => setShowPreview(true)} // ← buka preview dulu
          >
            <Printer size={18} /> Cetak
          </Button>
          <Button
            className="flex-1 gap-2 bg-green-600 hover:bg-green-700 shadow-green-600/30"
            onClick={handleSendWA}
          >
            <MessageCircle size={18} /> WhatsApp
          </Button>
        </div>
      </div>

      {/* ================= MODAL PREVIEW STRUK ================= */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowPreview(false)}
          />

          {/* Modal Panel — slide up dari bawah */}
          <div className="relative w-full max-w-md bg-white rounded-t-3xl shadow-xl animate-slide-up">
            {/* Header Modal */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h2 className="text-base font-bold">Preview Struk</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Divider */}
            <div className="mx-5 border-t border-gray-100" />

            {/* Konten Struk — scrollable */}
            <div className="mx-5 mt-4 mb-4 max-h-[55vh] overflow-y-auto">
              <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-4">
                <pre className="text-[11px] leading-[1.5] text-gray-800 whitespace-pre font-mono tracking-tight">
                  {generateReceiptText()}
                </pre>
              </div>
            </div>

            {/* Tombol Aksi */}
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
    </div>
  );
};

export default OrderDetail;