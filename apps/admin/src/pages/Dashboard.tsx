import { useState } from 'react';
import { 
  FileText, 
  Eye, 
  Clock, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  Download, 
  CheckCircle2, 
  Server, 
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | '90D'>('30D');

  const stats = [
    { 
      label: 'Published Articles', 
      value: '1,248', 
      change: '+12.4%', 
      isPositive: true, 
      subtext: 'vs last month',
      icon: FileText 
    },
    { 
      label: 'Total Impressions', 
      value: '842,500', 
      change: '+24.1%', 
      isPositive: true, 
      subtext: 'vs last month',
      icon: Eye 
    },
    { 
      label: 'Avg. Reader Engagement', 
      value: '4m 32s', 
      change: '+3.2%', 
      isPositive: true, 
      subtext: 'completion 68%',
      icon: Clock 
    },
    { 
      label: 'AdSense Est. Earnings', 
      value: '$1,842.50', 
      change: '+18.7%', 
      isPositive: true, 
      subtext: 'RPM $2.18',
      icon: DollarSign 
    },
  ];

  const recentArticles = [
    { 
      id: 'art-001', 
      title: 'Cambodia Tech Ecosystem Report 2026: Investment Surges', 
      category: 'Tech & Economy', 
      author: 'Sokha Rith', 
      views: '14,280', 
      status: 'Published', 
      time: '24m ago',
      slug: 'cambodia-tech-ecosystem-2026'
    },
    { 
      id: 'art-002', 
      title: 'Top 10 Hidden Cultural Temples in Siem Reap Beyond Angkor Wat', 
      category: 'Travel & Culture', 
      author: 'Mony Panha', 
      views: '8,420', 
      status: 'Published', 
      time: '2h ago',
      slug: 'top-10-hidden-cultural-temples'
    },
    { 
      id: 'art-003', 
      title: 'National High-Speed Rail Feasibility Study Approved', 
      category: 'Infrastructure', 
      author: 'Chea Vichea', 
      views: '6,104', 
      status: 'Published', 
      time: '5h ago',
      slug: 'high-speed-rail-feasibility'
    },
    { 
      id: 'art-004', 
      title: 'AI Editorial Guidelines & Fact-Checking Protocol Review', 
      category: 'Standards', 
      author: 'Editorial Desk', 
      views: '-', 
      status: 'In Review', 
      time: '1d ago',
      slug: 'ai-editorial-guidelines'
    },
    { 
      id: 'art-005', 
      title: 'Exploring Phnom Penh Modern Culinary Renaissance', 
      category: 'Lifestyle', 
      author: 'Sokha Rith', 
      views: '-', 
      status: 'Draft', 
      time: '2d ago',
      slug: 'phnom-penh-culinary-renaissance'
    },
  ];

  const services = [
    { name: 'PostgreSQL DB', status: 'Optimal', latency: '1.4ms', dot: 'bg-emerald-400' },
    { name: 'Redis Cache', status: '94.8% Hit', latency: '0.6ms', dot: 'bg-emerald-400' },
    { name: 'Cloudflare Tunnel', status: 'Routes Active', latency: 'Edge', dot: 'bg-emerald-400' },
    { name: 'MinIO Media S3', status: '14.8 GB Used', latency: 'Healthy', dot: 'bg-emerald-400' },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800/80">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">Overview</h1>
          <p className="text-xs text-zinc-400 mt-1">Editorial metrics, reader traffic, and system operations.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Time range selector */}
          <div className="flex items-center p-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[11px] font-mono">
            {(['7D', '30D', '90D'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  timeRange === range
                    ? 'bg-zinc-800 text-zinc-100 font-medium'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md transition-colors">
            <Download size={13} className="text-zinc-400" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div 
              key={stat.label} 
              className="p-4 rounded-lg bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700/80 transition-all duration-150"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">{stat.label}</span>
                <Icon size={14} className="text-zinc-500" />
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-semibold text-zinc-100 font-mono tracking-tight">
                  {stat.value}
                </span>
                <span className={`inline-flex items-center gap-0.5 text-[11px] font-mono font-medium ${
                  stat.isPositive ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {stat.isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {stat.change}
                </span>
              </div>
              <div className="mt-1 text-[11px] text-zinc-500">
                {stat.subtext}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Charts & Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Interactive Traffic Area Chart (2 cols) */}
        <div className="lg:col-span-2 p-5 rounded-lg bg-zinc-900/40 border border-zinc-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-200">Daily Readership & Pageviews</h2>
              <p className="text-[11px] text-zinc-500">Aggregated organic and direct reader traffic</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-zinc-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Current Period
              </span>
              <span className="flex items-center gap-1.5 text-zinc-500">
                <span className="w-2 h-2 rounded-full bg-zinc-600"></span> Previous Period
              </span>
            </div>
          </div>

          {/* SVG Area Chart */}
          <div className="relative h-60 w-full pt-4">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 600 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="40" x2="600" y2="40" stroke="#27272a" strokeDasharray="3 3" strokeWidth="1" />
              <line x1="0" y1="90" x2="600" y2="90" stroke="#27272a" strokeDasharray="3 3" strokeWidth="1" />
              <line x1="0" y1="140" x2="600" y2="140" stroke="#27272a" strokeDasharray="3 3" strokeWidth="1" />
              <line x1="0" y1="190" x2="600" y2="190" stroke="#27272a" strokeWidth="1" />

              {/* Previous Period Line (Muted Zinc) */}
              <path
                d="M 0,160 Q 60,150 120,130 T 240,110 T 360,95 T 480,120 T 600,80"
                fill="none"
                stroke="#52525b"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />

              {/* Current Period Area */}
              <path
                d="M 0,140 Q 60,120 120,80 T 240,90 T 360,40 T 480,60 T 600,25 L 600,190 L 0,190 Z"
                fill="url(#chartGradient)"
              />

              {/* Current Period Stroke */}
              <path
                d="M 0,140 Q 60,120 120,80 T 240,90 T 360,40 T 480,60 T 600,25"
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
              />

              {/* Active Highlight Points */}
              <circle cx="360" cy="40" r="4" fill="#10b981" stroke="#09090b" strokeWidth="2" />
              <circle cx="600" cy="25" r="4" fill="#10b981" stroke="#09090b" strokeWidth="2" />
            </svg>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 pt-2 border-t border-zinc-800/60">
            <span>Sep 04</span>
            <span>Sep 11</span>
            <span>Sep 18</span>
            <span>Sep 25</span>
            <span>Oct 03 (Today)</span>
          </div>
        </div>

        {/* Right: Infrastructure & Cluster Health (1 col) */}
        <div className="p-5 rounded-lg bg-zinc-900/40 border border-zinc-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-200">System Infrastructure</h2>
              <Server size={14} className="text-zinc-500" />
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Ubuntu host & container cluster status</p>

            <div className="mt-5 space-y-3">
              {services.map((svc) => (
                <div 
                  key={svc.name}
                  className="p-2.5 rounded-md bg-zinc-950/60 border border-zinc-800/80 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${svc.dot}`}></span>
                    <span className="text-xs font-medium text-zinc-200">{svc.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-mono">
                    <span className="text-zinc-400">{svc.status}</span>
                    <span className="text-zinc-600">·</span>
                    <span className="text-zinc-500">{svc.latency}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-6 border-t border-zinc-800/60 flex items-center justify-between text-xs">
            <span className="text-zinc-500 flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-emerald-400" /> All Services Operational
            </span>
            <a 
              href="https://cms.camtech.cam" 
              className="text-zinc-400 hover:text-zinc-200 font-mono text-[11px]"
            >
              10.1.0.11:3001
            </a>
          </div>
        </div>
      </div>

      {/* Editorial Content Queue Table */}
      <div className="rounded-lg bg-zinc-900/40 border border-zinc-800/80 overflow-hidden">
        <div className="p-4 px-5 border-b border-zinc-800/80 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-200">Recent Editorial Activity</h2>
            <p className="text-[11px] text-zinc-500">Live article pipeline and status</p>
          </div>
          <Link 
            to="/articles"
            className="text-xs text-zinc-400 hover:text-zinc-100 flex items-center gap-1 transition-colors"
          >
            <span>View All Articles</span>
            <ArrowUpRight size={13} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-800/80 bg-zinc-950/40 text-zinc-400 font-mono text-[10px] uppercase tracking-wider">
                <th className="py-3 px-5 font-medium">Article Title</th>
                <th className="py-3 px-4 font-medium">Category</th>
                <th className="py-3 px-4 font-medium">Author</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium text-right">Views</th>
                <th className="py-3 px-5 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-sans">
              {recentArticles.map((article) => (
                <tr key={article.id} className="hover:bg-zinc-800/30 transition-colors group">
                  <td className="py-3.5 px-5">
                    <span className="font-medium text-zinc-200 line-clamp-1 group-hover:text-white transition-colors">
                      {article.title}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">
                      /{article.slug}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-zinc-400 font-mono text-[11px]">
                    {article.category}
                  </td>
                  <td className="py-3.5 px-4 text-zinc-300">
                    {article.author}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      article.status === 'Published'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : article.status === 'In Review'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}>
                      <span className={`w-1 h-1 rounded-full ${
                        article.status === 'Published' ? 'bg-emerald-400' : article.status === 'In Review' ? 'bg-amber-400' : 'bg-zinc-500'
                      }`} />
                      {article.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-zinc-300">
                    {article.views}
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <a
                      href={`https://blog.camtech.cam/world/news/${article.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-zinc-500 hover:text-zinc-300 inline-flex items-center gap-1 rounded hover:bg-zinc-800 transition-colors"
                      title="Preview on live site"
                    >
                      <ExternalLink size={13} />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
