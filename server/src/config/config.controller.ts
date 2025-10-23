import { Controller, Get } from '@nestjs/common';

@Controller('config')
export class ConfigController {
  @Get()
  getConfig() {
    return {
      apiUrl: process.env.API_URL ?? '',
      adminRoleName: process.env.TDGEN_ADMIN_ATTR_NAME ?? 'admin',
      userRoleName: process.env.TDGEN_USER_ATTR_NAME ?? 'user',
      isDevEnv: process.env.NODE_ENV !== 'production',
      lockDurationMs: parseInt(process.env.LOCK_DURATION_MS ?? '1800000', 10),
      lockRefreshIntervalMs: parseInt(
        process.env.LOCK_REFRESH_INTERVAL_MS ?? '300000',
        10,
      ),
    };
  }
}
