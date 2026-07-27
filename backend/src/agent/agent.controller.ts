import { Controller, Post, Body, UnauthorizedException, Res } from '@nestjs/common';
import { Response } from 'express';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserId } from '../common/user-id.decorator';
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

  @Post('chat/stream')
  async chatStream(
    @Body() body: { message: string; chatId?: string },
    @UserId() userId: string,
    @Res() res: Response,
  ) {
    if (!userId) {
      res.status(401).json({ message: 'User ID required' });
      return;
    }
    if (!body.message || !body.message.trim()) {
      res.status(400).json({ message: 'Please provide a message.' });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    try {
      for await (const event of this.agentService.chatStream(userId, body.message, body.chatId)) {
        res.write(`event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`);
      }
    } catch (err) {
      res.write(`event: error\ndata: ${JSON.stringify({ message: (err as Error).message || 'Stream failed' })}\n\n`);
    }

    res.end();
  }

  @Post('telegram-chat')
  async telegramChat(
    @Body() body: { message: string; telegramChatId: string },
  ) {
    if (!body.message || !body.message.trim()) {
      return { text: 'Please provide a message.' };
    }
    if (!body.telegramChatId) {
      return { text: 'Telegram chat ID is required.' };
    }

    const user = await this.userModel.findOne({ telegramChatId: String(body.telegramChatId) }).lean().exec();
    if (!user) {
      return { text: 'Your Telegram account is not linked. Please link it from the Cycling Coach web dashboard: go to Profile > Link Telegram.' };
    }

    return this.agentService.chat(String(user._id), body.message, `telegram:${body.telegramChatId}`);
  }
}
