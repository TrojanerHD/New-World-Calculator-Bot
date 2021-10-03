import fs from 'fs';

export interface SettingsJSON {
  'permission-roles': string[];
}

export default class Settings {
  static #settingsFile: string = './settings.json';
  static #settings: SettingsJSON = {
    'permission-roles': [],
  };

	static getSettings(): SettingsJSON {
		if (!fs.existsSync(Settings.#settingsFile)) Settings.saveSettings();
		else {
			const settingsFileContent: string = fs.readFileSync(Settings.#settingsFile, 'utf8');
			if (!Settings.isJsonString(settingsFileContent)) Settings.saveSettings();
			else Settings.#settings = JSON.parse(settingsFileContent);
		}
		return Settings.#settings;
	}

	private static saveSettings(): void {
		fs.writeFileSync(Settings.#settingsFile, JSON.stringify(Settings.#settings, null, 2), 'utf8');
	}

	public static isJsonString(str: string): boolean {
		try {
			JSON.parse(str);
		} catch (e) {
			return false;
		}
		return true;
	}
}
