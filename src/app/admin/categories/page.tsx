import { AdminResourcePage } from "@/modules/admin/admin-resource-page";
import { listAllCategories, listAllTags } from "@/services/admin-service";

const columns = [
  { key: "_type", label: "类型" },
  { key: "name", label: "名称" },
  { key: "slug", label: "Slug" },
  { key: "count", label: "关联数" },
];

export default async function AdminCategoriesPage() {
  const [categories, tags] = await Promise.all([listAllCategories(), listAllTags()]);

  const categoryRows = categories.map((category) => ({
    id: String(category.id),
    values: {
      _type: "分类",
      name: category.name,
      slug: category.slug,
      count: String(category._count.posts),
    },
  }));

  const tagRows = tags.map((tag) => ({
    id: String(tag.id),
    values: {
      _type: "标签",
      name: tag.name,
      slug: tag.slug,
      count: String(tag._count.postTags),
    },
  }));

  return (
    <AdminResourcePage
      title="分类与标签管理"
      description="管理博客的分类体系和标签体系。分类偏栏目组织，标签偏主题索引。"
      columns={columns}
      rows={[...categoryRows, ...tagRows]}
      placeholderNote="支持新增、编辑、删除操作。删除前会检查是否有关联文章。"
      createLabel="新建分类/标签"
    />
  );
}
