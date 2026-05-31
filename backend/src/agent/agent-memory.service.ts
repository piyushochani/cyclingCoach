import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AgentMemory } from './agent-memory.schema';

const SECTION_ORDER = [
  'person', 'schedule', 'goals', 'preferences', 'notes', 'medical-history',
  'cycling-profile', 'cycling-equipment', 'cycling-history',
];

@Injectable()
export class AgentMemoryService {
  private readonly logger = new Logger(AgentMemoryService.name);

  constructor(
    @InjectModel(AgentMemory.name) private memoryModel: Model<AgentMemory>,
  ) {}

  private async ensureMemory(userId: string): Promise<AgentMemory> {
    const existing = await this.memoryModel.findOne({ userId: userId as any }).exec();
    if (existing) return existing;
    return this.memoryModel.create({
      userId: userId as any,
      sections: new Map(),
      dailyNotes: [],
      currentPlan: null,
      updatedAt: new Date(),
    });
  }

  async getContext(userId: string): Promise<string> {
    const mem = await this.ensureMemory(userId);
    if (!mem) return '';

    const parts: string[] = [];

    for (const section of SECTION_ORDER) {
      const content = mem.sections?.get(section);
      if (content) {
        parts.push(`## ${section}\n${content}`);
      }
    }

    if (mem.dailyNotes && mem.dailyNotes.length > 0) {
      const recent = mem.dailyNotes.slice(-7);
      for (const entry of recent) {
        if (entry.notes?.length > 0) {
          parts.push(`## Daily Notes (${entry.date})\n${entry.notes.join('\n')}`);
        }
      }
    }

    if (mem.currentPlan) {
      parts.push(`## Current Training Plan\n${JSON.stringify(mem.currentPlan, null, 2)}`);
    }

    return parts.join('\n\n');
  }

  async writeSection(userId: string, section: string, content: string): Promise<void> {
    const mem = await this.ensureMemory(userId);
    mem.sections.set(section, content);
    mem.updatedAt = new Date();
    await mem.save();
  }

  async readSection(userId: string, section: string): Promise<string | null> {
    const mem = await this.ensureMemory(userId);
    return mem.sections?.get(section) || null;
  }

  async appendDailyNote(userId: string, note: string, date?: string): Promise<void> {
    const mem = await this.ensureMemory(userId);
    const today = date || new Date().toISOString().split('T')[0];
    const existing = mem.dailyNotes.find((d) => d.date === today);
    if (existing) {
      existing.notes.push(note);
    } else {
      mem.dailyNotes.push({ date: today, notes: [note] });
    }
    mem.updatedAt = new Date();
    await mem.save();
  }

  async savePlan(userId: string, plan: Record<string, any>): Promise<void> {
    const mem = await this.ensureMemory(userId);
    mem.currentPlan = plan;
    mem.updatedAt = new Date();
    await mem.save();
  }

  async loadPlan(userId: string): Promise<Record<string, any> | null> {
    const mem = await this.ensureMemory(userId);
    return mem.currentPlan || null;
  }
}
