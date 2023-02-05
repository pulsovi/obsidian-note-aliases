// https://marcus.se.net/obsidian-plugin-docs/reference/typescript
import { Plugin, parseFrontMatterAliases } from 'obsidian';
import type { Editor, MarkdownView } from 'obsidian';

import { isNeedleAtIndex } from './util';

const linkRe = /\[\[(?<target>[^[|]*)\|(?<alias>[^\]]*)\]\]/u;

export default class NoteAliases extends Plugin {
  public onload (): void {
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

        this.saveAlias(editor, view, link).catch(error => { console.info(error); });
        return true;
      },
    });
  }

  private async saveAlias (editor: Editor, view: MarkdownView, link: string): Promise<void> {
    const { alias, target } = linkRe.exec(link)?.groups ?? {};

    const fromPath = view.file.path;
    let targetFile = this.app.metadataCache.getFirstLinkpathDest(target, fromPath);

    if (!targetFile) {
      console.info('target file not exists', { editor, link, view });
      const targetPath = `${this.app.fileManager.getNewFileParent(fromPath).path}/${target}.md`;
      targetFile = await this.app.vault.create(targetPath, '');
      console.info(targetFile);
    }

    if (targetFile.extension !== 'md') return;

    if (typeof this.app.fileManager.processFrontMatter === 'function') {
      await this.app.fileManager.processFrontMatter(
        targetFile,
        (metadata: { aliases?: unknown }) => {
          const aliases = parseFrontMatterAliases(metadata) ?? [];
          const exists = aliases.some(item => item.toLowerCase() === alias.toLowerCase());

          if (exists) return;

          metadata.aliases = [...aliases, alias];
        }
      );
    }
  }
}
