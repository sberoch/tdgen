import { Controller, Get } from '@nestjs/common';

@Controller('config')
export class ConfigController {
  @Get()
  getConfig() {
    return {
      apiUrl: process.env.API_URL ?? '',
      adminRoleName: process.env.ADMIN_ROLE_NAME ?? 'admin',
      userRoleName: process.env.USER_ROLE_NAME ?? 'user',
      isDevEnv: process.env.NODE_ENV !== 'production',
    };
  }
}
