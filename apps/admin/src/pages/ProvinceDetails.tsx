import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  MapPin,
  RefreshCw,
  Zap,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  Phone,
  Globe,
  Mail,
  Star,
  Eye,
  DollarSign,
  ExternalLink
} from 'lucide-react';
import { api } from '../lib/api';

interface Place {
  id: string;
  name: string;
  local_name?: string;
  slug?: string;
  place_type: string;
  description: string;
  description_km?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  website?: string;
  email?: string;
  opening_hours?: string;
  price_level?: string;
  hero_image_url?: string;
  gallery_json?: string;
  tags_json?: string;
  verification_status?: string;
  status?: string;
  rating?: number;
  review_count?: number;
  views_count?: number;
  is_featured?: boolean;
  created_at?: string;
  destination_id?: string;
  is_duplicate?: boolean;
}

const TYPE_COLORS: Record<string, string> = {
  TEMPLE: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  ATTRACTION: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  RESTAURANT: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  CAFE: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  MARKET: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  MUSEUM: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  WATERFALL: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  ACCOMMODATION: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  ACTIVITY: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  HIDDEN_GEM: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
};

export default function ProvinceDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // AI Scan State
  const [isScanning, setIsScanning] = useState(false);
  const [pendingApproval, setPendingApproval] = useState<{ province: string, places: Place[] } | null>(null);
  const [savingPlaceId, setSavingPlaceId] = useState<string | null>(null);
  
  // AI Update State
  const [isUpdatingAll, setIsUpdatingAll] = useState(false);
  const [updatingPlaceId, setUpdatingPlaceId] = useState<string | null>(null);
  
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchPlaces();
  }, [slug]);

  const fetchPlaces = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/tourism-places/${slug}`);
      setPlaces(res.data);
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: 'Failed to load places.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (placeId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await api.delete(`/admin/tourism-places/${placeId}`);
      setPlaces(prev => prev.filter(p => p.id !== placeId));
      setStatusMessage({ type: 'success', text: `Deleted "${name}"` });
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: `Failed to delete ${name}` });
    }
  };

  const handleUpdateSingle = async (place: Place) => {
    setUpdatingPlaceId(place.id);
    try {
      await api.post(`/admin/tourism-places/${place.id}/update-via-ai`);
      setStatusMessage({ type: 'success', text: `Successfully updated ${place.name}` });
      await fetchPlaces(); // reload to get new data
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.response?.data?.detail || `Failed to update ${place.name}` });
      throw err;
    } finally {
      setUpdatingPlaceId(null);
    }
  };

  const handleUpdateAll = async () => {
    if (!confirm(`Are you sure you want to update ALL ${places.length} places via AI? This will take some time and update them one by one.`)) return;
    setIsUpdatingAll(true);
    setStatusMessage({ type: 'success', text: `Starting sequential update for ${places.length} places...` });
    
    let successCount = 0;
    for (const place of places) {
      try {
        await handleUpdateSingle(place);
        successCount++;
        // Small delay to prevent hitting AI rate limits too aggressively
        await new Promise(r => setTimeout(r, 2000));
      } catch (err) {
        console.error(`Failed to update ${place.name}`, err);
        // Continue to the next one even if one fails
      }
    }
    
    setIsUpdatingAll(false);
    setStatusMessage({ type: 'success', text: `Finished updating. Successfully updated ${successCount}/${places.length} places.` });
  };

  const handleScan = async () => {
    setIsScanning(true);
    setStatusMessage(null);
    try {
      const res = await api.post(`/admin/ai/tourism-scan/${slug}`);
      if (res.data.status === 'failed') {
        setStatusMessage({ type: 'error', text: res.data.message || 'Scan failed.' });
        return;
      }
      setPendingApproval({
        province: res.data.province,
        places: res.data.places_data || []
      });
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: 'Failed to scan. Check logs.' });
    } finally {
      setIsScanning(false);
    }
  };

  const handleApproveSave = async (place: Place, index: number) => {
    setSavingPlaceId(index.toString());
    try {
      const res = await api.post('/admin/ai/tourism-save', place);
      if (res.data.status === 'success') {
        setPendingApproval(prev => {
          if (!prev) return prev;
          const newPlaces = [...prev.places];
          newPlaces[index].is_duplicate = true;
          return { ...prev, places: newPlaces };
        });
        setStatusMessage({ type: 'success', text: res.data.message });
        fetchPlaces();
      }
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: `Failed to save ${place.name}` });
    } finally {
      setSavingPlaceId(null);
    }
  };

  const handleApproveAll = async () => {
    if (!pendingApproval) return;
    const unapproved = pendingApproval.places.map((p, i) => ({ place: p, index: i })).filter(x => !x.place.is_duplicate);
    
    if (unapproved.length === 0) return;
    
    for (const item of unapproved) {
      await handleApproveSave(item.place, item.index);
    }
  };

  const parseTags = (tagsJson?: string): string[] => {
    try { return tagsJson ? JSON.parse(tagsJson) : []; } catch { return []; }
  };

  const provinceName = slug?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-zinc-800/80">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/tourism')}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors border border-zinc-800"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">{provinceName}</h1>
            <p className="text-xs text-zinc-400 mt-1">
              {places.length} places · Manage tourism destinations
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleUpdateAll}
            disabled={isUpdatingAll || isScanning || loading || places.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-xs text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-md transition-colors disabled:opacity-50"
          >
            {isUpdatingAll ? <RefreshCw size={13} className="animate-spin" /> : <Zap size={13} />}
            Update All via AI
          </button>
          <button 
            onClick={fetchPlaces}
            disabled={loading || isUpdatingAll}
            className="flex items-center gap-1.5 px-3 py-2 text-xs text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button 
            onClick={handleScan}
            disabled={isScanning || isUpdatingAll}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 rounded-md text-xs transition-colors shadow-sm disabled:opacity-50"
          >
            {isScanning ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
            <span>{isScanning ? 'Scanning...' : 'Scan with AI'}</span>
          </button>
        </div>
      </div>

      {/* Status */}
      {statusMessage && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-xs font-medium ${
          statusMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
        }`}>
          {statusMessage.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
          {statusMessage.text}
        </div>
      )}

      {/* Places List */}
      {loading ? (
        <div className="flex justify-center p-16"><RefreshCw className="animate-spin text-zinc-500" size={24} /></div>
      ) : places.length === 0 ? (
        <div className="text-center p-16 bg-zinc-900/40 border border-zinc-800 rounded-xl">
          <MapPin size={32} className="mx-auto text-zinc-600 mb-3" />
          <p className="text-zinc-400 text-sm mb-1">No places found</p>
          <p className="text-zinc-500 text-xs">Use "Scan with AI" to discover tourist destinations.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {places.map((place) => {
            const tags = parseTags(place.tags_json);
            const isExpanded = expandedId === place.id;
            const typeColor = TYPE_COLORS[place.place_type] || 'bg-zinc-700/50 text-zinc-300 border-zinc-600/30';
            
            return (
              <div 
                key={place.id} 
                className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors"
              >
                {/* Card Header */}
                <div 
                  className="flex flex-col sm:flex-row gap-4 p-5 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : place.id)}
                >
                  {/* Image */}
                  <div className="w-full sm:w-32 h-24 bg-zinc-800 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                    {place.hero_image_url ? (
                      <img src={place.hero_image_url} alt={place.name} className="w-full h-full object-cover" />
                    ) : (
                      <MapPin size={20} className="text-zinc-600" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <h3 className="font-semibold text-zinc-100">{place.name}</h3>
                      {place.local_name && <span className="text-xs text-zinc-500 font-mono">{place.local_name}</span>}
                      {place.is_featured && <Star size={12} className="text-amber-400 fill-amber-400" />}
                    </div>

                    <p className="text-xs text-zinc-400 mb-3 line-clamp-2">{place.description}</p>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${typeColor}`}>{place.place_type}</span>
                      {place.rating && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded text-[10px]">
                          <Star size={9} className="fill-amber-400" /> {place.rating}
                        </span>
                      )}
                      {place.price_level && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded text-[10px]">
                          <DollarSign size={9} /> {place.price_level}
                        </span>
                      )}
                      {place.views_count ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded text-[10px]">
                          <Eye size={9} /> {place.views_count}
                        </span>
                      ) : null}
                      {place.verification_status && (
                        <span className={`px-2 py-0.5 rounded text-[10px] ${
                          place.verification_status === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-400' :
                          place.verification_status === 'AI_GENERATED' ? 'bg-purple-500/10 text-purple-400' :
                          'bg-zinc-800 text-zinc-400'
                        }`}>{place.verification_status}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-start gap-2 shrink-0">
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!confirm(`Update "${place.name}" using AI?`)) return;
                        await handleUpdateSingle(place);
                      }}
                      disabled={updatingPlaceId === place.id || isUpdatingAll}
                      className="p-2 text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 rounded-md transition-colors disabled:opacity-50"
                      title="Update via AI"
                    >
                      {updatingPlaceId === place.id ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(place.id, place.name); }}
                      disabled={updatingPlaceId === place.id || isUpdatingAll}
                      className="p-2 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-md transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-zinc-800 bg-zinc-950/40 p-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                      {place.address && (
                        <div className="flex items-start gap-2">
                          <MapPin size={13} className="text-zinc-500 mt-0.5 shrink-0" />
                          <div><span className="text-zinc-500 block mb-0.5">Address</span><span className="text-zinc-300">{place.address}</span></div>
                        </div>
                      )}
                      {place.opening_hours && (
                        <div className="flex items-start gap-2">
                          <Clock size={13} className="text-zinc-500 mt-0.5 shrink-0" />
                          <div><span className="text-zinc-500 block mb-0.5">Hours</span><span className="text-zinc-300">{place.opening_hours}</span></div>
                        </div>
                      )}
                      {place.phone && (
                        <div className="flex items-start gap-2">
                          <Phone size={13} className="text-zinc-500 mt-0.5 shrink-0" />
                          <div><span className="text-zinc-500 block mb-0.5">Phone</span><span className="text-zinc-300">{place.phone}</span></div>
                        </div>
                      )}
                      {place.email && (
                        <div className="flex items-start gap-2">
                          <Mail size={13} className="text-zinc-500 mt-0.5 shrink-0" />
                          <div><span className="text-zinc-500 block mb-0.5">Email</span><span className="text-zinc-300">{place.email}</span></div>
                        </div>
                      )}
                      {place.website && (
                        <div className="flex items-start gap-2">
                          <Globe size={13} className="text-zinc-500 mt-0.5 shrink-0" />
                          <div>
                            <span className="text-zinc-500 block mb-0.5">Website</span>
                            <a href={place.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline flex items-center gap-1">
                              {place.website.replace(/^https?:\/\//, '').slice(0, 30)}
                              <ExternalLink size={10} />
                            </a>
                          </div>
                        </div>
                      )}
                      {(place.latitude && place.longitude) && (
                        <div className="flex items-start gap-2">
                          <MapPin size={13} className="text-zinc-500 mt-0.5 shrink-0" />
                          <div>
                            <span className="text-zinc-500 block mb-0.5">Coordinates</span>
                            <a 
                              href={`https://www.google.com/maps?q=${place.latitude},${place.longitude}`} 
                              target="_blank" rel="noopener noreferrer"
                              className="text-blue-400 hover:underline flex items-center gap-1"
                            >
                              {place.latitude?.toFixed(4)}, {place.longitude?.toFixed(4)}
                              <ExternalLink size={10} />
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {place.description_km && (
                      <div>
                        <span className="text-zinc-500 text-[11px] mb-1 block">ពិពណ៌នាខ្មែរ</span>
                        <p className="text-xs text-zinc-400">{place.description_km}</p>
                      </div>
                    )}

                    {tags.length > 0 && (
                      <div>
                        <span className="text-zinc-500 text-[11px] mb-1.5 block">Tags</span>
                        <div className="flex flex-wrap gap-1.5">
                          {tags.map((tag, i) => (
                            <span key={i} className="px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded-full text-[10px]">{tag}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {(() => {
                      try {
                        const gallery = place.gallery_json ? JSON.parse(place.gallery_json) : [];
                        if (gallery.length > 1) {
                          return (
                            <div>
                              <span className="text-zinc-500 text-[11px] mb-1.5 block">Gallery ({gallery.length} images)</span>
                              <div className="flex gap-2 overflow-x-auto pb-2">
                                {gallery.map((img: string, i: number) => (
                                  <a key={i} href={img} target="_blank" rel="noreferrer" className="shrink-0 block w-24 h-16 rounded-md overflow-hidden border border-zinc-700/50 hover:border-zinc-500">
                                    <img src={img} alt={`Gallery ${i}`} className="w-full h-full object-cover" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          );
                        }
                      } catch (e) {}
                      return null;
                    })()}

                    {place.created_at && (
                      <div className="text-[10px] text-zinc-600 pt-2 border-t border-zinc-800/50">
                        Created: {new Date(place.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Approval Modal */}
      {pendingApproval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <div>
                <h2 className="text-lg font-semibold text-zinc-100">AI Discovered Places</h2>
                <p className="text-xs text-zinc-400">{pendingApproval.places.length} places found for {pendingApproval.province}</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleApproveAll} 
                  disabled={savingPlaceId !== null}
                  className="flex items-center gap-1.5 bg-zinc-100 hover:bg-white text-zinc-900 font-medium px-4 py-1.5 rounded-md text-sm transition-colors disabled:opacity-50"
                >
                  <CheckCircle size={14} />
                  Approve All
                </button>
                <button onClick={() => setPendingApproval(null)} className="text-zinc-400 hover:text-white text-sm">Close</button>
              </div>
            </div>
            
            <div className="p-5 overflow-y-auto space-y-3">
              {pendingApproval.places.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-sm">No new places found.</div>
              ) : (
                pendingApproval.places.map((place, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row gap-4 p-4 border border-zinc-800 rounded-lg bg-zinc-950/50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-zinc-200">{place.name}</h3>
                        {place.local_name && <span className="text-xs text-zinc-500 font-mono">{place.local_name}</span>}
                      </div>
                      <p className="text-xs text-zinc-400 mb-2 line-clamp-2">{place.description}</p>
                      <div className="flex flex-wrap gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${TYPE_COLORS[place.place_type] || 'bg-zinc-800 text-zinc-300'}`}>{place.place_type}</span>
                        {place.rating && <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded text-[10px]">★ {place.rating}</span>}
                        {place.address && <span className="text-[10px] text-zinc-500">{place.address}</span>}
                      </div>
                    </div>
                    <div className="flex items-center sm:items-start shrink-0">
                      {place.is_duplicate ? (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium px-3 py-1.5">
                          <CheckCircle size={14} /> Saved
                        </div>
                      ) : (
                        <button
                          onClick={() => handleApproveSave(place, idx)}
                          disabled={savingPlaceId === idx.toString()}
                          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-1.5 rounded-md text-xs transition-colors disabled:opacity-50"
                        >
                          {savingPlaceId === idx.toString() ? <RefreshCw size={12} className="animate-spin" /> : <Zap size={12} />}
                          Approve & Save
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
