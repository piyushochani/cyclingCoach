import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AgentChatHistory } from './agent-chat-history.schema';

const MAX_KEPT_MESSAGES = 50;

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface LoadResult {
  messages: ChatMessage[];
  lastMessageTime: Date | null;
}

@Injectable()
export class AgentChatStoreService {
  private readonly logger = new Logger(AgentChatStoreService.name);

  constructor(
    @InjectModel(AgentChatHistory.name) private chatModel: Model<AgentChatHistory>,
  ) {}

  async load(userId: string, chatId: string): Promise<LoadResult> {
    const doc = await this.chatModel.findOne({
      userId: userId as any,
      chatId,
      archived: false,
    }).exec();

    if (!doc) return { messages: [], lastMessageTime: null };

    const messages: ChatMessage[] = doc.messages.map((m) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    }));

    return {
      messages: messages.slice(-MAX_KEPT_MESSAGES),
      lastMessageTime: doc.lastMessageTime,
    };
  }

  async appendMessage(userId: string, chatId: string, role: 'user' | 'assistant', content: string): Promise<void> {
    const doc = await this.chatModel.findOneAndUpdate(
      { userId: userId as any, chatId, archived: false },
      {
        $push: { messages: { role, content, timestamp: new Date() } },
        $set: { lastMessageTime: new Date(), updatedAt: new Date() },
        $setOnInsert: { userId: userId as any, chatId },
      },
      { upsert: true, returnDocument: 'after' },
    ).exec();

    if (doc.messages.length > MAX_KEPT_MESSAGES * 2) {
      const excess = doc.messages.length - MAX_KEPT_MESSAGES;
      doc.messages.splice(0, excess);
      doc.markModified('messages');
      await doc.save();
    }
  }

  async overwriteHistory(userId: string, chatId: string, messages: ChatMessage[]): Promise<void> {
    await this.chatModel.findOneAndUpdate(
      { userId: userId as any, chatId, archived: false },
      {
        $set: {
          messages: messages.map((m) => ({ ...m, timestamp: new Date() })),
          lastMessageTime: new Date(),
          updatedAt: new Date(),
        },
        $setOnInsert: { userId: userId as any, chatId },
      },
      { upsert: true },
    ).exec();
  }

  async archiveAndReset(userId: string, chatId: string): Promise<void> {
    const doc = await this.chatModel.findOne({
      userId: userId as any,
      chatId,
      archived: false,
    }).exec();

    if (doc) {
      doc.archived = true;
      await doc.save();
    }
  }

  async hasSession(userId: string, chatId: string): Promise<boolean> {
    const count = await this.chatModel.countDocuments({
      userId: userId as any,
      chatId,
      archived: false,
    }).exec();
    return count > 0;
  }
}
