import type NoteAliases from '../main';
import { App, PluginSettingTab, Setting } from 'obsidian';

export interface NoteAliasesSettings {
  debugMode: boolean;
}

export const DEFAULT_SETTINGS: NoteAliasesSettings = {
  debugMode: false,
};

let lastPlugin = { settings: DEFAULT_SETTINGS };

export default class NoteAliasesSettingTab extends PluginSettingTab {
  plugin: NoteAliases;

  constructor(app: App, plugin: NoteAliases) {
    super(app, plugin);
    this.plugin = plugin;
    lastPlugin = plugin;
  }

  display(): void {
    let { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName("Debug Mode")
      .setDesc("To display or not console debug messages")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.debugMode)
        .onChange(async (value) => {
          this.plugin.settings.debugMode = value;
          await this.plugin.saveSettings();
        })
      );
  }
}

export function getSettings (): NoteAliasesSettings {
  return lastPlugin.settings;
}
