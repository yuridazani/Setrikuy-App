import { useState } from 'react';
import { useRealtime } from '@/lib/hooks';
import { api } from '@/lib/db';
import { Card } from '@/components/ui/Cards';
import { formatRupiah } from '@/lib/utils';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay, subDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Search, Trash2, Calendar } from 'lucide-react';
import { orderBy } from 'firebase/firestore';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const STATUSES = ['all', 'antrian', 'proses', 'selesai', 'diambil', 'batal'];
const DATE_FILTERS = [
  { label: 'Hari Ini', days: 0 },
  { label: 'Kemarin', days: 1 },
  { label: '7 Hari', days: 7 },
  { label: '30 Hari', days: 30 },
];
const PAYMENT_FILTERS = ['all', 'paid', 'pending'];

const OrderHistory = () => {
  const orders = useRealtime('orders', [orderBy('date', 'desc')]);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState(0);
  const [paymentFilter, setPaymentFilter] = useState('all');

  // DELETE ORDER
  const handleDelete = async (e, orderId) => {
    e.stopPropagation();
    if (confirm("Yakin ingin menghapus riwayat order ini? Data akan hilang permanen.")) {
      try {
        await api.orders.delete(orderId);
        toast.success("Order berhasil dihapus");
      } catch (error) {
        console.error(error);
        toast.error("Gagal menghapus order");
      }
    }
  };

  // FILTER: SEARCH + STATUS + DATE + PAYMENT
  const filteredOrders = orders.filter(order => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      (order.invoiceNumber?.toLowerCase() || '').includes(term) ||
      (order.customerName?.toLowerCase() || '').includes(term);
    const matchStatus = statusFilter === 'all' || order.status === statusFilter;
    
    // Date filter
    const orderDate = parseISO(order.date);
    const startDate = startOfDay(subDays(new Date(), dateFilter));
    const endDate = endOfDay(new Date());
    const matchDate = isWithinInterval(orderDate, { start: startDate, end: endDate });
    
    // Payment filter
    const paymentStatus = order.payment?.status || order.paymentStatus || 'pending';
    const matchPayment = paymentFilter === 'all' || paymentStatus === paymentFilter;
    
    return matchSearch && matchStatus && matchDate && matchPayment;
  });

  return (
    <div className="p-6 pb-32 animate-slide-up space-y-6">
      <h1 className="text-2xl font-extrabold text-text-main">Riwayat Order</h1>

      {/* SEARCH + STATUS + DATE + PAYMENT FILTER */}
      <div className="space-y-3 sticky top-0 z-20 bg-background/95 backdrop-blur-sm py-2">
        
        {/* SEARCH */}
        <div className="bg-white p-3 rounded-2xl flex items-center gap-3 shadow-sm border border-gray-100">
          <Search className="text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Cari nota / nama..."
            className="bg-transparent outline-none w-full text-sm font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-xs font-bold text-gray-400"
            >
              Clear
            </button>
          )}
        </div>

        {/* DATE FILTER */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {DATE_FILTERS.map(df => (
            <button
              key={df.days}
              onClick={() => setDateFilter(df.days)}
              className={`px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1 ${
                dateFilter === df.days
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Calendar size={14} />
              {df.label}
            </button>
          ))}
        </div>

        {/* STATUS + PAYMENT TABS */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          <div className="flex gap-2">
            {STATUSES.map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-2 rounded-lg text-xs font-bold capitalize whitespace-nowrap transition-all border ${
                  statusFilter === status
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {status === 'all' ? 'Status' : status}
              </button>
            ))}
          </div>

          {/* Payment Filter */}
          <div className="flex gap-2 border-l-2 border-gray-200 pl-2">
            {PAYMENT_FILTERS.map(pf => (
              <button
                key={pf}
                onClick={() => setPaymentFilter(pf)}
                className={`px-3 py-2 rounded-lg text-xs font-bold capitalize whitespace-nowrap transition-all border ${
                  paymentFilter === pf
                    ? 'bg-green-500 text-white border-green-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {pf === 'all' ? 'Bayar' : pf === 'paid' ? 'Lunas' : 'Pending'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* LIST ORDER */}
      <div className="space-y-3">
        {filteredOrders.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            {orders.length === 0 ? "Belum ada transaksi" : "Data tidak ditemukan"}
          </div>
        )}

        <AnimatePresence>
          {filteredOrders.map(order => (
            <motion.div
              key={order.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => navigate(`/orders/${order.id}`)}
            >
              <Card className="p-4 active:scale-[0.98] transition-transform cursor-pointer border-transparent hover:border-primary/20 relative group">
                
                {/* DELETE BUTTON */}
                <button
                  onClick={(e) => handleDelete(e, order.id)}
                  className="absolute top-2 right-2 p-2 bg-red-50 text-red-500 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:bg-red-100 z-10"
                >
                  <Trash2 size={16} />
                </button>

                <div className="flex justify-between items-start mb-2 pr-8">
                  <div>
                    <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-1 rounded-md tracking-wider">
                      {order.invoiceNumber}
                    </span>
                    <h3 className="font-bold text-lg text-text-main mt-2 leading-tight">
                      {order.customerName || "Pelanggan Umum"}
                    </h3>
                    <p className="text-xs text-text-muted mt-1">
                      {order.date ? format(parseISO(order.date), 'dd MMM yyyy, HH:mm') : '-'}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-end border-t border-dashed border-gray-100 pt-3 mt-2">
                  <div
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                      order.status === 'selesai'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-orange/10 text-orange'
                    }`}
                  >
                    {order.status}
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Total</p>
                    <p className="text-lg font-black text-text-main">
                      {formatRupiah(order.total)}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OrderHistory;
