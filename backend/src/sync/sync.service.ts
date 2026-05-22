import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { resolve } from 'path';

const execAsync = promisify(exec);

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  async refresh(): Promise<{ success: boolean; output: string }> {
    const projectRoot = resolve(__dirname, '..', '..', '..');
    const scriptPath = resolve(projectRoot, 'tools', 'sync-refresh.ts');

    this.logger.log(`Running sync script: ${scriptPath}`);

    try {
      const { stdout, stderr } = await execAsync(`npx tsx "${scriptPath}"`, {
        cwd: projectRoot,
        timeout: 300000,
        maxBuffer: 1024 * 1024,
      });
      const output = stdout + (stderr || '');
      this.logger.log(`Sync completed`);
      return { success: true, output };
    } catch (err: any) {
      const output = (err.stdout || '') + '\n' + (err.stderr || '') + '\n' + err.message;
      this.logger.error(`Sync failed: ${err.message}`);
      return { success: false, output };
    }
  }
}
