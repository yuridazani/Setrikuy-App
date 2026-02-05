import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '@/lib/db';
import { formatRupiah } from '@/lib/utils';
import { ArrowLeft, Gift, AlertTriangle, Trophy, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

const LoyaltyView = () => {
  const { custId } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loyaltyConfig, setLoyaltyConfig] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const custData = await api.customers.get(custId);
        if (!custData) {
          setCustomer(null);
        } else {
          setCustomer(custData);
        }

        const config = await api.settings.get('loyalty_config');
        setLoyaltyConfig(config || { maxStamps: 10, rewardOption: 'Gratis 3kg Santuy' });
      } catch (error) {
        console.error('Error fetching loyalty data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [custId]);

  const maxStamps = loyaltyConfig?.maxStamps || 10;
  const currentStamps = customer?.stamps || 0;
  const totalStamps = customer?.totalStamps || 0;
  const progressPercent = (currentStamps / maxStamps) * 100;

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-orange-900 via-orange-800 to-orange-900 p-6 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-bold">Memuat kartu loyalty...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-linear-to-br from-orange-900 via-orange-800 to-orange-900 p-6 flex flex-col items-center justify-center">
        <div className="text-center text-white space-y-4">
          <div className="text-2xl font-black flex items-center justify-center gap-2">
            <AlertTriangle size={28} className="text-yellow-300" />
            <span>Data Tidak Ditemukan</span>
          </div>
          <p className="text-sm opacity-80">Pelanggan dengan ID ini tidak ada atau telah dihapus.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-orange-900 via-orange-800 to-orange-900 p-6 flex flex-col items-center">
      {/* HEADER */}
      <div className="w-full flex items-center justify-between mb-8 pt-2">
        <button
          onClick={() => navigate(-1)}
          className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
        >
          <ArrowLeft size={24} className="text-white" />
        </button>
        <img src="/logo.png" className="h-8" alt="Setrikuy" />
        <div className="w-10"></div>
      </div>

      {/* CARD UTAMA - FULL SVG BASED */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-sm shadow-2xl overflow-hidden rounded-3xl"
      >
        {/* SVG CARD - Otomatis berubah sesuai stamp count */}
        <motion.img
            key={currentStamps}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            src={`/loyalty card/${currentStamps + 1}.svg`}  
            alt={`Loyalty Card - ${currentStamps} stamps`}
            className="w-full h-auto"
        />
        
        {/* OPTIONAL: Text Overlay jika perlu */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {/* Customer name dapat di-overlay di sini jika SVG belum include nama */}
          {/* Uncomment jika SVG tidak punya nama */}
          {/* <h2 className="text-xl font-black text-gray-800">{customer.name}</h2> */}
        </div>
      </motion.div>

      {/* PROGRESS INFO */}
      <div className="mt-8 w-full max-w-sm text-center text-white space-y-4">
        {/* PROGRESS BAR */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-bold">
            <span>Progress</span>
            <span className="text-lg font-black">{currentStamps}/{maxStamps}</span>
          </div>
          <div className="w-full bg-white/20 h-3 rounded-full overflow-hidden backdrop-blur-sm">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="bg-linear-to-r from-orange-300 to-orange-500 h-full rounded-full"
            />
          </div>
        </div>

        {/* STATUS MESSAGE */}
        {currentStamps >= maxStamps ? (
          <div className="bg-green-500/30 backdrop-blur-sm border border-green-400 rounded-xl p-4">
            <p className="font-black text-lg flex items-center justify-center gap-2">
              <Trophy size={20} className="text-yellow-300" />
              Kamu Sudah Bisa Tukar Hadiah!
            </p>
            <p className="text-xs opacity-90 mt-1">Tunjukkan kartu ini ke kasir untuk redeem</p>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
            <p className="text-sm font-bold">Tinggal {maxStamps - currentStamps} stamp lagi</p>
            <p className="text-[10px] opacity-75">untuk mendapatkan {loyaltyConfig?.rewardOption}</p>
          </div>
        )}

        {/* STATS */}
        <div className="grid grid-cols-2 gap-3 text-xs mt-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
            <p className="opacity-75 mb-0.5">Total Transaksi</p>
            <p className="font-black text-base">{totalStamps}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
            <p className="opacity-75 mb-0.5">Stamp Terkumpul</p>
            <p className="font-black text-base">{currentStamps}</p>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="mt-auto pt-8 text-[10px] text-white/60 text-center uppercase tracking-[0.2em] flex items-center justify-center gap-2">
        <Sparkles size={14} />
        Tunjukkan kartu ini ke kasir untuk redeem reward
        <Sparkles size={14} />
      </div>

      {/* REWARD HISTORY */}
      {customer?.rewardHistory && customer.rewardHistory.length > 0 && (
        <div className="mt-8 w-full max-w-sm">
          <p className="text-xs font-bold text-white/70 uppercase tracking-widest mb-3">Riwayat Reward</p>
          <div className="space-y-2">
            {customer.rewardHistory.map((reward, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-3 flex items-start gap-2"
              >
                <Gift size={16} className="text-yellow-300 mt-1 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{reward.name || reward.rewardName}</p>
                  <p className="text-[10px] text-white/60">
                    {format(parseISO(reward.date), 'dd MMM yyyy', { locale: id })}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoyaltyView;