import { getProjects } from "../actions";
import CategoriesClient from "./CategoriesClient";

export default async function CategoriesPage() {
  const projects = await getProjects();

  const categoryCounts = projects.reduce((acc, p) => {
    const cats = Array.isArray(p.categories)
      ? p.categories
      : p.category
        ? String(p.category)
            .split(",")
            .map((s) => s.trim())
        : [];
    cats.forEach((c) => {
      if (!c) return;
      acc[c] = (acc[c] || 0) + 1;
    });
    return acc;
  }, {});

  const defaultCategories = {
    AI: 13,
    "Archi & Design": 12,
    Beauty: 16,
    Characters: 26,
    Luxury: 17,
    "Set Design": 13,
    Typography: 3,
  };

  const categories =
    Object.keys(categoryCounts).length > 0 ? categoryCounts : defaultCategories;

  return <CategoriesClient categories={categories} />;
}
