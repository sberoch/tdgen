import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JobTasksService {
  constructor(private prisma: PrismaService) {}
}
