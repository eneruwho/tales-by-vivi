import { getProjects } from "../actions";
import CategoriesClient from "./CategoriesClient";

export const dynamic = "force-dynamic";

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

  // Build representative image per category from projects (prefer previewImageUrl)
  const categoryImages = Object.keys(categories).reduce((acc, cat) => {
    const p = projects.find((proj) => {
      const cats = Array.isArray(proj.categories)
        ? proj.categories
        : proj.category
          ? String(proj.category)
              .split(",")
              .map((s) => s.trim())
          : [];
      return cats.includes(cat) && (proj.previewImageUrl || proj.imageUrl);
    });
    if (p) acc[cat] = p.previewImageUrl || p.imageUrl;
    return acc;
  }, {});

  return (
    <CategoriesClient categories={categories} categoryImages={categoryImages} />
  );
}
