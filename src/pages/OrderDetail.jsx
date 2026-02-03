import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/db'; // Pakai API Wrapper
import { Button } from '@/components/ui/Buttons';
import { Card } from '@/components/ui/Cards';
import { formatRupiah } from '@/lib/utils';
import { Printer, MessageCircle, ArrowLeft, CheckCircle, RefreshCw } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';

const OrderDetail = () => {
  const { id: orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [storeProfile, setStoreProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Ambil Data Order & Profil Toko
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Ambil Order (HAPUS parseInt KARENA ID FIREBASE ADALAH STRING)
        const orderData = await api.orders.get(orderId);
        
        // Ambil Profil Toko
        const profileData = await api.settings.get('store_profile');
        
        if (orderData) {
          setOrder(orderData);
          setStoreProfile(profileData || { name: 'SETRIKUY', address: 'Alamat belum diatur', phone: '-' });
        } else {
          toast.error("Order tidak ditemukan");
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

  // LOGIC UPDATE STATUS
  const handleStatusUpdate = async (newStatus) => {
    try {
        await api.orders.update(order.id, { status: newStatus });
        setOrder({ ...order, status: newStatus });
        toast.success(`Status diubah ke: ${newStatus}`);
    } catch (e) {
        toast.error("Gagal update status");
    }
  };

  const STATUS_FLOW = ['antrian', 'proses', 'selesai', 'diambil'];

  if (loading) return <div className="p-8 text-center text-gray-500">Memuat data...</div>;
  if (!order) return null;

  // --- LOGIC PRINT RAWBT (Sama seperti sebelumnya) ---
  const handlePrintRawBT = () => {
    const formatLine = (label, value) => {
      const maxWidth = 32; 
      const space = maxWidth - label.length - value.length;
      return label + ' '.repeat(Math.max(0, space)) + value;
    };
    const dashLine = '-'.repeat(32);
    
    // Parse tanggal aman
    const dateStr = order.date ? format(parseISO(order.date), 'dd/MM/yy HH:mm') : '-';

    const receiptText = 
`
[C]<b>${storeProfile?.name || 'LAUNDRY'}</b>
[C]${storeProfile?.address || '-'}
[C]${storeProfile?.phone || '-'}
${dashLine}
No. Nota : ${order.invoiceNumber}
Tanggal  : ${dateStr}
Plg      : ${order.customerName || 'Umum'}
${dashLine}
${order.items.map(item => {
  return `${item.name}\n` + formatLine(`${item.qty}x ${item.price.toLocaleString()}`, (item.price * item.qty).toLocaleString());
}).join('\n')}
${dashLine}
${formatLine('SUBTOTAL', order.subtotal ? order.subtotal.toLocaleString() : order.total.toLocaleString())}
${order.discount > 0 ? formatLine('DISKON', `-${order.discount.toLocaleString()}`) : ''}
[L]<b>${formatLine('TOTAL', formatRupiah(order.total))}</b>
${dashLine}
[L]Bayar: ${(order.paymentStatus || 'Unpaid').toUpperCase()}
[C]
[C]Terima Kasih
`;
    const base64Data = btoa(receiptText);
    window.location.href = `rawbt:base64,${base64Data}`;
  };

  // Logic WA (Sedikit update di parsing nomor HP)
  const handleSendWA = () => {
    const customerPhone = order.customerPhone ? order.customerPhone.replace(/^0/, '62') : "";
    const customerName = order.customerName || "Pelanggan";
    const dateStr = order.date ? format(parseISO(order.date), 'dd MMM yyyy', { locale: id }) : '-';

    const itemsList = order.items.map(item => 
      `- ${item.name} (${item.qty}x) : ${formatRupiah(item.price * item.qty)}`
    ).join('%0a');

    const message = `Halo Kak *${customerName}*! 👋%0a%0a` +
      `Terima kasih sudah laundry di *${storeProfile?.name || 'SETRIKUY'}*.%0a` +
      `Berikut detail pesanan kakak:%0a%0a` +
      `🧾 No. Nota: *${order.invoiceNumber}*%0a` +
      `📅 Tgl: ${dateStr}%0a%0a` +
      `*Rincian:*%0a${itemsList}%0a` +
      `--------------------------------%0a` +
      `*TOTAL: ${formatRupiah(order.total)}*%0a` +
      `--------------------------------%0a%0a` +
      `Status: *${order.status.toUpperCase()}*%0a%0a` +
      `Simpan struk ini untuk pengambilan ya kak! ✨`;

    window.open(`https://wa.me/${customerPhone}?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background pb-32 animate-slide-up">
      <div className="no-print p-6 space-y-6">
        {/* Header Nav */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/orders')}>
            <ArrowLeft />
          </Button>
          <h1 className="text-xl font-bold">Detail Pesanan</h1>
        </div>

        {/* Status Card & Updater */}
        <div className="bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Update Status</p>
            <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
              order.status === 'selesai' ? 'bg-green-100 text-green-700' : 'bg-primary/10 text-primary'
            }`}>
              {order.status}
            </span>
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            {STATUS_FLOW.map((status) => (
              <button
                key={status}
                onClick={() => handleStatusUpdate(status)}
                className={`p-2 rounded-xl text-[10px] font-bold uppercase transition-all border-2 ${
                  order.status === status 
                  ? 'border-primary bg-primary text-white shadow-lg shadow-primary/30' 
                  : 'border-gray-100 text-gray-400 hover:border-primary/50 hover:text-primary'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Invoice Info */}
        <Card className="border-none shadow-lg shadow-gray-100/50">
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-dashed border-gray-200 pb-4">
              <div>
                <p className="text-xs text-text-muted">No. Nota</p>
                <p className="font-mono font-bold text-lg">{order.invoiceNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-text-muted">Tanggal</p>
                <p className="font-bold">{order.date ? format(parseISO(order.date), 'dd/MM/yyyy') : '-'}</p>
              </div>
            </div>

            {/* List Item */}
            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-text-main">{item.name}</p>
                    <p className="text-xs text-text-muted">{item.qty} x {formatRupiah(item.price)}</p>
                  </div>
                  <p className="font-bold">{formatRupiah(item.price * item.qty)}</p>
                </div>
              ))}
            </div>

            {/* Summary */}
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
                <span className="font-black text-2xl text-primary">{formatRupiah(order.total)}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Sticky Action Buttons */}
        <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-lg border-t border-gray-100 p-4 pb-8 z-40 flex gap-3 max-w-md mx-auto right-0">
          <Button variant="outline" className="flex-1 gap-2 border-primary text-primary hover:bg-primary/5" onClick={handlePrintRawBT}>
            <Printer size={18} /> Cetak
          </Button>
          <Button className="flex-1 gap-2 bg-green-600 hover:bg-green-700 shadow-green-600/30" onClick={handleSendWA}>
            <MessageCircle size={18} /> WhatsApp
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;