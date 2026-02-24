import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy 
} from "firebase/firestore";
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from "firebase/storage";
import { db, storage, isFirebaseConfigured } from "../firebase";

// --- Types ---
export type Status = 'Public' | 'Confidential';

export interface CategoryInfo {
  id?: string;
  name: string;
  color: string;
  icon: string;
  parentId?: string | null;
}

export interface DocumentData {
  id?: string;
  name: string;
  category: string;
  date: string;
  status: Status;
  size: string;
  letterNumber: string;
  classification: string;
  description: string;
  fileUrl?: string;
  fileType?: string;
  storagePath?: string;
}

// --- Documents ---
export const subscribeToDocuments = (
  callback: (docs: DocumentData[]) => void,
  onError?: (error: any) => void
) => {
  if (!isFirebaseConfigured || !db) {
    callback([]);
    return () => {};
  }
  const docsCol = collection(db, "documents");
  const q = query(docsCol, orderBy("date", "desc"));
  return onSnapshot(q, 
    (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DocumentData));
      callback(docs);
    },
    (error) => {
      console.error("Firestore subscription error (documents):", error);
      if (onError) onError(error);
      callback([]);
    }
  );
};

export const saveDocument = async (document: DocumentData, file?: File) => {
  if (!isFirebaseConfigured || !db) throw new Error("Firebase not configured");
  
  let fileUrl = document.fileUrl;
  let storagePath = document.storagePath;

  if (file && storage) {
    const timestamp = Date.now();
    storagePath = `documents/${timestamp}_${file.name}`;
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, file);
    fileUrl = await getDownloadURL(storageRef);
  }

  const data = { ...document, fileUrl, storagePath };
  delete data.id; // Don't save ID in the document body

  if (document.id) {
    const docRef = doc(db, "documents", document.id);
    await updateDoc(docRef, data);
    return document.id;
  } else {
    const docsCol = collection(db, "documents");
    const docRef = await addDoc(docsCol, data);
    return docRef.id;
  }
};

export const removeDocument = async (id: string, storagePath?: string) => {
  if (!isFirebaseConfigured || !db) throw new Error("Firebase not configured");

  if (storagePath && storage) {
    try {
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef);
    } catch (error) {
      console.error("Error deleting file from storage:", error);
    }
  }
  await deleteDoc(doc(db, "documents", id));
};

// --- Categories ---
export const subscribeToCategories = (callback: (cats: CategoryInfo[]) => void) => {
  if (!isFirebaseConfigured || !db) {
    callback([]);
    return () => {};
  }
  const catsCol = collection(db, "categories");
  return onSnapshot(catsCol, 
    (snapshot) => {
      const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CategoryInfo));
      callback(cats);
    },
    (error) => {
      console.error("Firestore subscription error (categories):", error);
      callback([]);
    }
  );
};

export const saveCategory = async (category: CategoryInfo) => {
  if (!isFirebaseConfigured || !db) throw new Error("Firebase not configured");

  const data = { ...category };
  const id = category.id;
  delete data.id;

  if (id) {
    const docRef = doc(db, "categories", id);
    await updateDoc(docRef, data);
  } else {
    const catsCol = collection(db, "categories");
    await addDoc(catsCol, data);
  }
};

export const removeCategory = async (id: string) => {
  if (!isFirebaseConfigured || !db) throw new Error("Firebase not configured");
  await deleteDoc(doc(db, "categories", id));
};
