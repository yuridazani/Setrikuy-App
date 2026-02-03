import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '@/lib/db'; // Database
import { Card } from "@/components/ui/Cards";
import { Button } from "@/components/ui/Buttons";
import { Wallet, Package, ArrowUpRight, Settings, Users } from "lucide-react"; // Ganti Bell jadi Settings
import { formatRupiah } from "@/lib/utils";
import { isSameDay } from 'date-fns';

const Dashboard = () => {
  // State untuk menyimpan data Real-time
  const [stats, setStats] = useState({
    omsetToday: 0,
    activeOrders: 0,
    totalCustomers: 0
  });

  // Effect: Ambil data dari Dexie DB saat halaman dibuka
  useEffect(() => {
    const fetchStats = async () => {
      const today = new Date();
      
      // 1. Ambil Semua Order
      const orders = await db.orders.toArray();
      
      // 2. Hitung Omset Hari Ini
      const todayOrders = orders.filter(o => isSameDay(new Date(o.date), today));
      const omsetToday = todayOrders.reduce((acc, o) => acc + (o.total || 0), 0);

      // 3. Hitung Order Aktif (Yang belum diambil customer)
      // Status aktif = 'antrian', 'proses', atau 'selesai' (siap ambil)
      // Status non-aktif = 'diambil' atau 'batal'
      const activeOrders = orders.filter(o => 
        ['antrian', 'proses', 'selesai'].includes(o.status)
      ).length;

      // 4. Hitung Total Pelanggan
      const totalCustomers = await db.customers.count();

      setStats({
        omsetToday,
        activeOrders,
        totalCustomers
      });
    };

    fetchStats();
  }, []);

  return (
    <div className="p-6 space-y-8 animate-slide-up">
      {/* Header */}
      <header className="flex justify-between items-center">
        <div>
          <p className="text-text-muted text-sm font-medium mb-0.5">Selamat Pagi,</p>
          <h1 className="text-2xl font-extrabold text-text-main tracking-tight">Kasir Setrikuy</h1>
        </div>
        
        {/* REVISI: Tombol Notifikasi diganti jadi SETTINGS */}
        <Link to="/settings">
          <Button size="icon" variant="ghost" className="rounded-full bg-white border border-gray-100 hover:bg-gray-50 hover:border-primary/30 transition-all">
            <Settings size={22} className="text-text-main" />
          </Button>
        </Link>
      </header>

      {/* Main Card (Omset Real-time) */}
      <div className="relative overflow-hidden rounded-[2rem] bg-primary p-6 text-white shadow-xl shadow-primary/20">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-primary-soft/80 mb-2">
            <Wallet size={18} />
            <span className="text-sm font-semibold">Pendapatan Hari Ini</span>
          </div>
          {/* Angka Omset Dinamis */}
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

      {/* Quick Stats Grid (Data Dinamis) */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-5 flex flex-col justify-between bg-white border-none shadow-lg shadow-gray-100/50">
          <div className="h-10 w-10 bg-orange/10 rounded-xl flex items-center justify-center text-orange mb-3">
            <Package size={20} />
          </div>
          <div>
            {/* Angka Order Aktif */}
            <span className="text-3xl font-bold text-text-main">{stats.activeOrders}</span>
            <p className="text-xs text-text-muted font-medium">Order Aktif</p>
          </div>
        </Card>
        
        <Card className="p-5 flex flex-col justify-between bg-white border-none shadow-lg shadow-gray-100/50">
          <div className="h-10 w-10 bg-danger/10 rounded-xl flex items-center justify-center text-danger mb-3">
            <Users size={20} />
          </div>
          <div>
            {/* Angka Pelanggan Total */}
            <span className="text-3xl font-bold text-text-main">{stats.totalCustomers}</span>
            <p className="text-xs text-text-muted font-medium">Pelanggan</p>
          </div>
        </Card>
      </div>

      {/* Recent Activity / CTA */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Aksi Cepat</h3>
        </div>
        <Link to="/pos">
          <Button size="lg" className="w-full text-lg shadow-xl shadow-primary/20 h-14 rounded-[20px]">
            + Buat Transaksi Baru
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;