import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class SamlAuthGuard extends AuthGuard('saml') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // If there's an error or no user, throw an exception with the error message
    if (err || !user) {
      const errorMessage = info?.message || err?.message || 'SAML_AUTH_ERROR';
      throw new UnauthorizedException(errorMessage);
    }

    return user;
  }
}
