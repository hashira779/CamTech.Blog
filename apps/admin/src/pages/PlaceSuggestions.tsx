import { useState, useEffect } from 'react';
import { ShieldCheck, MapPin, CheckCircle, XCircle, Info } from 'lucide-react';
import { api } from '../lib/api';

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
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      await api.post(`/admin/place-suggestions/${id}/${action}`, { moderation_notes: '' });
      fetchSuggestions(); // Reload after action
    } catch (err) {
      console.error(`Failed to ${action} suggestion`, err);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-zinc-500" /> Place Suggestions Review Queue
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Review and approve new tourist places submitted by the community.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white rounded-lg border border-zinc-200 p-1">
          {['PENDING', 'APPROVED', 'REJECTED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                filter === status 
                  ? 'bg-zinc-900 text-white' 
                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-zinc-400">Loading suggestions...</div>
      ) : suggestions.length === 0 ? (
        <div className="bg-white rounded-xl border border-zinc-200 border-dashed p-12 text-center flex flex-col items-center">
          <MapPin className="h-12 w-12 text-zinc-300 mb-4" />
          <h3 className="text-lg font-bold text-zinc-900">No suggestions found</h3>
          <p className="text-zinc-500 text-sm mt-1">There are no {filter.toLowerCase()} place suggestions right now.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {suggestions.map((suggestion) => (
            <div key={suggestion.id} className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm flex flex-col sm:flex-row gap-5">
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                        {suggestion.suggestion_type.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 bg-zinc-50 px-2 py-0.5 rounded border border-zinc-200">
                        {suggestion.destination_slug}
                      </span>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        {suggestion.place_type}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-zinc-900 mt-1">{suggestion.place_name}</h2>
                  </div>
                </div>
                
                <div className="text-sm text-zinc-600 bg-zinc-50 p-3 rounded-lg border border-zinc-100 whitespace-pre-wrap">
                  {suggestion.details}
                </div>
                
                <div className="flex items-center gap-4 text-xs text-zinc-500">
                  <div className="flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" /> 
                    Submitted by: <strong>{suggestion.submitter_name || 'Anonymous'}</strong> {suggestion.submitter_contact && `(${suggestion.submitter_contact})`}
                  </div>
                  <span>•</span>
                  <span>{new Date(suggestion.created_at).toLocaleString()}</span>
                </div>
              </div>
              
              {suggestion.status === 'PENDING' && (
                <div className="flex flex-row sm:flex-col gap-2 justify-start sm:border-l sm:border-zinc-100 sm:pl-5 shrink-0">
                  <button 
                    onClick={() => handleAction(suggestion.id, 'approve')}
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve
                  </button>
                  <button 
                    onClick={() => handleAction(suggestion.id, 'reject')}
                    className="flex-1 flex items-center justify-center gap-2 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
