import { Controller, Get, Post, Put, Param, Body, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { UpdateUserDto } from './dto/user.dto';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get(':email')
  findOne(@Param('email') email: string) {
    return this.userService.findOne(email);
  }

  @Post()
  create(@Body() userData: any) {
    return this.userService.create(userData);
  }

  @Put(':email')
  update(@Param('email') email: string, @Body() userData: UpdateUserDto) {
    return this.userService.update(email, userData);
  }

  @Post(':email/training-start')
  async setTrainingStart(@Param('email') email: string) {
    const user = await this.userService.findOne(email);
    if (!user) throw new NotFoundException('User not found');
    const firstAuth = !user.trainingStart && !user.onboardingSummary;
    await this.userService.update(email, { trainingStart: new Date() });
    return { firstAuth };
  }

  @Post(':email/onboarding-summary')
  setOnboardingSummary(@Param('email') email: string, @Body() body: { summary: string }) {
    return this.userService.update(email, { onboardingSummary: body.summary || '' });
  }

  @Post(':email/link-telegram')
  linkTelegram(@Param('email') email: string, @Body() body: { chatId: string }) {
    if (!body.chatId) throw new HttpException('chatId is required', HttpStatus.BAD_REQUEST);
    return this.userService.update(email, { telegramChatId: body.chatId });
  }

  @Post(':email/upload-image')
  async uploadImage(@Param('email') email: string, @Body() body: { image: string }) {
    try {
      const user = await this.userService.findOne(email);
      if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

      if (user.profileImage) {
        const oldId = this.cloudinaryService.extractPublicId(user.profileImage);
        if (oldId) await this.cloudinaryService.delete(oldId);
      }

      const publicId = `user_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const url = await this.cloudinaryService.uploadBase64(body.image, publicId);
      return this.userService.update(email, { profileImage: url });
    } catch (err) {
      if (err instanceof HttpException) throw err;
      const msg = err instanceof Error ? err.message : 'Upload failed';
      console.error('Upload image error:', err);
      throw new HttpException(msg, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
