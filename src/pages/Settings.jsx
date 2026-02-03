import { useState, useEffect } from 'react';
import { api } from '@/lib/db';
import { useRealtime } from '@/lib/hooks';
import { Button } from '@/components/ui/Buttons';
import { Card } from '@/components/ui/Cards';
import { toast } from 'sonner';
import { Store, Tag, Save, Trash2, Plus, CloudCheck, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('toko');
  const navigate = useNavigate();

  // LOGOUT FUNCTION
  const handleLogout = () => {
    if (confirm('Yakin mau keluar aplikasi?')) {
      localStorage.removeItem('isLoggedIn');
      toast.success('Berhasil Logout');
      navigate('/login');
    }
  };

  return (
    <div className="p-6 pb-32 animate-slide-up space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-extrabold text-text-main">Pengaturan</h1>
        {/* LOGOUT MINI BUTTON */}
        <Button
          size="sm"
          variant="danger"
          onClick={handleLogout}
          className="bg-red-100 text-red-600 hover:bg-red-200"
        >
          <LogOut size={18} />
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex p-1 bg-white border border-gray-200 rounded-2xl overflow-x-auto no-scrollbar">
        <TabButton active={activeTab === 'toko'} onClick={() => setActiveTab('toko')} icon={Store} label="Profil Toko" />
        <TabButton active={activeTab === 'layanan'} onClick={() => setActiveTab('layanan')} icon={Tag} label="Layanan" />
        <TabButton active={activeTab === 'data'} onClick={() => setActiveTab('data')} icon={CloudCheck} label="Data Cloud" />
      </div>

      {/* Tab Content */}
      <div className="min-h-[50vh]">
        {activeTab === 'toko' && <StoreProfileSettings />}
        {activeTab === 'layanan' && <ServicesSettings />}
        {activeTab === 'data' && (
          <div className="space-y-6">
            <DataInfo />
            {/* LOGOUT BIG BUTTON */}
            <Button
              onClick={handleLogout}
              className="w-full bg-red-500 hover:bg-red-600 text-white gap-2 shadow-red-200"
            >
              <LogOut size={20} /> KELUAR APLIKASI
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- SUB COMPONENTS ---

const TabButton = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
      active ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:bg-gray-50'
    }`}
  >
    <Icon size={18} /> {label}
  </button>
);

const StoreProfileSettings = () => {
  const [profile, setProfile] = useState({
    name: '',
    address: '',
    phone: '',
    footerMessage: '',
  });

  useEffect(() => {
    api.settings.get('store_profile').then(data => {
      if (data) setProfile(data);
    });
  }, []);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      await api.settings.save('store_profile', profile);
      toast.success('Profil toko berhasil disimpan (Online)!');
    } catch (e) {
      toast.error('Gagal menyimpan profil');
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-bold text-text-muted">Nama Laundry</label>
        <input
          name="name"
          value={profile.name}
          onChange={handleChange}
          className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="Contoh: Setrikuy"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-bold text-text-muted">Alamat</label>
        <textarea
          name="address"
          value={profile.address}
          onChange={handleChange}
          className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
          rows="2"
          placeholder="Alamat lengkap..."
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-bold text-text-muted">Nomor WA (Format: 628...)</label>
        <input
          name="phone"
          type="number"
          value={profile.phone}
          onChange={handleChange}
          className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="628123456789"
        />
      </div>
      <Button onClick={handleSave} className="w-full mt-4 gap-2">
        <Save size={18} /> Simpan Profil
      </Button>
    </Card>
  );
};

const ServicesSettings = () => {
  const services = useRealtime('services');

  const [isAdding, setIsAdding] = useState(false);
  const [newService, setNewService] = useState({
    name: '',
    price: '',
    unit: 'kg',
    duration: 24,
    type: 'kiloan',
  });

  const handleAdd = async () => {
    if (!newService.name || !newService.price) return toast.error('Nama dan harga wajib diisi');

    await api.services.add({
      ...newService,
      price: parseInt(newService.price),
      duration: parseInt(newService.duration),
    });

    setIsAdding(false);
    setNewService({ name: '', price: '', unit: 'kg', duration: 24, type: 'kiloan' });
    toast.success('Layanan ditambahkan');
  };

  const handleDelete = async (id) => {
    if (confirm('Hapus layanan ini?')) {
      await api.services.delete(id);
      toast.success('Layanan dihapus');
    }
  };

  return (
    <div className="space-y-4">
      {/* Form Tambah */}
      {isAdding ? (
        <Card className="p-4 space-y-3 bg-primary/5 border-primary/20">
          <h3 className="font-bold text-primary">Tambah Layanan Baru</h3>
          <input
            placeholder="Nama Layanan (mis: Cuci Komplit)"
            className="w-full p-3 bg-white rounded-xl border border-gray-200"
            value={newService.name}
            onChange={e => setNewService({ ...newService, name: e.target.value })}
          />
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Harga"
              className="flex-1 p-3 bg-white rounded-xl border border-gray-200"
              value={newService.price}
              onChange={e => setNewService({ ...newService, price: e.target.value })}
            />
            <select
              className="p-3 bg-white rounded-xl border border-gray-200"
              value={newService.unit}
              onChange={e => setNewService({ ...newService, unit: e.target.value })}
            >
              <option value="kg">/kg</option>
              <option value="pcs">/pcs</option>
              <option value="mtr">/mtr</option>
            </select>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Estimasi (Jam)"
              className="flex-1 p-3 bg-white rounded-xl border border-gray-200"
              value={newService.duration}
              onChange={e => setNewService({ ...newService, duration: e.target.value })}
            />
            <select
              className="p-3 bg-white rounded-xl border border-gray-200"
              value={newService.type}
              onChange={e => setNewService({ ...newService, type: e.target.value })}
            >
              <option value="kiloan">Kiloan</option>
              <option value="satuan">Satuan</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setIsAdding(false)} className="flex-1">
              Batal
            </Button>
            <Button onClick={handleAdd} className="flex-1">
              Simpan
            </Button>
          </div>
        </Card>
      ) : (
        <Button
          variant="outline"
          className="w-full border-dashed border-2 py-6 text-text-muted hover:text-primary hover:border-primary hover:bg-primary/5"
          onClick={() => setIsAdding(true)}
        >
          <Plus size={20} className="mr-2" /> Tambah Layanan
        </Button>
      )}

      {/* List Layanan */}
      <div className="space-y-3">
        {services?.map(service => (
          <Card key={service.id} className="p-4 flex justify-between items-center">
            <div>
              <h4 className="font-bold text-text-main">{service.name}</h4>
              <p className="text-xs text-text-muted">
                Rp {service.price.toLocaleString()} / {service.unit} • {service.duration} Jam
              </p>
            </div>
            <button
              onClick={() => handleDelete(service.id)}
              className="p-2 text-danger bg-danger/10 rounded-lg hover:bg-danger hover:text-white transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </Card>
        ))}
        {services?.length === 0 && (
          <p className="text-center text-gray-400 py-4">Belum ada layanan. Tambahkan dulu!</p>
        )}
      </div>
    </div>
  );
};

const DataInfo = () => {
  return (
    <Card className="p-6 space-y-4 text-center">
      <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
        <CloudCheck size={40} />
      </div>
      <h3 className="font-bold text-xl text-text-main">Data Tersimpan Aman</h3>
      <p className="text-sm text-text-muted">
        Aplikasi Anda sekarang menggunakan <strong>Google Firebase Cloud</strong>.
        Data tersimpan otomatis di server Google secara Real-time.
      </p>
      <div className="bg-gray-50 p-4 rounded-xl text-left text-xs text-gray-500 mt-4 space-y-2">
        <p>✅ Tidak perlu backup manual.</p>
        <p>✅ Bisa diakses dari HP lain dengan akun yang sama.</p>
        <p>✅ Data aman meskipun ganti HP.</p>
      </div>
    </Card>
  );
};

export default Settings;