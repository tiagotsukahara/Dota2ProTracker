import { useState } from "react";
import type { AppLanguage } from "../../shared/types";
import { LANGUAGE_FLAG_CLASSES, LANGUAGE_NAMES, LANGUAGE_SEQUENCE } from "../i18n";

interface AppToolbarProps {
  subtitle: string;
  language: AppLanguage;
  onChangeLanguage: (language: AppLanguage) => void;
}

export function AppToolbar({ subtitle, language, onChangeLanguage }: AppToolbarProps) {
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);

  function selectLanguage(nextLanguage: AppLanguage) {
    onChangeLanguage(nextLanguage);
    setIsLanguageMenuOpen(false);
  }

  return (
    <section className="toolbar">
      <div>
        <h1>Dota2ProTracker Meta Grid</h1>
        <p>{subtitle}</p>
      </div>
      <div className="language-select">
        <button
          type="button"
          className="language-button"
          onClick={() => setIsLanguageMenuOpen((current) => !current)}
          title={`Language: ${LANGUAGE_NAMES[language]}`}
          aria-label={`Language: ${LANGUAGE_NAMES[language]}`}
          aria-haspopup="listbox"
          aria-expanded={isLanguageMenuOpen}
        >
          <span className={`language-flag ${LANGUAGE_FLAG_CLASSES[language]}`} aria-hidden="true" />
        </button>

        {isLanguageMenuOpen && (
          <div className="language-menu" role="listbox" aria-label="Language">
            {LANGUAGE_SEQUENCE.map((option) => (
              <button
                type="button"
                key={option}
                className={`language-option${option === language ? " selected" : ""}`}
                onClick={() => selectLanguage(option)}
                title={LANGUAGE_NAMES[option]}
                aria-label={LANGUAGE_NAMES[option]}
                aria-selected={option === language}
                role="option"
              >
                <span className={`language-flag ${LANGUAGE_FLAG_CLASSES[option]}`} aria-hidden="true" />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
