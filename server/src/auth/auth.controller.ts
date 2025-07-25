import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  @Get('saml/login')
  @UseGuards(AuthGuard('saml'))
  login() {}

  @Post('saml/callback')
  @UseGuards(AuthGuard('saml'))
  callback(@Req() req, @Res() res) {
    try {
      console.log('SAML login successful for user:', req.user);
      res.redirect('/');
    } catch (error) {
      console.error(error);
      res.redirect('/login');
    }
  }
}
