import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, ChevronRight, ArrowRight } from "lucide-react";
import { getAllPosts, getPostBySlug, getRelatedPosts } from "@/lib/blog-data";
import JsonLd from "@/app/components/JsonLd";
import BlogFaqAccordion from "./BlogFaqAccordion";

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  return {
    title: post.metaTitle,
    description: post.metaDescription,
    alternates: { canonical: `https://loveconverts.com/blog/${slug}` },
    openGraph: {
      title: post.metaTitle,
      description: post.metaDescription,
      url: `https://loveconverts.com/blog/${slug}`,
      type: "article",
      images: [`https://loveconverts.com${post.featuredImage}`],
    },
  };
}

const CATEGORY_COLORS: Record<string, string> = {
  Guides: "bg-blue-50 text-blue-700",
  Explained: "bg-violet-50 text-violet-700",
  Downloaders: "bg-pink-50 text-pink-700",
};

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const related = getRelatedPosts(slug, 3);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.h1,
    datePublished: post.publishDate,
    dateModified: post.publishDate,
    author: { "@type": "Organization", name: "LoveConverts" },
    publisher: {
      "@type": "Organization",
      name: "LoveConverts",
      url: "https://loveconverts.com",
    },
    image: `https://loveconverts.com${post.featuredImage}`,
    description: post.metaDescription,
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: post.faq.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://loveconverts.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: "https://loveconverts.com/blog",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.h1,
        item: `https://loveconverts.com/blog/${slug}`,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={articleSchema} />
      <JsonLd data={faqSchema} />
      <JsonLd data={breadcrumbSchema} />

      <article className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-muted mb-6 flex-wrap">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <ChevronRight size={12} />
          <Link href="/blog" className="hover:text-primary transition-colors">
            Blog
          </Link>
          <ChevronRight size={12} />
          <span className="text-foreground font-medium truncate max-w-[200px] sm:max-w-none">
            {post.h1}
          </span>
        </nav>

        {/* Featured image */}
        <div className="rounded-2xl overflow-hidden mb-8 max-h-[420px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.featuredImage}
            alt={post.h1}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Category + Title + Meta */}
        <div className="max-w-[720px] mx-auto space-y-4 mb-10">
          <span
            className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
              CATEGORY_COLORS[post.category] || "bg-gray-100 text-gray-600"
            }`}
          >
            {post.category}
          </span>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground leading-tight">
            {post.h1}
          </h1>

          <div className="flex items-center gap-3 text-sm text-muted">
            <span>{post.publishDate}</span>
            <span className="w-1 h-1 rounded-full bg-muted" />
            <span className="flex items-center gap-1">
              <Clock size={13} /> {post.readTime}
            </span>
          </div>
        </div>

        {/* Article body */}
        <div
          className="max-w-[720px] mx-auto prose-blog"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* FAQ */}
        {post.faq.length > 0 && (
          <div className="max-w-[720px] mx-auto mt-12">
            <h2 className="text-xl font-bold text-foreground mb-6">
              Frequently Asked Questions
            </h2>
            <BlogFaqAccordion items={post.faq} />
          </div>
        )}

        {/* Related tools */}
        {post.relatedTools.length > 0 && (
          <div className="max-w-[720px] mx-auto mt-12">
            <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-4">
              Try These Tools
            </h3>
            <div className="grid sm:grid-cols-3 gap-3">
              {post.relatedTools.map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="group flex items-center justify-between px-4 py-3.5 bg-card border border-border rounded-xl hover:border-primary/30 hover:shadow-sm transition-all"
                >
                  <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {tool.label}
                  </span>
                  <ArrowRight
                    size={14}
                    className="text-muted group-hover:text-primary transition-colors"
                  />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* More articles */}
        {related.length > 0 && (
          <div className="max-w-4xl mx-auto mt-16">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-muted uppercase tracking-wider">
                More Articles
              </h3>
              <Link
                href="/blog"
                className="text-xs font-bold text-primary hover:underline"
              >
                View all &rarr;
              </Link>
            </div>
            <div className="grid sm:grid-cols-3 gap-5">
              {related.map((rp) => (
                <Link
                  key={rp.slug}
                  href={`/blog/${rp.slug}`}
                  className="group bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md hover:border-primary/30 transition-all"
                >
                  <div className="aspect-[1200/630] bg-gray-100 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={rp.featuredImage}
                      alt={rp.h1}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4 space-y-2">
                    <h4 className="font-bold text-sm text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
                      {rp.h1}
                    </h4>
                    <span className="flex items-center gap-1 text-xs text-muted">
                      <Clock size={11} /> {rp.readTime}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
