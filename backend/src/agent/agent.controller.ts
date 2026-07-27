import { Controller, Post, Body, UnauthorizedException, Headers } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserId } from '../common/user-id.decorator';
import { Public } from '../common/public.decorator';
import { AgentService } from './agent.service';
import { User } from '../user/user.schema';

@Controller('agent')
export class AgentController {
  constructor(
    private readonly agentService: AgentService,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  @Post('chat')
  async chat(
    @Body() body: { message: string; chatId?: string },
    @UserId() userId: string,
  ) {
    if (!userId) throw new UnauthorizedException('User ID required');
    if (!body.message || !body.message.trim()) {
      return { text: 'Please provide a message.' };
    }
    return this.agentService.chat(userId, body.message, body.chatId);
  }

  @Public()
  @Post('telegram-chat')
  async telegramChat(
    @Body() body: { message: string; telegramChatId: string },
    @Headers('x-telegram-secret') webhookSecret?: string,
  ) {
    const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (expectedSecret && webhookSecret !== expectedSecret) {
      throw new UnauthorizedException('Invalid Telegram webhook secret');
    }

    if (!body.message || !body.message.trim()) {
      return { text: 'Please provide a message.' };
    }
    if (!body.telegramChatId) {
      return { text: 'Telegram chat ID is required.' };
    }

    const user = await this.userModel.findOne({ telegramChatId: String(body.telegramChatId) }).select('-passwordHash').lean().exec();
    if (!user) {
      return { text: 'Your Telegram account is not linked. Please link it from the Cycling Coach web dashboard: go to Profile > Link Telegram.' };
    }

    return this.agentService.chat(String(user._id), body.message, `telegram:${body.telegramChatId}`);
  }
}
