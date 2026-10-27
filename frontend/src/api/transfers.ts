import type { CompletedTransfer, CreateTransferInput } from '@/types/api';

import { postData } from './client';

export function createTransfer(input: CreateTransferInput): Promise<CompletedTransfer> {
  return postData<CompletedTransfer>('/transfers', input);
}
