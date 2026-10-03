import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Globe,
  RefreshCw,
  Zap,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { api } from '../lib/api';

const PROVINCES = [
  { slug: 'phnom-penh', name: 'Phnom Penh', nameKm: 'ភ្នំពេញ', featured: true },
  { slug: 'siem-reap', name: 'Siem Reap', nameKm: 'សៀមរាប', featured: true },
  { slug: 'sihanoukville', name: 'Sihanoukville', nameKm: 'ក្រុងព្រះសីហនុ', featured: true },
  { slug: 'battambang', name: 'Battambang', nameKm: 'បាត់ដំបង', featured: true },
  { slug: 'kampot', name: 'Kampot', nameKm: 'កំពត', featured: true },
  { slug: 'kep', name: 'Kep', nameKm: 'កែប' },
  { slug: 'kratie', name: 'Kratie', nameKm: 'ក្រចេះ' },
  { slug: 'mondulkiri', name: 'Mondulkiri', nameKm: 'មណ្ឌលគិរី' },
  { slug: 'ratanakiri', name: 'Ratanakiri', nameKm: 'រតនគិរី' },
  { slug: 'stung-treng', name: 'Stung Treng', nameKm: 'ស្ទឹងត្រែង' },
  { slug: 'pursat', name: 'Pursat', nameKm: 'ពោធិ៍សាត់' },
  { slug: 'kampong-cham', name: 'Kampong Cham', nameKm: 'កំពង់ចាម' },
  { slug: 'kampong-chhnang', name: 'Kampong Chhnang', nameKm: 'កំពង់ឆ្នាំង' },
  { slug: 'kampong-speu', name: 'Kampong Speu', nameKm: 'កំពង់ស្ពឺ' },
  { slug: 'kampong-thom', name: 'Kampong Thom', nameKm: 'កំពង់ធំ' },
  { slug: 'kandal', name: 'Kandal', nameKm: 'កណ្តាល' },
  { slug: 'koh-kong', name: 'Koh Kong', nameKm: 'កោះកុង' },
  { slug: 'preah-vihear', name: 'Preah Vihear', nameKm: 'ព្រះវិហារ' },
  { slug: 'prey-veng', name: 'Prey Veng', nameKm: 'ព្រៃវែង' },
  { slug: 'svay-rieng', name: 'Svay Rieng', nameKm: 'ស្វាយរៀង' },
  { slug: 'takeo', name: 'Takeo', nameKm: 'តាកែវ' },
  { slug: 'banteay-meanchey', name: 'Banteay Meanchey', nameKm: 'បន្ទាយមានជ័យ' },
  { slug: 'oddar-meanchey', name: 'Oddar Meanchey', nameKm: 'ឧត្ដរមានជ័យ' },
  { slug: 'pailin', name: 'Pailin', nameKm: 'ប៉ៃលិន' },
  { slug: 'tboung-khmum', name: 'Tboung Khmum', nameKm: 'ត្បូងឃ្មុំ' },
];

export default function Tourism() {
  const navigate = useNavigate();
  const [fullScanRunning, setFullScanRunning] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleFullScan = async () => {
    if (!confirm('This will scan ALL 25 provinces using Google AI. It may take several minutes. Proceed?')) return;
    setFullScanRunning(true);
    setStatusMessage(null);
    try {
      const res = await api.post<{ status?: string, message?: string, total_new_places?: number }>('/admin/ai/tourism-scan');
      if (res.data.status === 'failed') {
        setStatusMessage({ type: 'error', text: res.data.message || 'Scan failed.' });
        return;
      }
      setStatusMessage({
        type: 'success',
        text: `Full scan complete! ${res.data.total_new_places || 0} new places added across all provinces.`
      });
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: 'Full scan failed. Check server logs.' });
    } finally {
      setFullScanRunning(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">AI Tourism Engine</h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Globe size={10} /> 25 Provinces
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Uses Google Gemini AI to automatically discover and populate tourist places across Cambodia.
          </p>
        </div>
        <button 
          onClick={handleFullScan}
          disabled={fullScanRunning}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 rounded-md text-xs transition-colors shadow-sm disabled:opacity-50"
        >
          {fullScanRunning ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
          <span>{fullScanRunning ? 'Scanning All 25 Provinces...' : 'Run Full Scan Now'}</span>
        </button>
      </div>

      {/* Status Message */}
      {statusMessage && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-xs font-medium ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
        }`}>
          {statusMessage.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
          {statusMessage.text}
        </div>
      )}

      {/* Province Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {PROVINCES.map(prov => (
          <button 
            key={prov.slug}
            onClick={() => navigate(`/tourism/${prov.slug}`)}
            className="flex flex-col text-left bg-zinc-900/60 border border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-800/50 rounded-lg p-4 transition-all group"
          >
            <div className="flex items-start justify-between w-full mb-2">
              <div>
                <p className="text-sm font-medium text-zinc-200 group-hover:text-emerald-400 transition-colors">{prov.name}</p>
                <p className="text-[11px] text-zinc-500 font-mono">{prov.nameKm}</p>
              </div>
              {prov.featured && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 bg-amber-500/10 text-amber-400 rounded border border-amber-500/20">★</span>
              )}
            </div>
            
            <div className="w-full mt-2 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
              <span>Manage Places</span>
              <span className="text-zinc-600 group-hover:text-emerald-500 transition-colors">→</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
