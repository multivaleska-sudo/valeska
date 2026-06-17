type LocalDbOperationState = {
  name: string;
  startedAt: number;
};

let activeOperation: LocalDbOperationState | null = null;
let operationTail: Promise<void> = Promise.resolve();

export const isLocalDbBusy = () => activeOperation !== null;

export const getActiveLocalDbOperation = () => activeOperation;

export const waitForLocalDbIdle = async () => {
  await operationTail;
};

export const runExclusiveLocalDbOperation = async <T>(
  name: string,
  operation: () => Promise<T>,
): Promise<T> => {
  const previousTail = operationTail;

  let releaseTail!: () => void;
  operationTail = new Promise<void>((resolve) => {
    releaseTail = resolve;
  });

  await previousTail;
  activeOperation = { name, startedAt: Date.now() };

  try {
    return await operation();
  } finally {
    activeOperation = null;
    releaseTail();
  }
};
