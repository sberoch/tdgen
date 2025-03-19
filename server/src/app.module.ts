import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ConfigModule } from '@nestjs/config';
import { EmployeesModule } from './employees/employees.module';
import { PrismaModule } from './prisma/prisma.module';
import { JobTasksModule } from './job-tasks/job-tasks.module';
import { JobDescriptionsModule } from './job-descriptions/job-descriptions.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: process.env.CLIENT_DIST_DIR ?? '/usr/src/app/client',
    }),
    EmployeesModule,
    PrismaModule,
    JobTasksModule,
    JobDescriptionsModule,
  ],
})
export class AppModule {}
