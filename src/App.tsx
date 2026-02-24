/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Archive, 
  Search, 
  Plus, 
  FileText, 
  Folder, 
  Eye, 
  Download, 
  Share2, 
  Grid, 
  List, 
  MoreVertical,
  Bell,
  User,
  LogOut,
  Settings,
  X,
  UploadCloud,
  ChevronRight,
  ShieldCheck,
  Globe,
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';

import { 
  subscribeToDocuments, 
  subscribeToCategories, 
  saveDocument, 
  removeDocument, 
  saveCategory, 
  removeCategory,
  DocumentData,
  CategoryInfo as FirebaseCategoryInfo
} from './services/firebaseService';

import { isFirebaseConfigured } from './firebase';

// --- Types ---

type Status = 'Public' | 'Confidential';

// --- Initial Data ---

const INITIAL_DOCS: DocumentData[] = [];

const INITIAL_CATEGORIES: FirebaseCategoryInfo[] = [];

const AVAILABLE_ICONS = [
  { name: 'Folder', icon: Folder },
  { name: 'Inbox', icon: FileText },
  { name: 'Send', icon: Globe },
  { name: 'UserCheck', icon: ShieldCheck },
  { name: 'PieChart', icon: FileText },
  { name: 'Briefcase', icon: Archive },
  { name: 'Clipboard', icon: FileText },
  { name: 'Book', icon: Archive },
  { name: 'HardDrive', icon: Folder },
  { name: 'Layers', icon: Grid },
];

const ICON_MAP: Record<string, any> = {
  Folder: Folder,
  Inbox: FileText,
  Send: Globe,
  UserCheck: ShieldCheck,
  PieChart: FileText,
  Briefcase: Archive,
  Clipboard: FileText,
  Book: Archive,
  HardDrive: Folder,
  Layers: Grid,
};

const CATEGORY_COLORS = [
  'bg-blue-100 text-blue-600',
  'bg-purple-100 text-purple-600',
  'bg-emerald-100 text-emerald-600',
  'bg-orange-100 text-orange-600',
  'bg-pink-100 text-pink-600',
  'bg-indigo-100 text-indigo-600',
  'bg-cyan-100 text-cyan-600',
  'bg-rose-100 text-rose-600',
];

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 ${
      active 
      ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

const StatCard = ({ label, value, subValue, icon: Icon, color }: { label: string, value: string, subValue: string, icon: any, color: string }) => (
  <div className="bento-card flex flex-col justify-between">
    <div className="flex justify-between items-start">
      <div className={`p-3 rounded-2xl ${color}`}>
        <Icon size={24} />
      </div>
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
    </div>
    <div className="mt-6">
      <h3 className="text-3xl font-bold text-slate-900">{value}</h3>
      <p className="text-sm text-slate-500 mt-1">{subValue}</p>
    </div>
  </div>
);

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onConfirm: () => void, 
  title: string, 
  message: string 
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-sm glass rounded-3xl p-8 shadow-2xl text-center"
          >
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <X size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{title}</h2>
            <p className="text-slate-500 mb-8">{message}</p>
            <div className="flex gap-3">
              <button 
                onClick={onClose} 
                className="flex-1 py-3 rounded-2xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="flex-1 py-3 rounded-2xl bg-red-600 text-white font-semibold shadow-lg shadow-red-200 hover:bg-red-700 transition-colors"
              >
                Hapus
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const PreviewModal = ({ 
  isOpen, 
  onClose, 
  doc,
  onDelete
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  doc: DocumentData | null,
  onDelete: (id: string) => void
}) => {
  if (!doc) return null;

  const handleDownload = () => {
    // Simulated download
    const link = document.createElement('a');
    link.href = '#';
    link.download = doc.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert(`Mengunduh berkas: ${doc.name}`);
  };

  const handleDelete = () => {
    onDelete(doc.id);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-5xl bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col h-[90vh]"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-50 text-red-500 rounded-2xl">
                  <FileText size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{doc.name}</h2>
                  <p className="text-xs text-slate-500">{doc.letterNumber} • {doc.size}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleDelete}
                  className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all"
                  title="Hapus Dokumen"
                >
                  <X size={24} />
                </button>
                <button 
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                >
                  <Download size={18} />
                  Unduh
                </button>
                <button 
                  onClick={onClose}
                  className="p-2 bg-slate-100 text-slate-400 rounded-xl hover:bg-slate-200 transition-all"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-100 p-4 md:p-8 overflow-auto flex justify-center">
              {doc.fileUrl ? (
                <div className="w-full h-full flex items-center justify-center">
                  {doc.fileType?.startsWith('image/') ? (
                    <img 
                      src={doc.fileUrl} 
                      alt={doc.name} 
                      className="max-w-full max-h-full object-contain shadow-2xl rounded-lg" 
                      referrerPolicy="no-referrer"
                    />
                  ) : doc.fileType === 'application/pdf' ? (
                    <iframe 
                      src={doc.fileUrl} 
                      className="w-full h-full rounded-lg shadow-2xl border-none"
                      title={doc.name}
                    />
                  ) : (
                    <div className="w-full max-w-3xl bg-white shadow-lg rounded-lg p-12 min-h-[600px] flex flex-col items-center justify-center gap-4">
                      <FileText size={64} className="text-slate-300" />
                      <p className="text-slate-500 font-medium">Pratinjau tidak tersedia untuk format ini.</p>
                      <button 
                        onClick={handleDownload}
                        className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold"
                      >
                        Unduh untuk Melihat
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Simulated PDF Preview */
                <div className="w-full max-w-3xl bg-white shadow-lg rounded-lg p-12 min-h-[1000px] flex flex-col gap-8">
                  <div className="border-b-2 border-slate-900 pb-6 text-center">
                    <h1 className="text-2xl font-serif font-bold uppercase tracking-widest">KOP SURAT INSTANSI</h1>
                    <p className="text-sm mt-1">Jl. Contoh No. 123, Kota Administrasi, Indonesia</p>
                    <p className="text-sm font-bold">Telp: (021) 1234567 • Email: info@instansi.go.id</p>
                  </div>

                  <div className="flex justify-between items-start mt-4">
                    <div className="space-y-1">
                      <p className="text-sm"><span className="font-bold">Nomor:</span> {doc.letterNumber}</p>
                      <p className="text-sm"><span className="font-bold">Lampiran:</span> -</p>
                      <p className="text-sm"><span className="font-bold">Perihal:</span> {doc.name.replace('.pdf', '')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{doc.date}</p>
                    </div>
                  </div>

                  <div className="mt-8 space-y-4 text-justify leading-relaxed">
                    <p className="text-sm">Yth. Bapak/Ibu Penerima,</p>
                    <p className="text-sm">Di Tempat</p>
                    <p className="text-sm mt-6">Dengan hormat,</p>
                    <p className="text-sm">
                      Sehubungan dengan {doc.description || 'pengelolaan administrasi kantor'}, bersama ini kami sampaikan dokumen terkait yang telah diarsipkan dalam sistem E-Arsip Digital.
                    </p>
                    <p className="text-sm">
                      Dokumen ini bersifat <span className="font-bold uppercase">{doc.classification}</span> dan hanya diperuntukkan bagi pihak-pihak yang memiliki wewenang akses. Mohon untuk dapat dipergunakan sebagaimana mestinya.
                    </p>
                    <p className="text-sm">
                      Demikian penyampaian ini kami sampaikan. Atas perhatian dan kerjasamanya, kami ucapkan terima kasih.
                    </p>
                  </div>

                  <div className="mt-20 self-end text-center w-64">
                    <p className="text-sm mb-16">Hormat kami,</p>
                    <p className="text-sm font-bold underline">KEPALA BAGIAN ARSIP</p>
                    <p className="text-xs text-slate-500">NIP. 19800101 200501 1 001</p>
                  </div>

                  <div className="mt-auto pt-8 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 italic">
                    <span>Dicetak otomatis oleh Simbok App - {new Date().toLocaleString()}</span>
                    <span>Halaman 1 dari 1</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const DocumentView = ({ 
  docs, 
  viewMode, 
  onDelete,
  onEdit,
  onPreview,
  onDownload
}: { 
  docs: DocumentData[], 
  viewMode: 'list' | 'grid', 
  onDelete: (id: string) => void,
  onEdit: (doc: DocumentData) => void,
  onPreview: (doc: DocumentData) => void,
  onDownload: (doc: DocumentData) => void
}) => {
  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-bottom border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Nama Berkas</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Nomor Surat</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Ukuran</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Tanggal</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Klasifikasi</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {docs.length > 0 ? docs.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-50 text-red-500 rounded-lg">
                        <FileText size={18} />
                      </div>
                      <div className="flex flex-col">
                        <button 
                          onClick={() => onPreview(doc)}
                          className="font-semibold text-slate-700 hover:text-blue-600 text-left transition-colors"
                        >
                          {doc.name}
                        </button>
                        <span className="text-[10px] text-slate-400 line-clamp-1">{doc.description}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-500 font-mono">{doc.letterNumber}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-500">{doc.size}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-500">{doc.date}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      doc.classification === 'Rahasia' || doc.classification === 'Sangat Rahasia' 
                      ? 'bg-red-50 text-red-600' 
                      : doc.classification === 'Penting' 
                      ? 'bg-amber-50 text-amber-600' 
                      : 'bg-blue-50 text-blue-600'
                    }`}>
                      {doc.classification}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => onEdit(doc)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Edit"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => onPreview(doc)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Preview"
                      >
                        <Eye size={18} />
                      </button>
                      <button 
                        onClick={() => onDownload(doc)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Download"
                      >
                        <Download size={18} />
                      </button>
                      <button 
                        onClick={() => onDelete(doc.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Hapus"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <FileText size={48} className="opacity-20" />
                      <p className="font-medium">Belum ada dokumen ditemukan.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {docs.length > 0 ? docs.map((doc) => (
        <div key={doc.id} className="bento-card flex flex-col group relative">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-red-50 text-red-500 rounded-2xl">
              <FileText size={28} />
            </div>
            <div className="flex gap-1">
              <button 
                onClick={() => onEdit(doc)}
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
              >
                <Edit2 size={20} />
              </button>
              <button 
                onClick={() => onDelete(doc.id)}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          <button 
            onClick={() => onPreview(doc)}
            className="font-bold text-slate-900 line-clamp-1 text-left hover:text-blue-600 transition-colors"
          >
            {doc.name}
          </button>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{doc.letterNumber}</p>
          <p className="text-xs text-slate-500 mt-2 line-clamp-2 h-8">{doc.description}</p>
          <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
            <span className="text-xs text-slate-400">{doc.date}</span>
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
              doc.classification === 'Rahasia' || doc.classification === 'Sangat Rahasia' 
              ? 'bg-red-50 text-red-600' 
              : doc.classification === 'Penting' 
              ? 'bg-amber-50 text-amber-600' 
              : 'bg-blue-50 text-blue-600'
            }`}>
              {doc.classification}
            </div>
          </div>
          <div className="absolute inset-0 bg-blue-600/90 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
            <button 
              onClick={() => onEdit(doc)}
              className="w-10 h-10 bg-white text-blue-600 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
            >
              <Edit2 size={20} />
            </button>
            <button 
              onClick={() => onPreview(doc)}
              className="w-10 h-10 bg-white text-blue-600 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
            >
              <Eye size={20} />
            </button>
            <button 
              onClick={() => onDownload(doc)}
              className="w-10 h-10 bg-white text-blue-600 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
            >
              <Download size={20} />
            </button>
          </div>
        </div>
      )) : (
        <div className="col-span-full py-20 text-center">
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <FileText size={48} className="opacity-20" />
            <p className="font-medium">Belum ada dokumen ditemukan.</p>
          </div>
        </div>
      )}
    </div>
  );
};

const UploadModal = ({ 
  isOpen, 
  onClose, 
  categories, 
  onUpload,
  editingDoc,
  onAddCategory
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  categories: FirebaseCategoryInfo[], 
  onUpload: (doc: any, file?: File) => void,
  editingDoc?: DocumentData | null,
  onAddCategory: () => void
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || '');
  const [status, setStatus] = useState<Status>('Public');
  const [letterNumber, setLetterNumber] = useState('');
  const [docDate, setDocDate] = useState(new Date().toISOString().split('T')[0]);
  const [classification, setClassification] = useState('Umum');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingDoc) {
      setName(editingDoc.name.replace('.pdf', ''));
      setCategory(editingDoc.category);
      setStatus(editingDoc.status);
      setLetterNumber(editingDoc.letterNumber);
      
      // Convert DD-MM-YYYY to YYYY-MM-DD for input
      const [day, month, year] = editingDoc.date.split('-');
      setDocDate(`${year}-${month}-${day}`);
      
      setClassification(editingDoc.classification);
      setDescription(editingDoc.description);
      setSelectedFile(null);
    } else {
      setName('');
      setCategory(categories[0]?.name || '');
      setStatus('Public');
      setLetterNumber('');
      setDocDate(new Date().toISOString().split('T')[0]);
      setClassification('Umum');
      setDescription('');
      setSelectedFile(null);
    }
  }, [editingDoc, isOpen, categories]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!name) {
        setName(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleSubmit = () => {
    if (!name) {
      alert('Nama berkas harus diisi');
      return;
    }
    
    const [year, month, day] = docDate.split('-');
    const formattedDate = `${day}-${month}-${year}`;

    const fileType = selectedFile?.type || (editingDoc?.fileType || 'application/pdf');
    
    // Create a local URL for the file if a new one was selected
    let fileUrl = editingDoc?.fileUrl;
    if (selectedFile) {
      fileUrl = URL.createObjectURL(selectedFile);
    }

    onUpload({
      id: editingDoc?.id,
      name: name.endsWith('.pdf') ? name : `${name}.pdf`,
      category,
      date: formattedDate,
      status,
      size: selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB` : (editingDoc?.size || '0 MB'),
      letterNumber,
      classification,
      description,
      fileUrl: editingDoc?.fileUrl,
      fileType: selectedFile?.type || editingDoc?.fileType,
      storagePath: editingDoc?.storagePath
    }, selectedFile || undefined);
    
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-2xl glass rounded-3xl p-8 shadow-2xl my-8"
          >
            <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600">
              <X size={24} />
            </button>
            
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {editingDoc ? 'Edit Informasi Berkas' : 'Unggah Berkas Baru'}
            </h2>
            <p className="text-slate-500 mb-6">
              {editingDoc ? 'Ubah informasi berkas yang sudah ada.' : 'Lengkapi informasi berkas di bawah ini.'}
            </p>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Nama Berkas</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Laporan_Keuangan_Q1"
                    className="w-full px-4 py-3 bg-slate-100 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Nomor Surat</label>
                  <input 
                    type="text" 
                    value={letterNumber}
                    onChange={(e) => setLetterNumber(e.target.value)}
                    placeholder="Contoh: 001/ADM/2024"
                    className="w-full px-4 py-3 bg-slate-100 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Tanggal Dokumen</label>
                  <input 
                    type="date" 
                    value={docDate}
                    onChange={(e) => setDocDate(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-100 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Kategori</label>
                  {categories.length > 0 ? (
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-100 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none appearance-none"
                    >
                      {categories.map(cat => {
                        const getPath = (c: FirebaseCategoryInfo): string => {
                          if (!c.parentId) return c.name;
                          const parent = categories.find(p => p.name === c.parentId);
                          return parent ? `${getPath(parent)} > ${c.name}` : c.name;
                        };
                        return (
                          <option key={cat.name} value={cat.name}>{getPath(cat)}</option>
                        );
                      })}
                    </select>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-100">Belum ada kategori. Silakan buat kategori terlebih dahulu.</p>
                      <button 
                        type="button"
                        onClick={() => {
                          onClose();
                          onAddCategory();
                        }}
                        className="text-xs font-bold text-blue-600 hover:underline text-left"
                      >
                        + Tambah Kategori Baru
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Klasifikasi</label>
                  <select 
                    value={classification}
                    onChange={(e) => setClassification(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-100 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none appearance-none"
                  >
                    <option value="Umum">Umum</option>
                    <option value="Penting">Penting</option>
                    <option value="Rahasia">Rahasia</option>
                    <option value="Sangat Rahasia">Sangat Rahasia</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Deskripsi</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Keterangan singkat mengenai dokumen..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-100 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none resize-none"
                />
              </div>

              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-6 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group ${
                  selectedFile ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-400 hover:bg-blue-50/50'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <UploadCloud size={24} className={selectedFile ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-600'} />
                <p className="text-sm font-semibold text-slate-900">
                  {selectedFile ? selectedFile.name : 'Pilih berkas atau seret ke sini'}
                </p>
                <p className="text-xs text-slate-400">
                  {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : 'PDF, DOCX, JPG (Maks. 10MB)'}
                </p>
              </div>
            </div>
            
            <div className="mt-8 flex gap-3">
              <button onClick={onClose} className="flex-1 py-3 rounded-2xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                Batal
              </button>
              <button 
                onClick={handleSubmit}
                className="flex-1 py-3 rounded-2xl bg-blue-600 text-white font-semibold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors"
              >
                {editingDoc ? 'Simpan Perubahan' : 'Simpan Dokumen'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const FolderModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  editingFolder,
  categories
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onSave: (name: string, icon: string, parentId: string | null) => void,
  editingFolder: FirebaseCategoryInfo | null,
  categories: FirebaseCategoryInfo[]
}) => {
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Folder');
  const [parentId, setParentId] = useState<string | null>(null);

  useEffect(() => {
    if (editingFolder) {
      setName(editingFolder.name);
      setSelectedIcon(editingFolder.icon);
      setParentId(editingFolder.parentId || null);
    } else {
      setName('');
      setSelectedIcon('Folder');
      setParentId(null);
    }
  }, [editingFolder, isOpen]);

  const handleSubmit = () => {
    if (!name) return;
    onSave(name, selectedIcon, parentId);
    setName('');
    onClose();
  };

  // Filter out the current folder and its subfolders to prevent circular references
  // For simplicity in this demo, we just exclude the current folder
  const availableParents = categories.filter(c => !editingFolder || c.name !== editingFolder.name);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md glass rounded-3xl p-8 shadow-2xl"
          >
            <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600">
              <X size={24} />
            </button>
            
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {editingFolder ? 'Edit Folder' : 'Tambah Folder Baru'}
            </h2>
            <p className="text-slate-500 mb-6">
              {editingFolder ? 'Ubah informasi folder Anda.' : 'Berikan nama dan ikon untuk kategori folder baru Anda.'}
            </p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Nama Folder</label>
                <input 
                  type="text" 
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Arsip Kepegawaian"
                  className="w-full px-4 py-3 bg-slate-100 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Parent Folder (Opsional)</label>
                <select 
                  value={parentId || ''}
                  onChange={(e) => setParentId(e.target.value || null)}
                  className="w-full px-4 py-3 bg-slate-100 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none appearance-none"
                >
                  <option value="">Tanpa Parent (Root)</option>
                  {availableParents.map(cat => (
                    <option key={cat.name} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Pilih Ikon</label>
                <div className="grid grid-cols-5 gap-3">
                  {AVAILABLE_ICONS.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => setSelectedIcon(item.name)}
                      className={`p-3 rounded-xl flex items-center justify-center transition-all ${
                        selectedIcon === item.name 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      <item.icon size={20} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex gap-3">
              <button onClick={onClose} className="flex-1 py-3 rounded-2xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                Batal
              </button>
              <button 
                onClick={handleSubmit}
                className="flex-1 py-3 rounded-2xl bg-blue-600 text-white font-semibold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors"
              >
                {editingFolder ? 'Simpan Perubahan' : 'Buat Folder'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default function App() {
  const [activeMenu, setActiveMenu] = useState<'dashboard' | 'archive' | 'documents' | 'search'>('dashboard');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentData | null>(null);
  const [editingDoc, setEditingDoc] = useState<DocumentData | null>(null);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FirebaseCategoryInfo | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  
  // Confirmation Modal State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });
  
  // Advanced Search Filters
  const [advFilters, setAdvFilters] = useState({
    name: '',
    letterNumber: '',
    category: '',
    classification: '',
    startDate: '',
    endDate: ''
  });
  
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [categories, setCategories] = useState<FirebaseCategoryInfo[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermissionError, setHasPermissionError] = useState(false);

  useEffect(() => {
    const unsubDocs = subscribeToDocuments(
      (docs) => {
        setDocuments(docs);
        setIsLoading(false);
        setHasPermissionError(false);
      },
      (error) => {
        setIsLoading(false);
        if (error.code === 'permission-denied') {
          setHasPermissionError(true);
        }
      }
    );
    const unsubCats = subscribeToCategories((cats) => {
      setCategories(cats);
    });

    return () => {
      unsubDocs();
      unsubCats();
    };
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleUpload = async (newDoc: DocumentData, file?: File) => {
    try {
      await saveDocument(newDoc, file);
      setEditingDoc(null);
    } catch (error) {
      console.error("Error uploading document:", error);
      alert("Gagal mengunggah dokumen. Silakan coba lagi.");
    }
  };

  const handleEditDoc = (doc: DocumentData) => {
    setEditingDoc(doc);
    setIsUploadOpen(true);
  };

  const handlePreviewDoc = (doc: DocumentData) => {
    setSelectedDoc(doc);
    setIsPreviewOpen(true);
  };

  const handleDownloadDoc = (doc: DocumentData) => {
    if (doc.fileUrl) {
      window.open(doc.fileUrl, '_blank');
    } else {
      alert("Tautan unduhan tidak tersedia.");
    }
  };

  const handleSaveFolder = async (name: string, icon: string, parentId: string | null) => {
    try {
      if (editingFolder) {
        await saveCategory({ ...editingFolder, name, icon, parentId });
        setEditingFolder(null);
      } else {
        if (categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
          alert("Kategori dengan nama ini sudah ada.");
          return;
        }
        const color = CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length];
        await saveCategory({ name, color, icon, parentId });
      }
    } catch (error) {
      console.error("Error saving category:", error);
      alert("Gagal menyimpan kategori.");
    }
  };

  const handleAddFolderClick = () => {
    setEditingFolder(null);
    setIsFolderModalOpen(true);
  };

  const handleEditFolderClick = (e: React.MouseEvent, folder: FirebaseCategoryInfo) => {
    e.stopPropagation();
    setEditingFolder(folder);
    setIsFolderModalOpen(true);
  };

  const handleDeleteFolder = (name: string) => {
    const category = categories.find(c => c.name === name);
    if (!category?.id) return;

    setConfirmConfig({
      isOpen: true,
      title: 'Hapus Kategori',
      message: `Apakah Anda yakin ingin menghapus kategori "${name}"? Semua berkas di dalamnya akan tetap ada namun tanpa kategori.`,
      onConfirm: async () => {
        try {
          await removeCategory(category.id!);
          if (selectedFolder === name) {
            setSelectedFolder(category.parentId || null);
          }
        } catch (error) {
          console.error("Error deleting category:", error);
          alert("Gagal menghapus kategori.");
        }
      }
    });
  };

  const handleDeleteDoc = (id: string) => {
    const doc = documents.find(d => d.id === id);
    setConfirmConfig({
      isOpen: true,
      title: 'Hapus Dokumen',
      message: `Apakah Anda yakin ingin menghapus dokumen "${doc?.name || 'ini'}"?`,
      onConfirm: async () => {
        try {
          await removeDocument(id, doc?.storagePath);
          setIsPreviewOpen(false);
          setSelectedDoc(null);
        } catch (error) {
          console.error("Error deleting document:", error);
          alert("Gagal menghapus dokumen.");
        }
      }
    });
  };

  const getDocCount = (categoryName: string) => {
    const getSubCategories = (name: string): string[] => {
      const subs = categories.filter(c => c.parentId === name).map(c => c.name);
      return [name, ...subs.flatMap(s => getSubCategories(s))];
    };
    const allRelatedCategories = getSubCategories(categoryName);
    return documents.filter(doc => allRelatedCategories.includes(doc.category)).length;
  };

  const filteredDocs = documents.filter(doc => {
    // Simple Search (Header)
    const matchesSimpleSearch = searchQuery ? (
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.letterNumber.toLowerCase().includes(searchQuery.toLowerCase())
    ) : true;

    // Folder Filter (E-Archive)
    const matchesFolder = activeMenu === 'archive' && selectedFolder ? doc.category === selectedFolder : true;

    // Advanced Search Filters
    const matchesAdvName = advFilters.name ? doc.name.toLowerCase().includes(advFilters.name.toLowerCase()) : true;
    const matchesAdvLetter = advFilters.letterNumber ? doc.letterNumber.toLowerCase().includes(advFilters.letterNumber.toLowerCase()) : true;
    const matchesAdvCategory = advFilters.category ? doc.category === advFilters.category : true;
    const matchesAdvClassification = advFilters.classification ? doc.classification === advFilters.classification : true;
    
    // Date filtering (assuming DD-MM-YYYY format in doc.date)
    const matchesDateRange = true; // Simplified for now as date parsing can be tricky with DD-MM-YYYY
    
    if (activeMenu === 'search') {
      return matchesAdvName && matchesAdvLetter && matchesAdvCategory && matchesAdvClassification;
    }

    return matchesSimpleSearch && matchesFolder;
  });

  const totalSize = (documents.reduce((acc, doc) => {
    const size = parseFloat(doc.size) || 0;
    return acc + size;
  }, 0) / 1024).toFixed(2); // Assuming size is in MB, convert to GB for display

  const recentDocsCount = documents.filter(doc => {
    const docDate = new Date(doc.date.split('-').reverse().join('-'));
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return docDate >= sevenDaysAgo;
  }).length;

  // --- Chart Data Preparation ---
  const categoryStats = categories.map(cat => ({
    name: cat.name,
    value: documents.filter(doc => doc.category === cat.name).length
  })).filter(stat => stat.value > 0);

  const classificationStats = [
    { name: 'Umum', value: documents.filter(doc => doc.classification === 'Umum').length, color: '#3b82f6' },
    { name: 'Penting', value: documents.filter(doc => doc.classification === 'Penting').length, color: '#f59e0b' },
    { name: 'Rahasia', value: documents.filter(doc => doc.classification === 'Rahasia').length, color: '#ef4444' },
    { name: 'Sangat Rahasia', value: documents.filter(doc => doc.classification === 'Sangat Rahasia').length, color: '#7f1d1d' },
  ].filter(stat => stat.value > 0);

  const CHART_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* --- Desktop Sidebar --- */}
      {!isMobile && (
        <aside className="w-72 glass h-screen sticky top-0 flex flex-col p-6 z-40">
          <div className="flex items-center gap-3 px-2 mb-10">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <Archive size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Simbok <span className="text-blue-600">App</span></h1>
          </div>

          <nav className="flex-1 flex flex-col gap-2">
            <SidebarItem 
              icon={LayoutDashboard} 
              label="Dashboard" 
              active={activeMenu === 'dashboard'} 
              onClick={() => setActiveMenu('dashboard')}
            />
            <SidebarItem 
              icon={Archive} 
              label="Kategori" 
              active={activeMenu === 'archive' && !selectedFolder} 
              onClick={() => {
                setActiveMenu('archive');
                setSelectedFolder(null);
              }}
            />
            
            {/* Category List in Sidebar */}
            {categories.length > 0 && (
              <div className="ml-4 flex flex-col gap-1 mb-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                {categories.filter(cat => !cat.parentId).map(cat => {
                  const Icon = ICON_MAP[cat.icon] || Folder;
                  const isActive = activeMenu === 'archive' && selectedFolder === cat.name;
                  return (
                    <button 
                      key={cat.name}
                      onClick={() => {
                        setActiveMenu('archive');
                        setSelectedFolder(cat.name);
                      }}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-sm ${
                        isActive 
                        ? 'bg-blue-50 text-blue-600 font-bold' 
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <Icon size={16} />
                      <span className="truncate">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="px-4 py-2">
              <button 
                onClick={handleAddFolderClick}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-all border border-blue-100"
              >
                <Plus size={18} />
                <span>Tambah Kategori</span>
              </button>
            </div>
            <SidebarItem 
              icon={FileText} 
              label="Dokumen" 
              active={activeMenu === 'documents'} 
              onClick={() => setActiveMenu('documents')}
            />
            <SidebarItem 
              icon={Search} 
              label="Pencarian" 
              active={activeMenu === 'search'} 
              onClick={() => setActiveMenu('search')}
            />
            <SidebarItem 
              icon={Settings} 
              label="Pengaturan" 
              active={false} 
              onClick={() => {}}
            />
          </nav>

          <div className="mt-auto pt-6 border-t border-slate-100">
            <div className="flex items-center gap-3 p-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                <img src="https://picsum.photos/seed/user1/100/100" alt="User" referrerPolicy="no-referrer" />
              </div>
              <div>
                <p className="text-sm font-bold">Admin Kantor</p>
                <p className="text-xs text-slate-500">Super Admin</p>
              </div>
            </div>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-500 hover:bg-red-50 transition-all">
              <LogOut size={20} />
              <span className="font-medium">Keluar</span>
            </button>
          </div>
        </aside>
      )}

      {/* --- Main Content --- */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">
        {/* Header */}
        <header className="h-20 glass sticky top-0 z-30 flex items-center justify-between px-6 lg:px-10">
          <div className="flex-1 max-w-xl">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="Cari dokumen, kategori, atau tanggal..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-100/50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 rounded-2xl transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 ml-4">
            <button className="relative p-3 rounded-2xl text-slate-500 hover:bg-slate-100 transition-all">
              <Bell size={20} />
              <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            {isMobile && (
              <button className="p-3 rounded-2xl text-slate-500 hover:bg-slate-100 transition-all">
                <User size={20} />
              </button>
            )}
          </div>
        </header>

        {!isFirebaseConfigured && (
          <div className="mx-6 lg:mx-10 mt-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-800">
            <div className="p-2 bg-amber-100 rounded-xl">
              <Settings size={20} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold">Firebase Belum Dikonfigurasi</p>
              <p className="text-xs opacity-80">Silakan atur API Key Firebase di Secrets panel untuk mengaktifkan penyimpanan cloud.</p>
            </div>
          </div>
        )}

        {hasPermissionError && (
          <div className="mx-6 lg:mx-10 mt-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-800">
            <div className="p-2 bg-red-100 rounded-xl">
              <ShieldCheck size={20} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold">Akses Ditolak (Permission Denied)</p>
              <p className="text-xs opacity-80">Firebase menolak akses. Pastikan Anda telah mengatur "Security Rules" di Firebase Console menjadi "allow read, write: if true;".</p>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="p-6 lg:p-10 pb-32 lg:pb-10 relative min-h-[calc(100vh-5rem)]">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-[#F8FAFC]/80 backdrop-blur-sm z-20"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-slate-500 font-medium">Memuat data...</p>
                </div>
              </motion.div>
            ) : activeMenu === 'dashboard' ? (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-10"
              >
                {/* Stats Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div onClick={() => setActiveMenu('documents')} className="cursor-pointer transition-transform hover:scale-[1.02]">
                    <StatCard 
                      label="Total Dokumen" 
                      value={documents.length.toLocaleString()} 
                      subValue="+12% dari bulan lalu" 
                      icon={FileText} 
                      color="bg-blue-100 text-blue-600"
                    />
                  </div>
                  <StatCard 
                    label="Penyimpanan" 
                    value={`${totalSize} GB`} 
                    subValue="Dari total 100 GB" 
                    icon={Folder} 
                    color="bg-emerald-100 text-emerald-600"
                  />
                  <div onClick={() => {
                    setAdvFilters(prev => ({ ...prev, startDate: '2026-02-15' })); // Simulated "Recent" filter
                    setActiveMenu('search');
                  }} className="cursor-pointer transition-transform hover:scale-[1.02]">
                    <StatCard 
                      label="Dokumen Baru" 
                      value={recentDocsCount.toString()} 
                      subValue="Dalam 7 hari terakhir" 
                      icon={Plus} 
                      color="bg-purple-100 text-purple-600"
                    />
                  </div>
                  <div className="bento-card bg-blue-600 text-white flex flex-col justify-between border-none shadow-blue-200">
                    <div>
                      <h3 className="text-xl font-bold">Upgrade Pro</h3>
                      <p className="text-blue-100 text-sm mt-1">Dapatkan fitur OCR & Kolaborasi tim.</p>
                    </div>
                    <button className="mt-6 w-full py-2 bg-white text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors">
                      Pelajari Lebih Lanjut
                    </button>
                  </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Pie Chart: Distribution by Category */}
                  <div className="bento-card">
                    <h3 className="text-xl font-bold text-slate-900 mb-6">Distribusi Kategori</h3>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryStats}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                            onClick={(data) => {
                              if (data && data.name) {
                                setAdvFilters(prev => ({ ...prev, category: data.name }));
                                setActiveMenu('search');
                              }
                            }}
                            className="cursor-pointer"
                          >
                            {categoryStats.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                          <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Bar Chart: Classification Summary */}
                  <div className="bento-card">
                    <h3 className="text-xl font-bold text-slate-900 mb-6">Rekap Klasifikasi</h3>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={classificationStats}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#64748b', fontSize: 12 }}
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#64748b', fontSize: 12 }}
                          />
                          <Tooltip 
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                          <Bar 
                            dataKey="value" 
                            radius={[8, 8, 0, 0]}
                            onClick={(data) => {
                              if (data && data.name) {
                                setAdvFilters(prev => ({ ...prev, classification: data.name }));
                                setActiveMenu('search');
                              }
                            }}
                            className="cursor-pointer"
                          >
                            {classificationStats.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Quick Actions / Summary Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bento-card bg-slate-50 border-none">
                    <h4 className="font-bold text-slate-900 mb-2">Keamanan Data</h4>
                    <p className="text-sm text-slate-500">Seluruh dokumen dienkripsi dengan standar AES-256 untuk menjamin kerahasiaan arsip kantor Anda.</p>
                  </div>
                  <div className="bento-card bg-slate-50 border-none">
                    <h4 className="font-bold text-slate-900 mb-2">Pencarian Cepat</h4>
                    <p className="text-sm text-slate-500">Gunakan fitur pencarian tingkat lanjut untuk menemukan dokumen berdasarkan nomor surat atau klasifikasi.</p>
                  </div>
                  <div className="bento-card bg-slate-50 border-none">
                    <h4 className="font-bold text-slate-900 mb-2">Backup Otomatis</h4>
                    <p className="text-sm text-slate-500">Sistem melakukan pencadangan data setiap hari pukul 00:00 untuk mencegah kehilangan informasi penting.</p>
                  </div>
                </div>
              </motion.div>
            ) : activeMenu === 'archive' ? (
              <motion.div 
                key="archive"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Main Archive Content */}
                <div className="space-y-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {selectedFolder && (
                        <button 
                          onClick={() => {
                            const currentCat = categories.find(c => c.name === selectedFolder);
                            setSelectedFolder(currentCat?.parentId || null);
                          }}
                          className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all"
                        >
                          <ChevronRight size={20} className="rotate-180" />
                        </button>
                      )}
                      <div>
                        <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                          <span className="cursor-pointer hover:underline" onClick={() => setSelectedFolder(null)}>Kategori</span>
                          {selectedFolder && (
                            <>
                              <ChevronRight size={12} className="text-slate-300" />
                              <span className="text-slate-400">{selectedFolder}</span>
                            </>
                          )}
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900">{selectedFolder || 'Kategori'}</h2>
                        <p className="text-slate-500 mt-1 text-sm">
                          {selectedFolder ? `Menampilkan berkas dalam kategori ${selectedFolder}` : 'Kelola kategori dan telusuri semua arsip digital.'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {!selectedFolder && (
                        <button 
                          onClick={handleAddFolderClick}
                          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-2xl text-slate-600 font-semibold hover:bg-slate-50 transition-all shadow-sm"
                        >
                          <Plus size={18} />
                          Folder Baru
                        </button>
                      )}
                      <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
                        <button 
                          onClick={() => setViewMode('list')}
                          className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
                        >
                          <List size={20} />
                        </button>
                        <button 
                          onClick={() => setViewMode('grid')}
                          className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
                        >
                          <Grid size={20} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categories
                      .filter(cat => cat.parentId === (selectedFolder || null))
                      .map((cat, i) => {
                        const Icon = ICON_MAP[cat.icon] || Folder;
                        return (
                          <div key={i} className="bento-card group relative overflow-hidden">
                            <div 
                              onClick={() => setSelectedFolder(cat.name)}
                              className="flex flex-col h-full cursor-pointer"
                            >
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${cat.color}`}>
                                <Icon size={24} />
                              </div>
                              <h3 className="font-bold text-slate-900">{cat.name}</h3>
                              <p className="text-sm text-slate-500 mt-1">{getDocCount(cat.name)} Berkas</p>
                            </div>
                            
                            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                              <button 
                                onClick={(e) => handleEditFolderClick(e, cat)}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteFolder(cat.name);
                                }}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    
                    {/* Always show "Add Folder" button at the current level */}
                    <button 
                      onClick={handleAddFolderClick}
                      className="bento-card border-dashed border-2 border-slate-200 bg-transparent flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/30 transition-all py-8"
                    >
                      <Plus size={32} />
                      <span className="font-bold">Tambah Folder</span>
                    </button>
                  </div>

                  {selectedFolder && (
                    <div className="mt-10">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-slate-900">Berkas di {selectedFolder}</h3>
                      </div>
                      <DocumentView 
                        docs={filteredDocs} 
                        viewMode={viewMode} 
                        onDelete={handleDeleteDoc} 
                        onEdit={handleEditDoc}
                        onPreview={handlePreviewDoc}
                        onDownload={handleDownloadDoc}
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            ) : activeMenu === 'documents' ? (
              <motion.div 
                key="documents"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900">Seluruh Dokumen</h2>
                    <p className="text-slate-500 mt-1">Daftar lengkap seluruh dokumen yang telah diunggah.</p>
                  </div>
                  <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
                    <button 
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
                    >
                      <List size={20} />
                    </button>
                    <button 
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
                    >
                      <Grid size={20} />
                    </button>
                  </div>
                </div>
                <DocumentView 
                  docs={documents} 
                  viewMode={viewMode} 
                  onDelete={handleDeleteDoc} 
                  onEdit={handleEditDoc}
                  onPreview={handlePreviewDoc}
                  onDownload={handleDownloadDoc}
                />
              </motion.div>
            ) : (
              <motion.div 
                key="search"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">Pencarian Tingkat Lanjut</h2>
                  <p className="text-slate-500 mt-1">Gunakan filter di bawah untuk menemukan dokumen secara spesifik.</p>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Nama Berkas</label>
                      <input 
                        type="text" 
                        value={advFilters.name}
                        onChange={(e) => setAdvFilters(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Cari nama..."
                        className="w-full px-4 py-3 bg-slate-100 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Nomor Surat</label>
                      <input 
                        type="text" 
                        value={advFilters.letterNumber}
                        onChange={(e) => setAdvFilters(prev => ({ ...prev, letterNumber: e.target.value }))}
                        placeholder="Cari nomor..."
                        className="w-full px-4 py-3 bg-slate-100 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Klasifikasi</label>
                      <select 
                        value={advFilters.classification}
                        onChange={(e) => setAdvFilters(prev => ({ ...prev, classification: e.target.value }))}
                        className="w-full px-4 py-3 bg-slate-100 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none"
                      >
                        <option value="">Semua Klasifikasi</option>
                        <option value="Umum">Umum</option>
                        <option value="Penting">Penting</option>
                        <option value="Rahasia">Rahasia</option>
                        <option value="Sangat Rahasia">Sangat Rahasia</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Kategori</label>
                      <select 
                        value={advFilters.category}
                        onChange={(e) => setAdvFilters(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-4 py-3 bg-slate-100 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none"
                      >
                        <option value="">Semua Kategori</option>
                        {categories.map(cat => (
                          <option key={cat.name} value={cat.name}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2 flex items-end gap-3">
                      <button 
                        onClick={() => setAdvFilters({ name: '', letterNumber: '', category: '', classification: '', startDate: '', endDate: '' })}
                        className="px-6 py-3 rounded-2xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        Reset Filter
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-900">Hasil Pencarian ({filteredDocs.length})</h3>
                    <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
                      <button 
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
                      >
                        <List size={20} />
                      </button>
                      <button 
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
                      >
                        <Grid size={20} />
                      </button>
                    </div>
                  </div>
                  <DocumentView 
                    docs={filteredDocs} 
                    viewMode={viewMode} 
                    onDelete={handleDeleteDoc} 
                    onEdit={handleEditDoc}
                    onPreview={handlePreviewDoc}
                    onDownload={handleDownloadDoc}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* --- Mobile Bottom Nav --- */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 h-20 glass border-t border-slate-100 flex items-center justify-around px-6 z-40">
          <button 
            onClick={() => setActiveMenu('dashboard')}
            className={`flex flex-col items-center gap-1 ${activeMenu === 'dashboard' ? 'text-blue-600' : 'text-slate-400'}`}
          >
            <LayoutDashboard size={24} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Home</span>
          </button>
          <button 
            onClick={() => setActiveMenu('archive')}
            className={`flex flex-col items-center gap-1 ${activeMenu === 'archive' ? 'text-blue-600' : 'text-slate-400'}`}
          >
            <Archive size={24} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Kategori</span>
          </button>
          <button 
            onClick={() => setActiveMenu('documents')}
            className={`flex flex-col items-center gap-1 ${activeMenu === 'documents' ? 'text-blue-600' : 'text-slate-400'}`}
          >
            <FileText size={24} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Docs</span>
          </button>
          <div className="w-12"></div> {/* Spacer for FAB */}
          <button 
            onClick={() => setActiveMenu('search')}
            className={`flex flex-col items-center gap-1 ${activeMenu === 'search' ? 'text-blue-600' : 'text-slate-400'}`}
          >
            <Search size={24} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Cari</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-slate-400">
            <Settings size={24} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Set</span>
          </button>
        </nav>
      )}

      {/* --- Floating Action Button --- */}
      <motion.button 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsUploadOpen(true)}
        className={`fixed z-50 bg-blue-600 text-white shadow-2xl shadow-blue-300 flex items-center justify-center transition-all duration-300 ${
          isMobile 
          ? 'bottom-10 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full border-4 border-white' 
          : 'bottom-10 right-10 w-16 h-16 rounded-2xl'
        }`}
      >
        <Plus size={32} />
      </motion.button>

      {/* --- Modals --- */}
      <UploadModal 
        isOpen={isUploadOpen} 
        onClose={() => {
          setIsUploadOpen(false);
          setEditingDoc(null);
        }} 
        categories={categories}
        onUpload={handleUpload}
        editingDoc={editingDoc}
        onAddCategory={handleAddFolderClick}
      />
      <FolderModal 
        isOpen={isFolderModalOpen} 
        onClose={() => {
          setIsFolderModalOpen(false);
          setEditingFolder(null);
        }} 
        onSave={handleSaveFolder}
        editingFolder={editingFolder}
        categories={categories}
      />
      <PreviewModal 
        isOpen={isPreviewOpen} 
        onClose={() => {
          setIsPreviewOpen(false);
          setSelectedDoc(null);
        }} 
        doc={selectedDoc} 
        onDelete={handleDeleteDoc}
      />
      <ConfirmModal 
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
      />
    </div>
  );
}
