// https://marcus.se.net/obsidian-plugin-docs/reference/typescript
import { Plugin, parseFrontMatterAliases, parseYaml, stringifyYaml } from 'obsidian';
import type { Editor, MarkdownView, TFile } from 'obsidian';

import type { NoteAliasesSettings } from './src/Settings';
import NoteAliasesSettingTab, { DEFAULT_SETTINGS } from './src/Settings';
import { isNeedleAtIndex, log } from './src/util';

const linkRe = /\[\[(?<target>[^[|]*)\|(?<alias>[^\]]*)\]\]/u;

export default class NoteAliases extends Plugin {
  public settings: NoteAliasesSettings = DEFAULT_SETTINGS;

  public async loadSettings (): Promise<void> {
    this.settings = { ...DEFAULT_SETTINGS, ...(await this.loadData()) as NoteAliasesSettings };
  }

  public async onload (): Promise<void> {
    this.addSettingTab(new NoteAliasesSettingTab(this.app, this));
    await this.loadSettings();
    this.addCommands();
  }

  public async saveSettings (): Promise<void> {
    await this.saveData(this.settings);
  }

  private addCommands (): void {
    this.addCommand({
      id: 'save-alias',
      name: 'Save alias of the link under cursor in the target note frontmatter',

      editorCheckCallback: (checking: boolean, editor: Editor, view: MarkdownView) => {
        const position = editor.getCursor();
        const line = editor.getLine(position.line);
        const links = line.match(new RegExp(linkRe, 'gu')) ?? [];
        const link = links.find(match => isNeedleAtIndex(line, match, position.ch));

        if (!link) return false;
        if (checking) return true;

        this.saveAlias(view, link).catch(error => { console.info(error); });
        return true;
      },
    });
  }

  private async getTargetFile (target: string, fromPath: string): Promise<TFile> {
    const existFile = this.app.metadataCache.getFirstLinkpathDest(target, fromPath);
    if (existFile) return existFile;

    const targetPath = `${this.app.fileManager.getNewFileParent(fromPath).path}/${target}.md`;
    const targetFile = await this.app.vault.create(targetPath, '');
    return targetFile;
  }

  private async processFrontMatter (
    file: TFile, fn: (frontmatter: object) => void
  ): Promise<void> {
    if (typeof this.app.fileManager.processFrontMatter === 'function') {
      await this.app.fileManager.processFrontMatter(file, fn);
      return;
    }

    const frontMatterRe = /^---+\n(?<frontmatter>(?:.|\n)*)---+$/um;
    const contentBefore = await this.app.vault.read(file);
    const frontmatterStr = frontMatterRe.exec(contentBefore)?.[1];
    const frontmatter = (frontmatterStr ? parseYaml(frontmatterStr) : {}) as object;

    fn(frontmatter);

    const processedFrontMatter = `---\n${stringifyYaml(frontmatter)}---`;
    const contentAfter = frontmatterStr ?
      contentBefore.replace(frontMatterRe, processedFrontMatter) :
      `${processedFrontMatter}\n${contentBefore}`;

    await this.app.vault.modify(file, contentAfter);
  }

  private async saveAlias (view: MarkdownView, link: string): Promise<void> {
    const { alias, target } = linkRe.exec(link)?.groups ?? {};
    const fromPath = view.file.path;

    const targetFile = await this.getTargetFile(target, fromPath);
    log('saveAlias', { link, linkParse: { alias, target }, sourceFile: fromPath, targetFile });
    if (targetFile.extension !== 'md') return;

    await this.processFrontMatter(targetFile, (metadata: { aliases?: unknown }) => {
      const aliases = parseFrontMatterAliases(metadata) ?? [];
      const exists = aliases.some(item => item.toLowerCase() === alias.toLowerCase());

      if (exists) return;

      metadata.aliases = [...aliases, alias];
    });
  }
}
