import { Controller, Get, Post, Delete, Param, Body, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { UserId } from '../common/user-id.decorator';
import { RaceChatService } from './race-chat.service';

@Controller('races/:raceId/chat')
export class RaceChatController {
  constructor(private readonly raceChatService: RaceChatService) {}

  @Get()
  async findByRace(@Param('raceId') raceId: string, @UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    const chat = await this.raceChatService.findByRace(raceId, userId);
    if (!chat) throw new NotFoundException('Race chat not found');
    return chat;
  }

  @Post()
  addMessage(
    @Param('raceId') raceId: string,
    @Body() body: { role: string; content: string },
    @UserId() userId: string,
  ) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.raceChatService.addMessage(raceId, userId, body.role, body.content);
  }

  @Delete()
  deleteChat(@Param('raceId') raceId: string, @UserId() userId: string) {
    if (!userId) throw new UnauthorizedException('User ID required');
    return this.raceChatService.deleteChat(raceId, userId);
  }
}
