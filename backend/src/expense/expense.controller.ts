import { Controller, Get, Post, Put, Delete, Body, Param, UnauthorizedException } from '@nestjs/common';
import { UserId } from '../common/user-id.decorator';
import { ExpenseService } from './expense.service';
import { CreateExpenseDto, UpdateExpenseDto } from './dto/expense.dto';

@Controller('expenses')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Get()
  findAll(@UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.expenseService.findAllByUserId(userId);
  }

  @Post()
  create(@Body() expenseData: CreateExpenseDto, @UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.expenseService.create({ ...expenseData, user: userId as any });
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() expenseData: UpdateExpenseDto, @UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.expenseService.update(id, expenseData, userId);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.expenseService.delete(id, userId);
  }
}
