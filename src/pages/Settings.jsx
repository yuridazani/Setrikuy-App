import { useState, useEffect } from 'react';
import { api } from '@/lib/db';
import { useRealtime } from '@/lib/hooks';
import { Button } from '@/components/ui/Buttons';
import { Card } from '@/components/ui/Cards';
import { toast } from 'sonner';
import { Store, Tag, Save, Trash2, Plus, CloudCheck, LogOut, Eye, EyeOff, Ticket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('toko');
  const navigate = useNavigate();

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
        <Button
          size="sm"
          variant="danger"
          onClick={handleLogout}
          className="bg-red-100 text-red-600 hover:bg-red-200"
        >
          <LogOut size={18} />
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-white border border-gray-200 rounded-2xl overflow-x-auto overflow-y-hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <style>{`
          .flex.p-1.bg-white::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        <TabButton active={activeTab === 'toko'} onClick={() => setActiveTab('toko')} icon={Store} label="Profil Toko" />
        <TabButton active={activeTab === 'layanan'} onClick={() => setActiveTab('layanan')} icon={Tag} label="Layanan" />
        <TabButton active={activeTab === 'promo'} onClick={() => setActiveTab('promo')} icon={Ticket} label="Promo" />
        <TabButton active={activeTab === 'data'} onClick={() => setActiveTab('data')} icon={CloudCheck} label="Data Cloud" />
      </div>

      <div className="min-h-[50vh]">
        {activeTab === 'toko' && <StoreProfileSettings />}
        {activeTab === 'layanan' && <ServicesSettings />}
        {activeTab === 'promo' && <PromoSettings />}
        {activeTab === 'data' && (
          <div className="space-y-6">
            <DataInfo />
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

// ================= SUB COMPONENTS =================

const TabButton = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all whitespace-nowrap min-w-fit ${
      active ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:bg-gray-50'
    }`}
  >
    <Icon size={18} /> {label}
  </button>
);

// ---------- PROFIL TOKO ----------
const StoreProfileSettings = () => {
  const [profile, setProfile] = useState({
    name: '',
    address: '',
    phone: '',
    footerMessage: '',
    invoicePrefix: 'INV',
  });

  useEffect(() => {
    api.settings.get('store_profile').then(data => {
      if (data) {
        setProfile({
          ...data,
          invoicePrefix: data.invoicePrefix || 'INV',
        });
      }
    });
  }, []);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      await api.settings.save('store_profile', profile);
      toast.success('Profil toko berhasil disimpan!');
    } catch {
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

      {/* ✅ INPUT PREFIX NOTA */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-text-muted">Kode Nota (Prefix)</label>
        <input
          name="invoicePrefix"
          value={profile.invoicePrefix || 'INV'}
          onChange={(e) =>
            setProfile({ ...profile, invoicePrefix: e.target.value.toUpperCase() })
          }
          className="w-full p-3 bg-gray-50 rounded-xl outline-none border border-gray-200 uppercase font-mono"
          placeholder="INV"
          maxLength={5}
        />
        <p className="text-[10px] text-gray-400">Contoh: SETRIKUY-1234</p>
      </div>

      <Button onClick={handleSave} className="w-full mt-4 gap-2">
        <Save size={18} /> Simpan Profil
      </Button>
    </Card>
  );
};

// ---------- LAYANAN ----------
const ServicesSettings = () => {
  const services = useRealtime('services');

  const [isAdding, setIsAdding] = useState(false);
  const [newService, setNewService] = useState({
    name: '',
    price: '',
    unit: 'kg',
    duration: 24,
    type: 'kiloan',
    isActive: true,
  });

  const handleAdd = async () => {
    if (!newService.name || !newService.price) return toast.error('Nama dan harga wajib diisi');

    await api.services.add({
      ...newService,
      price: parseInt(newService.price),
      duration: parseInt(newService.duration),
      isActive: true,
    });

    setIsAdding(false);
    setNewService({ name: '', price: '', unit: 'kg', duration: 24, type: 'kiloan', isActive: true });
    toast.success('Layanan ditambahkan');
  };

  const handleToggleActive = async (service) => {
    const newStatus = service.isActive === false ? true : false; // undefined dianggap aktif
    await api.services.update(service.id, { isActive: newStatus });
    toast.success(newStatus ? 'Layanan diaktifkan' : 'Layanan dinonaktifkan');
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
        {services?.map(service => {
          const isActive = service.isActive !== false;
          return (
            <Card
              key={service.id}
              className={`p-4 flex justify-between items-center transition-all ${
                !isActive ? 'bg-gray-100 opacity-70' : ''
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-text-main">{service.name}</h4>
                  {!isActive && (
                    <span className="text-[10px] bg-gray-300 text-gray-600 px-2 py-0.5 rounded font-bold">
                      NON-AKTIF
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-muted">
                  Rp {service.price.toLocaleString()} / {service.unit} • {service.duration} Jam
                </p>
              </div>

              <div className="flex gap-2">
                {/* Toggle Aktif / Nonaktif */}
                <button
                  onClick={() => handleToggleActive(service)}
                  className={`p-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {isActive ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(service.id)}
                  className="p-2 text-danger bg-danger/10 rounded-lg hover:bg-danger hover:text-white transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </Card>
          );
        })}

        {services?.length === 0 && (
          <p className="text-center text-gray-400 py-4">Belum ada layanan. Tambahkan dulu!</p>
        )}
      </div>
    </div>
  );
};

// ---------- PROMO ----------
const PromoSettings = () => {
  const promos = useRealtime('promos');
  const [isAdding, setIsAdding] = useState(false);
  const [newPromo, setNewPromo] = useState({
    name: '',
    type: 'percent', // percent | nominal
    value: '',
    minType: 'weight', // weight | total
    minValue: '',
    isActive: true,
  });

  const handleAdd = async () => {
    if (!newPromo.name || !newPromo.value) return toast.error('Nama & nilai promo wajib diisi');

    await api.promos.add({
      ...newPromo,
      value: parseInt(newPromo.value),
      minValue: parseInt(newPromo.minValue || 0),
      isActive: true,
      createdAt: new Date().toISOString(),
    });

    setIsAdding(false);
    setNewPromo({ name: '', type: 'percent', value: '', minType: 'weight', minValue: '', isActive: true });
    toast.success('Promo berhasil dibuat!');
  };

  const handleToggleActive = async (promo) => {
    const newStatus = promo.isActive === false ? true : false;
    await api.promos.update(promo.id, { isActive: newStatus });
    toast.success(newStatus ? 'Promo diaktifkan' : 'Promo dinonaktifkan');
  };

  const handleDelete = async (id) => {
    if (confirm('Hapus promo ini?')) {
      await api.promos.delete(id);
      toast.success('Promo dihapus');
    }
  };

  return (
    <div className="space-y-4">
      {/* Form Tambah Promo */}
      {isAdding ? (
        <Card className="p-4 space-y-3 bg-orange/5 border-orange/20">
          <h3 className="font-bold text-orange-700">Buat Aturan Promo</h3>

          <input
            placeholder="Nama Promo (mis: Diskon 5kg+)"
            className="w-full p-3 bg-white rounded-xl border border-gray-200"
            value={newPromo.name}
            onChange={e => setNewPromo({ ...newPromo, name: e.target.value })}
          />

          <div className="flex gap-2">
            <select
              className="p-3 bg-white rounded-xl border border-gray-200"
              value={newPromo.type}
              onChange={e => setNewPromo({ ...newPromo, type: e.target.value })}
            >
              <option value="percent">Diskon %</option>
              <option value="nominal">Potongan Rp</option>
            </select>
            <input
              type="number"
              placeholder="Nilai (mis: 10)"
              className="flex-1 p-3 bg-white rounded-xl border border-gray-200"
              value={newPromo.value}
              onChange={e => setNewPromo({ ...newPromo, value: e.target.value })}
            />
          </div>

          <div className="p-3 bg-white rounded-xl border border-gray-200">
            <p className="text-xs font-bold text-gray-400 mb-2 uppercase">Syarat Otomatis</p>
            <div className="flex gap-2">
              <select
                className="p-2 bg-gray-50 rounded-lg text-sm"
                value={newPromo.minType}
                onChange={e => setNewPromo({ ...newPromo, minType: e.target.value })}
              >
                <option value="weight">Minimal Berat (Kg)</option>
                <option value="total">Minimal Total (Rp)</option>
              </select>
              <input
                type="number"
                placeholder="0"
                className="flex-1 p-2 bg-gray-50 rounded-lg text-sm"
                value={newPromo.minValue}
                onChange={e => setNewPromo({ ...newPromo, minValue: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setIsAdding(false)} className="flex-1">
              Batal
            </Button>
            <Button onClick={handleAdd} className="flex-1 bg-orange-500 hover:bg-orange-600">
              Simpan Promo
            </Button>
          </div>
        </Card>
      ) : (
        <Button
          variant="outline"
          className="w-full border-dashed border-2 py-6 text-text-muted hover:text-orange-600 hover:border-orange-500 hover:bg-orange-50"
          onClick={() => setIsAdding(true)}
        >
          <Ticket size={20} className="mr-2" /> Tambah Aturan Promo
        </Button>
      )}

      {/* List Promo */}
      <div className="space-y-3">
        {promos?.map(promo => {
          const isActive = promo.isActive !== false;
          return (
            <Card
              key={promo.id}
              className={`p-4 flex justify-between items-center border-l-4 transition-all ${
                isActive ? 'border-l-orange-500' : 'border-l-gray-300 bg-gray-100 opacity-70'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-text-main">{promo.name}</h4>
                  {!isActive && (
                    <span className="text-[10px] bg-gray-300 text-gray-600 px-2 py-0.5 rounded font-bold">
                      NON-AKTIF
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-muted">
                  Potongan {promo.type === 'percent' ? `${promo.value}%` : `Rp ${promo.value.toLocaleString()}`}
                  {' • '}
                  Syarat: Min {promo.minValue} {promo.minType === 'weight' ? 'Kg' : 'Rp'}
                </p>
              </div>

              <div className="flex gap-2">
                {/* Toggle Aktif / Nonaktif */}
                <button
                  onClick={() => handleToggleActive(promo)}
                  className={`p-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {isActive ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(promo.id)}
                  className="p-2 text-danger bg-danger/10 rounded-lg hover:bg-danger hover:text-white transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </Card>
          );
        })}

        {promos?.length === 0 && (
          <p className="text-center text-gray-400 py-4">Belum ada promo. Tambahkan dulu!</p>
        )}
      </div>
    </div>
  );
};

// ---------- DATA INFO ----------
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
