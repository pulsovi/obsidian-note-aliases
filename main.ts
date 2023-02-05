// https://marcus.se.net/obsidian-plugin-docs/reference/typescript
import { Plugin, parseFrontMatterAliases } from 'obsidian';
import type { Editor, MarkdownView } from 'obsidian';

import { isNeedleAtIndex } from './util';

export default class NoteAliases extends Plugin {
  public onload (): void {
    this.addCommand({
      id: 'save-alias',
      name: 'Save alias of the link under cursor in the target note frontmatter',

      editorCheckCallback: (checking: boolean, editor: Editor, view: MarkdownView) => {
        const linkRe = /\[\[(?<target>[^[|]*)\|(?<alias>[^\]]*)\]\]/u;

        const position = editor.getCursor();
        const line = editor.getLine(position.line);
        const links = line.match(new RegExp(linkRe, 'gu')) ?? [];
        const link = links.find(match => isNeedleAtIndex(line, match, position.ch));

        if (!link) return false;
        if (checking) return true;

        const { alias, target } = linkRe.exec(link)?.groups ?? {};
        const fromPath = view.file.path;

        (async (): Promise<void> => {
          let targetFile = this.app.metadataCache.getFirstLinkpathDest(target, fromPath);
          if (!targetFile) {
            console.info('target file not exists', { checking, editor, view });
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
            return;
          }

          );
        })().catch(error => { console.error(error); });
        return true;
      },
    });
  }
}
