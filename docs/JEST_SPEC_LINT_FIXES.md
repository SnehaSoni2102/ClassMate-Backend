# Jest spec files – "Unsafe call of a(n) `error` type typed value" lint fixes

## Cause

The root `tsconfig.json` has `"types": []`, so Jest globals (`describe`, `it`, `expect`, `beforeEach`, etc.) are not in scope. ESLint then treats them as `error`-typed and reports:

- `Unsafe call of a(n) \`error\` type typed value` (@typescript-eslint/no-unsafe-call)
- `Unsafe member access .toBeDefined on an \`error\` typed value` (@typescript-eslint/no-unsafe-member-access)
- `Cannot find name 'describe'` (and similar for other Jest globals)

## Fix

Add an explicit import of Jest globals at the top of each spec file:

```ts
import { describe, it, expect, beforeEach } from '@jest/globals';
```

Add `afterEach`, `afterAll`, `beforeAll`, or `jest` if the file uses them.

---

## Files updated

| #   | File                                                         | Status             |
| --- | ------------------------------------------------------------ | ------------------ |
| 1   | `src/app.controller.spec.ts`                                 | Fixed              |
| 2   | `src/banner/banner.controller.spec.ts`                       | Already had import |
| 3   | `src/banner/banner.service.spec.ts`                          | Fixed              |
| 4   | `src/category/category.controller.spec.ts`                   | Fixed              |
| 5   | `src/category/category.service.spec.ts`                      | Fixed              |
| 6   | `src/class/class.controller.spec.ts`                         | Fixed              |
| 7   | `src/class/class.service.spec.ts`                            | Fixed              |
| 8   | `src/exam/exam.controller.spec.ts`                           | Fixed              |
| 9   | `src/exam/exam.service.spec.ts`                              | Fixed              |
| 10  | `src/group/group.controller.spec.ts`                         | Fixed              |
| 11  | `src/group/group.service.spec.ts`                            | Already had import |
| 12  | `src/help-support/help-support.controller.spec.ts`           | Fixed              |
| 13  | `src/help-support/help-support.service.spec.ts`              | Fixed              |
| 14  | `src/library/library.controller.spec.ts`                     | Fixed              |
| 15  | `src/library/library.service.spec.ts`                        | Fixed              |
| 16  | `src/notice-board/notice-board.controller.spec.ts`           | Fixed              |
| 17  | `src/notice-board/notice-board.service.spec.ts`              | Fixed              |
| 18  | `src/notification/notification.controller.spec.ts`           | Fixed              |
| 19  | `src/notification/notification.service.spec.ts`              | Fixed              |
| 20  | `src/pricing/pricing.controller.spec.ts`                     | Fixed              |
| 21  | `src/pricing/pricing.service.spec.ts`                        | Fixed              |
| 22  | `src/question/question.controller.spec.ts`                   | Fixed              |
| 23  | `src/question/question.service.spec.ts`                      | Fixed              |
| 24  | `src/report/report.controller.spec.ts`                       | Fixed              |
| 25  | `src/report/report.service.spec.ts`                          | Fixed              |
| 26  | `src/report-question/report-question.controller.spec.ts`     | Fixed              |
| 27  | `src/report-question/report-question.service.spec.ts`        | Fixed              |
| 28  | `src/section/section.controller.spec.ts`                     | Fixed              |
| 29  | `src/section/section.service.spec.ts`                        | Fixed              |
| 30  | `src/subscription/subscription.controller.spec.ts`           | Fixed              |
| 31  | `src/subscription/subscription.service.spec.ts`              | Fixed              |
| 32  | `src/subject/subject.controller.spec.ts`                     | Fixed              |
| 33  | `src/subject/subject.service.spec.ts`                        | Fixed              |
| 34  | `src/test/test.controller.spec.ts`                           | Fixed              |
| 35  | `src/test/test.service.spec.ts`                              | Fixed              |
| 36  | `src/topic/topic.controller.spec.ts`                         | Fixed              |
| 37  | `src/topic/topic.service.spec.ts`                            | Fixed              |
| 38  | `src/transaction/transaction.controller.spec.ts`             | Fixed              |
| 39  | `src/transaction/transaction.service.spec.ts`                | Fixed              |
| 40  | `src/user-test-attempt/user-test-attempt.controller.spec.ts` | Fixed              |
| 41  | `src/user-test-attempt/user-test-attempt.service.spec.ts`    | Already had import |
| 42  | `src/user-subscription/user-subscription.controller.spec.ts` | Fixed              |
| 43  | `src/user-subscription/user-subscription.service.spec.ts`    | Fixed              |
| 44  | `src/users/users.controller.spec.ts`                         | Fixed              |
| 45  | `src/users/users.service.spec.ts`                            | Fixed              |

Total: 45 spec files. 3 already had the Jest globals import; 42 updated.
