import { JobTask } from '../types/job-tasks';

export type Card = {
  classification: string;
  jobTask: JobTask;
  title: string;
  text: string;
  percentage: number;
  order: number;
  tags: string[];
};

const pastelColors = [
  '#ffebf0',
  '#e6f5ff',
  '#ffffe6',
  '#ebffeb',
  '#f5ebf5',
  '#fff0eb',
  '#ebfff0',
  '#faf5ff',
  '#fff5eb',
  '#f0ffff',
];

export const getNextPastelColor = (currentIndex: number): string => {
  return pastelColors[currentIndex % pastelColors.length];
};

export const truncateText = (text: string, maxLength: number): string => {
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};
