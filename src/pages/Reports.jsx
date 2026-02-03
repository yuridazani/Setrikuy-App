import { useEffect, useState } from 'react';
import { api } from '@/lib/db';
import { useRealtime } from '@/lib/hooks';
import { Card } from '@/components/ui/Cards';
import { formatRupiah } from '@/lib/utils';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, subDays, isSameDay, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { TrendingUp, Users, ShoppingBag } from 'lucide-react';

const Reports = () => {
  const orders = useRealtime('orders');
  const customers = useRealtime('customers');

  const [chartData, setChartData] = useState([]);
  const [summary, setSummary] = useState({
    totalOmzet: 0,
    totalOrder: 0,
    totalPelanggan: 0,
  });

  useEffect(() => {
    if (!orders.length) return;

    // ===== SUMMARY =====
    const totalOmzet = orders.reduce((acc, o) => acc + (o.total || 0), 0);

    // ===== CHART 7 HARI =====
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      return {
        date: d,
        label: format(d, 'dd MMM', { locale: id }),
        total: 0,
      };
    });

    orders.forEach((order) => {
      if (!order.date) return;
      const orderDate = parseISO(order.date);
      const day = last7Days.find((d) => isSameDay(d.date, orderDate));
      if (day) day.total += order.total || 0;
    });

    setChartData(last7Days);
    setSummary({
      totalOmzet,
      totalOrder: orders.length,
      totalPelanggan: customers.length,
    });
  }, [orders, customers]);

  return (
    <div className="p-6 pb-32 animate-slide-up space-y-6">
      <h1 className="text-2xl font-extrabold text-text-main">Laporan Kinerja</h1>

      {/* Ringkasan */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 bg-black text-white border-none shadow-xl">
          <p className="text-xs text-gray-400 mb-1">Total Omzet</p>
          <h3 className="text-xl font-bold">
            {formatRupiah(summary.totalOmzet).split(',')[0]}
          </h3>
        </Card>

        <div className="space-y-3">
          <Card className="p-3 flex items-center gap-3">
            <div className="bg-orange/10 p-2 rounded-lg text-orange">
              <ShoppingBag size={16} />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase">
                Transaksi
              </p>
              <p className="font-bold text-lg leading-none">
                {summary.totalOrder}
              </p>
            </div>
          </Card>

          <Card className="p-3 flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg text-primary">
              <Users size={16} />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase">
                Pelanggan
              </p>
              <p className="font-bold text-lg leading-none">
                {summary.totalPelanggan}
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Grafik */}
      <Card className="p-5 border-none shadow-lg">
        <div className="flex items-center gap-2 mb-6">
          <div className="bg-green-100 p-2 rounded-full text-green-700">
            <TrendingUp size={18} />
          </div>
          <h3 className="font-bold text-lg">Grafik 7 Hari</h3>
        </div>

        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#007ea7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#007ea7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f0f0f0"
              />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                dy={10}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
                formatter={(value) => [formatRupiah(value), 'Omzet']}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#007ea7"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorTotal)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="bg-gray-100 p-4 rounded-2xl text-center text-xs text-gray-500">
        Data tersimpan online & realtime via Firebase ☁️
      </div>
    </div>
  );
};

export default Reports;
