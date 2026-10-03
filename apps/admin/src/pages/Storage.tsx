import { useState, useEffect } from 'react';
import { 
  FolderOpen, 
  Trash2, 
  Plus,
  Cloud,
  Database,
  CheckCircle2
} from 'lucide-react';
import { api } from '../lib/api';

interface StorageProvider {
  id: string;
  name: string;
  provider_type: string;
  status: string;
  is_default: boolean;
  created_at: string;
}

interface StoragePolicy {
  id: string;
  entity_type: string;
  provider_id: string;
  provider_name: string;
  provider_type: string;
}

export default function Storage() {
  const [providers, setProviders] = useState<StorageProvider[]>([]);
  const [policies, setPolicies] = useState<StoragePolicy[]>([]);
  const [loading, setLoading] = useState(true);

  // New Provider Modal State
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [newProvider, setNewProvider] = useState({ name: '', type: 'GOOGLE_DRIVE' });
  const [credentialsText, setCredentialsText] = useState('');

  // New Policy Modal State
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [newPolicy, setNewPolicy] = useState({ entity_type: 'ARTICLE', provider_id: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [provRes, polRes] = await Promise.all([
        api.get<{items: StorageProvider[]}>('/admin/storage-config/providers'),
        api.get<{items: StoragePolicy[]}>('/admin/storage-config/policies')
      ]);
      setProviders(provRes.data.items || []);
      setPolicies(polRes.data.items || []);
    } catch (err) {
      console.error('Failed to fetch storage data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddProvider = async () => {
    try {
      let creds = {};
      try {
        creds = JSON.parse(credentialsText);
      } catch (e) {
        alert("Invalid JSON in credentials");
        return;
      }
      await api.post('/admin/storage-config/providers', {
        name: newProvider.name,
        provider_type: newProvider.type,
        credentials: creds,
        is_default: providers.length === 0
      });
      setShowProviderModal(false);
      fetchData();
    } catch (e) {
      alert("Failed to add provider");
    }
  };

  const handleDeleteProvider = async (id: string) => {
    if (!confirm("Delete this provider?")) return;
    try {
      await api.delete(`/admin/storage-config/providers/${id}`);
      fetchData();
    } catch (e: any) {
      alert(e.response?.data?.detail || "Failed to delete provider");
    }
  };

  const handleAddPolicy = async () => {
    if (!newPolicy.provider_id) return;
    try {
      await api.post('/admin/storage-config/policies', newPolicy);
      setShowPolicyModal(false);
      fetchData();
    } catch (e) {
      alert("Failed to add policy");
    }
  };

  const handleDeletePolicy = async (id: string) => {
    if (!confirm("Delete this routing rule?")) return;
    try {
      await api.delete(`/admin/storage-config/policies/${id}`);
      fetchData();
    } catch (e) {
      alert("Failed to delete policy");
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 font-sans">
      
      {/* STORAGE PROVIDERS SECTION */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold text-zinc-100 flex items-center gap-2">
              <Database className="text-orange-500" size={20} />
              Storage Providers
            </h2>
            <p className="text-xs text-zinc-400 mt-1">Manage connected storage backends (Google Drive, Cloudflare R2, S3).</p>
          </div>
          <button onClick={() => setShowProviderModal(true)} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded text-sm flex items-center gap-2 transition-colors">
            <Plus size={16} /> Connect Provider
          </button>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-950/50 text-xs uppercase text-zinc-500 border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-medium">Provider</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Added On</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {providers.map(p => (
                <tr key={p.id} className="hover:bg-zinc-800/30">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <Cloud size={16} className="text-zinc-500" />
                    <span className="font-medium text-zinc-200">{p.name}</span>
                    {p.is_default && <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">DEFAULT</span>}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">{p.provider_type}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                      <CheckCircle2 size={12} /> Connected
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-500">
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleDeleteProvider(p.id)} className="text-zinc-500 hover:text-rose-400 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {providers.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">No storage providers configured.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ROUTING POLICIES SECTION */}
      <div className="pt-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold text-zinc-100 flex items-center gap-2">
              <FolderOpen className="text-orange-500" size={20} />
              Entity Routing Policies
            </h2>
            <p className="text-xs text-zinc-400 mt-1">Automatically route specific types of uploads to designated storage providers.</p>
          </div>
          <button onClick={() => setShowPolicyModal(true)} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded text-sm flex items-center gap-2 transition-colors">
            <Plus size={16} /> Add Routing Rule
          </button>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-950/50 text-xs uppercase text-zinc-500 border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-medium">Entity Type</th>
                <th className="px-6 py-4 font-medium">Destination Provider</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {policies.map(p => (
                <tr key={p.id} className="hover:bg-zinc-800/30">
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-orange-500">{p.entity_type}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-zinc-200">{p.provider_name}</span>
                    <span className="text-zinc-500 ml-2 text-xs">({p.provider_type})</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleDeletePolicy(p.id)} className="text-zinc-500 hover:text-rose-400 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {policies.length === 0 && !loading && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-zinc-500">No routing rules configured.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showProviderModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg w-full max-w-md p-6">
            <h3 className="text-lg font-medium text-white mb-4">Connect Storage Provider</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Name (e.g. My Drive)</label>
                <input value={newProvider.name} onChange={e => setNewProvider({...newProvider, name: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Provider Type</label>
                <select value={newProvider.type} onChange={e => setNewProvider({...newProvider, type: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white">
                  <option value="GOOGLE_DRIVE">Google Drive</option>
                  <option value="LOCAL_S3">Cloudflare R2 / AWS S3</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Credentials (JSON format)</label>
                <textarea value={credentialsText} onChange={e => setCredentialsText(e.target.value)} rows={5} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white font-mono placeholder:text-zinc-700" placeholder='{"client_email": "...", "private_key": "..."}' />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setShowProviderModal(false)} className="px-4 py-2 text-sm text-zinc-400 hover:text-white">Cancel</button>
                <button onClick={handleAddProvider} className="px-4 py-2 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded">Connect</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPolicyModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg w-full max-w-md p-6">
            <h3 className="text-lg font-medium text-white mb-4">Add Routing Rule</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Entity Type</label>
                <select value={newPolicy.entity_type} onChange={e => setNewPolicy({...newPolicy, entity_type: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white">
                  <option value="ARTICLE">ARTICLE</option>
                  <option value="TOURISM">TOURISM</option>
                  <option value="USER_AVATAR">USER_AVATAR</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Destination Provider</label>
                <select value={newPolicy.provider_id} onChange={e => setNewPolicy({...newPolicy, provider_id: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white">
                  <option value="">Select Provider...</option>
                  {providers.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.provider_type})</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setShowPolicyModal(false)} className="px-4 py-2 text-sm text-zinc-400 hover:text-white">Cancel</button>
                <button onClick={handleAddPolicy} className="px-4 py-2 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded">Add Rule</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
