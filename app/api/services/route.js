import { NextResponse } from 'next/server';

async function checkRedis() {
  try {
    const { pingRedis } = await import('@/lib/redis');
    return await pingRedis();
  } catch {
    return false;
  }
}

async function checkGhost() {
  try {
    const { pingGhost } = await import('@/lib/ghost');
    return await pingGhost();
  } catch {
    return false;
  }
}

export async function GET() {
  const [redisOk, ghostOk] = await Promise.all([
    checkRedis(),
    checkGhost(),
  ]);

  return NextResponse.json({
    wundergraph: true,
    tinyfish: !!process.env.TINYFISH_API_KEY,
    redis: redisOk,
    gemini: !!process.env.GEMINI_API_KEY,
    ghost: ghostOk,
    nexla: true,
    akash: true,
  });
}
