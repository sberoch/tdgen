import { JobTask } from '@prisma/client';

/**
 * Calculates the weighted average pay group based on job tasks and their percentages
 * @param payGroupArray - Array of [pay_group, percentage] entries
 * @returns The weighted average formatted to two decimal places
 */
export function calculateWeightedPayGroupAverage(
  payGroupArray: [number, number][],
): number {
  // Handle empty input
  if (!payGroupArray || payGroupArray.length === 0) {
    return 0.0;
  }

  // Initialize calculation variables
  let weightedSum = 0;
  let percentageSum = 0;

  // Process each entry
  for (const [payGroup, percentage] of payGroupArray) {
    // Validate pay group range
    if (!Number.isInteger(payGroup) || payGroup < 1 || payGroup > 15) {
      throw new Error(
        `Invalid pay group value: ${payGroup}. Expected integer between 1 and 15.`,
      );
    }

    // Validate percentage is a number
    if (typeof percentage !== 'number' || isNaN(percentage)) {
      throw new Error(
        `Invalid percentage value: ${percentage}. Expected a number.`,
      );
    }

    // Add to sums
    weightedSum += payGroup * percentage;
    percentageSum += percentage;
  }

  // Validate percentage sum
  if (Math.abs(percentageSum - 100) > 0.1) {
    throw new Error(`Percentage sum (${percentageSum}) is not close to 100.`);
  }

  // Calculate weighted average
  const weightedAverage = weightedSum / 100;

  // Return formatted to two decimal places
  return parseFloat(weightedAverage.toFixed(2));
}

/**
 * Extracts pay group and percentage from job description tasks
 * @param jobDescriptionTasks - Array of job description tasks
 * @returns Array of [pay_group, percentage] entries for calculating weighted average
 */
export function extractPayGroupData(
  jobDescriptionTasks: Array<{
    jobTask: JobTask;
    percentage: number;
  }>,
): [number, number][] {
  if (!jobDescriptionTasks || jobDescriptionTasks.length === 0) {
    return [];
  }

  return jobDescriptionTasks.map((task) => {
    const metadata = task.jobTask.metadata as { paymentGroup: string };
    if (!metadata || !metadata.paymentGroup) {
      throw new Error('Missing paymentGroup in task metadata');
    }

    try {
      const paymentGroup = parseInt(metadata.paymentGroup.split(' ')[1]);
      if (
        !Number.isInteger(paymentGroup) ||
        paymentGroup < 1 ||
        paymentGroup > 15
      ) {
        throw new Error(`Invalid or missing pay group in task metadata`);
      }

      return [paymentGroup, task.percentage] as [number, number];
    } catch (error: any) {
      throw new Error('Invalid paymentGroup in task metadata', {
        cause: error,
      });
    }
  });
}

/**
 * Gets the weighted pay group average from job description tasks
 * @param jobDescriptionTasks - Array of job description tasks
 * @returns The weighted average pay group
 */
export function getWeightedPayGroupFromTasks(
  jobDescriptionTasks: Array<{
    jobTask: JobTask;
    percentage: number;
  }>,
): number {
  console.log({ jobDescriptionTasks });
  const payGroupData = extractPayGroupData(jobDescriptionTasks);
  return calculateWeightedPayGroupAverage(payGroupData);
}
