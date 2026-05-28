import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Expense } from './expense.schema';

@Injectable()
export class ExpenseService {
  constructor(
    @InjectModel(Expense.name) private expenseModel: Model<Expense>,
  ) {}

  findAll(): Promise<Expense[]> {
    return this.expenseModel.find().sort({ date: -1 }).exec();
  }

  findAllByUserId(userId: any): Promise<Expense[]> {
    return this.expenseModel.find({ user: userId as any }).sort({ date: -1 }).exec();
  }

  create(expense: Partial<Expense>): Promise<Expense> {
    const newExpense = new this.expenseModel(expense);
    return newExpense.save();
  }

  update(id: string, expense: Partial<Expense>, userId?: any): Promise<Expense | null> {
    const filter: any = { _id: id };
    if (userId) filter.user = userId as any;
    return this.expenseModel.findOneAndUpdate(filter, expense, { new: true }).exec();
  }

  delete(id: string, userId?: any): Promise<Expense | null> {
    const filter: any = { _id: id };
    if (userId) filter.user = userId as any;
    return this.expenseModel.findOneAndDelete(filter).exec();
  }
}
