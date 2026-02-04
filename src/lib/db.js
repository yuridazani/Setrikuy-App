import { db } from './firebase';
import { 
  collection, addDoc, updateDoc, deleteDoc, doc, 
  getDoc, getDocs 
} from 'firebase/firestore';

export const api = {
  // --- LAYANAN ---
  services: {
    add: async (data) => await addDoc(collection(db, 'services'), data),
    delete: async (id) => await deleteDoc(doc(db, 'services', id)),
    update: async (id, data) => await updateDoc(doc(db, 'services', id), data),
  },

  // --- PELANGGAN ---
  customers: {
    add: async (data) => {
      const docRef = await addDoc(collection(db, 'customers'), data);
      return docRef.id;
    },
    update: async (id, data) => await updateDoc(doc(db, 'customers', id), data),
  },

  // --- ORDER ---
  orders: {
    add: async (data) => {
      const payload = {
        ...data,
        date: new Date().toISOString(),
      };
      const docRef = await addDoc(collection(db, 'orders'), payload);
      return docRef.id;
    },
    update: async (id, data) => await updateDoc(doc(db, 'orders', id), data),
    get: async (id) => {
      const docRef = doc(db, 'orders', id);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    },
    getAll: async () => {
      const snapshot = await getDocs(collection(db, 'orders'));
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    },
    delete: async (id) => await deleteDoc(doc(db, 'orders', id)),
  },

  // --- PENGATURAN ---
  settings: {
    get: async (key) => {
      const docRef = doc(db, 'settings', 'main');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data()[key] || null;
      }
      return null;
    },
    save: async (key, data) => {
      const docRef = doc(db, 'settings', 'main');
      const { setDoc } = await import('firebase/firestore');
      await setDoc(docRef, { [key]: data }, { merge: true });
    }
  },

  // --- PROMO (CRUD) ---
  promos: {
    add: async (data) => await addDoc(collection(db, 'promos'), data),
    delete: async (id) => await deleteDoc(doc(db, 'promos', id)),
    update: async (id, data) => await updateDoc(doc(db, 'promos', id), data),
    getAll: async () => {
      const snapshot = await getDocs(collection(db, 'promos'));
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    },
    get: async (id) => {
      const docRef = doc(db, 'promos', id);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    }
  }
};
