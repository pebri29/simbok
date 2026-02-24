import { supabase, isSupabaseConfigured } from '../supabase';

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

export interface AppSettings {
  app_name: string;
  profile_url: string;
  admin_label: string;
  super_admin_label: string;
}

// --- Documents ---

export const subscribeToDocuments = (callback: (docs: DocumentData[]) => void, onError?: (err: any) => void) => {
  if (!isSupabaseConfigured) return () => {};

  // Initial fetch
  supabase.from('documents').select('*').then(({ data, error }) => {
    if (error) {
      if (onError) onError(error);
    } else {
      callback(data as DocumentData[]);
    }
  });

  // Real-time subscription
  const subscription = supabase
    .channel('documents_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, async () => {
      const { data } = await supabase.from('documents').select('*');
      if (data) callback(data as DocumentData[]);
    })
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
};

export const saveDocument = async (document: DocumentData, file?: File) => {
  if (!isSupabaseConfigured) throw new Error("Supabase not configured");

  let fileUrl = document.fileUrl;
  let storagePath = document.storagePath;

  if (file) {
    const timestamp = Date.now();
    storagePath = `${timestamp}_${file.name}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, file);

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(storagePath);
      
    fileUrl = urlData.publicUrl;
  }

  const { id, ...data } = document;
  const payload = { ...data, fileUrl, storagePath };

  if (id) {
    const { error } = await supabase.from('documents').update(payload).eq('id', id);
    if (error) throw error;
    return id;
  } else {
    const { data: insertedData, error } = await supabase.from('documents').insert(payload).select();
    if (error) throw error;
    return insertedData[0].id;
  }
};

export const removeDocument = async (id: string, storagePath?: string) => {
  if (!isSupabaseConfigured) throw new Error("Supabase not configured");

  if (storagePath) {
    await supabase.storage.from('documents').remove([storagePath]);
  }

  const { error } = await supabase.from('documents').delete().eq('id', id);
  if (error) throw error;
};

// --- Categories ---

export const subscribeToCategories = (callback: (cats: CategoryInfo[]) => void) => {
  if (!isSupabaseConfigured) return () => {};

  // Initial fetch
  supabase.from('categories').select('*').then(({ data }) => {
    if (data) callback(data as CategoryInfo[]);
  });

  // Real-time subscription
  const subscription = supabase
    .channel('categories_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, async () => {
      const { data } = await supabase.from('categories').select('*');
      if (data) callback(data as CategoryInfo[]);
    })
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
};

export const saveCategory = async (category: CategoryInfo) => {
  if (!isSupabaseConfigured) throw new Error("Supabase not configured");

  const { id, ...data } = category;

  if (id) {
    const { error } = await supabase.from('categories').update(data).eq('id', id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('categories').insert(data);
    if (error) throw error;
  }
};

export const removeCategory = async (id: string) => {
  if (!isSupabaseConfigured) throw new Error("Supabase not configured");
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
};

// --- Settings ---

export const subscribeToSettings = (callback: (settings: AppSettings) => void) => {
  if (!isSupabaseConfigured) return () => {};

  supabase.from('app_settings').select('*').single().then(({ data }) => {
    if (data) callback(data as AppSettings);
  });

  const subscription = supabase
    .channel('settings_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, async () => {
      const { data } = await supabase.from('app_settings').select('*').single();
      if (data) callback(data as AppSettings);
    })
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
};

export const updateSettings = async (settings: Partial<AppSettings>) => {
  if (!isSupabaseConfigured) throw new Error("Supabase not configured");
  const { error } = await supabase.from('app_settings').update(settings).eq('id', 1);
  if (error) throw error;
};
