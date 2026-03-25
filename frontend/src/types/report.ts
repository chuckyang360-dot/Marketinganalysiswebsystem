export interface ReportSection {
  id: string;
  label: string;
  order: number;
  // 预留：未来如果需要展开子项，可在这里补 children
  children?: ReportSection[];
}

