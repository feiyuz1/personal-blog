export interface NavItem {
  label: string;
  href: string;
  description?: string;
}

export interface SiteStat {
  label: string;
  value: string;
  hint?: string;
}

export interface CategorySummary {
  name: string;
  slug: string;
  description: string;
  count: number;
}

export interface TagSummary {
  name: string;
  slug: string;
  count: number;
}

export interface PostSummary {
  id: string;
  title: string;
  slug: string;
  summary: string;
  publishedAt: string;
  readingTime: string;
  category: Pick<CategorySummary, "name" | "slug">;
  tags: Pick<TagSummary, "name" | "slug">[];
  featured?: boolean;
}

export interface PostSection {
  title: string;
  body: string[];
  kind?: "text" | "quote" | "code";
  code?: string;
}

export interface PostDetail extends PostSummary {
  content: string;
  toc: string[];
  sections: PostSection[];
  previousPostSlug?: string;
  nextPostSlug?: string;
}

export interface ArchiveGroup {
  year: string;
  items: {
    month: string;
    posts: Pick<PostSummary, "title" | "slug" | "publishedAt">[];
  }[];
}

export interface ProjectSummary {
  id: string;
  name: string;
  slug: string;
  summary: string;
  /** 项目卡片顶部使用的图片或视频地址。 */
  coverUrl?: string;
  techStack: string[];
  status: "planning" | "building" | "online";
  role: string;
  articleSlug?: string;
}

export interface ProjectDetail extends ProjectSummary {
  highlights: string[];
  milestones: string[];
  repositoryUrl?: string;
  previewUrl?: string;
}

export interface AboutSection {
  title: string;
  items: string[];
}

export interface ContactChannel {
  label: string;
  value: string;
  href?: string;
  note?: string;
}

export interface ProfileInfo {
  name: string;
  title: string;
  avatar: string;
  bio: string;
  location: string;
  experience: string;
  education: string;
}

export interface TechStackCategory {
  category: string;
  items: string[];
}

export interface TimelineItem {
  period: string;
  title: string;
  description: string;
  tag?: string;
}

export interface DashboardMetric {
  label: string;
  value: string;
  trend?: string;
}

export interface AdminQuickAction {
  label: string;
  href: string;
  description: string;
}

export interface CommentReviewItem {
  id: string;
  postTitle: string;
  author: string;
  excerpt: string;
  status: "pending" | "approved" | "rejected";
}

export interface AdminOverview {
  metrics: DashboardMetric[];
  draftPosts: Pick<PostSummary, "title" | "slug" | "summary">[];
  commentQueue: CommentReviewItem[];
  quickActions: AdminQuickAction[];
}

export interface SiteConfig {
  title: string;
  subtitle: string;
  description: string;
  heroLabel: string;
  navItems: NavItem[];
  footerLinks: NavItem[];
  stats: SiteStat[];
}
