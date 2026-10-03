import { useState, useEffect } from 'react';
import { 
  FolderOpen, 
  Trash2, 
  Plus,
  Cloud,
  Database,
  CheckCircle2,
  ArrowLeft,
  Save,
  HardDrive
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

  // View States
  const [view, setView] = useState<'list' | 'create_provider'>('list');

  // New Provider State
  const [providerType, setProviderType] = useState<'R2' | 'GDRIVE' | 'S3'>('GDRIVE');
  const [providerName, setProviderName] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [savingProvider, setSavingProvider] = useState(false);

  // R2 / S3 Configs
  const [s3Config, setS3Config] = useState({ accountId: '', bucket: '', domain: '', accessKey: '', secretKey: '', region: '', endpoint: '' });
  
  // GDrive Configs
  const [gdriveConfig, setGdriveConfig] = useState({ clientId: '', clientSecret: '', accessToken: '', refreshToken: '', folderId: '' });

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

  const handleSaveProvider = async () => {
    if (!providerName) return alert("Provider Name is required");
    
    setSavingProvider(true);
    try {
      let credentials = {};
      let configuration = {};
      let mappedType = '';

      if (providerType === 'GDRIVE') {
        mappedType = 'GOOGLE_DRIVE';
        credentials = {
          client_id: gdriveConfig.clientId,
          client_secret: gdriveConfig.clientSecret,
          access_token: gdriveConfig.accessToken,
          refresh_token: gdriveConfig.refreshToken
        };
        configuration = { folder_id: gdriveConfig.folderId };
      } else if (providerType === 'R2') {
        mappedType = 'CLOUDFLARE_R2';
        credentials = {
          access_key_id: s3Config.accessKey,
          secret_access_key: s3Config.secretKey
        };
        configuration = {
          account_id: s3Config.accountId,
          bucket_name: s3Config.bucket,
          public_domain: s3Config.domain,
          endpoint: `https://${s3Config.accountId}.r2.cloudflarestorage.com`
        };
      } else if (providerType === 'S3') {
        mappedType = 'AWS_S3';
        credentials = {
          access_key_id: s3Config.accessKey,
          secret_access_key: s3Config.secretKey
        };
        configuration = {
          bucket_name: s3Config.bucket,
          region: s3Config.region,
          endpoint: s3Config.endpoint,
          public_domain: s3Config.domain
        };
      }

      await api.post('/admin/storage-config/providers', {
        name: providerName,
        provider_type: mappedType,
        configuration,
        credentials,
        is_default: isDefault || providers.length === 0
      });
      
      setView('list');
      fetchData();
    } catch (e: any) {
      alert(e.response?.data?.detail || "Failed to add provider");
    } finally {
      setSavingProvider(false);
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

  if (view === 'create_provider') {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6 font-sans">
        <div className="flex items-center gap-4">
          <button onClick={() => setView('list')} className="text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-semibold text-white">Connect Storage Provider</h1>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-8">
          
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            <div className="flex-1 w-full">
              <label className="block text-xs font-semibold text-zinc-300 mb-2">Provider Name</label>
              <input 
                value={providerName}
                onChange={e => setProviderName(e.target.value)}
                placeholder="e.g. MinIO Backup or Primary GDrive" 
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/50" 
              />
            </div>
            
            <div className="w-full md:w-auto">
              <label className="block text-xs font-semibold text-zinc-300 mb-2">Type</label>
              <div className="flex bg-zinc-950 border border-zinc-800 rounded-lg p-1 gap-1">
                <button onClick={() => setProviderType('R2')} className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm transition-colors ${providerType === 'R2' ? 'bg-zinc-800 text-orange-500 font-medium' : 'text-zinc-400 hover:text-zinc-200'}`}>
                  <Cloud size={16} /> R2 CDN
                </button>
                <button onClick={() => setProviderType('GDRIVE')} className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm transition-colors ${providerType === 'GDRIVE' ? 'bg-zinc-800 text-orange-500 font-medium' : 'text-zinc-400 hover:text-zinc-200'}`}>
                  <Cloud size={16} /> GDrive
                </button>
                <button onClick={() => setProviderType('S3')} className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm transition-colors ${providerType === 'S3' ? 'bg-zinc-800 text-orange-500 font-medium' : 'text-zinc-400 hover:text-zinc-200'}`}>
                  <HardDrive size={16} /> S3
                </button>
              </div>
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer group">
            <input 
              type="checkbox" 
              checked={isDefault}
              onChange={e => setIsDefault(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-orange-500 focus:ring-orange-500/30 focus:ring-offset-zinc-900" 
            />
            <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">Set as default storage provider for new uploads</span>
          </label>
          
          <hr className="border-zinc-800/80" />

          {/* R2 Configuration */}
          {providerType === 'R2' && (
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-base font-semibold text-white">Cloudflare R2 Configuration</h3>
                  <p className="text-xs text-zinc-400 mt-1 max-w-xl leading-relaxed">
                    Connect your Cloudflare R2 bucket. The sync worker will automatically optimize and push WebP variants directly to R2 and Cloudflare CDN.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-1 rounded">Production Image CDN</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-2">Cloudflare Account ID</label>
                  <input value={s3Config.accountId} onChange={e => setS3Config({...s3Config, accountId: e.target.value})} placeholder="e.g. 7f8a9b2c3d4e..." className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-orange-500/50" />
                  <p className="text-[10px] text-zinc-500 mt-1.5">Found in Cloudflare Dashboard &gt; R2 &gt; Account Details</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-2">R2 Bucket Name</label>
                  <input value={s3Config.bucket} onChange={e => setS3Config({...s3Config, bucket: e.target.value})} placeholder="camtech-images" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-orange-500/50" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2">Public CDN Domain</label>
                <input value={s3Config.domain} onChange={e => setS3Config({...s3Config, domain: e.target.value})} placeholder="https://images.camtech.cam" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-orange-500/50" />
                <p className="text-[10px] text-zinc-500 mt-1.5">Custom domain attached to your R2 bucket (or public r2.dev URL)</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-2">R2 Access Key ID</label>
                  <input value={s3Config.accessKey} onChange={e => setS3Config({...s3Config, accessKey: e.target.value})} placeholder="Access Key ID from R2 API Token" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-orange-500/50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-2">R2 Secret Access Key</label>
                  <input type="password" value={s3Config.secretKey} onChange={e => setS3Config({...s3Config, secretKey: e.target.value})} placeholder="Secret Access Key" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-orange-500/50" />
                </div>
              </div>
            </div>
          )}

          {/* GDrive Configuration */}
          {providerType === 'GDRIVE' && (
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-base font-semibold text-white">Google Drive Configuration</h3>
                  <p className="text-xs text-zinc-400 mt-1 max-w-xl leading-relaxed">
                    For demo purposes, manually input your OAuth tokens. In production, this would use a secure OAuth flow.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2">Target Folder ID (Optional)</label>
                <input value={gdriveConfig.folderId} onChange={e => setGdriveConfig({...gdriveConfig, folderId: e.target.value})} placeholder="e.g. 1a2b3c4d5e6f" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-orange-500/50" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-2">Client ID</label>
                  <input value={gdriveConfig.clientId} onChange={e => setGdriveConfig({...gdriveConfig, clientId: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-orange-500/50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-2">Client Secret</label>
                  <input type="password" value={gdriveConfig.clientSecret} onChange={e => setGdriveConfig({...gdriveConfig, clientSecret: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-orange-500/50" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2">Access Token</label>
                <input value={gdriveConfig.accessToken} onChange={e => setGdriveConfig({...gdriveConfig, accessToken: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-orange-500/50" />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2">Refresh Token</label>
                <input type="password" value={gdriveConfig.refreshToken} onChange={e => setGdriveConfig({...gdriveConfig, refreshToken: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-orange-500/50" />
              </div>
            </div>
          )}
          
          {/* S3 Configuration */}
          {providerType === 'S3' && (
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-base font-semibold text-white">AWS S3 / Custom S3 Configuration</h3>
                  <p className="text-xs text-zinc-400 mt-1 max-w-xl leading-relaxed">
                    Connect any S3 compatible storage provider (AWS, MinIO, DigitalOcean Spaces, etc).
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-2">Endpoint URL (Optional)</label>
                  <input value={s3Config.endpoint} onChange={e => setS3Config({...s3Config, endpoint: e.target.value})} placeholder="https://s3.us-east-1.amazonaws.com" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-orange-500/50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-2">Region</label>
                  <input value={s3Config.region} onChange={e => setS3Config({...s3Config, region: e.target.value})} placeholder="us-east-1" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-orange-500/50" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-2">Bucket Name</label>
                  <input value={s3Config.bucket} onChange={e => setS3Config({...s3Config, bucket: e.target.value})} placeholder="my-bucket-name" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-orange-500/50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-2">Public CDN Domain (Optional)</label>
                  <input value={s3Config.domain} onChange={e => setS3Config({...s3Config, domain: e.target.value})} placeholder="https://assets.example.com" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-orange-500/50" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-2">Access Key ID</label>
                  <input value={s3Config.accessKey} onChange={e => setS3Config({...s3Config, accessKey: e.target.value})} placeholder="AKIAIOSFODNN7EXAMPLE" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-orange-500/50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-2">Secret Access Key</label>
                  <input type="password" value={s3Config.secretKey} onChange={e => setS3Config({...s3Config, secretKey: e.target.value})} placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-orange-500/50" />
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end pt-4 border-t border-zinc-800/80">
            <button 
              onClick={handleSaveProvider} 
              disabled={savingProvider}
              className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
            >
              <Save size={16} /> {savingProvider ? 'Connecting...' : 'Connect Provider'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // LIST VIEW
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
          <button onClick={() => setView('create_provider')} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md shadow-sm text-sm flex items-center gap-2 transition-colors">
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
                    {p.is_default && <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded border border-zinc-700">DEFAULT</span>}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-orange-400">{p.provider_type}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 font-medium">
                      <CheckCircle2 size={12} /> Connected
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-500">
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleDeleteProvider(p.id)} className="text-zinc-500 hover:text-rose-400 transition-colors p-1.5 hover:bg-rose-500/10 rounded">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {providers.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 border-dashed border-zinc-800">
                    No storage providers configured.
                  </td>
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
          <button onClick={() => setShowPolicyModal(true)} className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 border border-zinc-700 rounded-md text-sm flex items-center gap-2 transition-colors">
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
                    <span className="text-xs font-bold text-orange-500 bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-500/20">{p.entity_type}</span>
                  </td>
                  <td className="px-6 py-4 flex items-center gap-2">
                    <span className="font-medium text-zinc-200">{p.provider_name}</span>
                    <span className="text-zinc-500 text-xs font-mono">({p.provider_type})</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleDeletePolicy(p.id)} className="text-zinc-500 hover:text-rose-400 transition-colors p-1.5 hover:bg-rose-500/10 rounded">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {policies.length === 0 && !loading && (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-zinc-500 border-dashed border-zinc-800">
                    No routing rules configured.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showPolicyModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-medium text-white mb-4">Add Routing Rule</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Entity Type</label>
                <select value={newPolicy.entity_type} onChange={e => setNewPolicy({...newPolicy, entity_type: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50">
                  <option value="ARTICLE">ARTICLE</option>
                  <option value="TOURISM">TOURISM</option>
                  <option value="USER_AVATAR">USER_AVATAR</option>
                  <option value="SYSTEM">SYSTEM</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Destination Provider</label>
                <select value={newPolicy.provider_id} onChange={e => setNewPolicy({...newPolicy, provider_id: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50">
                  <option value="">Select Provider...</option>
                  {providers.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.provider_type})</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800 mt-6">
                <button onClick={() => setShowPolicyModal(false)} className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors">Cancel</button>
                <button onClick={handleAddPolicy} className="px-4 py-2 text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors">Add Rule</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
