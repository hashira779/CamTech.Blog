import { useState, useEffect } from 'react';
import { ShieldCheck, MapPin, CheckCircle, XCircle, Info, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../components/ui/Toast';

interface PlaceSuggestion {
  id: string;
  suggestion_type: string;
  place_name: string;
  destination_slug: string;
  place_type: string;
  details: string;
  submitter_name?: string;
  submitter_contact?: string;
  source_notes?: string;
  status: string;
  created_at: string;
}

export default function PlaceSuggestions() {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING');
  const [actioningId, setActioningId] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchSuggestions();
  }, [filter]);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const url = filter ? `/admin/place-suggestions?status=${filter}` : `/admin/place-suggestions`;
      const res = await api.get(url);
      setSuggestions(res.data);
    } catch (err) {
      console.error('Failed to fetch suggestions', err);
      showToast('error', 'Unable to retrieve submissions.');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      setActioningId(id);
      await api.post(`/admin/place-suggestions/${id}/${action}`, { moderation_notes: '' });
      showToast('success', `Place submission ${action === 'approve' ? 'approved and published' : 'rejected'}.`);
      fetchSuggestions();
    } catch (err) {
      console.error(`Failed to ${action} suggestion`, err);
      showToast('error', `Failed to ${action} submission.`);
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="h-6 w-6 text-emerald-600" /> Community Submissions
          </h1>
          <p className="text-zinc-500 text-xs sm:text-sm mt-1">Review, approve, or reject user-submitted places and tourist attractions.</p>
        </div>
        
        <div className="flex items-center gap-1.5 bg-zinc-100/80 p-1 rounded-lg border border-zinc-200/80 self-start sm:self-auto">
          {['PENDING', 'APPROVED', 'REJECTED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                filter === status 
                  ? 'bg-white text-zinc-900 shadow-xs border border-zinc-200/60' 
                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-white/50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-xl border border-zinc-200/70 p-5 shadow-xs flex flex-col sm:flex-row gap-5">
              <div className="flex-1 space-y-3">
                <div className="flex gap-2">
                  <div className="h-5 w-20 skeleton-shimmer rounded" />
                  <div className="h-5 w-24 skeleton-shimmer rounded" />
                  <div className="h-5 w-16 skeleton-shimmer rounded" />
                </div>
                <div className="h-6 w-1/3 skeleton-shimmer rounded" />
                <div className="h-16 w-full skeleton-shimmer rounded-lg" />
                <div className="h-4 w-48 skeleton-shimmer rounded" />
              </div>
              <div className="flex flex-row sm:flex-col gap-2 justify-center sm:border-l sm:border-zinc-100 sm:pl-5 shrink-0">
                <div className="h-9 w-28 skeleton-shimmer rounded-lg" />
                <div className="h-9 w-28 skeleton-shimmer rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : suggestions.length === 0 ? (
        <div className="bg-white rounded-xl border border-zinc-200/70 border-dashed p-12 text-center flex flex-col items-center">
          <MapPin className="h-12 w-12 text-zinc-300 mb-3" />
          <h3 className="text-base font-bold text-zinc-900">No {filter.toLowerCase()} submissions</h3>
          <p className="text-zinc-500 text-xs sm:text-sm mt-1 max-w-sm">Everything in the {filter.toLowerCase()} review pipeline has been moderated.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {suggestions.map((suggestion) => {
            const isProcessing = actioningId === suggestion.id;
            return (
              <div key={suggestion.id} className="bg-white rounded-xl border border-zinc-200/80 p-5 shadow-xs hover:border-zinc-300 transition-colors flex flex-col sm:flex-row gap-5">
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200/60">
                          {suggestion.suggestion_type.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200/60">
                          {suggestion.destination_slug}
                        </span>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                          {suggestion.place_type}
                        </span>
                      </div>
                      <h2 className="text-base font-bold text-zinc-900 mt-1">{suggestion.place_name}</h2>
                    </div>
                  </div>
                  
                  <div className="text-xs text-zinc-600 bg-zinc-50/80 p-3.5 rounded-lg border border-zinc-100 whitespace-pre-wrap leading-relaxed">
                    {suggestion.details}
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <div className="flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-zinc-400" /> 
                      <span>Submitted by: <strong className="text-zinc-700">{suggestion.submitter_name || 'Anonymous'}</strong> {suggestion.submitter_contact && `(${suggestion.submitter_contact})`}</span>
                    </div>
                    <span>•</span>
                    <span>{new Date(suggestion.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
                
                {suggestion.status === 'PENDING' && (
                  <div className="flex flex-row sm:flex-col gap-2 justify-center sm:border-l sm:border-zinc-100 sm:pl-5 shrink-0">
                    <button 
                      onClick={() => handleAction(suggestion.id, 'approve')}
                      disabled={isProcessing}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 px-4 py-2 rounded-lg text-xs font-semibold transition-colors shadow-xs disabled:opacity-50"
                    >
                      {isProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />} Approve
                    </button>
                    <button 
                      onClick={() => handleAction(suggestion.id, 'reject')}
                      disabled={isProcessing}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-white text-rose-600 border border-rose-200 hover:bg-rose-50 px-4 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
