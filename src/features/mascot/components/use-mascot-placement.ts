"use client";

import { useEffect, useState } from "react";

const VIEWPORT_MARGIN = 20;
const ANCHOR_GAP = 16;
const CHAT_WIDTH = 360;
const CHAT_MAX_HEIGHT = 500;
const TRIGGER_WIDTH = 86;
const TRIGGER_HEIGHT = 44;

type RectLike = Pick<
  DOMRect,
  "top" | "right" | "bottom" | "left" | "width" | "height"
>;

export type MascotPlacement = {
  trigger: { left: number; top: number };
  chat: { left: number; top: number };
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
}

export function calculateMascotPlacement(
  rect: RectLike,
  viewportWidth: number,
  viewportHeight: number,
): MascotPlacement {
  const leftSpace = rect.left - VIEWPORT_MARGIN - ANCHOR_GAP;
  const rightSpace = viewportWidth - VIEWPORT_MARGIN - rect.right - ANCHOR_GAP;
  const triggerOnLeft = leftSpace >= TRIGGER_WIDTH || leftSpace > rightSpace;
  const triggerLeft = triggerOnLeft
    ? rect.left - ANCHOR_GAP - TRIGGER_WIDTH
    : rect.right + ANCHOR_GAP;
  const triggerTop =
    rect.top + Math.min(72, Math.max(48, Math.round(rect.height * 0.2)));

  const chatHeight = Math.min(
    CHAT_MAX_HEIGHT,
    viewportHeight - VIEWPORT_MARGIN * 2,
  );
  const chatOnLeft = leftSpace >= CHAT_WIDTH || leftSpace > rightSpace;
  const preferredChatLeft = chatOnLeft
    ? rect.left - ANCHOR_GAP - CHAT_WIDTH
    : rect.right + ANCHOR_GAP;

  return {
    trigger: {
      left: Math.round(
        clamp(
          triggerLeft,
          VIEWPORT_MARGIN,
          viewportWidth - TRIGGER_WIDTH - VIEWPORT_MARGIN,
        ),
      ),
      top: Math.round(
        clamp(
          triggerTop,
          VIEWPORT_MARGIN,
          viewportHeight - TRIGGER_HEIGHT - VIEWPORT_MARGIN,
        ),
      ),
    },
    chat: {
      left: Math.round(
        clamp(
          preferredChatLeft,
          VIEWPORT_MARGIN,
          viewportWidth - CHAT_WIDTH - VIEWPORT_MARGIN,
        ),
      ),
      top: Math.round(
        clamp(
          rect.bottom - chatHeight,
          VIEWPORT_MARGIN,
          viewportHeight - chatHeight - VIEWPORT_MARGIN,
        ),
      ),
    },
  };
}

function samePlacement(
  current: MascotPlacement | undefined,
  next: MascotPlacement | undefined,
) {
  return (
    current?.trigger.left === next?.trigger.left &&
    current?.trigger.top === next?.trigger.top &&
    current?.chat.left === next?.chat.left &&
    current?.chat.top === next?.chat.top
  );
}

export function useMascotPlacement() {
  const [placement, setPlacement] = useState<MascotPlacement>();

  useEffect(() => {
    let anchor: HTMLElement | null = null;
    let frameId: number | undefined;

    const resizeObserver = new ResizeObserver(() => scheduleMeasure());
    const anchorObserver = new MutationObserver(() => scheduleMeasure());

    const measure = () => {
      frameId = undefined;
      if (
        !anchor?.isConnected ||
        anchor.classList.contains("waifu-hidden") ||
        window.getComputedStyle(anchor).display === "none"
      ) {
        setPlacement((current) =>
          samePlacement(current, undefined) ? current : undefined,
        );
        return;
      }

      const rect = anchor.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const next = calculateMascotPlacement(
        rect,
        window.innerWidth,
        window.innerHeight,
      );
      setPlacement((current) =>
        samePlacement(current, next) ? current : next,
      );
    };

    function scheduleMeasure() {
      if (frameId !== undefined) window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(measure);
    }

    const attachAnchor = () => {
      const next =
        document.getElementById("waifu") ??
        document.querySelector<HTMLElement>("[data-mascot-pet-anchor]");
      if (next === anchor) {
        scheduleMeasure();
        return;
      }

      if (anchor) {
        resizeObserver.unobserve(anchor);
        anchorObserver.disconnect();
        anchor.removeEventListener("pointerenter", scheduleMeasure);
        anchor.removeEventListener("pointerleave", scheduleMeasure);
        anchor.removeEventListener("transitionend", scheduleMeasure);
      }

      anchor = next;
      if (anchor) {
        resizeObserver.observe(anchor);
        anchorObserver.observe(anchor, {
          attributes: true,
          attributeFilter: ["class", "style"],
        });
        anchor.addEventListener("pointerenter", scheduleMeasure);
        anchor.addEventListener("pointerleave", scheduleMeasure);
        anchor.addEventListener("transitionend", scheduleMeasure);
      }
      scheduleMeasure();
    };

    const treeObserver = new MutationObserver(attachAnchor);
    treeObserver.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", scheduleMeasure);
    window.addEventListener("mascot:live2d-ready", attachAnchor);
    attachAnchor();

    return () => {
      if (frameId !== undefined) window.cancelAnimationFrame(frameId);
      treeObserver.disconnect();
      resizeObserver.disconnect();
      anchorObserver.disconnect();
      window.removeEventListener("resize", scheduleMeasure);
      window.removeEventListener("mascot:live2d-ready", attachAnchor);
      if (anchor) {
        anchor.removeEventListener("pointerenter", scheduleMeasure);
        anchor.removeEventListener("pointerleave", scheduleMeasure);
        anchor.removeEventListener("transitionend", scheduleMeasure);
      }
    };
  }, []);

  return placement;
}
