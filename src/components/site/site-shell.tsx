import type { ReactNode } from "react";

import { Live2DPet } from "@/components/site/live2d-pet";
import { MascotMount } from "@/features/mascot";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import type { SiteConfig } from "@/types/content";

export function SiteShell({
  children,
  config,
}: {
  children: ReactNode;
  config: SiteConfig;
}) {
  return (
    <div className="min-h-screen">
      <SiteHeader config={config} />
      <main>{children}</main>
      <SiteFooter config={config} />
      <MascotMount
        hostContext={{
          site: {
            name: config.title,
            description: config.description,
          },
        }}
        renderer={<Live2DPet />}
      />
    </div>
  );
}
