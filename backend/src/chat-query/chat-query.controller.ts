import { Controller, Post, Body } from '@nestjs/common';
import { UserId } from '../common/user-id.decorator';
import { ChatQueryService } from './chat-query.service';

@Controller('chat')
export class ChatQueryController {
  constructor(private readonly chatQueryService: ChatQueryService) {}

  @Post('query')
  async query(
    @Body() body: { message: string },
    @UserId() userId: string,
  ) {
    return this.chatQueryService.query(userId, body.message);
  }
}
