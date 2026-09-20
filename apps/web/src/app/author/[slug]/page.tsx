import { notFound } from "next/navigation";
import Link from "next/link";
import { User, Mail, Award, BookOpen, ExternalLink, ChevronRight } from "lucide-react";
import { getAuthorBySlug, getArticles } from "@/lib/api";
import { NewsCard } from "@/components/news/NewsCard";

export const revalidate = 60;

export default async function AuthorProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const author = await getAuthorBySlug(slug);

  if (!author) {
    notFound();
  }

  const { items: articles } = await getArticles({ author: slug, limit: 20 });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Link href="/" className="hover:text-slate-900 dark:hover:text-slate-100">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 dark:text-slate-100 font-semibold">Authors</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-emerald-600 dark:text-emerald-400 font-bold">{author.name}</span>
      </nav>

      {/* Author Bio Card */}
      <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-6 items-start">
        <div className="w-24 h-24 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-800 dark:text-emerald-300 font-black text-3xl shrink-0">
          {author.avatar_url ? (
            <img src={author.avatar_url} alt={author.name} className="w-full h-full object-cover rounded-2xl" />
          ) : (
            author.name.charAt(0)
          )}
        </div>

        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {author.name}
            </h1>
            <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-full">
              {author.role}
            </span>
          </div>

          {author.expertise && (
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>Specialties: {author.expertise}</span>
            </div>
          )}

          <p className="text-sm text-slate-700 dark:text-slate-300 max-w-3xl leading-relaxed">
            {author.bio || "Staff journalist and researcher at Daily Discovery newsroom focusing on verified regional developments, economy, and technological advancements."}
          </p>

          <div className="pt-2 flex flex-wrap gap-4 text-xs font-medium text-slate-500">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-slate-400" />
              {articles.length} Published Stories
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              Verified Editorial Staff
            </span>
          </div>
        </div>
      </div>

      {/* Articles by Author */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Articles & Coverage by {author.name}
        </h2>
        {articles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <p className="text-sm text-slate-500 font-medium">
              No published articles found for this author yet.
            </p>
          </div>
        )}
      </div>

      {/* JSON-LD Person Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name: author.name,
            jobTitle: author.role,
            description: author.bio,
            knowsAbout: author.expertise,
          }),
        }}
      />
    </div>
  );
}
