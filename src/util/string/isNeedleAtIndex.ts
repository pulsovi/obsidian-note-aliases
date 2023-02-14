export function isNeedleAtIndex (haystack: string, needle: string, index: number): boolean {
  let start = haystack.indexOf(needle);
  while (start !== -1) {
    if (start > index) return false;
    if ((start + needle.length) > index) return true;
    start = haystack.indexOf(needle, start + 1);
  }
  return false;
}
