import { db } from './firebase';
import { 
  collection, addDoc, updateDoc, deleteDoc, doc, 
  getDoc, getDocs 
} from 'firebase/firestore';

export const api = {
  // --- LAYANAN ---
  services: {
    add: async (data) => await addDoc(collection(db, 'services'), data),
    update: async (id, data) => await updateDoc(doc(db, 'services', id), data),
    delete: async (id) => await deleteDoc(doc(db, 'services', id)),
  },

  // --- PELANGGAN ---
  customers: {
    add: async (data) => {
      const docRef = await addDoc(collection(db, 'customers'), {
        ...data,
        stamps: 0,
        totalStamps: 0,
        rewardHistory: [],
        createdAt: new Date().toISOString(),
      });
      return docRef.id;
    },
    update: async (id, data) => await updateDoc(doc(db, 'customers', id), data),
    delete: async (id) => await deleteDoc(doc(db, 'customers', id)),
    get: async (id) => {
      const docRef = doc(db, 'customers', id);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    },

    // ⭐ STAMP & REWARD
    addStamp: async (id, count) => {
      const docRef = doc(db, 'customers', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        const currentStamps = (data.stamps || 0) + count;
        const totalStamps = (data.totalStamps || 0) + count;
        await updateDoc(docRef, { 
          stamps: currentStamps, 
          totalStamps: totalStamps 
        });
        return currentStamps;
      }
      return 0;
    },

    redeemReward: async (id, rewardName, rewardValue) => {
      const docRef = doc(db, 'customers', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        const history = data.rewardHistory || [];
        history.push({ 
          name: rewardName, 
          value: rewardValue,
          date: new Date().toISOString(),
          redeemedBy: 'kasir' // bisa ditambah username kasir nanti
        });

        await updateDoc(docRef, { 
          stamps: 0, // reset stamps ke 0 setelah redeem
          rewardHistory: history 
        });
        return true;
      }
      return false;
    }
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
    delete: async (id) => await deleteDoc(doc(db, 'orders', id)),
    get: async (id) => {
      const docRef = doc(db, 'orders', id);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    },
    getAll: async () => {
      const snapshot = await getDocs(collection(db, 'orders'));
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    },
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
    update: async (id, data) => await updateDoc(doc(db, 'promos', id), data),
    delete: async (id) => await deleteDoc(doc(db, 'promos', id)),
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
