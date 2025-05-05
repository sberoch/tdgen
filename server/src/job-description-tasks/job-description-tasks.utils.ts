export const balanceArray = (arr: number[]): number[] => {
  const sumArray = (arr: number[]) => arr.reduce((sum, curr) => sum + curr, 0);
  let maxAttempts = 100;

  while (sumArray(arr) !== 100 && maxAttempts > 0) {
    if (sumArray(arr) < 100) {
      const maxIndex = arr.indexOf(Math.max(...arr));
      arr[maxIndex] += 5;
    } else {
      const sortedIndices = arr
        .map((val, idx) => ({ val, idx }))
        .filter((item) => item.val > 5)
        .sort((a, b) => b.val - a.val);

      if (sortedIndices.length === 0) {
        throw new Error('No valid distribution possible');
      }

      arr[sortedIndices[0].idx] -= 5;
    }

    maxAttempts--;
  }

  if (maxAttempts === 0) {
    throw new Error('Could not balance array within reasonable attempts');
  }

  return arr;
};

export const calculateAdjustedPercentages = (
  newCount: number,
  existingPercentages: number[],
): number[] => {
  if (newCount === 0) return [];
  if (newCount === 1) return [100];

  const result = [...existingPercentages];
  // Add parts by splitting the largest value
  if (newCount > existingPercentages.length) {
    const maxVal = Math.max(...result);
    const maxIndex = result.indexOf(maxVal);
    if (maxVal <= 5) {
      throw new Error('Cannot split values smaller than or equal to 5%');
    }
    const halfValue = Math.floor(maxVal / 2);
    const firstHalf = Math.floor(halfValue / 5) * 5;
    const secondHalf = maxVal - firstHalf;
    if (firstHalf < 5 || secondHalf < 5) {
      return balanceArray(
        result.concat(Array(newCount - result.length).fill(5)),
      );
    }
    result.splice(maxIndex, 1);
    result.unshift(
      Math.min(firstHalf, secondHalf),
      Math.max(firstHalf, secondHalf),
    );
  }
  // Remove parts by merging with the next smaller value
  else if (newCount < existingPercentages.length) {
    const areAllDivisibleByFive = (arr: number[]) =>
      arr.every((num: number) => num % 5 === 0);
    while (result.length > newCount) {
      const smallest = Math.min(...result);
      const smallestIndex = result.indexOf(smallest);

      // Find the next smallest value
      let nextSmallest = Infinity;
      let nextSmallestIndex = -1;

      for (let i = 0; i < result.length; i++) {
        if (i !== smallestIndex && result[i] < nextSmallest) {
          nextSmallest = result[i];
          nextSmallestIndex = i;
        }
      }

      if (nextSmallestIndex === -1) {
        throw new Error('Cannot find valid merge target');
      }

      // Merge the values
      result[nextSmallestIndex] += result[smallestIndex];
      result.splice(smallestIndex, 1);

      // If the result is not divisible by 5, try balancing
      if (!areAllDivisibleByFive([result[nextSmallestIndex]])) {
        return balanceArray(result);
      }
    }
  }
  return result;
};
