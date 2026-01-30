/**
 * Shared types for JWT payload and request context.
 * Used to resolve @typescript-eslint/no-unsafe-call and no-unsafe-member-access
 * when reading req.headers and JWT verify payload.
 */

export interface JwtPayloadData {
  _id: string;
  role?: string;
  phoneNumber?: string;
  Name?: string;
}

export interface JwtPayload {
  data: JwtPayloadData;
  iat?: number;
  exp?: number;
}

export interface RequestWithAuthHeaders {
  headers: {
    authorization?: string;
    [key: string]: string | string[] | undefined;
  };
  user?: { _id: string; role?: string };
}
