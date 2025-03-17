import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Employee, Prisma } from '@prisma/client';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async employee(
    employeeWhereUniqueInput: Prisma.EmployeeWhereUniqueInput,
  ): Promise<Employee | null> {
    return this.prisma.employee.findUnique({
      where: employeeWhereUniqueInput,
    });
  }

  async employees(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.EmployeeWhereUniqueInput;
    where?: Prisma.EmployeeWhereInput;
    orderBy?: Prisma.EmployeeOrderByWithRelationInput;
  }): Promise<Employee[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.employee.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createEmployee(data: Prisma.EmployeeCreateInput): Promise<Employee> {
    return this.prisma.employee.create({
      data,
    });
  }

  async updateEmployee(params: {
    where: Prisma.EmployeeWhereUniqueInput;
    data: Prisma.EmployeeUpdateInput;
  }): Promise<Employee> {
    const { where, data } = params;
    return this.prisma.employee.update({
      data,
      where,
    });
  }

  async deleteEmployee(where: Prisma.EmployeeWhereUniqueInput): Promise<Employee> {
    return this.prisma.employee.delete({
      where,
    });
  }
}
