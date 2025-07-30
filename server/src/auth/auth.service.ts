import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface SamlUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  groups: string[];
}

export interface JwtPayload {
  sub: string;
  email: string;
  displayName: string;
  firstName: string;
  lastName: string;
  username: string;
  groups: string[];
  iat?: number;
  exp?: number;
}

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  generateJwtToken(user: SamlUser): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      firstName: user.firstName,
      displayName: user.firstName + ' ' + user.lastName,
      lastName: user.lastName,
      username: user.username,
      groups: user.groups,
    };

    return this.jwtService.sign(payload);
  }

  validateJwtPayload(payload: JwtPayload): SamlUser {
    return {
      id: payload.sub,
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      username: payload.username,
      groups: payload.groups,
    };
  }
}
