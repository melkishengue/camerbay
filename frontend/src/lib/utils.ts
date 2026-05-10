export const truncateTitle = (title: string, maxLength: number = 35) => {
  return title.length > maxLength
    ? `${title.substring(0, maxLength)}...`
    : title;
};
