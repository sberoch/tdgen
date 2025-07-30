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
      const token = this.authService.generateJwtToken(req.user);

      res.cookie('accessToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      });

      res.redirect('/');
    } catch (error) {
      console.error(error);
      res.redirect('/login');
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
