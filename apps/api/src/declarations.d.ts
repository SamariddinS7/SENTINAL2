declare module 'onnxruntime-node' {
  export class InferenceSession {
    static create(path: string, options?: any): Promise<InferenceSession>;
    run(feeds: any, options?: any): Promise<any>;
    inputNames: string[];
    outputNames: string[];
    release(): void;
  }
  export class Tensor {
    constructor(type: string, data: any, dims: any);
  }
}

declare module 'tesseract.js';
declare module 'ioredis';
declare module 'nats';
declare module '@aws-sdk/client-s3';
declare module '@aws-sdk/lib-storage';
declare module '@aws-sdk/s3-request-presigner';
declare module 'express-rate-limit';
declare module 'pg';
