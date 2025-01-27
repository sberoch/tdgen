export type Card = {
  classification: string;
  text: string;
};

const possibleTexts = [
  'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua.',
  'Optio a pariatur nulla non adipisci odio aliquam necessitatibus quidem tenetur distinctio assumenda atque culpa sunt, odit ab perspiciatis debitis? Fugiat praesentium cumque atque officia aliquam quo nesciunt esse neque dicta eius.',
  'Ducimus autem hic labore cum id harum aspernatur eaque ea neque cupiditate eum nam nesciunt, voluptatibus dolorum esse, doloribus illum iste! Numquam itaque provident reiciendis accusantium quasi repellat.',
  'Lorem ipsum dolor sit amet consectetur adipisicing elit. Ducimus autem hic labore cum id harum aspernatur eaque ea neque cupiditate eum nam nesciunt, voluptatibus dolorum esse, doloribus illum iste! Numquam itaque provident reiciendis accusantium quasi repellat.',
];

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

export const createCards = (length: number): Card[] => {
  return Array.from({ length }, (_, index) => ({
    classification: `E${index + 1}`,
    text: possibleTexts[index % possibleTexts.length],
  }));
};
