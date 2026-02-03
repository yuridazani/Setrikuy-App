import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/Buttons';
import { Card } from '@/components/ui/Cards';
import { formatRupiah } from '@/lib/utils';
import { Printer, MessageCircle, ArrowLeft, Share2, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';

const OrderDetail = () => {
  const { id: orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Ambil Data Order
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        // Parse ID ke number karena Dexie auto-increment pakai number
        const data = await db.orders.get(parseInt(orderId));
        if (data) {
          setOrder(data);
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
    fetchOrder();
  }, [orderId, navigate]);

  if (loading) return <div className="p-8 text-center text-gray-500">Memuat data...</div>;
  if (!order) return null;

  // 2. Logic Print Thermal
  const handlePrint = () => {
    window.print();
  };

  // 3. Logic WhatsApp Generator
  const handleSendWA = () => {
    const customerPhone = order.customer?.phone || "628123456789"; // Ganti dengan order.customer.phone nanti
    const customerName = order.customer?.name || "Pelanggan Setia"; // Ganti dengan order.customer.name

    const itemsList = order.items.map(item => 
      `- ${item.name} (${item.qty}x) : ${formatRupiah(item.price * item.qty)}`
    ).join('%0a'); // %0a adalah Enter di URL

    const message = `Halo Kak *${customerName}*! 👋%0a%0a` +
      `Terima kasih sudah laundry di *SETRIKUY*.%0a` +
      `Berikut detail pesanan kakak:%0a%0a` +
      `🧾 No. Nota: *${order.invoiceNumber}*%0a` +
      `📅 Tgl: ${format(new Date(order.date), 'dd MMMM yyyy', { locale: id })}%0a%0a` +
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
      {/* --- UI LAYAR HP (TIDAK AKAN DICETAK) --- */}
      <div className="no-print p-6 space-y-6">
        {/* Header Nav */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
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

            {/* Total */}
            <div className="flex justify-between items-center pt-4 border-t-2 border-gray-100">
              <span className="font-bold text-lg">Total Bayar</span>
              <span className="font-black text-2xl text-primary">{formatRupiah(order.total)}</span>
            </div>
          </div>
        </Card>

        {/* Sticky Action Buttons */}
        <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-lg border-t border-gray-100 p-4 pb-8 z-40 flex gap-3 max-w-md mx-auto right-0">
          <Button variant="outline" className="flex-1 gap-2" onClick={handlePrint}>
            <Printer size={18} /> Cetak
          </Button>
          <Button className="flex-1 gap-2 bg-green-600 hover:bg-green-700 shadow-green-600/30" onClick={handleSendWA}>
            <MessageCircle size={18} /> WhatsApp
          </Button>
        </div>
      </div>

      {/* --- UI KHUSUS PRINT THERMAL (HANYA MUNCUL SAAT PRINT) --- */}
      <div id="printable-area" className="hidden print:block bg-white p-2 text-black font-mono text-[12px] leading-tight w-full max-w-[58mm] mx-auto">
        <div className="text-center mb-4">
          <h2 className="font-black text-lg uppercase tracking-widest">SETRIKUY PANDAAN</h2>
          <p className="text-[10px]">Premium Steam Iron Service</p>
          <p className="text-[10px]">Lingk. Jogonalan RT.003/RW.004 (0823-3835-1245)</p>
        </div>

        <div className="border-b border-dashed border-black mb-2 pb-2">
          <div className="flex justify-between">
            <span>Nota:</span>
            <span>{order.invoiceNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>Tgl:</span>
            <span>{format(new Date(order.date), 'dd/MM/yy HH:mm')}</span>
          </div>
          <div className="flex justify-between">
            <span>Plg:</span>
            <span>Pelanggan Umum</span> {/* Nanti ganti dynamic */}
          </div>
        </div>

        <div className="space-y-2 mb-4">
          {order.items.map((item, idx) => (
            <div key={idx}>
              <div className="font-bold">{item.name}</div>
              <div className="flex justify-between">
                <span>{item.qty} x {item.price.toLocaleString()}</span>
                <span>{(item.price * item.qty).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-black pt-2 mb-4">
          <div className="flex justify-between font-black text-sm">
            <span>TOTAL</span>
            <span>{formatRupiah(order.total)}</span>
          </div>
          <div className="flex justify-between text-[10px] mt-1">
            <span>Bayar:</span>
            <span>{order.paymentStatus.toUpperCase()}</span>
          </div>
        </div>

        <div className="text-center text-[10px] mt-6">
          <p>Terima kasih sudah laundry disini!</p>
          <p>Barang tidak diambil lebih 30 hari</p>
          <p>bukan tanggung jawab kami.</p>
          <p className="mt-2 text-[8px] italic">Powered by Setrikuy App</p>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;