import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  MapPin,
  RefreshCw,
  Zap,
  Trash2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { api } from '../lib/api';

interface Place {
  id: string;
  name: string;
  local_name?: string;
  place_type: string;
  description: string;
  rating?: number;
  is_duplicate?: boolean; // For AI scan results
}

export default function ProvinceDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  
  // AI Scan State
  const [isScanning, setIsScanning] = useState(false);
  const [pendingApproval, setPendingApproval] = useState<{ province: string, places: Place[] } | null>(null);
  const [savingPlaceId, setSavingPlaceId] = useState<string | null>(null);
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
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await api.delete(`/admin/tourism-places/${placeId}`);
      setPlaces(prev => prev.filter(p => p.id !== placeId));
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: `Failed to delete ${name}` });
    }
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
      setStatusMessage({ type: 'error', text: 'Failed to scan province. Check logs.' });
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
        fetchPlaces(); // Refresh main list
      }
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: `Failed to save ${place.name}` });
    } finally {
      setSavingPlaceId(null);
    }
  };

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
            <h1 className="text-xl font-semibold text-zinc-100 tracking-tight capitalize">
              {slug?.replace('-', ' ')}
            </h1>
            <p className="text-xs text-zinc-400 mt-1">Manage existing tourist destinations</p>
          </div>
        </div>
        
        <button 
          onClick={handleScan}
          disabled={isScanning}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 rounded-md text-xs transition-colors shadow-sm disabled:opacity-50"
        >
          {isScanning ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
          <span>Scan with AI</span>
        </button>
      </div>

      {statusMessage && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-xs font-medium ${
          statusMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
        }`}>
          {statusMessage.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
          {statusMessage.text}
        </div>
      )}

      {/* Main Places List */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-12"><RefreshCw className="animate-spin text-zinc-500" /></div>
        ) : places.length === 0 ? (
          <div className="text-center p-12 text-zinc-500 text-sm">No places found. Use 'Scan with AI' to discover some!</div>
        ) : (
          <div className="divide-y divide-zinc-800/80">
            {places.map((place) => (
              <div key={place.id} className="flex flex-col sm:flex-row gap-4 p-5 hover:bg-zinc-800/20 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <MapPin size={14} className="text-emerald-500" />
                    <h3 className="font-medium text-zinc-200">{place.name}</h3>
                    {place.local_name && <span className="text-xs text-zinc-500 font-mono">{place.local_name}</span>}
                  </div>
                  <p className="text-xs text-zinc-400 mb-2.5 line-clamp-2">{place.description}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-0.5 bg-zinc-800 rounded text-[10px] text-zinc-300">{place.place_type}</span>
                    {place.rating && <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded text-[10px]">★ {place.rating}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleDelete(place.id, place.name)}
                    className="p-2 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-md transition-colors"
                    title="Delete Place"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approval Modal (Same as before) */}
      {pendingApproval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <div>
                <h2 className="text-lg font-semibold text-zinc-100">Discovered Places</h2>
                <p className="text-xs text-zinc-400">Review AI discoveries for {pendingApproval.province}</p>
              </div>
              <button 
                onClick={() => setPendingApproval(null)}
                className="text-zinc-400 hover:text-white"
              >
                Close
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto space-y-4">
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
                        <span className="px-2 py-0.5 bg-zinc-800 rounded text-[10px] text-zinc-300">{place.place_type}</span>
                        {place.rating && <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded text-[10px]">★ {place.rating}</span>}
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
