// South Africa's 11 official languages. `name` is the label sent to the
// translation backend; `native` is shown to the user in the picker.
export interface AppLanguage {
  code: string;
  name: string;
  native: string;
}

export const DEFAULT_LANGUAGE = 'en';

export const LANGUAGES: AppLanguage[] = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'af', name: 'Afrikaans', native: 'Afrikaans' },
  { code: 'zu', name: 'isiZulu', native: 'isiZulu' },
  { code: 'xh', name: 'isiXhosa', native: 'isiXhosa' },
  { code: 'nso', name: 'Sepedi', native: 'Sepedi' },
  { code: 'st', name: 'Sesotho', native: 'Sesotho' },
  { code: 'tn', name: 'Setswana', native: 'Setswana' },
  { code: 'ts', name: 'Xitsonga', native: 'Xitsonga' },
  { code: 'ss', name: 'siSwati', native: 'siSwati' },
  { code: 've', name: 'Tshivenda', native: 'Tshivenḓa' },
  { code: 'nr', name: 'isiNdebele', native: 'isiNdebele' },
];

export function findLanguage(code: string): AppLanguage {
  return LANGUAGES.find((l) => l.code === code) || LANGUAGES[0];
}
