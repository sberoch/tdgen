import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { Employee as EmployeeModel, Level as LevelModel } from '@prisma/client';

@Controller('employees')
export class EmployeesController {
  constructor(
    private readonly employeesService: EmployeesService,
  ) {}

  @Get()
  async getEmployees(): Promise<EmployeeModel[]> {
    return this.employeesService.employees({});
  }

  @Get(':id')
  async getEmployeeById(@Param('id') id: string): Promise<EmployeeModel|null> {
    return this.employeesService.employee({ id: Number(id) });
  }

  @Post()
  async createEmployee(
    @Body() postData: { name: string; position: string; level: LevelModel },
  ): Promise<EmployeeModel> {
    const { name, position, level } = postData;
    return this.employeesService.createEmployee({
      name,
      position,
      level
    });
  }

  @Put(':id')
  async updateEmployee(
    @Param('id') id: string,
    @Body() putData: { name: string; position: string; level: LevelModel },
  ): Promise<EmployeeModel> {
    const { name, position, level } = putData;
    return this.employeesService.updateEmployee({
      where: { id: Number(id) },
      data: {
        name,
        position,
        level
      },
    });
  }

  @Delete(':id')
  async deletePost(@Param('id') id: string): Promise<EmployeeModel> {
    return this.employeesService.deleteEmployee({ id: Number(id) });
  }
}
