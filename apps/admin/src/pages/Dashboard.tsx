import { TrendingUp, Users, FileText, Eye, ArrowUpRight } from 'lucide-react';

export default function Dashboard() {
  const stats = [
    { name: 'Total Articles', value: '1,248', change: '+12%', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { name: 'Total Views', value: '842.5K', change: '+24%', icon: Eye, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { name: 'Active Users', value: '12,492', change: '+4.5%', icon: Users, color: 'text-violet-500', bg: 'bg-violet-500/10' },
    { name: 'Avg. Engagement', value: '4m 32s', change: '+1.2%', icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
        <p className="text-slate-500 mt-1">Here is what's happening on Daily Discovery today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="flex items-center gap-1 text-emerald-600 text-sm font-semibold bg-emerald-50 px-2.5 py-1 rounded-full">
                  <ArrowUpRight className="w-4 h-4" />
                  {stat.change}
                </div>
              </div>
              <div className="mt-6">
                <h3 className="text-slate-500 text-sm font-medium">{stat.name}</h3>
                <p className="text-3xl font-black text-slate-900 mt-1">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity & Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4 mb-4">Traffic Overview</h2>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-100 rounded-xl bg-slate-50">
            <p className="text-slate-400 font-medium">Chart visualization will appear here</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4 mb-4">Recent Publishing</h2>
          <div className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 line-clamp-1">New Technology Advances in AI for 2026</h4>
                  <p className="text-xs text-slate-500 mt-1">Published 2 hours ago by Editor</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
