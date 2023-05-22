// https://marcus.se.net/obsidian-plugin-docs/reference/typescript
import { Notice, Plugin, parseFrontMatterAliases, parseYaml, stringifyYaml } from 'obsidian';
import type { Editor, MarkdownView, TFile } from 'obsidian';

import type { NoteAliasesSettings } from './src/Settings';
import NoteAliasesSettingTab, { DEFAULT_SETTINGS } from './src/Settings';
import { getLinks, log } from './src/util';
import type { Link } from './src/util';

export default class NoteAliases extends Plugin {
  public settings: NoteAliasesSettings = DEFAULT_SETTINGS;

  private notice: Notice | null = null;

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
        const links = getLinks(line);
        const link = links.find(
          linkItem => linkItem.start <= position.ch && linkItem.end >= position.ch
        );

        if (!link) return false;
        if (checking) return true;

        this.saveAlias(view, link).catch(error => { console.error(error); });
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

  private async saveAlias (view: MarkdownView, link: Link): Promise<void> {
    const { alias } = link;
    if (!alias) return;

    const fromPath = view.file.path;
    const targetFile = await this.getTargetFile(link.target, fromPath);

    log('saveAlias', { link, sourceFile: fromPath, targetFile });
    if (targetFile.extension !== 'md') return;

    await this.processFrontMatter(targetFile, (metadata: { aliases?: unknown }) => {
      const aliases = parseFrontMatterAliases(metadata) ?? [];
      const exists = aliases.some(item => item === alias);

      if (exists) {
        this.notify(`save-alias: "${alias}" already in aliases list of "${targetFile.basename}"`);
        return;
      }

      metadata.aliases = [...aliases, alias];
      this.notify(`save-alias: "${alias}" saved in "${targetFile.basename}"`);
    });
  }

  private notify (message: string): void {
    this.notice?.hide();
    this.notice = new Notice(message);
  }
}
