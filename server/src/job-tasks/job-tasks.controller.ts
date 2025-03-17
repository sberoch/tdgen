import { Controller } from '@nestjs/common';
import { JobTasksService } from './job-tasks.service';

@Controller('job-tasks')
export class JobTasksController {
  constructor(private readonly jobTasksService: JobTasksService) {}
}
