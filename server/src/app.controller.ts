import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { join } from 'path';

@Controller('misc')
export class AppController {
  @Get('instructions')
  downloadInstruction(@Res() res: Response) {
    const filePath = join(
      __dirname,
      '..',
      '..',
      'static',
      'TDGen_Manual_latest.pdf',
    );
    res.download(filePath);
  }
}
