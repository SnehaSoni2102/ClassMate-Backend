# Quiz Realtime Events (SSE) + Manual APIs

This document is for the frontend + mobile developer team.

## 1) SSE Stream Endpoint

The backend provides a single SSE stream per quiz:

- **GET** `/quiz-attempt/events/:quizId`

Authentication: `Authorization: Bearer <jwt>` (JWT guard is enabled).

Once connected, the client receives these SSE events:

1. `quiz-answer-saved`
2. `quiz-question-all-responded`
3. `quiz-next-question`

### Client-side subscription (example)

```js
const es = new EventSource(`${BASE_URL}/quiz-attempt/events/${quizId}`);

es.addEventListener('quiz-answer-saved', (evt) => {
  const payload = JSON.parse(evt.data);
  // payload.eventType === 'quiz-answer-saved'
});

es.addEventListener('quiz-question-all-responded', (evt) => {
  const payload = JSON.parse(evt.data);
  // payload.eventType === 'quiz-question-all-responded'
});

es.addEventListener('quiz-next-question', (evt) => {
  const payload = JSON.parse(evt.data);
  // payload.eventType === 'quiz-next-question'
});
```

Note: Depending on your platform, you may need to pass JWT (for many client frameworks you can’t set headers on native `EventSource`; if that’s your case, tell me your platform and I’ll suggest the proper pattern for token transport).

## 2) SSE Event: `quiz-answer-saved`

Emitted when a participant saves an answer for a question:

- Triggered by **POST** `/quiz-attempt/:quizId/:questionId`
- Event name: `quiz-answer-saved`

### Payload (`JSON.parse(evt.data)`)

```ts
{
  eventType: 'quiz-answer-saved',
  quizId: string,
  questionId: string,
  userId: string,
  score: number,              // quiz total score after save
  totalTimeSpent: number,    // quiz total time after save
  top5: Array<{
    userId: string,
    marks: number,
    timeTaken: number,
  }>,
  timestamp: string           // ISO
}
```

`top5` comes from Redis leaderboard for the given `questionId`.

## 3) SSE Event: `quiz-question-all-responded`

Emitted for **group-scoped** quizzes when **all expected participants** have responded for a question **before its time ends**.

- Event name: `quiz-question-all-responded`

### Payload

```ts
{
  eventType: 'quiz-question-all-responded',
  quizId: string,
  questionId: string,
  userId: string,            // last responder
  scope: 'global' | 'group',
  groupId?: string,
  expectedCount: number,    // number of expected participants
  respondedCount: number,   // unique responders detected in Redis
  top5: Array<{
    userId: string,
    marks: number,
    timeTaken: number,
  }>,
  timestamp: string            // ISO
}
```

### How `expectedCount` is decided (important)

For `scope=group`, expected participants are computed from the group document:
- We count members whose `role === 'member'`.
- If there are no `role: 'member'` entries, we fallback to counting all `group.members`.

### How “before time allowed” is decided

The backend computes question end time as:
- quiz start datetime (derived from quiz `startDate` + `startTime`)
- plus the sum of `timeInMinutes` for all previous questions
- plus current question `timeInMinutes`

If all expected participants have responded before that computed end-time, the event triggers **once** per quiz-question.

## 4) Manual API: Move to Next Question (`manual-next`)

This API is called by the frontend when you want to manually advance the quiz UI.
When it is called, the backend emits `quiz-next-question` to everyone connected to that quiz SSE stream.

### Endpoint

- **POST** `/quiz-attempt/manual-next/:quizId`

### Body

Send either one of these:

```json
{ "currentQuestionIndex": 0 }
```

or

```json
{ "nextQuestionIndex": 1 }
```

If you send `currentQuestionIndex`, server uses `next = current + 1`.

### SSE Event emitted

Event name: `quiz-next-question`

Payload:

```ts
{
  eventType: 'quiz-next-question',
  quizId: string,
  nextQuestionIndex: number,
  nextQuestionId?: string,
  timestamp: string
}
```

Auth: JWT enabled. (This endpoint currently allows only admin/superadmin by roles in controller.)

## 5) Manual API: End Quiz Early (`endQuiz`)

This endpoint marks the quiz as completed immediately.

### Endpoint

- **POST** `/quiz/end/:quizId`

### What it does
- Sets `quiz.endDate` to **today’s local date** (00:00)
- Sets `quiz.endTime` to **current local time** (`HH:mm`)
- Sets `quiz.status = 'completed'`
- Cancels any future quiz-start job for that quiz (if queued)

Auth: JWT enabled (roles removed; any authenticated user can call it).

## 6) Redis Leaderboard (Top 5 per question)

Backend keeps per-question top 5 in Redis keyed by `questionId`.

- **Sorted set** key: `quiz:question:<questionId>:rank`
- **Member score** uses: `marks * 1_000_000 - timeTaken`

When a question answer is saved, the backend updates:
- the user’s best entry for that question (higher marks wins; lower time breaks ties)
- the returned `top5` in `quiz-answer-saved` and `quiz-question-all-responded`

## 7) Existing API (optional helper)

- **GET** `/quiz-attempt/question-rankers/:questionId`

Returns current Redis top 5 for a `questionId`.

