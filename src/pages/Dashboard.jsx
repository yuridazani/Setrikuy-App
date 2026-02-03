import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/db';
import { useRealtime } from '@/lib/hooks';
import { Card } from "@/components/ui/Cards";
import { Button } from "@/components/ui/Buttons";
import { Wallet, Package, ArrowUpRight, Settings, Users } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { isSameDay, parseISO } from 'date-fns';

const Dashboard = () => {
  const orders = useRealtime('orders');
  const customers = useRealtime('customers');

  const [stats, setStats] = useState({
    omsetToday: 0,
    activeOrders: 0,
    totalCustomers: 0
  });

  useEffect(() => {
    const today = new Date();

    const todayOrders = orders.filter(o => {
      if (!o.date) return false;
      return isSameDay(parseISO(o.date), today);
    });

    const omsetToday = todayOrders.reduce((acc, o) => acc + (o.total || 0), 0);

    const activeOrders = orders.filter(o =>
      ['antrian', 'proses', 'selesai'].includes(o.status)
    ).length;

    setStats({
      omsetToday,
      activeOrders,
      totalCustomers: customers.length
    });
  }, [orders, customers]);

  return (
    <div className="p-6 space-y-8 animate-slide-up">
      {/* Header */}
      <header className="flex justify-between items-center">
        <div>
          <p className="text-text-muted text-sm font-medium mb-0.5">Selamat Datang,</p>
          <h1 className="text-2xl font-extrabold text-text-main tracking-tight">
            Kasir Setrikuy
          </h1>
        </div>

        <Link to="/settings">
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full bg-white border border-gray-100 hover:bg-gray-50 hover:border-primary/30 transition-all"
          >
            <Settings size={22} className="text-text-main" />
          </Button>
        </Link>
      </header>

      {/* Card Omset */}
      <div className="relative overflow-hidden rounded-[2rem] bg-primary p-6 text-white shadow-xl shadow-primary/20">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-primary-soft/80 mb-2">
            <Wallet size={18} />
            <span className="text-sm font-semibold">Pendapatan Hari Ini</span>
          </div>
          <h2 className="text-4xl font-black tracking-tight mb-4">
            {formatRupiah(stats.omsetToday).replace(',00', '')}
          </h2>
          <div className="flex gap-2">
            <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1">
              <ArrowUpRight size={14} /> Data Realtime
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-5 flex flex-col justify-between bg-white border-none shadow-lg shadow-gray-100/50">
          <div className="h-10 w-10 bg-orange/10 rounded-xl flex items-center justify-center text-orange mb-3">
            <Package size={20} />
          </div>
          <div>
            <span className="text-3xl font-bold text-text-main">{stats.activeOrders}</span>
            <p className="text-xs text-text-muted font-medium">Order Aktif</p>
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between bg-white border-none shadow-lg shadow-gray-100/50">
          <div className="h-10 w-10 bg-danger/10 rounded-xl flex items-center justify-center text-danger mb-3">
            <Users size={20} />
          </div>
          <div>
            <span className="text-3xl font-bold text-text-main">{stats.totalCustomers}</span>
            <p className="text-xs text-text-muted font-medium">Pelanggan</p>
          </div>
        </Card>
      </div>

      {/* CTA */}
      <div>
        <Link to="/pos">
          <Button
            size="lg"
            className="w-full text-lg shadow-xl shadow-primary/20 h-14 rounded-[20px]"
          >
            + Buat Transaksi Baru
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
