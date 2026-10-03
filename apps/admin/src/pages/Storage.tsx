import { useState, useEffect } from 'react';
import { 
  FolderOpen, 
  Trash2, 
  Copy,
  ExternalLink,
  Upload,
  RefreshCw,
  Image as ImageIcon
} from 'lucide-react';
import { api } from '../lib/api';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  size: string;
  thumbnailLink?: string;
}

export default function Storage() {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ items: DriveFile[] }>('/admin/storage/files');
      if (res.data?.items) {
        setFiles(res.data.items);
      }
    } catch (err) {
      console.error('Failed to fetch files:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post('/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchFiles();
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Please check logs.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileId: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"? This action cannot be undone.`)) return;
    
    try {
      await api.delete(`/admin/storage/${fileId}`);
      fetchFiles();
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete file.');
    }
  };

  const copyUrl = (id: string) => {
    const url = `${window.location.origin}/api/v1/admin/storage/${id}`;
    navigator.clipboard.writeText(url);
    alert('URL copied to clipboard!');
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">Google Drive Storage</h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <FolderOpen size={10} /> {files.length} Files
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">Manage images and assets stored directly in Google Drive.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button 
            onClick={fetchFiles}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md transition-colors"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-zinc-400' : 'text-zinc-400'} />
            <span>Refresh</span>
          </button>
          
          <div className="relative">
            <input 
              type="file" 
              accept="image/*"
              onChange={handleUpload}
              disabled={uploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <button 
              disabled={uploading}
              className="flex items-center gap-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-medium px-3.5 py-1.5 rounded-md text-xs transition-colors shadow-sm disabled:opacity-50"
            >
              {uploading ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
              <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-zinc-500 font-mono text-sm">
          Loading Drive contents...
        </div>
      ) : files.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center gap-3">
          <FolderOpen size={40} className="text-zinc-700" />
          <p className="text-zinc-400 text-sm">No files found in the configured Google Drive folder.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {files.map(file => (
            <div key={file.id} className="bg-zinc-900/60 border border-zinc-800 rounded-lg overflow-hidden group hover:border-zinc-700 transition-colors">
              <div className="aspect-video bg-zinc-950 flex items-center justify-center overflow-hidden relative">
                {file.thumbnailLink ? (
                  <img src={file.thumbnailLink} alt={file.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <ImageIcon size={30} className="text-zinc-800" />
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button onClick={() => copyUrl(file.id)} className="p-2 bg-zinc-800 hover:bg-blue-600 text-white rounded-full transition-colors" title="Copy URL">
                    <Copy size={16} />
                  </button>
                  <a href={`/api/v1/admin/storage/${file.id}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full transition-colors" title="View Full Image">
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>
              <div className="p-3">
                <p className="text-xs font-medium text-zinc-200 truncate" title={file.name}>{file.name}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] font-mono text-zinc-500">
                    {file.size ? (parseInt(file.size) / 1024).toFixed(1) + ' KB' : 'Unknown'}
                  </span>
                  <button 
                    onClick={() => handleDelete(file.id, file.name)}
                    className="text-zinc-600 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
