import {
  getProjects,
  getArtists,
  getSiteSettings,
  getClientLogos,
} from "./actions";
import ClientPage from "./ClientPage";

export const revalidate = 300;

export default async function Home() {
  try {
    const [projects, artists, siteSettings, clientLogos] = await Promise.all([
      getProjects().catch(() => []),
      getArtists().catch(() => []),
      getSiteSettings().catch(() => null),
      getClientLogos().catch(() => []),
    ]);
    return (
      <ClientPage
        projects={projects || []}
        artists={artists || []}
        showreelUrl={siteSettings?.showreelUrl || null}
        clientLogos={clientLogos || []}
      />
    );
  } catch (error) {
    console.error("Home page render error:", error);
    return (
      <ClientPage
        projects={[]}
        artists={[]}
        showreelUrl={null}
        clientLogos={[]}
      />
    );
  }
}
