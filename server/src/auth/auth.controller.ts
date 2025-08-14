/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService, SamlUser } from './auth.service';
import { Response, Request } from 'express';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}
  @Get('saml/login')
  @UseGuards(AuthGuard('saml'))
  login() {}

  @Post('saml/callback')
  @UseGuards(AuthGuard('saml'))
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
      console.error('SAML callback error:', error);

      // Check if it's a SAML-specific error
      if (error.message && error.message.startsWith('SAML_')) {
        return res.redirect(`/denied?error=${error.message.toLowerCase()}`);
      }

      // Generic SAML error
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
}
