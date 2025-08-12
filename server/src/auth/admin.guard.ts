import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { SamlUser } from './auth.service';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user: SamlUser }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const adminRoleName = process.env.TDGEN_ADMIN_ATTR_NAME || 'admin';
    const isAdmin = user.groups?.includes(adminRoleName);

    if (!isAdmin) {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}