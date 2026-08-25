import type { MascotLimits } from "../core/limits";
import type { MascotTokenUsage } from "../core/types";

type Counter = { amount: number; resetAt: number };
type ActiveLease = { expiresAt: number };

export type LimitDecision =
  | { allowed: true }
  | {
      allowed: false;
      reason: "minute" | "daily" | "concurrent" | "tts-daily";
      retryAfterSeconds: number;
    };

const MINUTE_MS = 60_000;
const CHAT_LEASE_MS = 90_000;
const MAX_TRACKED_KEYS = 5_000;

function nextUtcDay(now: number) {
  const date = new Date(now);
  return Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate() + 1,
  );
}

function retryAfter(resetAt: number, now: number) {
  return Math.max(1, Math.ceil((resetAt - now) / 1_000));
}

class MascotUsageLimiter {
  private readonly minuteCounters = new Map<string, Counter>();
  private readonly dailyChatCounters = new Map<string, Counter>();
  private readonly dailyTtsCounters = new Map<string, Counter>();
  private readonly dailyTokenUsage = new Map<string, MascotTokenUsage>();
  private readonly activeChats = new Map<string, ActiveLease>();

  beginChat(
    visitorId: string,
    ip: string,
    limits: MascotLimits,
    now = Date.now(),
  ): LimitDecision {
    this.prune(now);
    const active = this.activeChats.get(visitorId);
    if (active && active.expiresAt > now) {
      return {
        allowed: false,
        reason: "concurrent",
        retryAfterSeconds: retryAfter(active.expiresAt, now),
      };
    }

    const minuteKeys = [`chat:visitor:${visitorId}`, `chat:ip:${ip}`];
    for (const key of minuteKeys) {
      const counter = this.currentCounter(
        this.minuteCounters,
        key,
        now + MINUTE_MS,
        now,
      );
      if (counter.amount >= limits.requestsPerMinute) {
        return {
          allowed: false,
          reason: "minute",
          retryAfterSeconds: retryAfter(counter.resetAt, now),
        };
      }
    }

    const dailyKey = `chat:${visitorId}`;
    const daily = this.currentCounter(
      this.dailyChatCounters,
      dailyKey,
      nextUtcDay(now),
      now,
    );
    if (daily.amount >= limits.dailyRequestLimit) {
      return {
        allowed: false,
        reason: "daily",
        retryAfterSeconds: retryAfter(daily.resetAt, now),
      };
    }

    for (const key of minuteKeys) {
      this.increment(this.minuteCounters, key, now + MINUTE_MS, 1, now);
    }
    this.increment(this.dailyChatCounters, dailyKey, nextUtcDay(now), 1, now);
    this.activeChats.set(visitorId, { expiresAt: now + CHAT_LEASE_MS });
    return { allowed: true };
  }

  releaseChat(visitorId: string) {
    this.activeChats.delete(visitorId);
  }

  consumeTts(
    visitorId: string,
    ip: string,
    characters: number,
    limits: MascotLimits,
    now = Date.now(),
  ): LimitDecision {
    this.prune(now);
    const minuteKeys = [`tts:visitor:${visitorId}`, `tts:ip:${ip}`];
    for (const key of minuteKeys) {
      const counter = this.currentCounter(
        this.minuteCounters,
        key,
        now + MINUTE_MS,
        now,
      );
      if (counter.amount >= limits.requestsPerMinute) {
        return {
          allowed: false,
          reason: "minute",
          retryAfterSeconds: retryAfter(counter.resetAt, now),
        };
      }
    }

    const dailyKey = `tts:${visitorId}`;
    const daily = this.currentCounter(
      this.dailyTtsCounters,
      dailyKey,
      nextUtcDay(now),
      now,
    );
    if (daily.amount + characters > limits.ttsDailyCharLimit) {
      return {
        allowed: false,
        reason: "tts-daily",
        retryAfterSeconds: retryAfter(daily.resetAt, now),
      };
    }

    for (const key of minuteKeys) {
      this.increment(this.minuteCounters, key, now + MINUTE_MS, 1, now);
    }
    this.increment(
      this.dailyTtsCounters,
      dailyKey,
      nextUtcDay(now),
      characters,
      now,
    );
    return { allowed: true };
  }

  recordTokenUsage(visitorId: string, usage: MascotTokenUsage) {
    if (
      usage.inputTokens === undefined &&
      usage.outputTokens === undefined &&
      usage.totalTokens === undefined
    ) {
      return;
    }

    const key = `${new Date().toISOString().slice(0, 10)}:${visitorId}`;
    const current = this.dailyTokenUsage.get(key) ?? {};
    this.dailyTokenUsage.set(key, {
      inputTokens: addKnown(current.inputTokens, usage.inputTokens),
      outputTokens: addKnown(current.outputTokens, usage.outputTokens),
      totalTokens: addKnown(current.totalTokens, usage.totalTokens),
    });
  }

  private currentCounter(
    map: Map<string, Counter>,
    key: string,
    resetAt: number,
    now: number,
  ) {
    const current = map.get(key);
    if (!current || current.resetAt <= now) {
      return { amount: 0, resetAt };
    }
    return current;
  }

  private increment(
    map: Map<string, Counter>,
    key: string,
    resetAt: number,
    amount: number,
    now: number,
  ) {
    const current = this.currentCounter(map, key, resetAt, now);
    map.set(key, {
      amount: current.amount + amount,
      resetAt: current.resetAt,
    });
  }

  private prune(now: number) {
    for (const [key, lease] of this.activeChats) {
      if (lease.expiresAt <= now) this.activeChats.delete(key);
    }

    for (const map of [
      this.minuteCounters,
      this.dailyChatCounters,
      this.dailyTtsCounters,
    ]) {
      if (map.size < MAX_TRACKED_KEYS) continue;
      for (const [key, counter] of map) {
        if (counter.resetAt <= now) map.delete(key);
      }
    }

    if (this.dailyTokenUsage.size >= MAX_TRACKED_KEYS) {
      const today = new Date(now).toISOString().slice(0, 10);
      for (const key of this.dailyTokenUsage.keys()) {
        if (!key.startsWith(today)) this.dailyTokenUsage.delete(key);
      }
    }
  }
}

function addKnown(left?: number, right?: number) {
  if (left === undefined && right === undefined) return undefined;
  return (left ?? 0) + (right ?? 0);
}

const mascotGlobal = globalThis as typeof globalThis & {
  __mascotUsageLimiter?: MascotUsageLimiter;
};

export const mascotUsageLimiter =
  mascotGlobal.__mascotUsageLimiter ?? new MascotUsageLimiter();

mascotGlobal.__mascotUsageLimiter = mascotUsageLimiter;
