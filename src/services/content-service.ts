import { PostStatus, Prisma, ProjectStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type {
  AboutSection,
  ArchiveGroup,
  CategorySummary,
  ContactChannel,
  PostDetail,
  PostSummary,
  ProjectDetail,
  ProfileInfo,
  SiteConfig,
  TagSummary,
  TechStackCategory,
  TimelineItem,
} from "@/types/content";

const CONTENT_BLOCK_KEYS = {
  siteConfig: "site-config",
  aboutSections: "about-sections",
  contactChannels: "contact-channels",
  profileInfo: "profile-info",
  techStacks: "tech-stacks",
  timeline: "timeline",
} as const;

type ContentBlockKey = (typeof CONTENT_BLOCK_KEYS)[keyof typeof CONTENT_BLOCK_KEYS];

type ContentBlockMap = {
  [CONTENT_BLOCK_KEYS.siteConfig]: SiteConfig;
  [CONTENT_BLOCK_KEYS.aboutSections]: AboutSection[];
  [CONTENT_BLOCK_KEYS.contactChannels]: ContactChannel[];
  [CONTENT_BLOCK_KEYS.profileInfo]: ProfileInfo;
  [CONTENT_BLOCK_KEYS.techStacks]: TechStackCategory[];
  [CONTENT_BLOCK_KEYS.timeline]: TimelineItem[];
};

type PostWithRelations = Prisma.PostGetPayload<{
  include: {
    category: true;
    postTags: {
      include: {
        tag: true;
      };
    };
  };
}>;

type ProjectRow = {
  id: bigint;
  name: string;
  slug: string;
  summary: string | null;
  techStack: string | null;
  status: ProjectStatus;
  role: string | null;
  highlights: Prisma.JsonValue | null;
  milestones: Prisma.JsonValue | null;
  articleSlug: string | null;
  githubUrl: string | null;
  projectUrl: string | null;
};

async function loadContentBlock<K extends ContentBlockKey>(key: K): Promise<ContentBlockMap[K] | null> {
  const block = await prisma.contentBlock.findUnique({ where: { key } });

  if (!block) {
    return null;
  }

  return block.data as unknown as ContentBlockMap[K];
}

function toPostSummary(post: PostWithRelations): PostSummary {
  return {
    id: String(post.id),
    title: post.title,
    slug: post.slug,
    summary: post.summary ?? "",
    publishedAt: formatDate(post.publishedAt ?? post.createdAt),
    readingTime: post.readingTime ?? "5 min",
    category: post.category
      ? { name: post.category.name, slug: post.category.slug }
      : { name: "未分类", slug: "uncategorized" },
    tags: post.postTags.map((entry) => ({
      name: entry.tag.name,
      slug: entry.tag.slug,
    })),
    featured: post.isTop,
  };
}

function parseContentToSections(content: string): PostDetail["sections"] {
  const lines = content.split("\n");
  const sections: PostDetail["sections"] = [];
  let currentTitle = "正文";
  let currentBody: string[] = [];

  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (currentBody.some((item) => item.trim())) {
        sections.push({ title: currentTitle, body: currentBody });
      }
      currentTitle = line.replace("## ", "").trim();
      currentBody = [];
      continue;
    }

    const cleaned = line.replace(/^```[\w]*\s*$/, "").replace(/^>\s*/, "");
    if (cleaned) currentBody.push(cleaned);
  }

  if (currentBody.some((item) => item.trim())) {
    sections.push({ title: currentTitle, body: currentBody });
  }

  if (sections.length === 0 && content.trim()) {
    sections.push({ title: "正文", body: [content] });
  }

  return sections.length > 0 ? sections : [{ title: "正文", body: ["(暂无内容)"] }];
}

function extractToc(content: string): string[] {
  const matches = content.match(/^## .+$/gm);
  if (!matches) return [];
  return matches.map((match) => match.replace("## ", "").trim());
}

function toStringArray(value: Prisma.JsonValue | null | undefined): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function toProjectDetail(project: ProjectRow): ProjectDetail {
  const statusMap: Record<ProjectStatus, ProjectDetail["status"]> = {
    PLANNING: "planning",
    BUILDING: "building",
    ONLINE: "online",
  };

  return {
    id: String(project.id),
    name: project.name,
    slug: project.slug,
    summary: project.summary ?? "",
    techStack: project.techStack ? JSON.parse(project.techStack) : [],
    status: statusMap[project.status],
    role: project.role ?? "",
    articleSlug: project.articleSlug ?? undefined,
    highlights: toStringArray(project.highlights),
    milestones: toStringArray(project.milestones),
    repositoryUrl: project.githubUrl ?? undefined,
    previewUrl: project.projectUrl ?? undefined,
  };
}

const DEFAULT_SITE_CONFIG: SiteConfig = {
  title: "",
  subtitle: "",
  description: "",
  heroLabel: "",
  navItems: [],
  footerLinks: [],
  stats: [],
};

const DEFAULT_PROFILE_INFO: ProfileInfo = {
  name: "",
  title: "",
  avatar: "",
  bio: "",
  location: "",
  experience: "",
  education: "",
};

export async function getSiteConfig(): Promise<SiteConfig> {
  return (await loadContentBlock(CONTENT_BLOCK_KEYS.siteConfig)) ?? DEFAULT_SITE_CONFIG;
}

export async function listFeaturedPosts(): Promise<PostSummary[]> {
  const posts = await prisma.post.findMany({
    where: { status: PostStatus.PUBLISHED, isTop: true },
    orderBy: { publishedAt: "desc" },
    include: {
      category: true,
      postTags: { include: { tag: true } },
    },
  });

  return posts.map(toPostSummary);
}

export async function listPosts(): Promise<PostSummary[]> {
  const posts = await prisma.post.findMany({
    where: { status: PostStatus.PUBLISHED },
    orderBy: { publishedAt: "desc" },
    include: {
      category: true,
      postTags: { include: { tag: true } },
    },
  });

  return posts.map(toPostSummary);
}

export async function getPostBySlug(slug: string): Promise<PostDetail | null> {
  const post = await prisma.post.findUnique({
    where: { slug },
    include: {
      category: true,
      author: true,
      postTags: { include: { tag: true } },
    },
  });

  if (!post || post.status !== PostStatus.PUBLISHED) return null;

  const pubAt = post.publishedAt;
  if (!pubAt) return null;

  const previousPosts = await prisma.post.findMany({
    where: {
      status: PostStatus.PUBLISHED,
      publishedAt: { lt: pubAt },
    },
    orderBy: { publishedAt: "desc" },
    take: 1,
    select: { slug: true },
  });

  const nextPosts = await prisma.post.findMany({
    where: {
      status: PostStatus.PUBLISHED,
      publishedAt: { gt: pubAt },
    },
    orderBy: { publishedAt: "asc" },
    take: 1,
    select: { slug: true },
  });

  const summary = toPostSummary(post);

  return {
    ...summary,
    toc: extractToc(post.content),
    sections: parseContentToSections(post.content),
    previousPostSlug: previousPosts[0]?.slug ?? undefined,
    nextPostSlug: nextPosts[0]?.slug ?? undefined,
  };
}

export async function listCategories(): Promise<CategorySummary[]> {
  const categories = await prisma.category.findMany({
    include: {
      _count: { select: { posts: { where: { status: PostStatus.PUBLISHED } } } },
    },
    orderBy: { name: "asc" },
  });

  return categories.map((category) => ({
    name: category.name,
    slug: category.slug,
    description: category.description ?? "",
    count: category._count.posts,
  }));
}

export async function getCategoryBySlug(slug: string): Promise<CategorySummary | null> {
  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      _count: { select: { posts: { where: { status: PostStatus.PUBLISHED } } } },
    },
  });

  if (!category) return null;

  return {
    name: category.name,
    slug: category.slug,
    description: category.description ?? "",
    count: category._count.posts,
  };
}

export async function listPostsByCategory(categorySlug: string): Promise<PostSummary[]> {
  const posts = await prisma.post.findMany({
    where: {
      status: PostStatus.PUBLISHED,
      category: { slug: categorySlug },
    },
    orderBy: { publishedAt: "desc" },
    include: {
      category: true,
      postTags: { include: { tag: true } },
    },
  });

  return posts.map(toPostSummary);
}

export async function listTags(): Promise<TagSummary[]> {
  const tags = await prisma.tag.findMany({
    include: {
      _count: {
        select: {
          postTags: { where: { post: { status: PostStatus.PUBLISHED } } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return tags.map((tag) => ({
    name: tag.name,
    slug: tag.slug,
    count: tag._count.postTags,
  }));
}

export async function getTagBySlug(slug: string): Promise<TagSummary | null> {
  const tag = await prisma.tag.findUnique({
    where: { slug },
    include: {
      _count: {
        select: {
          postTags: { where: { post: { status: PostStatus.PUBLISHED } } },
        },
      },
    },
  });

  if (!tag) return null;

  return {
    name: tag.name,
    slug: tag.slug,
    count: tag._count.postTags,
  };
}

export async function listPostsByTag(tagSlug: string): Promise<PostSummary[]> {
  const posts = await prisma.post.findMany({
    where: {
      status: PostStatus.PUBLISHED,
      postTags: { some: { tag: { slug: tagSlug } } },
    },
    orderBy: { publishedAt: "desc" },
    include: {
      category: true,
      postTags: { include: { tag: true } },
    },
  });

  return posts.map(toPostSummary);
}

export async function searchPosts(keyword: string): Promise<PostSummary[]> {
  const normalized = keyword.trim();
  if (!normalized) return [];

  const posts = await prisma.post.findMany({
    where: {
      status: PostStatus.PUBLISHED,
      OR: [
        { title: { contains: normalized, mode: "insensitive" } },
        { summary: { contains: normalized, mode: "insensitive" } },
        { content: { contains: normalized, mode: "insensitive" } },
      ],
    },
    orderBy: { publishedAt: "desc" },
    include: {
      category: true,
      postTags: { include: { tag: true } },
    },
  });

  return posts.map(toPostSummary);
}

export async function listArchiveGroups(): Promise<ArchiveGroup[]> {
  const posts = await prisma.post.findMany({
    where: { status: PostStatus.PUBLISHED, publishedAt: { not: null } },
    orderBy: { publishedAt: "desc" },
    select: { title: true, slug: true, publishedAt: true },
  });

  const byYear = new Map<string, Map<string, Array<{ title: string; slug: string; publishedAt: string }>>>();

  for (const post of posts) {
    if (!post.publishedAt) continue;
    const publishedAt = new Date(post.publishedAt);
    const year = String(publishedAt.getFullYear());
    const month = String(publishedAt.getMonth() + 1).padStart(2, "0");

    if (!byYear.has(year)) byYear.set(year, new Map());
    const yearMap = byYear.get(year)!;
    if (!yearMap.has(month)) yearMap.set(month, []);
    yearMap.get(month)!.push({
      title: post.title,
      slug: post.slug,
      publishedAt: formatDate(publishedAt),
    });
  }

  const groups: ArchiveGroup[] = [];
  for (const [year, months] of byYear.entries()) {
    const items: ArchiveGroup["items"] = [];
    for (const [month, monthPosts] of months.entries()) {
      items.push({ month, posts: monthPosts });
    }
    groups.push({ year, items });
  }

  return groups;
}

export async function listProjects(): Promise<ProjectDetail[]> {
  const projects = await prisma.project.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return projects.map((project) =>
    toProjectDetail({
      id: project.id,
      name: project.name,
      slug: project.slug,
      summary: project.summary,
      techStack: project.techStack,
      status: project.status,
      role: project.role,
      highlights: project.highlights,
      milestones: project.milestones,
      articleSlug: project.articleSlug,
      githubUrl: project.githubUrl,
      projectUrl: project.projectUrl,
    }),
  );
}

export async function getProjectBySlug(slug: string): Promise<ProjectDetail | null> {
  const project = await prisma.project.findUnique({ where: { slug } });
  if (!project) return null;

  return toProjectDetail({
    id: project.id,
    name: project.name,
    slug: project.slug,
    summary: project.summary,
    techStack: project.techStack,
    status: project.status,
    role: project.role,
    highlights: project.highlights,
    milestones: project.milestones,
    articleSlug: project.articleSlug,
    githubUrl: project.githubUrl,
    projectUrl: project.projectUrl,
  });
}

export async function getAboutSections(): Promise<AboutSection[]> {
  return (await loadContentBlock(CONTENT_BLOCK_KEYS.aboutSections)) ?? [];
}

export async function getContactChannels(): Promise<ContactChannel[]> {
  return (await loadContentBlock(CONTENT_BLOCK_KEYS.contactChannels)) ?? [];
}

export async function getProfileInfo(): Promise<ProfileInfo> {
  return (await loadContentBlock(CONTENT_BLOCK_KEYS.profileInfo)) ?? DEFAULT_PROFILE_INFO;
}

export async function getTechStacks(): Promise<TechStackCategory[]> {
  return (await loadContentBlock(CONTENT_BLOCK_KEYS.techStacks)) ?? [];
}

export async function getTimeline(): Promise<TimelineItem[]> {
  return (await loadContentBlock(CONTENT_BLOCK_KEYS.timeline)) ?? [];
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
