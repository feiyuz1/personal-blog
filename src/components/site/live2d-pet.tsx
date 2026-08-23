"use client";

import { useEffect, useState } from "react";

const MODEL_PATH =
  "/pet/pachan%202.0/pachirisu%20anime%20girl%20-%20top%20half.model3.json";
const TIPS_PATH = "/live2d/waifu-tips.json";
const DEFAULT_WIDGET_BASE_URL = "/live2d/widget/";
const DEFAULT_CUBISM_CORE_URL =
  "https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js";
const PET_POSITION_STORAGE_KEY = "live2d-pet-position";
const PET_VIEWPORT_MARGIN = 8;
const EXPRESSION_MESSAGES = {
  shy: [
    "突、突然靠这么近……我会害羞的啦。",
    "脸红才不是因为你，只是这里有点热。",
    "再摸一下也不是不可以……只能一下哦。",
    "你这样看着我，我都不知道该把视线放哪里了。",
  ],
  happy: [
    "嘿嘿，见到你我就开心起来啦！",
    "今天也要带着好心情继续阅读哦。",
    "被你发现了，我刚刚正在偷偷笑呢。",
    "一起学到新东西，当然值得开心啦！",
  ],
  surprised: [
    "呀！吓我一跳，你什么时候过来的？",
    "欸？这里居然还有这种知识！",
    "突然点我，是有什么新发现吗？",
    "哇——这个问题听起来很有意思！",
  ],
  pout: [
    "哼，连续点我也不会掉落奖励啦。",
    "你是不是只顾着看文章，忘记我了？",
    "我才没有生气……最多只有一点点。",
    "再不理我，我就把好文章藏起来啦。",
  ],
  playful: [
    "抓到你啦！刚才是不是想偷摸我？",
    "猜猜我下一次会露出什么表情？",
    "嘿嘿，今天也来一点小恶作剧吧。",
    "耳朵动了？一定是你看错啦。",
  ],
} as const;

type PetMode = "checking" | "preview" | "live2d";
type ExpressionName = keyof typeof EXPRESSION_MESSAGES;
type PetPosition = { left: number; top: number };
type PetDrag = {
  canvas: HTMLCanvasElement;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startLeft: number;
  startTop: number;
  width: number;
  height: number;
  moved: boolean;
  waifu: HTMLElement;
};
type WidgetConfig = {
  waifuPath: string;
  cubism5Path: string;
  tools: string[];
  drag: boolean;
  showToggleAfterQuit: boolean;
  logLevel: "warn";
};

declare global {
  interface Window {
    initWidget?: (config: WidgetConfig) => void;
  }
}

function clampPetPosition(
  position: PetPosition,
  width: number,
  height: number,
): PetPosition {
  return {
    left: Math.min(
      Math.max(PET_VIEWPORT_MARGIN, position.left),
      Math.max(
        PET_VIEWPORT_MARGIN,
        window.innerWidth - width - PET_VIEWPORT_MARGIN,
      ),
    ),
    top: Math.min(
      Math.max(PET_VIEWPORT_MARGIN, position.top),
      Math.max(
        PET_VIEWPORT_MARGIN,
        window.innerHeight - height - PET_VIEWPORT_MARGIN,
      ),
    ),
  };
}

function readPetPosition(): PetPosition | null {
  try {
    const value = JSON.parse(
      localStorage.getItem(PET_POSITION_STORAGE_KEY) ?? "null",
    ) as Partial<PetPosition> | null;

    if (
      !value ||
      typeof value.left !== "number" ||
      typeof value.top !== "number" ||
      !Number.isFinite(value.left) ||
      !Number.isFinite(value.top)
    ) {
      return null;
    }

    return { left: value.left, top: value.top };
  } catch {
    return null;
  }
}

function savePetPosition(position: PetPosition) {
  try {
    localStorage.setItem(PET_POSITION_STORAGE_KEY, JSON.stringify(position));
  } catch {
    // The pet remains draggable when browser storage is unavailable.
  }
}

function applyPetPosition(waifu: HTMLElement, position: PetPosition) {
  const clamped = clampPetPosition(
    position,
    waifu.offsetWidth,
    waifu.offsetHeight,
  );

  waifu.style.right = "auto";
  waifu.style.bottom = "auto";
  waifu.style.left = `${clamped.left}px`;
  waifu.style.top = `${clamped.top}px`;
  waifu.dataset.positioned = "true";

  return clamped;
}

function loadWidgetResource(id: string, url: string, type: "script" | "style") {
  const existing = document.getElementById(id) as
    | HTMLScriptElement
    | HTMLLinkElement
    | null;

  if (existing) {
    if (type === "style") return Promise.resolve();
    if (type === "script" && window.initWidget) return Promise.resolve();
    if (existing.dataset.loaded === "true") return Promise.resolve();

    return new Promise<void>((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error(url)), {
        once: true,
      });
    });
  }

  return new Promise<void>((resolve, reject) => {
    const element =
      type === "style"
        ? Object.assign(document.createElement("link"), {
            id,
            rel: "stylesheet",
            href: url,
          })
        : Object.assign(document.createElement("script"), {
            id,
            type: "module",
            src: url,
          });

    element.addEventListener(
      "load",
      () => {
        element.dataset.loaded = "true";
        resolve();
      },
      { once: true },
    );
    element.addEventListener(
      "error",
      () => {
        element.remove();
        reject(new Error(url));
      },
      { once: true },
    );
    document.head.appendChild(element);
  });
}

function StaticPetPreview() {
  const [isTalking, setIsTalking] = useState(true);

  return (
    <aside className="fixed right-3 bottom-3 z-40 sm:right-6 sm:bottom-5">
      <div
        className={`pointer-events-none absolute right-20 bottom-[82%] w-52 origin-bottom-right rounded-2xl border border-emerald-900/10 bg-[#fffdf8]/95 px-4 py-3 text-sm leading-6 text-slate-700 shadow-[0_14px_36px_rgba(34,58,45,0.16)] backdrop-blur transition sm:right-28 ${
          isTalking
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-2 scale-95 opacity-0"
        }`}
        role="status"
      >
        Pachan 暂时没有加载成功，刷新页面再叫我一次吧。
        <span className="absolute right-5 -bottom-2 size-4 rotate-45 border-r border-b border-emerald-900/10 bg-[#fffdf8]" />
      </div>

      <button
        type="button"
        className="group relative block cursor-pointer rounded-[2rem] outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-4 focus-visible:ring-offset-[#f4efe5]"
        aria-label={isTalking ? "收起宠物对话" : "查看 Pachan 状态"}
        aria-pressed={isTalking}
        onClick={() => setIsTalking((value) => !value)}
      >
        <span className="flex size-20 items-center justify-center rounded-full border border-emerald-900/10 bg-[#fffdf8]/95 text-2xl font-semibold text-emerald-800 shadow-[0_14px_36px_rgba(34,58,45,0.18)] backdrop-blur transition duration-300 group-hover:-translate-y-1 group-hover:rotate-3 sm:size-24">
          Pa
        </span>
      </button>
    </aside>
  );
}

export function Live2DPet() {
  const [mode, setMode] = useState<PetMode>("checking");

  useEffect(() => {
    let cancelled = false;
    let activeDrag: PetDrag | null = null;
    let expressionMessageTimer: number | null = null;
    let lastExpressionName: ExpressionName | null = null;
    let suppressNextPetClick = false;

    const showExpressionMessage = (name: ExpressionName) => {
      const waifu = document.getElementById("waifu");
      if (!waifu) return;

      let tips = document.getElementById("waifu-expression-tips");
      if (!tips) {
        tips = document.createElement("div");
        tips.id = "waifu-expression-tips";
        tips.setAttribute("role", "status");
        tips.setAttribute("aria-live", "polite");
        waifu.prepend(tips);
      }

      const messages = EXPRESSION_MESSAGES[name];
      tips.textContent = messages[Math.floor(Math.random() * messages.length)];
      tips.classList.add("waifu-expression-tips-active");
      waifu.dataset.expressionActive = "true";

      if (expressionMessageTimer !== null) {
        window.clearTimeout(expressionMessageTimer);
      }
      expressionMessageTimer = window.setTimeout(() => {
        tips.classList.remove("waifu-expression-tips-active");
        delete waifu.dataset.expressionActive;
        expressionMessageTimer = null;
      }, 4000);
    };

    const chooseExpression = () => {
      const names = Object.keys(EXPRESSION_MESSAGES) as ExpressionName[];
      const candidates = names.filter((name) => name !== lastExpressionName);
      const name = candidates[Math.floor(Math.random() * candidates.length)];
      lastExpressionName = name;
      return name;
    };

    const restorePetPosition = () => {
      if (activeDrag?.moved) return;

      const waifu = document.getElementById("waifu");
      const position = readPetPosition();

      if (!waifu || !position || !waifu.classList.contains("waifu-active")) {
        return;
      }

      applyPetPosition(waifu, position);
    };

    const positionObserver = new MutationObserver(restorePetPosition);
    positionObserver.observe(document.body, {
      attributeFilter: ["class"],
      attributes: true,
      childList: true,
      subtree: true,
    });
    restorePetPosition();

    const handlePetClick = (event: MouseEvent) => {
      if (!(event.target instanceof HTMLCanvasElement)) return;
      if (event.target.id !== "live2d") return;

      if (suppressNextPetClick) {
        suppressNextPetClick = false;
        return;
      }

      const expression = chooseExpression();
      showExpressionMessage(expression);
      window.dispatchEvent(
        new CustomEvent("live2d:expression", {
          detail: { name: expression },
        }),
      );
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof HTMLCanvasElement)) return;
      if (event.target.id !== "live2d" || event.button !== 0) return;

      const waifu = event.target.closest<HTMLElement>("#waifu");
      if (!waifu) return;

      const rect = waifu.getBoundingClientRect();
      const transformValue = window.getComputedStyle(waifu).transform;
      const transform =
        transformValue === "none"
          ? new DOMMatrixReadOnly()
          : new DOMMatrixReadOnly(transformValue);

      activeDrag = {
        canvas: event.target,
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startLeft: rect.left - transform.m41,
        startTop: rect.top - transform.m42,
        width: waifu.offsetWidth,
        height: waifu.offsetHeight,
        moved: false,
        waifu,
      };

      event.target.setPointerCapture?.(event.pointerId);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!activeDrag || event.pointerId !== activeDrag.pointerId) return;

      const deltaX = event.clientX - activeDrag.startClientX;
      const deltaY = event.clientY - activeDrag.startClientY;

      if (!activeDrag.moved && Math.hypot(deltaX, deltaY) < 5) return;

      activeDrag.moved = true;
      activeDrag.waifu.dataset.dragging = "true";
      const position = clampPetPosition(
        {
          left: activeDrag.startLeft + deltaX,
          top: activeDrag.startTop + deltaY,
        },
        activeDrag.width,
        activeDrag.height,
      );

      activeDrag.waifu.style.right = "auto";
      activeDrag.waifu.style.bottom = "auto";
      activeDrag.waifu.style.left = `${position.left}px`;
      activeDrag.waifu.style.top = `${position.top}px`;
      activeDrag.waifu.dataset.positioned = "true";
      event.preventDefault();
    };

    const finishPetDrag = (event: PointerEvent) => {
      if (!activeDrag || event.pointerId !== activeDrag.pointerId) return;

      if (activeDrag.moved) {
        const position = {
          left: Number.parseFloat(activeDrag.waifu.style.left),
          top: Number.parseFloat(activeDrag.waifu.style.top),
        };

        savePetPosition(position);
        suppressNextPetClick = true;
        window.setTimeout(() => {
          suppressNextPetClick = false;
        }, 250);
      }

      delete activeDrag.waifu.dataset.dragging;
      if (activeDrag.canvas.hasPointerCapture?.(event.pointerId)) {
        activeDrag.canvas.releasePointerCapture(event.pointerId);
      }
      activeDrag = null;
    };

    const handleResize = () => {
      const waifu = document.getElementById("waifu");
      if (!waifu || waifu.dataset.positioned !== "true") return;

      const position = applyPetPosition(waifu, {
        left: Number.parseFloat(waifu.style.left),
        top: Number.parseFloat(waifu.style.top),
      });
      savePetPosition(position);
    };

    document.addEventListener("click", handlePetClick);
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("pointermove", handlePointerMove, {
      passive: false,
    });
    document.addEventListener("pointerup", finishPetDrag);
    document.addEventListener("pointercancel", finishPetDrag);
    window.addEventListener("resize", handleResize);

    async function initialize() {
      if (
        document.getElementById("waifu") ||
        document.getElementById("waifu-toggle")
      ) {
        setMode("live2d");
        return;
      }

      try {
        const modelResponse = await fetch(MODEL_PATH, {
          cache: "no-store",
        });

        if (!modelResponse.ok) {
          if (!cancelled) setMode("preview");
          return;
        }

        const widgetBaseUrl = (
          process.env.NEXT_PUBLIC_LIVE2D_WIDGET_BASE_URL ??
          DEFAULT_WIDGET_BASE_URL
        ).replace(/\/?$/, "/");

        await Promise.all([
          loadWidgetResource(
            "live2d-widget-styles",
            `${widgetBaseUrl}waifu.css`,
            "style",
          ),
          loadWidgetResource(
            "live2d-widget-runtime",
            `${widgetBaseUrl}waifu-tips.js`,
            "script",
          ),
        ]);
        if (cancelled) return;

        if (!window.initWidget) {
          throw new Error("live2d-widget runtime did not expose initWidget");
        }

        const config: WidgetConfig = {
          waifuPath: TIPS_PATH,
          cubism5Path:
            process.env.NEXT_PUBLIC_LIVE2D_CUBISM_CORE_URL ??
            DEFAULT_CUBISM_CORE_URL,
          tools: ["photo", "info", "quit"],
          drag: false,
          showToggleAfterQuit: true,
          logLevel: "warn",
        };

        window.initWidget(config);
        setMode("live2d");
      } catch (error) {
        console.warn("Live2D pet could not be initialized.", error);
        if (!cancelled) setMode("preview");
      }
    }

    void initialize();

    return () => {
      cancelled = true;
      if (expressionMessageTimer !== null) {
        window.clearTimeout(expressionMessageTimer);
      }
      document.getElementById("waifu-expression-tips")?.remove();
      const waifu = document.getElementById("waifu");
      if (waifu) delete waifu.dataset.expressionActive;
      positionObserver.disconnect();
      document.removeEventListener("click", handlePetClick);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", finishPetDrag);
      document.removeEventListener("pointercancel", finishPetDrag);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  if (mode === "checking" || mode === "live2d") return null;

  return <StaticPetPreview />;
}
