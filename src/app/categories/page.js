import { redirect } from "next/navigation";

export default async function CategoriesPage({ searchParams }) {
  const params = await searchParams;
  const filter = typeof params?.filter === "string" ? params.filter : "";
  const query = filter
    ? `/projects?category=${encodeURIComponent(filter)}`
    : "/projects";

  redirect(query);
}
