import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  RefreshCw,
  Search,
  X,
  Sparkles,
  ChevronRight,
  Star
} from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../components/ui/Toast';

const PROVINCES = [
  { slug: 'phnom-penh', name: 'Phnom Penh', nameKm: 'ភ្នំពេញ', featured: true, region: 'Central' },
  { slug: 'siem-reap', name: 'Siem Reap', nameKm: 'សៀមរាប', featured: true, region: 'Northwest' },
  { slug: 'sihanoukville', name: 'Sihanoukville', nameKm: 'ក្រុងព្រះសីហនុ', featured: true, region: 'Coastal' },
  { slug: 'battambang', name: 'Battambang', nameKm: 'បាត់ដំបង', featured: true, region: 'Northwest' },
  { slug: 'kampot', name: 'Kampot', nameKm: 'កំពត', featured: true, region: 'Coastal' },
  { slug: 'kep', name: 'Kep', nameKm: 'កែប', region: 'Coastal' },
  { slug: 'kratie', name: 'Kratie', nameKm: 'ក្រចេះ', region: 'East' },
  { slug: 'mondulkiri', name: 'Mondulkiri', nameKm: 'មណ្ឌលគិរី', region: 'Highland' },
  { slug: 'ratanakiri', name: 'Ratanakiri', nameKm: 'រតនគិរី', region: 'Highland' },
  { slug: 'stung-treng', name: 'Stung Treng', nameKm: 'ស្ទឹងត្រែង', region: 'Northeast' },
  { slug: 'pursat', name: 'Pursat', nameKm: 'ពោធិ៍សាត់', region: 'West' },
  { slug: 'kampong-cham', name: 'Kampong Cham', nameKm: 'កំពង់ចាម', region: 'Central' },
  { slug: 'kampong-chhnang', name: 'Kampong Chhnang', nameKm: 'កំពង់ឆ្នាំង', region: 'Central' },
  { slug: 'kampong-speu', name: 'Kampong Speu', nameKm: 'កំពង់ស្ពឺ', region: 'Central' },
  { slug: 'kampong-thom', name: 'Kampong Thom', nameKm: 'កំពង់ធំ', region: 'Central' },
  { slug: 'kandal', name: 'Kandal', nameKm: 'កណ្តាល', region: 'Central' },
  { slug: 'koh-kong', name: 'Koh Kong', nameKm: 'កោះកុង', region: 'Coastal' },
  { slug: 'preah-vihear', name: 'Preah Vihear', nameKm: 'ព្រះវិហារ', region: 'North' },
  { slug: 'prey-veng', name: 'Prey Veng', nameKm: 'ព្រៃវែង', region: 'Southeast' },
  { slug: 'svay-rieng', name: 'Svay Rieng', nameKm: 'ស្វាយរៀង', region: 'Southeast' },
  { slug: 'takeo', name: 'Takeo', nameKm: 'តាកែវ', region: 'South' },
  { slug: 'banteay-meanchey', name: 'Banteay Meanchey', nameKm: 'បន្ទាយមានជ័យ', region: 'Northwest' },
  { slug: 'oddar-meanchey', name: 'Oddar Meanchey', nameKm: 'ឧត្ដរមានជ័យ', region: 'North' },
  { slug: 'pailin', name: 'Pailin', nameKm: 'ប៉ៃលិន', region: 'West' },
  { slug: 'tboung-khmum', name: 'Tboung Khmum', nameKm: 'ត្បូងឃ្មុំ', region: 'East' },
];

export default function Tourism() {
  const navigate = useNavigate();
  const [fullScanRunning, setFullScanRunning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();

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
    } catch (err: any) {
      console.error(err);
      toastError(err.response?.data?.detail || 'Full scan failed. Check server logs.');
    } finally {
      setFullScanRunning(false);
    }
  };

  const filteredProvinces = useMemo(() => {
    if (!searchQuery.trim()) return PROVINCES;
    const q = searchQuery.toLowerCase();
    return PROVINCES.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.nameKm.toLowerCase().includes(q) ||
      p.region?.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Destinations & Hubs</h1>
            <span className="badge-pill badge-zinc font-mono">25 Provinces</span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Browse and manage tourist destinations, culinary spots, and cultural heritage hubs.
          </p>
        </div>
        <button 
          onClick={handleFullScan}
          disabled={fullScanRunning}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 rounded-lg text-xs transition-all shadow-md hover:shadow-emerald-950/40 disabled:opacity-50"
        >
          {fullScanRunning ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
          <span>{fullScanRunning ? 'Scanning 25 Provinces...' : 'Discover New Places'}</span>
        </button>
      </div>

      {/* 2. Search Toolbar */}
      <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={13} />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search province by English or Khmer name..."
            className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg py-1.5 pl-8 pr-8 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-all"
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
        <div className="text-xs text-zinc-500 font-mono hidden sm:block">
          Showing {filteredProvinces.length} of 25 regions
        </div>
      </div>

      {/* 3. Province Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
        {filteredProvinces.map(prov => (
          <button 
            key={prov.slug}
            onClick={() => navigate(`/tourism/${prov.slug}`)}
            className="flex flex-col text-left bg-zinc-900/60 border border-zinc-800/90 hover:border-zinc-700 hover:bg-zinc-850 rounded-xl p-4 transition-all duration-200 group shadow-sm hover:shadow-md cursor-pointer"
          >
            <div className="flex items-start justify-between w-full mb-3">
              <div>
                <p className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors">{prov.name}</p>
                <p className="text-xs text-zinc-400 font-sans mt-0.5">{prov.nameKm}</p>
              </div>
              {prov.featured && (
                <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20 font-medium">
                  <Star size={9} className="fill-amber-400" /> Top
                </span>
              )}
            </div>
            
            <div className="w-full mt-auto pt-3 border-t border-zinc-800/70 flex items-center justify-between text-xs text-zinc-500 group-hover:text-zinc-300 transition-colors">
              <span className="text-[11px] font-mono">{prov.region}</span>
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
