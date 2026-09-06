import { cache } from "react";
import { getProjectBySlug } from "../../actions";

export const getProjectForSlug = cache(async (slug) => getProjectBySlug(slug));
