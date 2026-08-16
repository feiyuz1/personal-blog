// 基于内存的登录限流（固定窗口）。
// 单实例部署（systemd 单进程）下够用；进程重启会清空计数，
// 对单管理员博客是可接受的取舍。多实例部署需改为 Redis 等共享存储。

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const WINDOW_MS = 15 * 60 * 1000; // 15 分钟窗口
const MAX_ATTEMPTS = 10; // 窗口内最多尝试次数
const MAX_BUCKETS = 1000; // 防止内存无限增长的上限

function pruneExpired(now: number) {
  if (buckets.size < MAX_BUCKETS) {
    return;
  }

  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) {
      buckets.delete(key);
    }
  }
}

export function checkRateLimit(
  key: string,
  now = Date.now(),
): { allowed: boolean; remaining: number } {
  pruneExpired(now);

  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }

  if (bucket.count >= MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0 };
  }

  bucket.count += 1;
  return { allowed: true, remaining: MAX_ATTEMPTS - bucket.count };
}

export function resetRateLimit(key: string) {
  buckets.delete(key);
}
