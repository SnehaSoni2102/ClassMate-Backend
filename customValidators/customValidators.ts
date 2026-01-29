import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'DateTimeRequiredForLive', async: false })
export class DateTimeRequiredForLive implements ValidatorConstraintInterface {
  validate(_: any, args: ValidationArguments): boolean {
    const dto = args.object as any;

    if (dto.type === 'live') {
      return !!(dto.startDate && dto.startTime && dto.endDate && dto.endTime);
    }
    return true;
  }

  defaultMessage(): string {
    return 'startDate, startTime, endDate, and endTime are required for test type "live".';
  }
}
