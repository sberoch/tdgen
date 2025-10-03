/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Get,
  Header,
  Post,
  Req,
  Res,
  UseGuards,
  UseFilters,
} from '@nestjs/common';
import { AuthService, SamlUser } from './auth.service';
import { Response, Request } from 'express';
import { JwtAuthGuard } from './jwt-auth.guard';
import { SamlStrategy } from './saml.strategy';
import { SamlAuthGuard } from './saml-auth.guard';
import { SamlExceptionFilter } from './saml-exception.filter';

@Controller('auth')
export class AuthController {
  samlStrategy: SamlStrategy;

  constructor(
    private authService: AuthService,
    samlStrategy: SamlStrategy,
  ) {
    this.samlStrategy = samlStrategy;
  }

  @Get('saml/login')
  @UseGuards(SamlAuthGuard)
  @UseFilters(SamlExceptionFilter)
  login() {}

  @Post('saml/callback')
  @UseGuards(SamlAuthGuard)
  @UseFilters(SamlExceptionFilter)
  callback(@Req() req: Request & { user: SamlUser }, @Res() res: Response) {
    try {
      if (!req.user) {
        console.error('No user in SAML callback');
        return res.redirect('/denied?error=saml_no_user');
      }

      const token = this.authService.generateJwtToken(req.user);

      const lifetimeStr = process.env.JWT_COOKIE_LIFETIME || '12h';
      const { milliseconds } = this.authService.parseTimeString(lifetimeStr);

      res.cookie('accessToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: milliseconds,
      });

      res.redirect('/');
    } catch (error: any) {
      if (error.message && error.message.startsWith('SAML_')) {
        return res.redirect(`/denied?error=${error.message.toLowerCase()}`);
      }

      res.redirect('/denied?error=saml_callback_error');
    }
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req: Request & { user: SamlUser }) {
    return req.user;
  }

  @Post('logout')
  logout(@Res() res: Response) {
    res.clearCookie('accessToken');
    return res.json({ message: 'Logged out successfully' });
  }

  @Get('metadata')
  @Header('content-type', 'text/xml')
  getMetadata(@Res() res: Response) {
    return res.send(this.samlStrategy.generateServiceProviderMetadata(null));
  }
}
