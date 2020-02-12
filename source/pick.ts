export const pickFunctionBodyAndTypeStructure = (code: string) => {
  code.match(/@id ([0123456789abcdef]{32})/u);
};
