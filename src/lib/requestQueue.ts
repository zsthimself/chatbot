class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private readonly maxConcurrent = 3;
  private currentProcessing = 0;

  async add<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.currentProcessing >= this.maxConcurrent) return;
    this.processing = true;

    while (this.queue.length > 0 && this.currentProcessing < this.maxConcurrent) {
      const request = this.queue.shift();
      if (request) {
        this.currentProcessing++;
        try {
          await request();
        } catch (error) {
          console.error('Queue processing error:', error);
        }
        this.currentProcessing--;
      }
    }

    this.processing = false;
  }
}

export const requestQueue = new RequestQueue(); 