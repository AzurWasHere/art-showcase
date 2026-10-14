import { SiteHeader } from "@/components/site/site-header";

/** Full-screen pages: header only, no footer. */
export default function ImmersiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
    </>
  );
}
