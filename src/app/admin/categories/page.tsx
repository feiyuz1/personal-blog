import { requireAdmin } from "@/lib/auth/session";
import { listAllCategories, listAllTags } from "@/services/admin-service";
import { AdminCategoriesPage as AdminCategoriesClient } from "@/modules/admin/admin-categories-page";

/**
 * 分类与标签管理页（服务端组件）。
 * 服务端预取分类与标签列表传入客户端组件；
 * 新增/编辑/删除由客户端组件请求 API 完成后自行刷新列表。
 */
export default async function AdminCategoriesRoute() {
  await requireAdmin();

  const [categories, tags] = await Promise.all([listAllCategories(), listAllTags()]);

  // 映射为客户端组件所需行结构
  const categoryRows = categories.map((category) => ({
    id: String(category.id),
    values: {
      name: category.name,
      slug: category.slug,
      description: category.description ?? "",
      count: String(category._count.posts),
    },
  }));

  const tagRows = tags.map((tag) => ({
    id: String(tag.id),
    values: {
      name: tag.name,
      slug: tag.slug,
      count: String(tag._count.postTags),
    },
  }));

  return (
    <AdminCategoriesClient
      initialCategories={categoryRows}
      initialTags={tagRows}
    />
  );
}
