import { MASCOT_INTERACTION_VOICE_VERSION } from "./interaction-voice-assets.generated";

export const MASCOT_INTERACTION_VOICE_PROFILE = {
  provider: "siliconflow",
  baseUrl: "https://api.siliconflow.cn/v1",
  model: "FunAudioLLM/CosyVoice2-0.5B",
  voice: "FunAudioLLM/CosyVoice2-0.5B:diana",
  speed: 0.95,
  responseFormat: "mp3",
  stylePrompt: "自然少女音，语速均匀，句尾不要加速。",
  // 后处理参数：先生成 WAV，定位最后有效声音后淡出并补齐静音，最终编码为 MP3。
  // 所有字段都参与缓存版本指纹，任意调整都会触发重新生成。
  postProcessVersion: 2,
  audibleRmsThreshold: 180,
  maxDurationBaseMs: 3_000,
  maxDurationPerCharMs: 350,
  tailSilenceMs: 300,
  fadeOutMs: 25,
} as const;

export const MASCOT_INTERACTION_VOICES = [
  {
    id: "shy-1",
    expression: "shy",
    text: "突、突然靠这么近……我会害羞的啦。",
  },
  {
    id: "shy-2",
    expression: "shy",
    text: "脸红才不是因为你，只是这里有点热。",
  },
  {
    id: "shy-3",
    expression: "shy",
    text: "再摸一下也不是不可以……只能一下哦。",
  },
  {
    id: "shy-4",
    expression: "shy",
    text: "你这样看着我，我都不知道该把视线放哪里了。",
  },
  {
    id: "happy-1",
    expression: "happy",
    text: "嘿嘿，见到你我就开心起来啦！",
  },
  {
    id: "happy-2",
    expression: "happy",
    text: "今天也要带着好心情继续阅读哦。",
  },
  {
    id: "happy-3",
    expression: "happy",
    text: "被你发现了，我刚刚正在偷偷笑呢。",
  },
  {
    id: "happy-4",
    expression: "happy",
    text: "一起学到新东西，当然值得开心啦！",
  },
  {
    id: "surprised-1",
    expression: "surprised",
    text: "呀！吓我一跳，你什么时候过来的？",
  },
  {
    id: "surprised-2",
    expression: "surprised",
    text: "欸？这里居然还有这种知识！",
  },
  {
    id: "surprised-3",
    expression: "surprised",
    text: "突然点我，是有什么新发现吗？",
  },
  {
    id: "surprised-4",
    expression: "surprised",
    text: "哇——这个问题听起来很有意思！",
  },
  {
    id: "pout-1",
    expression: "pout",
    text: "哼，连续点我也不会掉落奖励啦。",
  },
  {
    id: "pout-2",
    expression: "pout",
    text: "你是不是只顾着看文章，忘记我了？",
  },
  {
    id: "pout-3",
    expression: "pout",
    text: "我才没有生气……最多只有一点点。",
  },
  {
    id: "pout-4",
    expression: "pout",
    text: "再不理我，我就把好文章藏起来啦。",
  },
  {
    id: "playful-1",
    expression: "playful",
    text: "抓到你啦！刚才是不是想偷摸我？",
  },
  {
    id: "playful-2",
    expression: "playful",
    text: "猜猜我下一次会露出什么表情？",
  },
  {
    id: "playful-3",
    expression: "playful",
    text: "嘿嘿，今天也来一点小恶作剧吧。",
  },
  {
    id: "playful-4",
    expression: "playful",
    text: "耳朵动了？一定是你看错啦。",
  },
] as const;

export type MascotInteractionVoice = (typeof MASCOT_INTERACTION_VOICES)[number];
export type MascotInteractionVoiceId = MascotInteractionVoice["id"];
export type MascotInteractionExpression = MascotInteractionVoice["expression"];

export const MASCOT_INTERACTION_VOICE_IDS = MASCOT_INTERACTION_VOICES.map(
  ({ id }) => id,
);

export const MASCOT_INTERACTION_EXPRESSIONS = [
  "shy",
  "happy",
  "surprised",
  "pout",
  "playful",
] as const satisfies readonly MascotInteractionExpression[];

const interactionVoiceIds = new Set<string>(MASCOT_INTERACTION_VOICE_IDS);
const interactionVoicesById = new Map(
  MASCOT_INTERACTION_VOICES.map((voice) => [voice.id, voice]),
);

export function isMascotInteractionVoiceId(
  value: unknown,
): value is MascotInteractionVoiceId {
  return typeof value === "string" && interactionVoiceIds.has(value);
}

export function getMascotInteractionVoice(id: MascotInteractionVoiceId) {
  return interactionVoicesById.get(id)!;
}

export function getMascotInteractionVoicesForExpression(
  expression: MascotInteractionExpression,
) {
  return MASCOT_INTERACTION_VOICES.filter(
    (voice) => voice.expression === expression,
  );
}

export function mascotInteractionVoiceUrl(id: MascotInteractionVoiceId) {
  return `/mascot/interaction-voice/${MASCOT_INTERACTION_VOICE_VERSION}/${id}.mp3`;
}
