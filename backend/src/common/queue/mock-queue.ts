const executingQueues = new Set<string>();

export interface MockJobRecord {
  id: string;
  name: string;
  data: any;
  opts?: any;
  timestamp: number;
  status: 'waiting' | 'active' | 'completed' | 'failed';
  returnvalue?: any;
  failedReason?: string;
}

export class MockQueue {
  private jobs: Map<string, MockJobRecord> = new Map();
  private directHandler: ((name: string, data: any) => Promise<any>) | null = null;
  private queueName: string = '';
  private jobCounter = 0;

  constructor(name?: string) {
    this.queueName = name || '';
  }

  registerDirectHandler(handler: (name: string, data: any) => Promise<any>) {
    this.directHandler = handler;
  }

  async add(name: string, data: any, opts?: any) {
    const id = `mock_${++this.jobCounter}_${Date.now()}`;
    const job: MockJobRecord = {
      id,
      name,
      data,
      opts,
      timestamp: Date.now(),
      status: 'waiting',
    };
    this.jobs.set(id, job);

    if (this.directHandler && !executingQueues.has(this.queueName)) {
      executingQueues.add(this.queueName);
      job.status = 'active';
      // Fire-and-forget async execution
      Promise.resolve()
        .then(() => this.directHandler!(name, data))
        .then((result) => {
          job.status = 'completed';
          job.returnvalue = result;
        })
        .catch((err: Error) => {
          job.status = 'failed';
          job.failedReason = err?.message || String(err);
        })
        .finally(() => {
          executingQueues.delete(this.queueName);
        });
    }

    return { id, name, data, opts };
  }

  async getJob(id: string): Promise<MockJobRecord | null> {
    return this.jobs.get(id) || null;
  }

  async getJobs() {
    return Array.from(this.jobs.values());
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
