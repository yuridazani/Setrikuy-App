import Dexie from 'dexie';

export const db = new Dexie('SetrikuyDB');

db.version(1).stores({
  users: '++id, username, role', // role: 'owner' | 'kasir'
  services: '++id, name, type', // type: 'kiloan' | 'satuan'
  customers: '++id, phone, name',
  orders: '++id, invoiceNumber, customerId, status, date', // status: 'antrian', 'proses', 'selesai', 'diambil'
  settings: 'id' // id: 'store_profile'
});

// Seed Data Awal (Optional)
db.on('populate', () => {
  db.services.bulkAdd([
    { name: 'SANTUY (Reguler)', price: 4000, unit: 'kg', duration: 72, type: 'kiloan' },
    { name: 'SAT-SET (Express)', price: 6000, unit: 'kg', duration: 24, type: 'kiloan' },
    { name: 'WUSHHH (Super Express)', price: 8000, unit: 'kg', duration: 6, type: 'kiloan' },
  ]);
  
  db.settings.add({
    id: 'store_profile',
    name: 'Setrikuy Pandaan',
    address: 'Lingk. Jogonalan RT.003/RW.004 Pandaan, Pasuruan',
    phone: '082338351245',
    footerMessage: 'Baju Rapi, Hati Santuy'
  });
});