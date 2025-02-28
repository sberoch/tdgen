export type Card = {
  classification: string;
  title: string;
  text: string;
  percentage: number;
};

const possibleTitles = [
  'Lorem ipsum dolor sit amet',
  'Consectetur adipiscing elit',
  'Sed do eiusmod tempor incididunt',
  'Ut labore et dolore magna aliqua',
];

const possibleTexts = [
  'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan et iusto odio dignissim qui blandit praesent luptatum zzril delenit augue duis dolore te feugait nulla facilisi. Nam liber tempor cum soluta nobis eleifend option congue nihil imperdiet doming id quod mazim placerat facer possim assum.',
  'Optio a pariatur nulla non adipisci odio aliquam necessitatibus quidem tenetur distinctio assumenda atque culpa sunt, odit ab perspiciatis debitis? Fugiat praesentium cumque atque officia aliquam quo nesciunt esse neque dicta eius. Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur? At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio.',
  'Ducimus autem hic labore cum id harum aspernatur eaque ea neque cupiditate eum nam nesciunt, voluptatibus dolorum esse, doloribus illum iste! Numquam itaque provident reiciendis accusantium quasi repellat. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.',
  'Lorem ipsum dolor sit amet consectetur adipisicing elit. Ducimus autem hic labore cum id harum aspernatur eaque ea neque cupiditate eum nam nesciunt, voluptatibus dolorum esse, doloribus illum iste! Numquam itaque provident reiciendis accusantium quasi repellat. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur?',
];

export const createCards = (length: number): Card[] => {
  return Array.from({ length }, (_, index) => ({
    classification: `EG ${index + 1}`,
    title: possibleTitles[index % possibleTitles.length],
    text: possibleTexts[index % possibleTexts.length],
    percentage: 5,
  }));
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
