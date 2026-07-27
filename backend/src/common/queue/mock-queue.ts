const executingQueues = new Set<string>();

export class MockQueue {
  private jobs: Map<string, any[]> = new Map();
  private directHandler: ((name: string, data: any) => Promise<any>) | null = null;
  private queueName: string = '';

  constructor(name?: string) {
    this.queueName = name || '';
  }

  registerDirectHandler(handler: (name: string, data: any) => Promise<any>) {
    this.directHandler = handler;
  }

  async add(name: string, data: any, opts?: any) {
    const arr = this.jobs.get(name) || [];
    arr.push({ data, opts, timestamp: Date.now() });
    this.jobs.set(name, arr);

    const jobId = opts?.jobId || `mock_${Date.now()}`;
    let returnvalue: unknown;

    if (this.directHandler && !executingQueues.has(this.queueName)) {
      executingQueues.add(this.queueName);
      try {
        returnvalue = await this.directHandler(name, data);
      } finally {
        executingQueues.delete(this.queueName);
      }
    }

    return { id: jobId, name, data, opts, returnvalue };
  }

  async getJob(name: string) {
    const arr = this.jobs.get(name) || [];
    return arr.length > 0 ? arr[arr.length - 1] : null;
  }

  async getJobs() {
    const all: any[] = [];
    this.jobs.forEach((arr) => all.push(...arr));
    return all;
  }

  async obliterate() {}
  async close() {}
}

export function createMockQueueProvider(name: string) {
  return {
    provide: `BullQueue_${name}`,
    useFactory: () => new MockQueue(name),
  };
}
