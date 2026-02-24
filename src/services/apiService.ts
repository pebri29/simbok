// --- Types ---
export interface DocumentData {
  id?: string;
  name: string;
  category: string;
  date: string;
  status: 'Public' | 'Confidential';
  size: string;
  letterNumber: string;
  classification: string;
  description: string;
  fileUrl?: string;
  fileType?: string;
  storagePath?: string;
}

export interface CategoryInfo {
  id?: string;
  name: string;
  color: string;
  icon: string;
  parentId?: string | null;
}

// --- API Service ---

export const fetchDocuments = async (): Promise<DocumentData[]> => {
  const res = await fetch('/api/documents');
  return res.json();
};

export const fetchCategories = async (): Promise<CategoryInfo[]> => {
  const res = await fetch('/api/categories');
  return res.json();
};

export const saveDocument = async (document: DocumentData, file?: File) => {
  const formData = new FormData();
  formData.append('document', JSON.stringify(document));
  if (file) {
    formData.append('file', file);
  }

  const res = await fetch('/api/documents', {
    method: 'POST',
    body: formData,
  });
  
  if (!res.ok) throw new Error('Failed to save document');
  return res.json();
};

export const removeDocument = async (id: string) => {
  const res = await fetch(`/api/documents/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete document');
  return res.json();
};

export const saveCategory = async (category: CategoryInfo) => {
  const res = await fetch('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(category),
  });
  if (!res.ok) throw new Error('Failed to save category');
  return res.json();
};

export const removeCategory = async (id: string) => {
  const res = await fetch(`/api/categories/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete category');
  return res.json();
};

// Polling helper for real-time feel (since we don't have WebSockets yet)
export const subscribeToDocuments = (callback: (docs: DocumentData[]) => void, onError?: (err: any) => void) => {
  let interval: any;
  
  const poll = async () => {
    try {
      const docs = await fetchDocuments();
      callback(docs);
    } catch (err) {
      if (onError) onError(err);
    }
  };

  poll();
  interval = setInterval(poll, 3000);
  return () => clearInterval(interval);
};

export const subscribeToCategories = (callback: (cats: CategoryInfo[]) => void) => {
  let interval: any;
  
  const poll = async () => {
    try {
      const cats = await fetchCategories();
      callback(cats);
    } catch (err) {
      console.error(err);
    }
  };

  poll();
  interval = setInterval(poll, 5000);
  return () => clearInterval(interval);
};
