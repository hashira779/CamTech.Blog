import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  RefreshCw,
  Search,
  X,
  Sparkles,
  ChevronRight,
  Star,
  MapPin,
  AlertTriangle,
  Check,
  Image as ImageIcon
} from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../components/ui/Toast';

interface TourismScanStatus {
  running: boolean;
  started_at?: string | null;
  finished_at?: string | null;
  discovery_source?: string | null;
  provinces_total: number;
  provinces_done: number;
  current_province?: string | null;
  new_places: number;
  candidates: number;
  duplicates_skipped: number;
  generic_withheld: number;
  errors: string[];
  last_summary?: {
    status?: string;
    provinces_scanned?: number;
    new_places?: number;
    candidates?: number;
    duplicates_skipped?: number;
    generic_withheld?: number;
    discovery_source?: string;
    error_count?: number;
  } | null;
}

/**
 * Response of POST /admin/ai/enhance-place-images.
 *
 * The old build only read `updated_count`, so a scan that skipped every place carrying a
 * wrong photograph still toasted "Enhanced 0 places" - indistinguishable from success. The
 * server now names every outcome instead of merging them into one number, including the two
 * that used to be reported as one: a replaced cover (what the reader sees) and a re-verified
 * album behind it. `needs_editorial_attention` is the honest remainder - photos the scan could
 * not prove right or wrong, so it left them alone and told someone.
 */
interface PlaceImageReport {
  status: string;
  updated_count: number;
  replaced_count: number;
  /** The picture on the card really is a different picture now. */
  hero_replaced_count?: number;
  /** Cover unchanged; only the album behind it was re-verified. */
  gallery_only_count?: number;
  cleared_count: number;
  unconfirmed_count: number;
  no_photo_found_count?: number;
  confirmed_ok_count?: number;
  places_examined: number;
  places_selected: number;
  already_trusted: number;
  more_pending: number;
  places: { id: string; name: string; province?: string; hero_before?: string | null; hero_image_url?: string | null; hero_changed?: boolean; gallery_changed?: boolean; verified_images?: number }[];
  no_verified_image: { id: string; name: string; province?: string; hero_before?: string | null }[];
  needs_editorial_attention: { id: string; name: string; province?: string; hero?: string | null; hero_score?: number | null; reasons?: string[] }[];
  no_photo_found?: { id: string; name: string; province?: string; reasons?: string[] }[];
  images_confirmed_ok?: { id: string; name: string; province?: string; hero_image_url?: string | null; reasons?: string[] }[];
}

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
  const [scan, setScan] = useState<TourismScanStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const scanPollRef = useRef<number | null>(null);
  const watchingRef = useRef(false);
  const sawRunningRef = useRef(false);
  const notStartedPollsRef = useRef(0);
  const { success: toastSuccess, error: toastError, warning: toastWarning, info: toastInfo } = useToast();

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

  const describeFinish = (s: TourismScanStatus) => {
    const summary = s.last_summary || {};
    const added = summary.new_places ?? s.new_places ?? 0;
    const dupes = summary.duplicates_skipped ?? s.duplicates_skipped ?? 0;
    const withheld = summary.generic_withheld ?? s.generic_withheld ?? 0;
    const provinces = summary.provinces_scanned ?? s.provinces_total;
    const sourceNote = (summary.discovery_source ?? s.discovery_source) === 'curated_heritage_list'
      ? ' No AI provider is configured, so the built-in heritage list was used - add an API key in Settings for researched discoveries.'
      : '';

    if ((summary.error_count ?? 0) > 0 && added === 0) {
      return {
        kind: 'warning' as const,
        text: `Scan stopped after ${provinces} provinces with ${summary.error_count} error(s) and added nothing. Check the API logs.${sourceNote}`,
      };
    }
    if (added > 0) {
      return {
        kind: 'success' as const,
        text: `Scan finished: ${added} new place(s) added across ${provinces} provinces. ${dupes} duplicate spelling(s) and ${withheld} generic placeholder(s) were not added.${sourceNote}`,
      };
    }
    return {
      kind: 'info' as const,
      text: `Scan finished across ${provinces} provinces: nothing new to add. ${dupes} candidate(s) were already in the directory and ${withheld} were generic placeholders.${sourceNote}`,
    };
  };

  const stopScanPolling = () => {
    if (scanPollRef.current !== null) {
      window.clearInterval(scanPollRef.current);
      scanPollRef.current = null;
    }
  };

  const pollScan = async () => {
    try {
      const res = await api.get<TourismScanStatus>('/admin/ai/tourism-scan/status');
      const s = res.data;
      setScan(s);
      if (s.running) {
        sawRunningRef.current = true;
        setFullScanRunning(true);
        return;
      }
      if (sawRunningRef.current) {
        sawRunningRef.current = false;
        setFullScanRunning(false);
        stopScanPolling();
        const outcome = describeFinish(s);
        if (outcome.kind === 'success') toastSuccess(outcome.text, 'Discovery complete');
        else if (outcome.kind === 'warning') toastWarning(outcome.text, 'Discovery problem');
        else toastInfo(outcome.text, 'Discovery complete');
        fetchDestinations();
      } else if (watchingRef.current) {
        // The scan was started but this poll could not see it running yet. Wait a few
        // cycles before calling it a failure - the job only marks itself running after
        // it has re-created the 25 destination rows.
        notStartedPollsRef.current += 1;
        if (notStartedPollsRef.current < 5) return;
        watchingRef.current = false;
        setFullScanRunning(false);
        stopScanPolling();
        toastWarning('The server reported no running scan. Check the API logs.', 'Discovery not started');
      }
    } catch (err: any) {
      watchingRef.current = false;
      sawRunningRef.current = false;
      setFullScanRunning(false);
      stopScanPolling();
      toastError(err?.response?.data?.detail || 'Could not read scan progress from the server.');
    }
  };

  const watchScan = () => {
    watchingRef.current = true;
    stopScanPolling();
    scanPollRef.current = window.setInterval(pollScan, 5000);
    // Give the background task a moment to set running=true before the first read.
    window.setTimeout(pollScan, 1500);
  };

  const handleFullScan = async () => {
    if (!confirm('This researches all 25 provinces and auto-saves places that are genuinely new. It runs in the background and can take many minutes. Proceed?')) return;
    setFullScanRunning(true);
    toastInfo('Discovery started across all 25 provinces - progress shows in the header.', 'Tourism Engine');
    try {
      const res = await api.post<{ status?: string; discovery_source?: string; message?: string }>('/admin/ai/tourism-scan');
      if (res.data.discovery_source === 'curated_heritage_list') {
        toastInfo('No AI provider key is configured: discovery will use the built-in heritage list, not live research.', 'Curated mode');
      }
      watchScan();
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      if (err?.response?.status === 409) {
        toastInfo(detail || 'A discovery scan is already running.', 'Already running');
        sawRunningRef.current = true;
        watchScan();
        return;
      }
      setFullScanRunning(false);
      toastError(detail || 'Could not start the scan. Check server logs.');
    }
  };

  // A scan keeps running server-side across page reloads, so pick its progress back up.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<TourismScanStatus>('/admin/ai/tourism-scan/status');
        if (cancelled) return;
        setScan(res.data);
        if (res.data.running) {
          sawRunningRef.current = true;
          setFullScanRunning(true);
          stopScanPolling();
          scanPollRef.current = window.setInterval(pollScan, 5000);
        }
      } catch {
        /* progress is optional; the button still surfaces request errors */
      }
    })();
    return () => {
      cancelled = true;
      stopScanPolling();
    };
  }, []);

  const [enhancingImages, setEnhancingImages] = useState(false);
  const [rescanTrusted, setRescanTrusted] = useState(false);
  const [imageReport, setImageReport] = useState<PlaceImageReport | null>(null);

  const handleEnhancePlaceImages = async () => {
    setEnhancingImages(true);
    toastInfo(
      rescanTrusted
        ? 'Re-searching every place photograph, including the ones that already pass…'
        : 'Re-checking place photographs and replacing the ones that do not show the place…',
      'Place photo scan'
    );
    try {
      const res = await api.post<PlaceImageReport>(
        `/admin/ai/enhance-place-images?force=${rescanTrusted ? 'true' : 'false'}`
      );
      const d = res.data;
      setImageReport(d);
      const parts = [
        d.hero_replaced_count ? `${d.hero_replaced_count} cover photo(s) replaced` : null,
        d.gallery_only_count ? `${d.gallery_only_count} album(s) re-verified` : null,
        d.cleared_count ? `${d.cleared_count} unusable photo removed` : null,
        d.unconfirmed_count ? `${d.unconfirmed_count} kept but unproven` : null,
        d.no_photo_found_count ? `${d.no_photo_found_count} with no photo anywhere yet` : null,
        d.confirmed_ok_count ? `${d.confirmed_ok_count} re-checked and already right` : null,
        `${d.already_trusted ?? 0} already matched`,
      ].filter(Boolean).join(' - ');
      if (d.replaced_count || d.cleared_count) {
        toastSuccess(`Photo scan done: ${parts}.`, 'Place photos updated');
      } else {
        toastInfo(`Photo scan done: ${parts}.`, 'Nothing to replace');
      }
      fetchDestinations();
    } catch (err: any) {
      console.error(err);
      toastError(err.response?.data?.detail || 'Failed to scan place photos.');
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
            onClick={() => setRescanTrusted((v) => !v)}
            aria-pressed={rescanTrusted}
            title="Also re-search places whose current photo already passes verification (slower, more network calls)"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs border transition-colors cursor-pointer ${
              rescanTrusted
                ? 'bg-blue-950/60 border-blue-700 text-blue-200'
                : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <span className={`inline-flex h-3 w-3 items-center justify-center rounded-[3px] border ${rescanTrusted ? 'border-blue-400 bg-blue-500' : 'border-zinc-700'}`}>
              {rescanTrusted && <Check size={9} className="text-white" />}
            </span>
            <span>Re-scan good photos too</span>
          </button>
          <button 
            onClick={handleEnhancePlaceImages}
            disabled={enhancingImages}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium px-3.5 py-2 rounded-lg text-xs transition-all shadow-md hover:shadow-blue-950/40 disabled:opacity-50 cursor-pointer"
            title="Re-check every place photograph and replace the ones that do not show that place"
          >
            {enhancingImages ? <RefreshCw size={13} className="animate-spin" /> : <ImageIcon size={13} />}
            <span>{enhancingImages ? 'Checking photos...' : 'Fix Place Photos'}</span>
          </button>
          <button 
            onClick={handleFullScan}
            disabled={fullScanRunning}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 rounded-lg text-xs transition-all shadow-md hover:shadow-emerald-950/40 disabled:opacity-50 cursor-pointer"
          >
            {fullScanRunning ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
            <span>
              {fullScanRunning && scan
                ? `Scanning ${scan.provinces_done}/${scan.provinces_total} provinces...`
                : 'Discover New Places'}
            </span>
          </button>
        </div>
      </div>

      {/* 1a. What the last photo scan actually did. Counts come from the server, and the two
              lists are the honest part: photos that could not be proven right (so they stayed,
              with a flag) and places no free source has a photo of at all. Fields are defaulted
              because an older API build answers with only `updated_count`. */}
      {imageReport && (() => {
        const unproven = imageReport.needs_editorial_attention || [];
        const photoless = imageReport.no_photo_found || [];
        const repaired = (imageReport.places || []).filter((r) => r.hero_changed || r.gallery_changed);
        return (
        <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <span className="flex items-center gap-2 text-xs font-medium text-zinc-200">
              <ImageIcon size={12} className="text-blue-400" />
              Photo scan of {imageReport.places_examined} place(s) - {imageReport.places_selected} needed work
            </span>
            <button onClick={() => setImageReport(null)} className="text-zinc-500 hover:text-zinc-300" aria-label="Dismiss photo report">
              <X size={13} />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono">
            <span className="text-emerald-400">{imageReport.hero_replaced_count ?? 0} cover photo(s) replaced</span>
            <span className="text-sky-400">{imageReport.gallery_only_count ?? 0} album(s) re-verified</span>
            <span className="text-amber-400">{imageReport.cleared_count ?? 0} unusable photo removed</span>
            <span className="text-orange-400/80">{imageReport.unconfirmed_count ?? 0} kept, not proven</span>
            <span className="text-zinc-500">{imageReport.no_photo_found_count ?? 0} no photo exists to find</span>
            <span className="text-zinc-400">{imageReport.confirmed_ok_count ?? 0} re-checked, already right</span>
            <span className="text-zinc-400">{imageReport.already_trusted ?? 0} passed, not re-scanned</span>
            {imageReport.more_pending > 0 && (
              <span className="text-zinc-500">{imageReport.more_pending} more pending, run again</span>
            )}
          </div>
          {repaired.length > 0 && (
            <ul className="space-y-1 pt-1 border-t border-zinc-800/60">
              <li className="text-[10px] uppercase tracking-wider text-zinc-500">Photos written over the old ones</li>
              {repaired.slice(0, 6).map((p) => (
                <li key={p.id} className="flex flex-wrap items-baseline gap-x-2 text-[11px] text-zinc-400">
                  <span className="text-zinc-200">{p.name}</span>
                  <span className="text-zinc-500">{p.province}</span>
                  <span className={p.hero_changed ? 'text-emerald-400' : 'text-sky-400/80'}>
                    {p.hero_changed ? 'new cover' : 'cover already matched'} · {p.verified_images ?? 0} verified
                  </span>
                </li>
              ))}
            </ul>
          )}
          {unproven.length > 0 && (
            <ul className="space-y-1 pt-1 border-t border-zinc-800/60">
              <li className="text-[10px] uppercase tracking-wider text-zinc-500">Photo still on the card, but unproven - check it yourself</li>
              {unproven.slice(0, 6).map((p) => (
                <li key={p.id} className="flex flex-wrap items-baseline gap-x-2 text-[11px] text-zinc-400">
                  <span className="text-zinc-200">{p.name}</span>
                  <span className="text-zinc-500">{p.province}</span>
                  <span className="text-amber-400/80">{(p.reasons || []).join('; ')}</span>
                </li>
              ))}
            </ul>
          )}
          {photoless.length > 0 && (
            <ul className="space-y-1 pt-1 border-t border-zinc-800/60">
              <li className="text-[10px] uppercase tracking-wider text-zinc-500">Wikipedia and Commons have no photo of these - upload one or drop in your own</li>
              {photoless.slice(0, 6).map((p) => (
                <li key={p.id} className="flex flex-wrap items-baseline gap-x-2 text-[11px] text-zinc-400">
                  <span className="text-zinc-200">{p.name}</span>
                  <span className="text-zinc-500">{p.province}</span>
                  <span className="text-zinc-500">{(p.reasons || []).join('; ')}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        );
      })()}

      {/* 1b. Discovery progress - the scan runs server-side, so this is the real state */}
      {scan && (scan.running || scan.last_summary) && (() => {
        const done = scan.provinces_done;
        const total = scan.provinces_total || 25;
        const pct = Math.min(100, Math.round((done / total) * 100));
        const summary = scan.last_summary;
        const source = scan.discovery_source ?? summary?.discovery_source;
        return (
          <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="flex items-center gap-2 font-medium text-zinc-200">
                {scan.running ? (
                  <>
                    <RefreshCw size={12} className="animate-spin text-emerald-400" />
                    <span>Researching {scan.current_province || 'the next province'} - province {done} of {total}</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={12} className="text-emerald-400" />
                    <span>Last scan finished - {summary?.provinces_scanned ?? done} provinces searched</span>
                  </>
                )}
              </span>
              <span className="text-zinc-500 font-mono text-[10px] uppercase tracking-wide">
                {source === 'curated_heritage_list' ? 'Curated heritage list' : 'AI research'}
              </span>
            </div>

            <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${scan.running ? 'bg-emerald-500' : 'bg-zinc-600'}`}
                style={{ width: `${scan.running ? pct : 100}%` }}
              />
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-zinc-400 font-mono">
              <span className="text-emerald-400">{scan.new_places} new places</span>
              <span>{scan.candidates} candidates seen</span>
              <span>{scan.duplicates_skipped} duplicate spellings skipped</span>
              <span>{scan.generic_withheld} generic placeholders withheld</span>
              {scan.errors && scan.errors.length > 0 && (
                <span className="flex items-center gap-1 text-amber-400">
                  <AlertTriangle size={11} /> {scan.errors.length} province error(s)
                </span>
              )}
            </div>

            {!scan.running && scan.new_places === 0 && (
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Nothing new was added: every candidate either repeats a place already in the directory
                or is a generic placeholder such as &quot;Takeo Historic Pagoda&quot;. Configure an AI
                provider in Settings to research live sources instead of the built-in list.
              </p>
            )}
          </div>
        );
      })()}

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
