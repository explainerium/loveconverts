import type { Metadata } from "next";
import Link from "next/link";
import { Clock, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { getAllPosts } from "@/lib/blog-data";

export const metadata: Metadata = {
  title: { absolute: "Free Image Conversion Tips, Guides & Tutorials | LoveConverts Blog" },
  description:
    "Practical guides on image conversion, compression, cropping, and video downloading. Written by the team at LoveConverts.",
  alternates: { canonical: "https://loveconverts.com/blog" },
  openGraph: {
    title: "Free Image Conversion Tips, Guides & Tutorials",
    description:
      "Practical guides on image conversion, compression, cropping, and video downloading.",
    url: "https://loveconverts.com/blog",
  },
};

const PER_PAGE = 12;

const CATEGORY_COLORS: Record<string, string> = {
  Guides: "bg-blue-50 text-blue-700",
  Explained: "bg-violet-50 text-violet-700",
  Downloaders: "bg-pink-50 text-pink-700",
};

function parseDate(d: string): number {
  return new Date(d).getTime() || 0;
}

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageStr } = await searchParams;

  // Sort newest first
  const allPosts = getAllPosts().sort(
    (a, b) => parseDate(b.publishDate) - parseDate(a.publishDate)
  );
  const totalPosts = allPosts.length;
  const totalPages = Math.ceil(totalPosts / PER_PAGE);
  const currentPage = Math.max(1, Math.min(totalPages, parseInt(pageStr || "1") || 1));
  const start = (currentPage - 1) * PER_PAGE;
  const posts = allPosts.slice(start, start + PER_PAGE);
  const showingFrom = start + 1;
  const showingTo = Math.min(start + PER_PAGE, totalPosts);

  // Page numbers to show: current +/- 2
  const pageNumbers: number[] = [];
  for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-5xl mx-auto px-4 space-y-10">
        {/* Hero */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-extrabold text-foreground">Blog</h1>
          <p className="text-muted max-w-lg mx-auto">
            Practical guides on image formats, compression, resizing, and
            downloading. No fluff, just useful information.
          </p>
        </div>

        {/* Post grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all"
            >
              {/* Featured image */}
              <div className="aspect-[1200/630] bg-gray-100 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.featuredImage}
                  alt={post.h1}
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                />
              </div>

              <div className="p-5 space-y-3">
                {/* Category badge */}
                <span
                  className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    CATEGORY_COLORS[post.category] || "bg-gray-100 text-gray-600"
                  }`}
                >
                  {post.category}
                </span>

                {/* Title */}
                <h2 className="font-bold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
                  {post.h1}
                </h2>

                {/* Excerpt */}
                <p className="text-sm text-muted line-clamp-2 leading-relaxed">
                  {post.excerpt}
                </p>

                {/* Meta */}
                <div className="flex items-center justify-between pt-1">
                  <span className="flex items-center gap-1 text-xs text-muted">
                    <Clock size={12} /> {post.readTime}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-primary group-hover:gap-2 transition-all">
                    Read article <ArrowRight size={12} />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="space-y-4">
            <p className="text-center text-sm text-muted">
              Showing {showingFrom}-{showingTo} of {totalPosts} posts
            </p>

            <nav className="flex items-center justify-center gap-1.5">
              {/* Previous */}
              {currentPage > 1 ? (
                <Link
                  href={currentPage === 2 ? "/blog" : `/blog?page=${currentPage - 1}`}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-semibold text-muted border border-border rounded-lg hover:border-primary/40 hover:text-primary transition-all"
                >
                  <ChevronLeft size={14} /> Previous
                </Link>
              ) : (
                <span className="flex items-center gap-1 px-3 py-2 text-sm font-semibold text-muted/40 border border-border/40 rounded-lg cursor-not-allowed">
                  <ChevronLeft size={14} /> Previous
                </span>
              )}

              {/* Page 1 + ellipsis if needed */}
              {pageNumbers[0] > 1 && (
                <>
                  <Link
                    href="/blog"
                    className="w-9 h-9 flex items-center justify-center text-sm font-semibold rounded-lg border border-border text-muted hover:border-primary/40 hover:text-primary transition-all"
                  >
                    1
                  </Link>
                  {pageNumbers[0] > 2 && (
                    <span className="w-9 h-9 flex items-center justify-center text-sm text-muted">...</span>
                  )}
                </>
              )}

              {/* Page numbers */}
              {pageNumbers.map((n) => (
                <Link
                  key={n}
                  href={n === 1 ? "/blog" : `/blog?page=${n}`}
                  className={`w-9 h-9 flex items-center justify-center text-sm font-semibold rounded-lg border transition-all ${
                    n === currentPage
                      ? "bg-primary text-white border-primary"
                      : "border-border text-muted hover:border-primary/40 hover:text-primary"
                  }`}
                >
                  {n}
                </Link>
              ))}

              {/* Ellipsis + last page if needed */}
              {pageNumbers[pageNumbers.length - 1] < totalPages && (
                <>
                  {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                    <span className="w-9 h-9 flex items-center justify-center text-sm text-muted">...</span>
                  )}
                  <Link
                    href={`/blog?page=${totalPages}`}
                    className="w-9 h-9 flex items-center justify-center text-sm font-semibold rounded-lg border border-border text-muted hover:border-primary/40 hover:text-primary transition-all"
                  >
                    {totalPages}
                  </Link>
                </>
              )}

              {/* Next */}
              {currentPage < totalPages ? (
                <Link
                  href={`/blog?page=${currentPage + 1}`}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-semibold text-muted border border-border rounded-lg hover:border-primary/40 hover:text-primary transition-all"
                >
                  Next <ChevronRight size={14} />
                </Link>
              ) : (
                <span className="flex items-center gap-1 px-3 py-2 text-sm font-semibold text-muted/40 border border-border/40 rounded-lg cursor-not-allowed">
                  Next <ChevronRight size={14} />
                </span>
              )}
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}
