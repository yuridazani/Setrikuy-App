import { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Button } from '@/components/ui/Buttons';
import { Card } from '@/components/ui/Cards';
import { toast } from 'sonner';
import { Store, Tag, Save, Trash2, Plus, Database, Upload, Download } from 'lucide-react';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('toko'); // toko | layanan | data
  
  return (
    <div className="p-6 pb-32 animate-slide-up space-y-6">
      <h1 className="text-2xl font-extrabold text-text-main">Pengaturan</h1>

      {/* Tab Navigation */}
      <div className="flex p-1 bg-white border border-gray-200 rounded-2xl overflow-x-auto no-scrollbar">
        <TabButton active={activeTab === 'toko'} onClick={() => setActiveTab('toko')} icon={Store} label="Profil Toko" />
        <TabButton active={activeTab === 'layanan'} onClick={() => setActiveTab('layanan')} icon={Tag} label="Layanan" />
        <TabButton active={activeTab === 'data'} onClick={() => setActiveTab('data')} icon={Database} label="Data" />
      </div>

      {/* Tab Content */}
      <div className="min-h-[50vh]">
        {activeTab === 'toko' && <StoreProfileSettings />}
        {activeTab === 'layanan' && <ServicesSettings />}
        {activeTab === 'data' && <DataSettings />}
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
    name: '', address: '', phone: '', footerMessage: ''
  });

  useEffect(() => {
    db.settings.get('store_profile').then(data => {
      if (data) setProfile(data);
    });
  }, []);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      await db.settings.put({ ...profile, id: 'store_profile' });
      toast.success("Profil toko berhasil disimpan!");
    } catch (e) {
      toast.error("Gagal menyimpan profil");
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-bold text-text-muted">Nama Laundry</label>
        <input name="name" value={profile.name} onChange={handleChange} className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-primary/20" placeholder="Contoh: Setrikuy" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-bold text-text-muted">Alamat</label>
        <textarea name="address" value={profile.address} onChange={handleChange} className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-primary/20" rows="2" placeholder="Alamat lengkap..." />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-bold text-text-muted">Nomor WA (Format: 628...)</label>
        <input name="phone" type="number" value={profile.phone} onChange={handleChange} className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-primary/20" placeholder="628123456789" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-bold text-text-muted">Pesan Footer Nota</label>
        <input name="footerMessage" value={profile.footerMessage} onChange={handleChange} className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-primary/20" placeholder="Terima kasih..." />
      </div>
      <Button onClick={handleSave} className="w-full mt-4 gap-2">
        <Save size={18} /> Simpan Profil
      </Button>
    </Card>
  );
};

const ServicesSettings = () => {
  const services = useLiveQuery(() => db.services.toArray());
  const [isAdding, setIsAdding] = useState(false);
  const [newService, setNewService] = useState({ name: '', price: '', unit: 'kg', duration: 24, type: 'kiloan' });

  const handleAdd = async () => {
    if (!newService.name || !newService.price) return toast.error("Nama dan harga wajib diisi");
    await db.services.add({
      ...newService,
      price: parseInt(newService.price),
      duration: parseInt(newService.duration)
    });
    setIsAdding(false);
    setNewService({ name: '', price: '', unit: 'kg', duration: 24, type: 'kiloan' });
    toast.success("Layanan ditambahkan");
  };

  const handleDelete = (id) => {
    if (confirm('Hapus layanan ini?')) {
      db.services.delete(id);
      toast.success("Layanan dihapus");
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
            value={newService.name} onChange={e => setNewService({...newService, name: e.target.value})}
          />
          <div className="flex gap-2">
            <input 
              type="number" placeholder="Harga" 
              className="flex-1 p-3 bg-white rounded-xl border border-gray-200"
              value={newService.price} onChange={e => setNewService({...newService, price: e.target.value})}
            />
            <select 
              className="p-3 bg-white rounded-xl border border-gray-200"
              value={newService.unit} onChange={e => setNewService({...newService, unit: e.target.value})}
            >
              <option value="kg">/kg</option>
              <option value="pcs">/pcs</option>
              <option value="mtr">/mtr</option>
            </select>
          </div>
          <div className="flex gap-2">
             <input 
              type="number" placeholder="Estimasi (Jam)" 
              className="flex-1 p-3 bg-white rounded-xl border border-gray-200"
              value={newService.duration} onChange={e => setNewService({...newService, duration: e.target.value})}
            />
            <select 
              className="p-3 bg-white rounded-xl border border-gray-200"
              value={newService.type} onChange={e => setNewService({...newService, type: e.target.value})}
            >
              <option value="kiloan">Kiloan</option>
              <option value="satuan">Satuan</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setIsAdding(false)} className="flex-1">Batal</Button>
            <Button onClick={handleAdd} className="flex-1">Simpan</Button>
          </div>
        </Card>
      ) : (
        <Button variant="outline" className="w-full border-dashed border-2 py-6 text-text-muted hover:text-primary hover:border-primary hover:bg-primary/5" onClick={() => setIsAdding(true)}>
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
            <button onClick={() => handleDelete(service.id)} className="p-2 text-danger bg-danger/10 rounded-lg hover:bg-danger hover:text-white transition-colors">
              <Trash2 size={18} />
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
};

const DataSettings = () => {
  const handleBackup = async () => {
    try {
      const allData = {
        services: await db.services.toArray(),
        customers: await db.customers.toArray(),
        orders: await db.orders.toArray(),
        settings: await db.settings.toArray(),
        timestamp: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(allData)], {type: "application/json"});
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Backup-Setrikuy-${new Date().toISOString().slice(0,10)}.json`;
      link.click();
      toast.success("Data berhasil didownload!");
    } catch (e) {
      toast.error("Gagal backup data");
    }
  };

  const handleRestore = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if(!confirm("Restore akan menimpa data lama (kecuali jika ID beda). Lanjut?")) return;
        
        await db.transaction('rw', db.services, db.customers, db.orders, db.settings, async () => {
          if(data.services) await db.services.bulkPut(data.services);
          if(data.customers) await db.customers.bulkPut(data.customers);
          if(data.orders) await db.orders.bulkPut(data.orders);
          if(data.settings) await db.settings.bulkPut(data.settings);
        });
        toast.success("Data berhasil direstore!");
        window.location.reload();
      } catch (err) {
        toast.error("File backup tidak valid");
      }
    };
    reader.readAsText(file);
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="p-4 bg-orange/10 rounded-xl border border-orange/20 text-orange-700 text-sm">
        <strong>Penting:</strong> Lakukan backup secara berkala. Data tersimpan di browser HP ini saja (Offline). Jika clear cache, data bisa hilang tanpa backup.
      </div>
      
      <Button onClick={handleBackup} variant="outline" className="w-full justify-start gap-3 h-14">
        <Download size={20} /> Backup Data (Download JSON)
      </Button>

      <div className="relative">
        <input 
          type="file" 
          accept=".json"
          onChange={handleRestore}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <Button variant="outline" className="w-full justify-start gap-3 h-14 border-dashed">
          <Upload size={20} /> Restore Data (Upload JSON)
        </Button>
      </div>
    </Card>
  );
};

export default Settings;