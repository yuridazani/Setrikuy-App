import { useState, useEffect } from 'react';
import { useRealtime } from '@/lib/hooks';
import { Card } from '@/components/ui/Cards';
import { formatRupiah } from '@/lib/utils';
import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  format,
  parseISO,
  isWithinInterval,
  startOfDay,
  endOfDay,
  subDays,
} from 'date-fns';
import { id } from 'date-fns/locale';
import {
  TrendingUp,
  Users,
  ShoppingBag,
  Download,
  Calendar,
  Scale,
} from 'lucide-react';

const Reports = () => {
  const orders = useRealtime('orders');
  const customers = useRealtime('customers');

  // ===== DATE RANGE (DEFAULT 7 HARI) =====
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  });

  const [stats, setStats] = useState({
    omset: 0,
    count: 0,
    weight: 0,
    chart: [],
  });

  useEffect(() => {
    if (!orders) return;

    const startDate = startOfDay(parseISO(dateRange.start));
    const endDate = endOfDay(parseISO(dateRange.end));

    // ===== FILTER ORDER =====
    const filteredOrders = orders.filter((o) => {
      if (!o.date) return false;
      return isWithinInterval(parseISO(o.date), {
        start: startDate,
        end: endDate,
      });
    });

    // ===== TOTAL =====
    const omset = filteredOrders.reduce((acc, o) => acc + (o.total || 0), 0);
    const count = filteredOrders.length;

    // ===== TOTAL BERAT (KG) =====
    const weight = filteredOrders.reduce((acc, o) => {
      const orderWeight =
        o.items?.reduce(
          (w, item) =>
            w + (item.unit === 'kg' ? item.realQty || item.qty || 0 : 0),
          0
        ) || 0;
      return acc + orderWeight;
    }, 0);

    // ===== CHART PER HARI =====
    const chartMap = {};
    filteredOrders.forEach((o) => {
      const key = format(parseISO(o.date), 'dd MMM', { locale: id });
      chartMap[key] = (chartMap[key] || 0) + (o.total || 0);
    });

    const chartData = Object.keys(chartMap).map((k) => ({
      label: k,
      total: chartMap[k],
    }));

    setStats({ omset, count, weight, chart: chartData });
  }, [orders, dateRange]);

  // ===== EXPORT CSV =====
  const handleExport = () => {
    if (!orders) return;

    const header =
      'No.Nota,Tanggal,Pelanggan,Status,Total,MetodeBayar,TotalKG\n';

    const startDate = startOfDay(parseISO(dateRange.start));
    const endDate = endOfDay(parseISO(dateRange.end));

    const filtered = orders.filter((o) => {
      if (!o.date) return false;
      return isWithinInterval(parseISO(o.date), {
        start: startDate,
        end: endDate,
      });
    });

    const rows = filtered
      .map((o) => {
        const weight =
          o.items?.reduce(
            (w, item) =>
              w + (item.unit === 'kg' ? item.realQty || item.qty || 0 : 0),
            0
          ) || 0;

        return `${o.invoiceNumber},${o.date?.substring(
          0,
          10
        )},"${o.customerName}",${o.status},${o.total},${
          o.payment?.method || '-'
        },${weight}`;
      })
      .join('\n');

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      encodeURIComponent(header + rows);

    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute(
      'download',
      `Laporan_Setrikuy_${dateRange.start}_${dateRange.end}.csv`
    );
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="p-6 pb-32 animate-slide-up space-y-6">
      <h1 className="text-2xl font-extrabold text-text-main">Laporan</h1>

      {/* DATE PICKER & EXPORT */}
      <Card className="p-4 space-y-3">
        <div className="flex gap-2 items-center">
          <div className="flex-1 bg-gray-50 p-2 rounded-xl border border-gray-200 flex items-center gap-2">
            <Calendar size={16} className="text-gray-400" />
            <input
              type="date"
              className="bg-transparent w-full text-xs font-bold outline-none"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange({ ...dateRange, start: e.target.value })
              }
            />
          </div>
          <span className="text-gray-400">-</span>
          <div className="flex-1 bg-gray-50 p-2 rounded-xl border border-gray-200 flex items-center gap-2">
            <input
              type="date"
              className="bg-transparent w-full text-xs font-bold outline-none"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange({ ...dateRange, end: e.target.value })
              }
            />
          </div>
        </div>

        <button
          onClick={handleExport}
          className="w-full py-3 bg-green-50 text-green-700 font-bold rounded-xl text-sm flex justify-center items-center gap-2 hover:bg-green-100 border border-green-200"
        >
          <Download size={18} /> Download Excel (.csv)
        </button>
      </Card>

      {/* STATS */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={TrendingUp}
          label="Total Omzet"
          value={formatRupiah(stats.omset)}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          icon={ShoppingBag}
          label="Total Order"
          value={stats.count}
          color="bg-orange-50 text-orange-600"
        />
        <StatCard
          icon={Scale}
          label="Total Berat"
          value={`${stats.weight.toFixed(1)} Kg`}
          color="bg-purple-50 text-purple-600"
        />
        <StatCard
          icon={Users}
          label="Total Pelanggan"
          value={customers?.length || 0}
          color="bg-green-50 text-green-600"
        />
      </div>

      {/* CHART */}
      <Card className="p-6 border-none shadow-lg">
        <h3 className="font-bold mb-4 text-gray-700">Grafik Pendapatan</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.chart}>
              <defs>
                <linearGradient
                  id="colorTotal"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
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
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className={`p-4 rounded-2xl flex flex-col justify-between h-28 ${color}`}>
    <Icon size={24} className="opacity-80" />
    <div>
      <p className="text-2xl font-black">{value}</p>
      <p className="text-[10px] font-bold uppercase opacity-60">{label}</p>
    </div>
  </div>
);

export default Reports;
