interface AtomChangeLogData {
  storeName: string;
  atomName: string;
  newValue: any;
  previousValue?: any;
  timestamp: number;
}

export function logAtomChange(logData: AtomChangeLogData): void {
  console.group(
    `%c[NUCLEUX] %c${logData.storeName}.${logData.atomName}`,
    'color: #6366f1; font-weight: bold; font-size: 12px;',
    'color: #374151; font-weight: bold; font-size: 12px;',
  );
  console.log('Previous:', logData.previousValue ?? '(N/A)');
  console.log('Current:', logData.newValue);
  console.log('Timestamp:', new Date(logData.timestamp).toISOString());
  console.log('Store:', logData.storeName);
  console.log('Atom:', logData.atomName);
  console.groupEnd();
}
