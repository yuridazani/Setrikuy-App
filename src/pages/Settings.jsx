import { useState, useEffect } from 'react';
import { api } from '@/lib/db';
import { useRealtime } from '@/lib/hooks';
import { Button } from '@/components/ui/Buttons';
import { Card } from '@/components/ui/Cards';
import { toast } from 'sonner';
import { 
  Store, Tag, Save, Trash2, Plus, CloudCheck, LogOut, 
  Eye, EyeOff, Ticket, Award, Edit3, X, Users 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

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
        <TabButton active={activeTab === 'pelanggan'} onClick={() => setActiveTab('pelanggan')} icon={Users} label="Pelanggan" />
        <TabButton active={activeTab === 'promo'} onClick={() => setActiveTab('promo')} icon={Ticket} label="Promo" />
        <TabButton active={activeTab === 'loyalty'} onClick={() => setActiveTab('loyalty')} icon={Award} label="Loyalty" />
        <TabButton active={activeTab === 'data'} onClick={() => setActiveTab('data')} icon={CloudCheck} label="Data Cloud" />
      </div>

      <div className="min-h-[50vh]">
        {activeTab === 'toko' && <StoreProfileSettings />}
        {activeTab === 'layanan' && <ServicesSettings />}
        {activeTab === 'pelanggan' && <CustomersSettings />}
        {activeTab === 'promo' && <PromoSettings />}
        {activeTab === 'loyalty' && <LoyaltySettings />}
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
    minKiloan: 2,
    minDelivery: 15000,
  });

  useEffect(() => {
    api.settings.get('main').then(data => {
      if (data) {
        setProfile({
          name: data.name || '',
          address: data.address || '',
          phone: data.phone || '',
          footerMessage: data.footerMessage || '',
          invoicePrefix: data.invoicePrefix || 'INV',
          minKiloan: data.minKiloan || 2,
          minDelivery: data.minDelivery || 15000,
        });
      }
    });
  }, []);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      await api.settings.save('main', profile);
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

      {/* ✅ FIELD BARU: MIN KILOAN & MIN DELIVERY */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Min. Kiloan (Kg)</label>
          <input 
            type="number" 
            className="w-full p-3 bg-gray-50 rounded-xl font-bold" 
            value={profile.minKiloan || 2} 
            onChange={e => setProfile({ ...profile, minKiloan: parseFloat(e.target.value || 0) })} 
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Min. Delivery (Rp)</label>
          <input 
            type="number" 
            className="w-full p-3 bg-gray-50 rounded-xl font-bold" 
            value={profile.minDelivery || 15000} 
            onChange={e => setProfile({ ...profile, minDelivery: parseInt(e.target.value || 0) })} 
          />
        </div>
      </div>

      <Button onClick={handleSave} className="w-full mt-4 gap-2">
        <Save size={18} /> Simpan Profil
      </Button>
    </Card>
  );
};

// ================= LAYANAN (EDIT + TOGGLE + HAPUS) =================
const ServicesSettings = () => {
  const services = useRealtime('services');

  const [isAdding, setIsAdding] = useState(false);
  const [editingService, setEditingService] = useState(null);
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
    const newStatus = service.isActive === false ? true : false;
    await api.services.update(service.id, { isActive: newStatus });
    toast.success(newStatus ? 'Layanan diaktifkan' : 'Layanan dinonaktifkan');
  };

  const handleDelete = async (id) => {
    if (confirm('Hapus layanan ini?')) {
      await api.services.delete(id);
      toast.success('Layanan dihapus');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    await api.services.update(editingService.id, editingService);
    setEditingService(null);
    toast.success('Layanan berhasil diperbarui');
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
                {/* Edit */}
                <button
                  onClick={() => setEditingService(service)}
                  className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                >
                  <Edit3 size={18} />
                </button>

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

      {/* MODAL EDIT LAYANAN */}
      <AnimatePresence>
        {editingService && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex justify-between mb-4">
                <h3 className="font-bold text-lg">Edit Layanan</h3>
                <button onClick={() => setEditingService(null)}>
                  <X />
                </button>
              </div>
              <form onSubmit={handleUpdate} className="space-y-3">
                <input
                  className="w-full p-3 bg-gray-50 rounded-xl"
                  value={editingService.name}
                  onChange={e => setEditingService({ ...editingService, name: e.target.value })}
                  placeholder="Nama"
                />
                <input
                  type="number"
                  className="w-full p-3 bg-gray-50 rounded-xl"
                  value={editingService.price}
                  onChange={e => setEditingService({ ...editingService, price: parseInt(e.target.value || 0) })}
                  placeholder="Harga"
                />
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" onClick={() => setEditingService(null)} className="flex-1">
                    Batal
                  </Button>
                  <Button type="submit" className="flex-1">
                    Simpan
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ================= PELANGGAN (EDIT + HAPUS) =================
const CustomersSettings = () => {
  const customers = useRealtime('customers');
  const [editingCust, setEditingCust] = useState(null);

  const handleDelete = async (id) => {
    if (confirm('Hapus data pelanggan ini? Seluruh riwayat stamp juga akan hilang.')) {
      await api.customers.delete(id);
      toast.success('Data pelanggan dihapus');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    await api.customers.update(editingCust.id, editingCust);
    setEditingCust(null);
    toast.success('Data pelanggan diperbarui');
  };

  return (
    <div className="space-y-3">
      {customers?.map(c => (
        <Card key={c.id} className="p-4 flex justify-between items-center bg-white shadow-sm">
          <div>
            <h4 className="font-bold text-gray-800">{c.name}</h4>
            <p className="text-xs text-gray-400">
              {c.phone || 'Tanpa No. HP'} • ⭐ {c.stamps || 0} Stamp
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setEditingCust(c)}
              className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
            >
              <Edit3 size={18} />
            </button>
            <button
              onClick={() => handleDelete(c.id)}
              className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </Card>
      ))}

      {customers?.length === 0 && (
        <p className="text-center text-gray-400 py-4">Belum ada pelanggan.</p>
      )}

      {/* MODAL EDIT PELANGGAN */}
      <AnimatePresence>
        {editingCust && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex justify-between mb-4">
                <h3 className="font-bold text-lg">Edit Data Pelanggan</h3>
                <button onClick={() => setEditingCust(null)}>
                  <X />
                </button>
              </div>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1 uppercase">Nama</label>
                  <input
                    className="w-full p-3 bg-gray-50 rounded-xl"
                    value={editingCust.name}
                    onChange={e => setEditingCust({ ...editingCust, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1 uppercase">Nomor HP</label>
                  <input
                    className="w-full p-3 bg-gray-50 rounded-xl"
                    value={editingCust.phone || ''}
                    onChange={e => setEditingCust({ ...editingCust, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1 uppercase">Stamp Manual</label>
                  <input
                    type="number"
                    className="w-full p-3 bg-gray-50 rounded-xl"
                    value={editingCust.stamps || 0}
                    onChange={e => setEditingCust({ ...editingCust, stamps: parseInt(e.target.value || 0) })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" onClick={() => setEditingCust(null)} className="flex-1">
                    Batal
                  </Button>
                  <Button type="submit" className="flex-1">
                    Simpan Perubahan
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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

// ---------- LOYALTY / STAMP (KASIR DAPAT REDEEM) ----------
const LoyaltySettings = () => {
  const customers = useRealtime('customers');
  const [config, setConfig] = useState({
    isActive: true,
    minTrxPerStamp: 20000,
    maxStamps: 10,
    rewardOption: 'Gratis 3kg Santuy'
  });
  const [selectedForRedeem, setSelectedForRedeem] = useState(null);
  const [redeemLoading, setRedeemLoading] = useState(false);

  useEffect(() => {
    api.settings.get('loyalty_config').then(data => data && setConfig(data));
  }, []);

  const handleSave = async () => {
    try {
      await api.settings.save('loyalty_config', config);
      toast.success('Pengaturan Loyalty disimpan!');
    } catch (error) {
      toast.error('Gagal menyimpan pengaturan');
    }
  };

  const handleRedeem = async (customer) => {
    if (customer.stamps < 10) {
      toast.error(`Stamp belum cukup (${customer.stamps}/10)`);
      return;
    }

    setRedeemLoading(true);
    try {
      await api.customers.redeemReward(customer.id, config.rewardOption, config.rewardOption);
      toast.success(`Reward diberikan ke ${customer.name}!`);
      setSelectedForRedeem(null);
    } catch (error) {
      toast.error('Gagal memberikan reward');
    } finally {
      setRedeemLoading(false);
    }
  };

  const customersReadyForRedeem = customers?.filter(c => (c.stamps || 0) >= 10) || [];

  return (
    <div className="space-y-6">
      {/* KONFIGURASI */}
      <Card className="p-6 space-y-4 border-t-4 border-primary">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">Program Loyalitas (Stamp)</h3>
          <button 
            onClick={() => setConfig({ ...config, isActive: !config.isActive })}
            className={`w-12 h-6 rounded-full p-1 transition-all ${config.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full transition-all ${config.isActive ? 'ml-6' : 'ml-0'}`} />
          </button>
        </div>

        {config.isActive && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400">MIN. BELANJA PER STAMP</label>
                <input
                  type="number"
                  className="w-full p-3 bg-gray-50 rounded-xl"
                  value={config.minTrxPerStamp}
                  onChange={e => setConfig({ ...config, minTrxPerStamp: parseInt(e.target.value || 0) })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400">TARGET STAMP</label>
                <input
                  type="number"
                  className="w-full p-3 bg-gray-50 rounded-xl"
                  value={config.maxStamps}
                  onChange={e => setConfig({ ...config, maxStamps: parseInt(e.target.value || 0) })}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400">HADIAH REWARD</label>
              <select
                className="w-full p-3 bg-gray-50 rounded-xl"
                value={config.rewardOption}
                onChange={e => setConfig({ ...config, rewardOption: e.target.value })}
              >
                <option>Gratis 3kg Santuy</option>
                <option>Potongan Rp 12.000</option>
                <option>Diskon 50% All Item</option>
              </select>
            </div>

            <Button onClick={handleSave} className="w-full">
              <Save size={18} /> Simpan Konfigurasi
            </Button>
          </div>
        )}
      </Card>

      {/* REDEEM REWARDS */}
      {config.isActive && (
        <Card className="p-6 space-y-4 border-l-4 border-l-orange-500">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Award size={20} className="text-orange-500" />
            Redeem Reward Manual
          </h3>

          {customersReadyForRedeem.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs text-gray-500 font-bold">
                {customersReadyForRedeem.length} pelanggan siap redeem
              </p>
              {customersReadyForRedeem.map(customer => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between bg-orange-50 p-4 rounded-xl border border-orange-200"
                >
                  <div>
                    <h4 className="font-bold text-text-main">{customer.name}</h4>
                    <p className="text-xs text-orange-600 font-bold">
                      ⭐ {customer.stamps}/{config.maxStamps} STAMPS
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleRedeem(customer)}
                    disabled={redeemLoading}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    {redeemLoading ? '...' : 'Redeem'}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400">
              <Award size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Belum ada pelanggan yang siap redeem</p>
            </div>
          )}
        </Card>
      )}
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
        <p>Tidak perlu backup manual.</p>
        <p>Bisa diakses dari HP lain dengan akun yang sama.</p>
        <p>Data aman meskipun ganti HP.</p>
      </div>
    </Card>
  );
};

export default Settings;
