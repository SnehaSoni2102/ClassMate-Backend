import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExtractJwt } from 'passport-jwt';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err, user) {
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(request as any);

    // If there's a token, validate it using the JWT strategy
    if (token) {
      return super.canActivate(context);
    }

    // No token present, allow request to proceed without authentication
    return true;
  }

  handleRequest(err: Error | undefined, user: any): any {
    // If there's a user from JWT validation, return it
    if (user) {
      return user;
    }

    // If JWT validation failed or no token was present, return null
    return null;
  }
}
