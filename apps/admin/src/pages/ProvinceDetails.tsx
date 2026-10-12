import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  MapPin,
  RefreshCw,
  Zap,
  Trash2,
  CheckCircle2,
  Clock,
  Phone,
  Globe,
  Mail,
  Star,
  Eye,
  DollarSign,
  ExternalLink,
  Search,
  Filter,
  CheckCircle,
  X,
  Sparkles
} from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../components/ui/Toast';

const resolveImageUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('/images/')) {
    return `https://blog.camtech.cam${url}`;
  }
  return url;
};

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
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();
  
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // AI Scan State
  const [isScanning, setIsScanning] = useState(false);
  const [pendingApproval, setPendingApproval] = useState<{ province: string, places: Place[] } | null>(null);
  const [savingPlaceId, setSavingPlaceId] = useState<string | null>(null);
  const [isApprovingAll, setIsApprovingAll] = useState(false);
  const [approvalProgress, setApprovalProgress] = useState<{ current: number; total: number; placeName: string } | null>(null);
  
  // AI Update State
  const [isUpdatingAll, setIsUpdatingAll] = useState(false);
  const [updatingPlaceId, setUpdatingPlaceId] = useState<string | null>(null);

  useEffect(() => {
    fetchPlaces();
  }, [slug]);

  const fetchPlaces = async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const res = await api.get(`/admin/tourism-places/${slug}`);
      setPlaces(res.data);
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.status === 524
        ? 'Server timeout (Cloudflare 524). Server is processing heavy AI tasks; please retry shortly.'
        : (err.response?.data?.detail || 'Failed to load places.');
      toastError(msg, 'Connection Issue');
    } finally {
      if (!quiet) setLoading(false);
    }
  };

  const handleDelete = async (placeId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await api.delete(`/admin/tourism-places/${placeId}`);
      setPlaces(prev => prev.filter(p => p.id !== placeId));
      toastSuccess(`Deleted "${name}"`, 'Place Removed');
    } catch (err) {
      console.error(err);
      toastError(`Failed to delete "${name}"`);
    }
  };

  const handleUpdateSingle = async (place: Place) => {
    setUpdatingPlaceId(place.id);
    try {
      await api.post(`/admin/tourism-places/${place.id}/update-via-ai`);
      toastSuccess(`Updated "${place.name}" with latest AI data`);
      await fetchPlaces(true);
    } catch (err: any) {
      const msg = err.response?.data?.detail || `Failed to update ${place.name}`;
      toastError(msg);
      throw err;
    } finally {
      setUpdatingPlaceId(null);
    }
  };

  const handleUpdateAll = async () => {
    if (!confirm(`Are you sure you want to update ALL ${places.length} places via AI? This will run sequentially to ensure data accuracy.`)) return;
    setIsUpdatingAll(true);
    toastInfo(`Updating ${places.length} places in the background...`, 'AI Update Started');
    
    let successCount = 0;
    for (const place of places) {
      try {
        await handleUpdateSingle(place);
        successCount++;
        await new Promise(r => setTimeout(r, 2000));
      } catch (err) {
        console.error(`Failed to update ${place.name}`, err);
      }
    }
    
    setIsUpdatingAll(false);
    const summary = `Finished updating. Successfully updated ${successCount}/${places.length} places.`;
    toastSuccess(summary, 'Update Complete');
  };

  const handleScan = async () => {
    setIsScanning(true);
    toastInfo(`AI is scanning province destinations for ${provinceName}...`, 'Discovery in Progress');
    try {
      const res = await api.post(`/admin/ai/tourism-scan/${slug}`);
      if (res.data.status === 'failed') {
        const msg = res.data.message || 'Scan failed.';
        toastError(msg);
        return;
      }
      setPendingApproval({
        province: res.data.province,
        places: res.data.places_data || []
      });
      toastSuccess(`Discovered ${res.data.places_data?.length || 0} candidate places!`, 'Scan Finished');
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.status === 524 
        ? 'Scan took longer than 100 seconds (Cloudflare 524). The server is busy; please try again.' 
        : (err.response?.data?.detail || 'Failed to scan. Check logs.');
      toastError(msg);
    } finally {
      setIsScanning(false);
    }
  };

  const handleApproveSave = async (place: Place, index: number) => {
    if (isApprovingAll || savingPlaceId !== null) return;
    setSavingPlaceId(index.toString());
    try {
      const res = await api.post('/admin/ai/tourism-save', place);
      if (res.data.status === 'success' || res.data.status === 'skipped') {
        setPendingApproval(prev => {
          if (!prev) return prev;
          const newPlaces = [...prev.places];
          newPlaces[index].is_duplicate = true;
          return { ...prev, places: newPlaces };
        });
        toastSuccess(`Saved "${place.name}" to Cloudflare R2 & Google Drive`);
        fetchPlaces(true);
      }
    } catch (err: any) {
      console.error(err);
      toastError(err.response?.data?.detail || `Failed to save ${place.name}`);
    } finally {
      setSavingPlaceId(null);
    }
  };

  const handleApproveAll = async () => {
    if (!pendingApproval || isApprovingAll) return;
    const unapproved = pendingApproval.places
      .map((p, i) => ({ place: p, index: i }))
      .filter(x => !x.place.is_duplicate);
    
    if (unapproved.length === 0) return;
    
    setIsApprovingAll(true);
    let savedCount = 0;
    
    for (let i = 0; i < unapproved.length; i++) {
      const item = unapproved[i];
      setApprovalProgress({
        current: i + 1,
        total: unapproved.length,
        placeName: item.place.name
      });
      setSavingPlaceId(item.index.toString());
      
      try {
        const res = await api.post('/admin/ai/tourism-save', item.place);
        if (res.data.status === 'success' || res.data.status === 'skipped') {
          savedCount++;
          setPendingApproval(prev => {
            if (!prev) return prev;
            const newPlaces = [...prev.places];
            newPlaces[item.index].is_duplicate = true;
            return { ...prev, places: newPlaces };
          });
        }
      } catch (err) {
        console.error(`Failed to save ${item.place.name}`, err);
      }
    }
    
    setSavingPlaceId(null);
    setIsApprovingAll(false);
    setApprovalProgress(null);
    const msg = `Successfully saved ${savedCount} places to Cloudflare R2 & Google Drive!`;
    toastSuccess(msg, 'Approval Completed');
    await fetchPlaces(true);
  };

  const parseTags = (tagsJson?: string): string[] => {
    try { return tagsJson ? JSON.parse(tagsJson) : []; } catch { return []; }
  };

  const provinceName = slug?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  // Filtered Places logic
  const filteredPlaces = useMemo(() => {
    return places.filter(place => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = place.name?.toLowerCase().includes(q);
        const matchLocal = place.local_name?.toLowerCase().includes(q);
        const matchAddr = place.address?.toLowerCase().includes(q);
        if (!matchName && !matchLocal && !matchAddr) return false;
      }
      if (typeFilter !== 'ALL' && place.place_type !== typeFilter) {
        return false;
      }
      if (statusFilter !== 'ALL' && place.verification_status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [places, searchQuery, typeFilter, statusFilter]);

  // Place types available in current dataset
  const availableTypes = useMemo(() => {
    const types = new Set(places.map(p => p.place_type).filter(Boolean));
    return Array.from(types);
  }, [places]);

  const verifiedCount = useMemo(() => places.filter(p => p.verification_status === 'VERIFIED').length, [places]);
  const aiGeneratedCount = useMemo(() => places.filter(p => p.verification_status === 'AI_GENERATED').length, [places]);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      {/* 1. Standard Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-zinc-800/80">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/tourism')}
            className="p-2.5 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-all border border-zinc-800/80 shadow-sm"
            title="Back to Tourism Overview"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">{provinceName}</h1>
              <span className="badge-pill badge-emerald">Active Hub</span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 flex items-center gap-2">
              <span>{places.length} registered destinations</span>
              <span className="text-zinc-600">·</span>
              <span className="text-emerald-400 font-medium">{verifiedCount} verified</span>
              <span className="text-zinc-600">·</span>
              <span className="text-purple-400 font-medium">{aiGeneratedCount} AI generated</span>
            </p>
          </div>
        </div>
        
        {/* Action Toolbar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button 
            onClick={handleUpdateAll}
            disabled={isUpdatingAll || isScanning || loading || places.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/25 rounded-lg transition-all shadow-sm disabled:opacity-50"
          >
            {isUpdatingAll ? <RefreshCw size={13} className="animate-spin" /> : <Sparkles size={13} />}
            <span>Update All via AI</span>
          </button>
          <button 
            onClick={() => fetchPlaces()}
            disabled={loading || isUpdatingAll}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-zinc-300 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button 
            onClick={handleScan}
            disabled={isScanning || isUpdatingAll}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 rounded-lg text-xs transition-all shadow-md hover:shadow-emerald-950/40 disabled:opacity-50"
          >
            {isScanning ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
            <span>{isScanning ? 'Scanning...' : 'Scan with AI'}</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
          <span className="text-[11px] font-medium text-zinc-400 block mb-1">Total Destinations</span>
          <span className="text-xl font-bold text-zinc-100">{places.length}</span>
        </div>
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
          <span className="text-[11px] font-medium text-zinc-400 block mb-1">Verified Places</span>
          <span className="text-xl font-bold text-emerald-400">{verifiedCount}</span>
        </div>
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
          <span className="text-[11px] font-medium text-zinc-400 block mb-1">AI Discovered</span>
          <span className="text-xl font-bold text-purple-400">{aiGeneratedCount}</span>
        </div>
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
          <span className="text-[11px] font-medium text-zinc-400 block mb-1">Featured Gems</span>
          <span className="text-xl font-bold text-amber-400">{places.filter(p => p.is_featured).length}</span>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by place name, local name, or address..."
            className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg pl-9 pr-8 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 focus:bg-zinc-950 transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Filter Dropdowns / Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <Filter size={13} className="text-zinc-500 shrink-0" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-zinc-600"
            >
              <option value="ALL">All Categories</option>
              {availableTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-zinc-600 shrink-0"
          >
            <option value="ALL">All Statuses</option>
            <option value="VERIFIED">Verified</option>
            <option value="AI_GENERATED">AI Generated</option>
          </select>

          {(searchQuery || typeFilter !== 'ALL' || statusFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setTypeFilter('ALL');
                setStatusFilter('ALL');
              }}
              className="text-[11px] text-zinc-400 hover:text-zinc-200 px-2 py-1 rounded bg-zinc-800/60 hover:bg-zinc-800 shrink-0 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* 4. Places List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800/80 flex flex-col sm:flex-row gap-4 animate-pulse">
              <div className="w-full sm:w-36 h-28 bg-zinc-800/80 rounded-lg shrink-0" />
              <div className="flex-1 space-y-3 py-1">
                <div className="h-4 bg-zinc-800/80 rounded w-1/3" />
                <div className="h-3 bg-zinc-800/60 rounded w-5/6" />
                <div className="h-3 bg-zinc-800/60 rounded w-1/2" />
                <div className="flex gap-2 pt-2">
                  <div className="h-5 w-16 bg-zinc-800/70 rounded-full" />
                  <div className="h-5 w-12 bg-zinc-800/70 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredPlaces.length === 0 ? (
        <div className="text-center p-16 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl">
          <MapPin size={36} className="mx-auto text-zinc-600 mb-3" />
          <h3 className="text-zinc-300 font-medium text-sm mb-1">
            {places.length === 0 ? 'No places registered yet' : 'No places match your filters'}
          </h3>
          <p className="text-zinc-500 text-xs max-w-sm mx-auto mb-4">
            {places.length === 0 
              ? 'Use "Scan with AI" to automatically discover temples, restaurants, and attractions in this province.' 
              : 'Try adjusting your search keyword or clearing the category and status filters.'}
          </p>
          {places.length === 0 && (
            <button
              onClick={handleScan}
              disabled={isScanning}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-all shadow-md"
            >
              <Zap size={14} />
              <span>Scan with AI Now</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-xs text-zinc-500 font-mono flex items-center justify-between px-1">
            <span>Showing {filteredPlaces.length} of {places.length} places</span>
            <span>Click any card to inspect full metadata</span>
          </div>

          {filteredPlaces.map((place) => {
            const tags = parseTags(place.tags_json);
            const isExpanded = expandedId === place.id;
            const typeColor = TYPE_COLORS[place.place_type] || 'bg-zinc-700/50 text-zinc-300 border-zinc-600/30';
            
            return (
              <div 
                key={place.id} 
                className="bg-zinc-900/70 border border-zinc-800/90 rounded-xl overflow-hidden hover:border-zinc-700/90 transition-all duration-200 shadow-sm"
              >
                {/* Card Header */}
                <div 
                  className="flex flex-col sm:flex-row gap-4 p-5 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : place.id)}
                >
                  {/* Hero Thumbnail */}
                  <div className="w-full sm:w-36 h-28 bg-zinc-950 rounded-lg overflow-hidden shrink-0 flex items-center justify-center relative border border-zinc-800">
                    {place.hero_image_url ? (
                      <img 
                        src={resolveImageUrl(place.hero_image_url)} 
                        alt={place.name} 
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "https://images.unsplash.com/photo-1540611025311-01df3cef54b5?w=400&auto=format&fit=crop&q=80";
                        }}
                      />
                    ) : (
                      <MapPin size={24} className="text-zinc-600" />
                    )}
                  </div>

                  {/* Primary Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <h3 className="font-semibold text-zinc-100 text-sm">{place.name}</h3>
                      {place.local_name && (
                        <span className="text-xs text-zinc-400 font-sans px-1.5 py-0.5 bg-zinc-800/60 rounded">
                          {place.local_name}
                        </span>
                      )}
                      {place.is_featured && <Star size={13} className="text-amber-400 fill-amber-400" />}
                    </div>

                    <p className="text-xs text-zinc-400 mb-3 line-clamp-2 leading-relaxed">{place.description}</p>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${typeColor}`}>
                        {place.place_type}
                      </span>
                      {place.rating && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[10px] font-medium">
                          <Star size={10} className="fill-amber-400" /> {place.rating}
                        </span>
                      )}
                      {place.price_level && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-zinc-800/80 text-zinc-300 rounded-full text-[10px]">
                          <DollarSign size={10} /> {place.price_level}
                        </span>
                      )}
                      {place.views_count ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-zinc-800/80 text-zinc-400 rounded-full text-[10px]">
                          <Eye size={10} /> {place.views_count}
                        </span>
                      ) : null}
                      {place.verification_status && (
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                          place.verification_status === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          place.verification_status === 'AI_GENERATED' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                          'bg-zinc-800 text-zinc-400'
                        }`}>
                          {place.verification_status}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center sm:items-start gap-2 shrink-0 pt-2 sm:pt-0">
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!confirm(`Update "${place.name}" using AI?`)) return;
                        await handleUpdateSingle(place);
                      }}
                      disabled={updatingPlaceId === place.id || isUpdatingAll}
                      className="p-2 text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg transition-all disabled:opacity-50"
                      title="Update via AI"
                    >
                      {updatingPlaceId === place.id ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(place.id, place.name); }}
                      disabled={updatingPlaceId === place.id || isUpdatingAll}
                      className="p-2 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition-all disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-zinc-800/80 bg-zinc-950/60 p-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                      {place.address && (
                        <div className="flex items-start gap-2.5">
                          <MapPin size={14} className="text-zinc-500 mt-0.5 shrink-0" />
                          <div><span className="text-zinc-500 block mb-0.5 text-[11px]">Address</span><span className="text-zinc-300">{place.address}</span></div>
                        </div>
                      )}
                      {place.opening_hours && (
                        <div className="flex items-start gap-2.5">
                          <Clock size={14} className="text-zinc-500 mt-0.5 shrink-0" />
                          <div><span className="text-zinc-500 block mb-0.5 text-[11px]">Hours</span><span className="text-zinc-300">{place.opening_hours}</span></div>
                        </div>
                      )}
                      {place.phone && (
                        <div className="flex items-start gap-2.5">
                          <Phone size={14} className="text-zinc-500 mt-0.5 shrink-0" />
                          <div><span className="text-zinc-500 block mb-0.5 text-[11px]">Phone</span><span className="text-zinc-300">{place.phone}</span></div>
                        </div>
                      )}
                      {place.email && (
                        <div className="flex items-start gap-2.5">
                          <Mail size={14} className="text-zinc-500 mt-0.5 shrink-0" />
                          <div><span className="text-zinc-500 block mb-0.5 text-[11px]">Email</span><span className="text-zinc-300">{place.email}</span></div>
                        </div>
                      )}
                      {place.website && (
                        <div className="flex items-start gap-2.5">
                          <Globe size={14} className="text-zinc-500 mt-0.5 shrink-0" />
                          <div>
                            <span className="text-zinc-500 block mb-0.5 text-[11px]">Website</span>
                            <a href={place.website} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline flex items-center gap-1">
                              Visit URL <ExternalLink size={11} />
                            </a>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Khmer Description */}
                    {place.description_km && (
                      <div className="pt-2 border-t border-zinc-800/60">
                        <span className="text-zinc-500 text-[11px] block mb-1">Khmer Description</span>
                        <p className="text-xs text-zinc-300 font-sans leading-relaxed">{place.description_km}</p>
                      </div>
                    )}

                    {/* Tags */}
                    {tags.length > 0 && (
                      <div className="pt-2 border-t border-zinc-800/60">
                        <span className="text-zinc-500 text-[11px] block mb-1.5">Tags</span>
                        <div className="flex flex-wrap gap-1.5">
                          {tags.map((tag, i) => (
                            <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-zinc-800/80 text-zinc-400 border border-zinc-700/60">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Gallery Thumbnails */}
                    {(() => {
                      try {
                        const gallery = place.gallery_json ? JSON.parse(place.gallery_json) : [];
                        if (Array.isArray(gallery) && gallery.length > 0) {
                          return (
                            <div className="pt-2 border-t border-zinc-800/60">
                              <span className="text-zinc-500 text-[11px] mb-2 block font-medium">Gallery ({gallery.length} images)</span>
                              <div className="flex gap-2.5 overflow-x-auto pb-2">
                                {gallery.map((img: string, i: number) => (
                                  <a key={i} href={img} target="_blank" rel="noreferrer" className="shrink-0 block w-24 h-16 rounded-lg overflow-hidden border border-zinc-700/60 hover:border-zinc-500 transition-colors">
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
                        Registered: {new Date(place.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Modern Approval Modal */}
      {pendingApproval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-950/60">
              <div>
                <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                  <Sparkles size={18} className="text-emerald-400" />
                  <span>AI Discovered Destinations</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {pendingApproval.places.length} places found for {pendingApproval.province}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleApproveAll} 
                  disabled={isApprovingAll || savingPlaceId !== null || pendingApproval.places.filter(p => !p.is_duplicate).length === 0}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 rounded-lg text-xs transition-all shadow-md disabled:opacity-50"
                >
                  {isApprovingAll ? (
                    <>
                      <RefreshCw size={13} className="animate-spin text-white" />
                      <span>Saving {approvalProgress?.current || 1} of {approvalProgress?.total || 1}...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} />
                      <span>Approve All ({pendingApproval.places.filter(p => !p.is_duplicate).length})</span>
                    </>
                  )}
                </button>
                <button 
                  onClick={() => !isApprovingAll && setPendingApproval(null)} 
                  disabled={isApprovingAll}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 disabled:opacity-30 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Live Progress Bar for Storage Uploads */}
            {approvalProgress && (
              <div className="bg-emerald-950/40 border-b border-emerald-800/40 px-5 py-3 shrink-0">
                <div className="flex items-center justify-between text-xs text-emerald-300 mb-1.5 font-medium">
                  <div className="flex items-center gap-2">
                    <RefreshCw size={13} className="animate-spin text-emerald-400 shrink-0" />
                    <span>Uploading <b>{approvalProgress.placeName}</b> to Cloudflare R2 & Drive...</span>
                  </div>
                  <span className="font-mono text-emerald-400">
                    {Math.round((approvalProgress.current / approvalProgress.total) * 100)}% ({approvalProgress.current}/{approvalProgress.total})
                  </span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${(approvalProgress.current / approvalProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}
            
            {/* Modal List */}
            <div className="p-5 overflow-y-auto space-y-3.5">
              {pendingApproval.places.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 text-sm">No new places found.</div>
              ) : (
                pendingApproval.places.map((place, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row gap-4 p-4 border border-zinc-800 rounded-xl bg-zinc-950/60 items-start">
                    {place.hero_image_url && (
                      <div className="w-full sm:w-28 h-20 bg-zinc-900 rounded-lg overflow-hidden shrink-0 border border-zinc-800">
                        <img 
                          src={resolveImageUrl(place.hero_image_url)} 
                          alt={place.name} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "https://images.unsplash.com/photo-1540611025311-01df3cef54b5?w=300&auto=format&fit=crop&q=80";
                          }}
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-zinc-200 text-sm">{place.name}</h3>
                        {place.local_name && <span className="text-xs text-zinc-500 font-sans">{place.local_name}</span>}
                      </div>
                      <p className="text-xs text-zinc-400 mb-2.5 line-clamp-2 leading-relaxed">{place.description}</p>
                      <div className="flex flex-wrap gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${TYPE_COLORS[place.place_type] || 'bg-zinc-800 text-zinc-300'}`}>
                          {place.place_type}
                        </span>
                        {place.rating && (
                          <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[10px] font-medium">
                            ★ {place.rating}
                          </span>
                        )}
                        {place.address && <span className="text-[10px] text-zinc-500">{place.address}</span>}
                      </div>
                    </div>
                    <div className="flex items-center sm:items-start shrink-0 pt-2 sm:pt-0">
                      {place.is_duplicate ? (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                          <CheckCircle size={14} /> Saved
                        </div>
                      ) : savingPlaceId === idx.toString() ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-medium animate-pulse">
                          <RefreshCw size={12} className="animate-spin text-blue-400" />
                          <span>Uploading...</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleApproveSave(place, idx)}
                          disabled={isApprovingAll || savingPlaceId !== null}
                          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-1.5 rounded-lg text-xs transition-all shadow-sm disabled:opacity-50"
                        >
                          <Zap size={12} />
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
