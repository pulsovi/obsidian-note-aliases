export interface Link {
  /** The start position of the link text in the text */
  start: number;
  /** The end position of the link text in the text */
  end: number;
  /** The target string in the parsed link */
  target: string;
  /** The anchor string in the parsed link */
  anchor: string;
  /** The alias string in the parsed link */
  alias?: string;
  /** The title string in the parsed link */
  title?: string;
}

export function getLinks (text: string): Link[] {
  return getWikilinks(text).concat(getMdlinks(text));
}

export function getWikilinks (text: string): Link[] {
  const linkRe = /\[\[(?<target>[^[|#]*)(?:#(?<anchor>[^[|]*))?\|(?<alias>[^\]]*)\]\]/gu;
  const found: Link[] = [];
  for (const match of text.matchAll(linkRe)) {
    found.push(getLinkFromMatch(match, text));
  }
  return found;
}

export function getMdlinks (text: string): Link[] {
  const linkBrRe = /\[(?<alias>(?:[^\]\\]|\\\]|\\[^\]])*)\]\(<(?<target>[^#>"]*)(?:#(?<anchor>[^>"]*))?(?: "(?<title>[^>]*)")?>\)/gu;
  const linkRe = /\[(?<alias>(?:[^\]\\]|\\\]|\\[^\]])*)\]\((?<target>[^ #\)]*)(?:#(?<anchor>[^\) ]*))?(?: "(?<title>[^>]*)")?\)/gu;
  const found: Link[] = [];
  for (const match of text.matchAll(linkRe)) {
    found.push(getLinkFromMatch(match, text));
  }
  for (const match of text.matchAll(linkBrRe)) {
    found.push(getLinkFromMatch(match, text));
  }
  return found;
}

  function getLinkFromMatch (match: RegExpMatchArray, text: string): Link {
    const start = match.index || 0;
    const end = start + match[0].length;
    const { target, anchor, alias, title } = match.groups!;
    return { target, anchor, alias, title, start, end };
  }
