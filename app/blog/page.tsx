import type { Metadata } from "next";
import Link from "next/link";
import { Clock, ArrowRight } from "lucide-react";
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

const CATEGORY_COLORS: Record<string, string> = {
  Guides: "bg-blue-50 text-blue-700",
  Explained: "bg-violet-50 text-violet-700",
  Downloaders: "bg-pink-50 text-pink-700",
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

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
      </div>
    </div>
  );
}
