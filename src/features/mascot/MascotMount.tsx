import type { ReactNode } from "react";

import { getMascotFeatureConfig } from "./core/config";
import type { MascotHostContext } from "./core/types";
import { BlogMascotHost } from "./host/blog-adapter";

export function MascotMount({
  hostContext,
  renderer,
}: {
  hostContext: MascotHostContext;
  renderer?: ReactNode;
}) {
  const features = getMascotFeatureConfig();
  if (!features.enabled) return null;

  return (
    <>
      {features.live2dEnabled ? renderer : null}
      <BlogMascotHost hostContext={hostContext} features={features} />
    </>
  );
}
