import { useRealtime } from '@/lib/hooks'; // Hook Firebase
import { Card } from '@/components/ui/Cards';
import { formatRupiah } from '@/lib/utils';
import { format, parseISO } from 'date-fns'; // Tambah parseISO untuk aman
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { orderBy } from 'firebase/firestore'; // Untuk sorting

const OrderHistory = () => {
  // Ambil data orders realtime, urutkan berdasarkan tanggal (descending)
  const orders = useRealtime('orders', [orderBy('date', 'desc')]);
  const navigate = useNavigate();

  return (
    <div className="p-6 pb-32 animate-slide-up space-y-6">
      <h1 className="text-2xl font-extrabold text-text-main">Riwayat Order</h1>

      {/* Search Bar Sederhana */}
      <div className="bg-white p-3 rounded-2xl flex items-center gap-3 shadow-sm border border-gray-100">
        <Search className="text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Cari nota atau nama..." 
          className="bg-transparent outline-none w-full text-sm font-medium"
        />
      </div>

      <div className="space-y-4">
        {!orders?.length && (
          <div className="text-center py-10 text-gray-400">Belum ada transaksi</div>
        )}

        {orders?.map((order) => (
          <div key={order.id} onClick={() => navigate(`/orders/${order.id}`)}>
            <Card className="p-5 active:scale-[0.98] transition-transform cursor-pointer border-transparent hover:border-primary/20">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg">
                    {order.invoiceNumber}
                  </span>
                  <p className="text-xs text-text-muted mt-2">
                    {/* Gunakan parseISO karena tanggal di Firebase string */}
                    {order.date ? format(parseISO(order.date), 'dd MMM yyyy, HH:mm') : '-'}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                  order.status === 'selesai' ? 'bg-green-100 text-green-700' : 'bg-orange/10 text-orange'
                }`}>
                  {order.status}
                </div>
              </div>
              
              <div className="flex justify-between items-end border-t border-dashed border-gray-100 pt-3 mt-2">
                <p className="text-sm font-medium text-text-muted">Total Belanja</p>
                <p className="text-lg font-black text-text-main">{formatRupiah(order.total)}</p>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderHistory;