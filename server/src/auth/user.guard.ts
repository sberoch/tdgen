import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { SamlUser } from './auth.service';

@Injectable()
export class UserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user: SamlUser }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const adminRoleName = process.env.TDGEN_ADMIN_ATTR_NAME || 'admin';
    const userRoleName = process.env.TDGEN_USER_ATTR_NAME || 'user';

    const isAdmin = user.groups?.includes(adminRoleName);
    const isUser = user.groups?.includes(userRoleName);

    if (!isAdmin && !isUser) {
      throw new ForbiddenException('User access required');
    }

    return true;
  }
}
