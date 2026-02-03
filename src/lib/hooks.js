import { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';

// Hook sakti untuk mengambil data Real-time (Pengganti useLiveQuery)
export function useRealtime(collectionName, constraints = []) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, collectionName), ...constraints);
    
    // onSnapshot = Mendengar perubahan data secara langsung
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setData(items);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching realtime:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [collectionName]); // Re-run kalau nama koleksi berubah

  return data;
}