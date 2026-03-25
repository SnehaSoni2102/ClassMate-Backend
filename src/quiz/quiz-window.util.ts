/**
 * Parse YYYY-MM-DD (or Date) + HH:mm in the server local timezone so scheduled
 * start/end match user-facing calendar times (avoids UTC-only ISO date bugs).
 */
function parseCalendarParts(dateVal: unknown): { y: number; m: number; d: number } | null {
  if (dateVal == null) return null;
  if (dateVal instanceof Date && !isNaN(dateVal.getTime())) {
    return {
      y: dateVal.getFullYear(),
      m: dateVal.getMonth() + 1,
      d: dateVal.getDate(),
    };
  }
  const s = String(dateVal).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const [y, m, d] = s.slice(0, 10).split('-').map(Number);
    if (!y || !m || !d) return null;
    return { y, m, d };
  }
  const dt = new Date(s);
  if (isNaN(dt.getTime())) return null;
  return { y: dt.getFullYear(), m: dt.getMonth() + 1, d: dt.getDate() };
}

export function parseQuizStartLocal(quiz: {
  startDate?: unknown;
  startTime?: string;
}): Date | null {
  const parts = parseCalendarParts(quiz.startDate);
  if (!parts) return null;
  const [sh, sm] = String(quiz.startTime || '00:00').split(':').map(Number);
  return new Date(parts.y, parts.m - 1, parts.d, sh, sm || 0, 0, 0);
}

function parseQuizEndLocal(quiz: { endDate?: unknown; endTime?: string }): Date | null {
  const parts = parseCalendarParts(quiz.endDate);
  if (!parts) return null;
  const [eh, em] = String(quiz.endTime || '00:00').split(':').map(Number);
  return new Date(parts.y, parts.m - 1, parts.d, eh, em || 0, 0, 0);
}

/**
 * Quiz end may be legacy-stored on the document (endDate/endTime) or derived from
 * durationInMinutes (stored as seconds in create/update) or sum of questions[].timeInMinutes.
 */
export function getQuizStartEnd(quiz: any): { start: Date; end: Date } | null {
  const start = parseQuizStartLocal(quiz);
  if (!start) return null;

  if (quiz.endDate && quiz.endTime) {
    const end = parseQuizEndLocal(quiz);
    if (!end) return null;
    return { start, end };
  }

  const durSec = quiz.durationInMinutes;
  if (typeof durSec === 'number' && durSec > 0) {
    const end = new Date(start.getTime() + durSec * 1000);
    return { start, end };
  }

  const entries = Array.isArray(quiz.questions) ? quiz.questions : [];
  const totalMin = entries.reduce(
    (acc: number, q: any) =>
      acc + (typeof q?.timeInMinutes === 'number' ? q.timeInMinutes : 0),
    0,
  );
  if (totalMin > 0) {
    const end = new Date(start.getTime() + totalMin * 60 * 1000);
    return { start, end };
  }

  return null;
}

export type QuizTimeStatus = 'upcomming' | 'active' | 'completed' | 'unknown';

/** Time-window status (ignores stale DB `status` when the window is known). */
export function getQuizTimeStatus(quiz: any, now = new Date()): QuizTimeStatus {
  const window = getQuizStartEnd(quiz);
  if (!window) return 'unknown';
  if (now < window.start) return 'upcomming';
  if (now > window.end) return 'completed';
  return 'active';
}
