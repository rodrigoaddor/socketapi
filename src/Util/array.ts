export const nextIn = <T>(array: T[], current: T): T => {
  const index = array.indexOf(current);
  if (index === array.length - 1) return array[0];
  return array[index + 1];
};
