import { Body, Controller, Post } from '@nestjs/common';
import { LoginDto, RegisterDto } from './auth.dto';

@Controller('auth')
export class AuthController {
  @Post('login')
  // eslint-disable-next-line @typescript-eslint/require-await
  async login(@Body() body: LoginDto) {
    console.log(body);
    return {
      message: 'Login successful',
    };
  }

  @Post('register')
  // eslint-disable-next-line @typescript-eslint/require-await
  async register(@Body() body: RegisterDto) {
    console.log(body);
    return {
      message: 'Register successful',
    };
  }

  @Post('logout')
  // eslint-disable-next-line @typescript-eslint/require-await
  async logout() {
    return {
      message: 'Logout successful',
    };
  }
}
