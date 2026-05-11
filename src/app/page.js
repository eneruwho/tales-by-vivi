import {
  getProjects,
  getArtists,
  getSiteSettings,
  getClientLogos,
} from "./actions";
import ClientPage from "./ClientPage";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [projects, artists, siteSettings, clientLogos] = await Promise.all([
    getProjects(),
    getArtists(),
    getSiteSettings(),
    getClientLogos(),
  ]);
  return (
    <ClientPage
      projects={projects}
      artists={artists}
      showreelUrl={siteSettings?.showreelUrl || null}
      showreelTitle={siteSettings?.showreelTitle || null}
      clientLogos={clientLogos}
    />
  );
}
