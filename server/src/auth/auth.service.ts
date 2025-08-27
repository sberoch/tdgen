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

  parseTimeString(timeStr: string): {
    milliseconds: number;
    jwtFormat: string;
  } {
    const match = timeStr.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(
        `Invalid time format: ${timeStr}. Use format like: 30s, 15m, 2h, 1d`,
      );
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    let milliseconds: number;
    switch (unit) {
      case 's':
        milliseconds = value * 1000;
        break;
      case 'm':
        milliseconds = value * 60 * 1000;
        break;
      case 'h':
        milliseconds = value * 60 * 60 * 1000;
        break;
      case 'd':
        milliseconds = value * 24 * 60 * 60 * 1000;
        break;
      default:
        throw new Error(`Unsupported time unit: ${unit}`);
    }

    return {
      milliseconds,
      jwtFormat: timeStr,
    };
  }

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
