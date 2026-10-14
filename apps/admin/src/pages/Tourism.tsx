import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  RefreshCw,
  Search,
  X,
  Sparkles,
  ChevronRight,
  Star,
  MapPin,
  Image as ImageIcon
} from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../components/ui/Toast';

export interface DestinationItem {
  id?: string;
  slug: string;
  name: string;
  name_km?: string;
  overview?: string;
  hero_image_url?: string;
  is_featured?: boolean;
  views_count?: number;
  symbol_name?: string;
  symbol_name_km?: string;
  symbol_nickname?: string;
  symbol_nickname_km?: string;
  symbol_monument_type?: string;
  symbol_story?: string;
  symbol_photo_spot_tip?: string;
  symbol_must_try_specialty?: string;
  symbol_accent_color?: string;
  symbol_emoji?: string;
  symbol_image_url?: string;
  region?: string;
}

const REGION_MAP: Record<string, string> = {
  'phnom-penh': 'Central',
  'siem-reap': 'Northwest',
  'sihanoukville': 'Coastal',
  'battambang': 'Northwest',
  'kampot': 'Coastal',
  'kep': 'Coastal',
  'kratie': 'East',
  'mondulkiri': 'Highland',
  'ratanakiri': 'Highland',
  'stung-treng': 'Northeast',
  'pursat': 'West',
  'kampong-cham': 'Central',
  'kampong-chhnang': 'Central',
  'kampong-speu': 'Central',
  'kampong-thom': 'Central',
  'kandal': 'Central',
  'koh-kong': 'Coastal',
  'preah-vihear': 'North',
  'prey-veng': 'Southeast',
  'svay-rieng': 'Southeast',
  'takeo': 'South',
  'banteay-meanchey': 'Northwest',
  'oddar-meanchey': 'North',
  'pailin': 'West',
  'tboung-khmum': 'East',
};

const DEFAULT_PROVINCES: DestinationItem[] = [
  { slug: 'phnom-penh', name: 'Phnom Penh', name_km: 'ភ្នំពេញ', is_featured: true, region: 'Central', symbol_emoji: '🏛️' },
  { slug: 'siem-reap', name: 'Siem Reap', name_km: 'សៀមរាប', is_featured: true, region: 'Northwest', symbol_emoji: '🏛️' },
  { slug: 'sihanoukville', name: 'Sihanoukville', name_km: 'ក្រុងព្រះសីហនុ', is_featured: true, region: 'Coastal', symbol_emoji: '🌊' },
  { slug: 'battambang', name: 'Battambang', name_km: 'បាត់ដំបង', is_featured: true, region: 'Northwest', symbol_emoji: '🎋' },
  { slug: 'kampot', name: 'Kampot', name_km: 'កំពត', is_featured: true, region: 'Coastal', symbol_emoji: '🍈' },
  { slug: 'kep', name: 'Kep', name_km: 'កែប', region: 'Coastal', symbol_emoji: '🦀' },
  { slug: 'kratie', name: 'Kratie', name_km: 'ក្រចេះ', region: 'East', symbol_emoji: '🐬' },
  { slug: 'mondulkiri', name: 'Mondulkiri', name_km: 'មណ្ឌលគិរី', region: 'Highland', symbol_emoji: '🐘' },
  { slug: 'ratanakiri', name: 'Ratanakiri', name_km: 'រតនគិរី', region: 'Highland', symbol_emoji: '🌋' },
  { slug: 'stung-treng', name: 'Stung Treng', name_km: 'ស្ទឹងត្រែង', region: 'Northeast', symbol_emoji: '🐟' },
  { slug: 'pursat', name: 'Pursat', name_km: 'ពោធិ៍សាត់', region: 'West', symbol_emoji: '🍊' },
  { slug: 'kampong-cham', name: 'Kampong Cham', name_km: 'កំពង់ចាម', region: 'Central', symbol_emoji: '🌉' },
  { slug: 'kampong-chhnang', name: 'Kampong Chhnang', name_km: 'កំពង់ឆ្នាំង', region: 'Central', symbol_emoji: '🏺' },
  { slug: 'kampong-speu', name: 'Kampong Speu', name_km: 'កំពង់ស្ពឺ', region: 'Central', symbol_emoji: '🌴' },
  { slug: 'kampong-thom', name: 'Kampong Thom', name_km: 'កំពង់ធំ', region: 'Central', symbol_emoji: '🛕' },
  { slug: 'kandal', name: 'Kandal', name_km: 'កណ្តាល', region: 'Central', symbol_emoji: '🌾' },
  { slug: 'koh-kong', name: 'Koh Kong', name_km: 'កោះកុង', region: 'Coastal', symbol_emoji: '🌿' },
  { slug: 'preah-vihear', name: 'Preah Vihear', name_km: 'ព្រះវិហារ', region: 'North', symbol_emoji: '⛰️' },
  { slug: 'prey-veng', name: 'Prey Veng', name_km: 'ព្រៃវែង', region: 'Southeast', symbol_emoji: '🌱' },
  { slug: 'svay-rieng', name: 'Svay Rieng', name_km: 'ស្វាយរៀង', region: 'Southeast', symbol_emoji: '🦆' },
  { slug: 'takeo', name: 'Takeo', name_km: 'តាកែវ', region: 'South', symbol_emoji: '🦐' },
  { slug: 'banteay-meanchey', name: 'Banteay Meanchey', name_km: 'បន្ទាយមានជ័យ', region: 'Northwest', symbol_emoji: '🚪' },
  { slug: 'oddar-meanchey', name: 'Oddar Meanchey', name_km: 'ឧត្ដរមានជ័យ', region: 'North', symbol_emoji: '🛡️' },
  { slug: 'pailin', name: 'Pailin', name_km: 'ប៉ៃលិន', region: 'West', symbol_emoji: '💎' },
  { slug: 'tboung-khmum', name: 'Tboung Khmum', name_km: 'ត្បូងឃ្មុំ', region: 'East', symbol_emoji: '🍯' },
];

export default function Tourism() {
  const navigate = useNavigate();
  const [destinations, setDestinations] = useState<DestinationItem[]>(DEFAULT_PROVINCES);
  const [loading, setLoading] = useState(true);
  const [fullScanRunning, setFullScanRunning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();

  useEffect(() => {
    fetchDestinations();
  }, []);

  const fetchDestinations = async () => {
    setLoading(true);
    try {
      const res = await api.get<DestinationItem[]>('/travel/destinations');
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        const enriched = res.data.map(d => ({
          ...d,
          region: REGION_MAP[d.slug] || 'Cambodia',
        }));
        setDestinations(enriched);
      }
    } catch (err) {
      console.warn('Failed to load dynamic destinations, using fallback list:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFullScan = async () => {
    if (!confirm('This will trigger automated discovery across all 25 provinces. This operation runs in the background. Proceed?')) return;
    setFullScanRunning(true);
    toastInfo('Initiating full discovery scan across all 25 provinces...', 'Tourism Engine');
    try {
      const res = await api.post<{ status?: string, message?: string, total_new_places?: number }>('/admin/ai/tourism-scan');
      if (res.data.status === 'failed') {
        toastError(res.data.message || 'Scan failed.');
        return;
      }
      toastSuccess(`Full scan complete! ${res.data.total_new_places || 0} new destinations discovered.`, 'Discovery Complete');
      fetchDestinations();
    } catch (err: any) {
      console.error(err);
      toastError(err.response?.data?.detail || 'Full scan failed. Check server logs.');
    } finally {
      setFullScanRunning(false);
    }
  };

  const [enhancingImages, setEnhancingImages] = useState(false);

  const handleEnhancePlaceImages = async () => {
    setEnhancingImages(true);
    toastInfo('Scanning places and fetching high-resolution 1600px HD photos...', 'AI HD Image Search');
    try {
      const res = await api.post<{ status: string; updated_count: number }>('/admin/ai/enhance-place-images');
      if (res.data?.status === 'success') {
        toastSuccess(`Enhanced ${res.data.updated_count} places with authentic HD images!`, 'HD Images Ready');
        fetchDestinations();
      } else {
        toastInfo('All places already have verified high-resolution images.', 'Up to date');
      }
    } catch (err: any) {
      console.error(err);
      toastError(err.response?.data?.detail || 'Failed to enhance place images.');
    } finally {
      setEnhancingImages(false);
    }
  };

  const filteredProvinces = useMemo(() => {
    if (!searchQuery.trim()) return destinations;
    const q = searchQuery.toLowerCase();
    return destinations.filter(p => 
      p.name.toLowerCase().includes(q) || 
      (p.name_km && p.name_km.toLowerCase().includes(q)) ||
      (p.symbol_name && p.symbol_name.toLowerCase().includes(q)) ||
      (p.region && p.region.toLowerCase().includes(q))
    );
  }, [searchQuery, destinations]);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Destinations & Hubs</h1>
            <span className="badge-pill badge-zinc font-mono">{destinations.length} Dynamic Hubs</span>
            {loading && <span className="text-xs text-zinc-500 animate-pulse">Syncing...</span>}
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Dynamic database-driven tourist destinations, provincial symbols, culinary heritage, and travel hubs.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button 
            onClick={fetchDestinations}
            disabled={loading}
            className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-medium px-3.5 py-2 rounded-lg text-xs border border-zinc-800 transition-all cursor-pointer"
            title="Refresh database destinations"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Sync</span>
          </button>
          <button 
            onClick={handleEnhancePlaceImages}
            disabled={enhancingImages}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium px-3.5 py-2 rounded-lg text-xs transition-all shadow-md hover:shadow-blue-950/40 disabled:opacity-50 cursor-pointer"
            title="Search and assign 1600px HD cultural photos and galleries for places"
          >
            {enhancingImages ? <RefreshCw size={13} className="animate-spin" /> : <ImageIcon size={13} />}
            <span>{enhancingImages ? 'Enhancing Places...' : 'Enhance Places HD'}</span>
          </button>
          <button 
            onClick={handleFullScan}
            disabled={fullScanRunning}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 rounded-lg text-xs transition-all shadow-md hover:shadow-emerald-950/40 disabled:opacity-50 cursor-pointer"
          >
            {fullScanRunning ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
            <span>{fullScanRunning ? 'Scanning 25 Provinces...' : 'Discover New Places'}</span>
          </button>
        </div>
      </div>

      {/* 2. Search Toolbar */}
      <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={13} />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search province by English, Khmer, or symbol..."
            className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg py-1.5 pl-8 pr-8 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
        </div>
        <div className="text-xs text-zinc-500 font-mono hidden sm:block">
          Showing {filteredProvinces.length} of {destinations.length} active regions
        </div>
      </div>

      {/* 3. Dynamic Province Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
        {filteredProvinces.map(prov => (
          <button 
            key={prov.slug}
            onClick={() => navigate(`/tourism/${prov.slug}`)}
            className="flex flex-col text-left bg-zinc-900/60 border border-zinc-800/90 hover:border-zinc-700 hover:bg-zinc-850 rounded-xl p-4 transition-all duration-200 group shadow-sm hover:shadow-md cursor-pointer"
          >
            <div className="flex items-start justify-between w-full mb-3">
              <div className="flex items-start gap-2.5">
                <span className="text-xl sm:text-2xl p-1.5 rounded-lg bg-zinc-950/70 border border-zinc-800/70 shrink-0">
                  {prov.symbol_emoji || '🏛️'}
                </span>
                <div>
                  <p className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors">{prov.name}</p>
                  <p className="text-xs text-zinc-400 font-sans mt-0.5">{prov.name_km || prov.name}</p>
                </div>
              </div>
              {prov.is_featured && (
                <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20 font-medium shrink-0">
                  <Star size={9} className="fill-amber-400" /> Top
                </span>
              )}
            </div>

            {prov.symbol_name && (
              <p className="text-[11px] text-zinc-400 line-clamp-1 mb-2 italic">
                {prov.symbol_name}
              </p>
            )}
            
            <div className="w-full mt-auto pt-3 border-t border-zinc-800/70 flex items-center justify-between text-xs text-zinc-500 group-hover:text-zinc-300 transition-colors">
              <span className="text-[11px] font-mono flex items-center gap-1">
                <MapPin size={11} className="text-zinc-500" />
                {prov.region}
              </span>
              <span className="flex items-center gap-0.5 text-xs text-blue-400 font-medium group-hover:translate-x-0.5 transition-transform">
                Manage <ChevronRight size={13} />
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
