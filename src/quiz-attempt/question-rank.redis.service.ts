import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { QuestionRanker } from './quiz-attempt-events.service';

@Injectable()
export class QuestionRankRedisService implements OnModuleDestroy {
  private readonly logger = new Logger(QuestionRankRedisService.name);
  private client: RedisClientType | null = null;
  private connecting: Promise<unknown> | null = null;

  private getQuestionRankKey(questionId: string): string {
    return `quiz:question:${questionId}:rank`;
  }

  private getQuestionMetaKey(questionId: string): string {
    return `quiz:question:${questionId}:rank:meta`;
  }

  private compositeScore(marks: number, timeTaken: number): number {
    return marks * 1_000_000 - timeTaken;
  }

  private getResponderKeys(
    questionId: string,
    quizId: string,
    scope: 'global' | 'group',
    groupId?: string,
  ): {
    respondersKey: string;
    expectedKey: string;
    allSentKey: string;
  } {
    const scopeKey =
      scope === 'group' ? `group:${groupId || 'unknown'}` : 'global';
    const base = `quiz:question:${questionId}:quiz:${quizId}:${scopeKey}`;
    return {
      respondersKey: `${base}:responders`,
      expectedKey: `${base}:expected`,
      allSentKey: `${base}:allSent`,
    };
  }

  private async ensureConnected(): Promise<RedisClientType> {
    if (this.client?.isOpen) return this.client;

    if (!this.client) {
      const host = process.env.REDIS_HOST || '127.0.0.1';
      const port = Number(process.env.REDIS_PORT || 6379);
      const password = process.env.REDIS_PASSWORD || undefined;

      this.client = createClient({
        socket: { host, port },
        password,
      });
      this.client.on('error', (err) => {
        this.logger.error(`Redis error: ${String(err)}`);
      });
    }

    if (!this.connecting) {
      this.connecting = this.client
        .connect()
        .then(() => undefined)
        .finally(() => {
          this.connecting = null;
        });
    }

    await this.connecting;
    return this.client;
  }

  async updateAndGetTop5(
    questionId: string,
    userId: string,
    marks: number,
    timeTaken: number,
  ): Promise<QuestionRanker[]> {
    const redis = await this.ensureConnected();
    const rankKey = this.getQuestionRankKey(questionId);
    const metaKey = this.getQuestionMetaKey(questionId);
    const nextScore = this.compositeScore(marks, timeTaken);

    const prev = await redis.zScore(rankKey, userId);
    if (prev == null || nextScore > prev) {
      await redis.zAdd(rankKey, [{ value: userId, score: nextScore }]);
      await redis.hSet(
        metaKey,
        userId,
        JSON.stringify({ userId, marks, timeTaken }),
      );
    }

    return this.getTop5(questionId);
  }

  async getTop5(questionId: string): Promise<QuestionRanker[]> {
    const redis = await this.ensureConnected();
    const rankKey = this.getQuestionRankKey(questionId);
    const metaKey = this.getQuestionMetaKey(questionId);

    const entries = await redis.zRangeWithScores(rankKey, 0, 4, {
      REV: true,
    });
    if (!entries.length) return [];

    const userIds = entries.map((e) => e.value);
    const metas = await redis.hmGet(metaKey, userIds);

    return userIds.map((userId, index) => {
      const raw = metas[index];
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as QuestionRanker;
          return {
            userId,
            marks: Number(parsed.marks || 0),
            timeTaken: Number(parsed.timeTaken || 0),
          };
        } catch {
          // fallback below
        }
      }

      const composite = entries[index]?.score || 0;
      const marks = Math.floor(composite / 1_000_000);
      const timeTaken = Math.max(0, marks * 1_000_000 - composite);
      return { userId, marks, timeTaken };
    });
  }

  /**
   * Tracks unique responders for a question in a quiz (per group/global scope).
   * If all expected participants responded BEFORE `questionEnd`, it triggers exactly once.
   */
  async addResponderAndCheckAllResponded(params: {
    questionId: string;
    quizId: string;
    scope: 'global' | 'group';
    groupId?: string;
    userId: string;
    expectedCount: number;
    questionEnd: Date;
  }): Promise<{
    triggered: boolean;
    respondedCount: number;
    expectedCount: number;
  }> {
    const {
      questionId,
      quizId,
      scope,
      groupId,
      userId,
      expectedCount,
      questionEnd,
    } = params;

    const redis = await this.ensureConnected();
    const nowMs = Date.now();
    const endMs = questionEnd.getTime();
    if (!Number.isFinite(endMs) || endMs <= nowMs) {
      return { triggered: false, respondedCount: 0, expectedCount };
    }

    const ttlSec = Math.max(1, Math.floor((endMs - nowMs) / 1000));
    const { respondersKey, expectedKey, allSentKey } = this.getResponderKeys(
      questionId,
      quizId,
      scope,
      groupId,
    );

    // initialize expected count exactly once (until question ends)
    await redis.set(expectedKey, String(expectedCount), {
      NX: true,
      EX: ttlSec,
    });

    // add responder and set TTL for cleanup
    await redis.sAdd(respondersKey, userId);
    await redis.expire(respondersKey, ttlSec);

    const respondedCount = await redis.sCard(respondersKey);
    const resolvedExpectedRaw = await redis.get(expectedKey);
    const resolvedExpected = resolvedExpectedRaw
      ? Number(resolvedExpectedRaw)
      : expectedCount;

    if (respondedCount !== resolvedExpected) {
      return { triggered: false, respondedCount, expectedCount: resolvedExpected };
    }

    // trigger only once
    const allSent = await redis.set(allSentKey, '1', { NX: true, EX: ttlSec });
    const triggered = allSent === 'OK';

    return {
      triggered,
      respondedCount,
      expectedCount: resolvedExpected,
    };
  }

  async onModuleDestroy() {
    if (this.client?.isOpen) {
      await this.client.quit();
    }
  }
}
