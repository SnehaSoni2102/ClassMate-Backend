import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

/**
 * Extracts JWT from Authorization header. Tolerates "Bearer Bearer <token>"
 * (e.g. when Swagger UI adds "Bearer " and user also pasted "Bearer <token>").
 */
function jwtFromRequestTolerateDoubleBearer(req: Request): string | null {
  const authHeader = req.headers?.authorization;
  if (!authHeader || typeof authHeader !== 'string') return null;
  let value = authHeader.trim();
  while (value.toLowerCase().startsWith('bearer ')) {
    value = value.slice(7).trim();
  }
  return value || null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: jwtFromRequestTolerateDoubleBearer,
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    return { _id: payload.data._id, role: payload.data.role };
  }
}
