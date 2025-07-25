import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { JobTasksModule } from './job-tasks/job-tasks.module';
import { JobDescriptionsModule } from './job-descriptions/job-descriptions.module';
import { JobDescriptionTasksModule } from './job-description-tasks/job-description-tasks.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: process.env.CLIENT_DIST_DIR ?? '/usr/src/app/client',
    }),
    PrismaModule,
    JobTasksModule,
    JobDescriptionsModule,
    JobDescriptionTasksModule,
    AuthModule,
  ],
  controllers: [],
})
export class AppModule {}
