import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/Buttons';
import { Card } from '@/components/ui/Cards';
import { formatRupiah } from '@/lib/utils';
import { Printer, MessageCircle, ArrowLeft, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
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
        // Ambil Order
        const orderData = await db.orders.get(parseInt(orderId));
        
        // Ambil Profil Toko untuk Header Struk
        const profileData = await db.settings.get('store_profile');
        
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

  if (loading) return <div className="p-8 text-center text-gray-500">Memuat data...</div>;
  if (!order) return null;

  // --- 2. LOGIC PRINT RAWBT (THERMAL) ---
  const handlePrintRawBT = () => {
    // Helper untuk meratakan teks (Kiri - Kanan)
    const formatLine = (label, value) => {
      // Asumsi lebar kertas 32 karakter (standar 58mm font normal)
      const maxWidth = 32; 
      const space = maxWidth - label.length - value.length;
      return label + ' '.repeat(Math.max(0, space)) + value;
    };

    // Helper Garis Putus
    const dashLine = '-'.repeat(32);

    // Susun Format Struk (Plain Text)
    // Gunakan \n untuk enter
    const receiptText = 
`
[C]<b>${storeProfile.name}</b>
[C]${storeProfile.address}
[C]${storeProfile.phone}
${dashLine}
No. Nota : ${order.invoiceNumber}
Tanggal  : ${format(new Date(order.date), 'dd/MM/yy HH:mm')}
Plg      : ${order.customerName || 'Umum'}
${dashLine}
${order.items.map(item => {
  // Format: Nama Item (Enter) Qty x Harga = Total
  return `${item.name}\n` + formatLine(`${item.qty}x ${item.price.toLocaleString()}`, (item.price * item.qty).toLocaleString());
}).join('\n')}
${dashLine}
${formatLine('SUBTOTAL', order.subtotal ? order.subtotal.toLocaleString() : order.total.toLocaleString())}
${order.discount > 0 ? formatLine('DISKON', `-${order.discount.toLocaleString()}`) : ''}
[L]<b>${formatLine('TOTAL', formatRupiah(order.total))}</b>
${dashLine}
[L]Bayar: ${order.paymentStatus.toUpperCase()}
[C]
[C]Terima Kasih
[C]Simpan struk ini sebagai bukti
`;

    // Encode ke Base64
    const base64Data = btoa(receiptText);
    
    // Panggil RawBT via Intent URL
    const rawbtUrl = `rawbt:base64,${base64Data}`;
    window.location.href = rawbtUrl;
  };

  // 3. Logic WhatsApp Generator (Existing)
  const handleSendWA = () => {
    const customerPhone = order.customerPhone ? order.customerPhone.replace(/^0/, '62') : "";
    const customerName = order.customerName || "Pelanggan";

    const itemsList = order.items.map(item => 
      `- ${item.name} (${item.qty}x) : ${formatRupiah(item.price * item.qty)}`
    ).join('%0a');

    const message = `Halo Kak *${customerName}*! 👋%0a%0a` +
      `Terima kasih sudah laundry di *${storeProfile?.name || 'SETRIKUY'}*.%0a` +
      `Berikut detail pesanan kakak:%0a%0a` +
      `🧾 No. Nota: *${order.invoiceNumber}*%0a` +
      `📅 Tgl: ${format(new Date(order.date), 'dd MMM yyyy', { locale: id })}%0a%0a` +
      `*Rincian:*%0a${itemsList}%0a` +
      `--------------------------------%0a` +
      `*TOTAL: ${formatRupiah(order.total)}*%0a` +
      `--------------------------------%0a%0a` +
      `Status: *${order.status.toUpperCase()}*%0a%0a` +
      `Simpan struk ini untuk pengambilan ya kak! ✨`;

    const url = `https://wa.me/${customerPhone}?text=${message}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-background pb-32 animate-slide-up">
      <div className="p-6 space-y-6">
        {/* Header Nav */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/orders')}>
            <ArrowLeft />
          </Button>
          <h1 className="text-xl font-bold">Detail Pesanan</h1>
        </div>

        {/* Status Card */}
        <div className="bg-primary/10 p-6 rounded-[24px] flex items-center gap-4 text-primary border border-primary/20">
          <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center shadow-sm">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider opacity-70">Status Order</p>
            <p className="text-xl font-extrabold capitalize">{order.status}</p>
          </div>
        </div>

        {/* Invoice Info UI (Hanya Tampilan Layar HP) */}
        <Card className="border-none shadow-lg shadow-gray-100/50">
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-dashed border-gray-200 pb-4">
              <div>
                <p className="text-xs text-text-muted">No. Nota</p>
                <p className="font-mono font-bold text-lg">{order.invoiceNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-text-muted">Tanggal</p>
                <p className="font-bold">{format(new Date(order.date), 'dd/MM/yyyy')}</p>
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
            <Printer size={18} /> Cetak Struk
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