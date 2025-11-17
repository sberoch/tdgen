import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { JobTasksModule } from './job-tasks/job-tasks.module';
import { JobDescriptionsModule } from './job-descriptions/job-descriptions.module';
import { JobDescriptionTasksModule } from './job-description-tasks/job-description-tasks.module';
import { AuthModule } from './auth/auth.module';
import { LockModule } from './lock/lock.module';
import { EventsModule } from './events/events.module';
import * as path from 'path';
import { ConfigController } from './config/config.controller';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath:
        process.env.CLIENT_DIST_DIR &&
        process.env.CLIENT_DIST_DIR.startsWith('..') // It's a relative path
          ? path.join(__dirname, process.env.CLIENT_DIST_DIR)
          : '/usr/src/app/client',
    }),
    PrismaModule,
    EventsModule,
    LockModule,
    JobTasksModule,
    JobDescriptionsModule,
    JobDescriptionTasksModule,
    AuthModule,
  ],
  controllers: [ConfigController],
})
export class AppModule {}
