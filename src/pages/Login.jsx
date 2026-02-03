import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/db'; // Asumsi logic auth pakai simple check atau Dexie
import { Button } from '@/components/ui/Buttons';
import { toast } from 'sonner';
import { ShieldCheck, User } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [pin, setPin] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    // HARDCODE DULU UNTUK KEMUDAHAN (Sesuai request 'Simple')
    // Nanti bisa dikembangkan cek ke DB Users
    if (pin === '1234') { 
      localStorage.setItem('isLoggedIn', 'true');
      toast.success("Selamat Datang Bos!");
      navigate('/');
    } else {
      toast.error("PIN Salah! Coba 1234");
      setPin('');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-secondary/10 rounded-full blur-3xl"></div>

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-[2rem] bg-black text-white mb-6 shadow-2xl shadow-primary/20">
            <span className="font-extrabold text-3xl">S</span>
          </div>
          <h1 className="text-3xl font-black text-text-main mb-2">SETRIKUY</h1>
          <p className="text-text-muted">Aplikasi Kasir Laundry Pintar</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-100 border border-gray-100 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-muted uppercase ml-2">PIN Akses</label>
            <div className="relative">
              <ShieldCheck className="absolute left-4 top-3.5 text-gray-400" size={20} />
              <input 
                type="password" 
                placeholder="Masukan PIN (1234)" 
                className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-primary font-bold text-lg text-center tracking-widest"
                value={pin}
                onChange={e => setPin(e.target.value)}
                maxLength={4}
                inputMode="numeric"
              />
            </div>
          </div>

          <Button size="lg" className="w-full text-lg shadow-xl shadow-primary/30 h-16 rounded-[20px]">
            MASUK APLIKASI
          </Button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-8 font-medium">
          Versi 2.0 • Offline First System
        </p>
      </div>
    </div>
  );
};

export default Login;