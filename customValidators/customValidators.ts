import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * When `type === 'live'`, startDate, startTime, endDate, and endTime must be present.
 * Used on `createTestDto` / `createTestDtoAllIndia` via `@Validate(DateTimeRequiredForLive)`.
 */
@ValidatorConstraint({ name: 'DateTimeRequiredForLive', async: false })
export class DateTimeRequiredForLive implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    const dto = args.object as Record<string, unknown>;
    if (dto?.type !== 'live') return true;
    return !!(
      dto.startDate &&
      dto.startTime &&
      dto.endDate &&
      dto.endTime
    );
  }

  defaultMessage(): string {
    return 'startDate, startTime, endDate, and endTime are required for test type "live".';
  }
}
