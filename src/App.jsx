import { BrowserRouter as Router, Routes, Route, useLocation, Link } from 'react-router-dom';
import { LayoutGrid, Plus, History, User } from 'lucide-react';
import { Toaster } from 'sonner';
import { motion } from 'framer-motion';

// Pages
import Dashboard from '@/pages/Dashboard';
import PosPage from '@/pages/PosPage';
import OrderHistory from '@/pages/OrderHistory';
import OrderDetail from '@/pages/OrderDetail';

const BottomNav = () => {
  const location = useLocation();
  
  const menus = [
    { path: '/', icon: LayoutGrid, label: 'Home' },
    { path: '/pos', icon: Plus, label: 'Order', isMain: true },
    { path: '/orders', icon: History, label: 'Riwayat' },
    { path: '/settings', icon: User, label: 'Akun' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full p-4 z-50 pointer-events-none">
      <div className="bg-white/90 backdrop-blur-lg border border-white/20 shadow-2xl rounded-4xl px-6 py-3 flex justify-between items-center max-w-md mx-auto pointer-events-auto">
        {menus.map((menu) => {
          const isActive = location.pathname === menu.path;
          
          if (menu.isMain) {
            return (
              <Link key={menu.path} to={menu.path} className="relative -top-8">
                <motion.div 
                  whileTap={{ scale: 0.9 }}
                  className={`h-16 w-16 rounded-full flex items-center justify-center shadow-xl shadow-primary/40 ${isActive ? 'bg-black text-white' : 'bg-primary text-white'}`}
                >
                  <menu.icon size={28} strokeWidth={3} />
                </motion.div>
              </Link>
            )
          }

          return (
            <Link key={menu.path} to={menu.path} className="flex flex-col items-center gap-1 w-12">
              <div className={`transition-colors ${isActive ? 'text-primary' : 'text-gray-400'}`}>
                <menu.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              {isActive && (
                <motion.div layoutId="dot" className="h-1 w-1 bg-primary rounded-full mt-1" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  );
};

function App() {
  return (
<Router>
      <div className="bg-background min-h-screen pb-28 max-w-md mx-auto shadow-2xl overflow-hidden relative">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pos" element={<PosPage />} />
          
          {/* Update Route Ini */}
          <Route path="/orders" element={<OrderHistory />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          
          <Route path="/settings" element={<div className="p-8 font-bold text-2xl">Pengaturan</div>} />
        </Routes>
        
        <BottomNav />
        <Toaster position="top-center" toastOptions={{
          className: 'rounded-2xl border-none shadow-xl font-sans',
          style: { background: '#1e1e1e', color: '#fff' }
        }}/>
      </div>
    </Router>
  )
}

export default App