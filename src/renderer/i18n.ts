import type { AppLanguage, MetaMode } from "../shared/types";

export interface ModeCopy {
  title: string;
  description: string;
}

export interface AppCopy {
  subtitle: string;
  targetTitle: string;
  targetSubtitle: string;
  select: string;
  instructionPrefix: string;
  instructionSuffix: string;
  accountLabel: string;
  accountPlaceholder: string;
  selectedPathPlaceholder: string;
  gridTitle: string;
  gridSubtitle: string;
  download: string;
  readyTitle: string;
  readyMessage: string;
  statusTitle: string;
  errorTitle: string;
  warningTitle: string;
  savedPrefix: string;
  backupPrefix: string;
  noBackup: string;
  filePrefix: string;
  manualFolder: string;
  noSteamFolder: string;
  autoFolder: string;
  selectedFolder: string;
  multipleAccounts: string;
  detectError: string;
  folderWarning: string;
  preparing: string;
  modes: Record<MetaMode, ModeCopy>;
}

export const LANGUAGE_SEQUENCE: AppLanguage[] = ["pt-BR", "en", "es"];

export const LANGUAGE_FLAG_CLASSES: Record<AppLanguage, string> = {
  "pt-BR": "flag-br",
  en: "flag-us",
  es: "flag-es"
};

export const LANGUAGE_NAMES: Record<AppLanguage, string> = {
  "pt-BR": "Português (Brasil)",
  en: "English",
  es: "Español"
};

export const COPY: Record<AppLanguage, AppCopy> = {
  "pt-BR": {
    subtitle: "Hero Grid atualizado direto na configuracao local do Dota 2.",
    targetTitle: "Pasta de destino",
    targetSubtitle: "Configure uma vez e reutilize nos proximos downloads.",
    select: "Selecionar",
    instructionPrefix: "Use a pasta",
    instructionSuffix: "Se houver mais de uma conta Steam, escolha o Steam ID usado para jogar Dota 2.",
    accountLabel: "Conta Steam",
    accountPlaceholder: "Escolha uma conta detectada",
    selectedPathPlaceholder: "Nenhuma pasta selecionada",
    gridTitle: "Tipo de grid",
    gridSubtitle: "Escolha o criterio e grave como hero_grid_config.json.",
    download: "Baixar",
    readyTitle: "Pronto",
    readyMessage: "Selecione uma pasta e escolha um modo para baixar.",
    statusTitle: "Status",
    errorTitle: "Erro",
    warningTitle: "Aviso",
    savedPrefix: "Salvo em",
    backupPrefix: "Backup criado:",
    noBackup: "Nenhum backup anterior encontrado.",
    filePrefix: "Arquivo:",
    manualFolder: "Pasta selecionada manualmente.",
    noSteamFolder: "Nenhuma pasta Steam\\userdata\\<SEU_ID>\\570\\remote\\cfg foi encontrada. Use Selecionar.",
    autoFolder: "Pasta detectada automaticamente",
    selectedFolder: "Pasta selecionada",
    multipleAccounts: "contas Steam encontradas. Escolha o Steam ID usado no Dota 2.",
    detectError: "Falha ao detectar pastas Steam.",
    folderWarning: "A pasta selecionada nao parece ser a pasta cfg do Dota 2.",
    preparing: "Preparando",
    modes: {
      "most-played": {
        title: "Most Played",
        description: "Top 7 herois mais escolhidos por funcao no patch atual."
      },
      "high-winrate": {
        title: "High Winrate",
        description: "Herois populares filtrados por mais de 50% de winrate."
      },
      "d2pt-rating": {
        title: "D2PT Rating",
        description: "Ranking pelo sistema de avaliacao do Dota2ProTracker."
      }
    }
  },
  en: {
    subtitle: "Hero Grid updated directly in the local Dota 2 configuration.",
    targetTitle: "Destination folder",
    targetSubtitle: "Configure once and reuse for future downloads.",
    select: "Select",
    instructionPrefix: "Use the folder",
    instructionSuffix: "If there is more than one Steam account, choose the Steam ID used for Dota 2.",
    accountLabel: "Steam account",
    accountPlaceholder: "Choose a detected account",
    selectedPathPlaceholder: "No folder selected",
    gridTitle: "Grid type",
    gridSubtitle: "Choose the criteria and save as hero_grid_config.json.",
    download: "Download",
    readyTitle: "Ready",
    readyMessage: "Select a folder and choose a mode to download.",
    statusTitle: "Status",
    errorTitle: "Error",
    warningTitle: "Warning",
    savedPrefix: "Saved to",
    backupPrefix: "Backup created:",
    noBackup: "No previous backup found.",
    filePrefix: "File:",
    manualFolder: "Folder selected manually.",
    noSteamFolder: "No Steam\\userdata\\<SEU_ID>\\570\\remote\\cfg folder was found. Use Select.",
    autoFolder: "Folder detected automatically",
    selectedFolder: "Folder selected",
    multipleAccounts: "Steam accounts found. Choose the Steam ID used in Dota 2.",
    detectError: "Failed to detect Steam folders.",
    folderWarning: "The selected folder does not look like the Dota 2 cfg folder.",
    preparing: "Preparing",
    modes: {
      "most-played": {
        title: "Most Played",
        description: "Top 7 most picked heroes by role in the current patch."
      },
      "high-winrate": {
        title: "High Winrate",
        description: "Popular heroes filtered by more than 50% winrate."
      },
      "d2pt-rating": {
        title: "D2PT Rating",
        description: "Ranking by the Dota2ProTracker rating system."
      }
    }
  },
  es: {
    subtitle: "Hero Grid actualizado directo en la configuracion local de Dota 2.",
    targetTitle: "Carpeta de destino",
    targetSubtitle: "Configura una vez y reutiliza en proximas descargas.",
    select: "Seleccionar",
    instructionPrefix: "Usa la carpeta",
    instructionSuffix: "Si hay mas de una cuenta Steam, elige el Steam ID usado para jugar Dota 2.",
    accountLabel: "Cuenta Steam",
    accountPlaceholder: "Elige una cuenta detectada",
    selectedPathPlaceholder: "Ninguna carpeta seleccionada",
    gridTitle: "Tipo de grid",
    gridSubtitle: "Elige el criterio y guarda como hero_grid_config.json.",
    download: "Descargar",
    readyTitle: "Listo",
    readyMessage: "Selecciona una carpeta y elige un modo para descargar.",
    statusTitle: "Estado",
    errorTitle: "Error",
    warningTitle: "Aviso",
    savedPrefix: "Guardado en",
    backupPrefix: "Backup creado:",
    noBackup: "No se encontro backup anterior.",
    filePrefix: "Archivo:",
    manualFolder: "Carpeta seleccionada manualmente.",
    noSteamFolder: "No se encontro ninguna carpeta Steam\\userdata\\<SEU_ID>\\570\\remote\\cfg. Usa Seleccionar.",
    autoFolder: "Carpeta detectada automaticamente",
    selectedFolder: "Carpeta seleccionada",
    multipleAccounts: "cuentas Steam encontradas. Elige el Steam ID usado en Dota 2.",
    detectError: "Error al detectar carpetas Steam.",
    folderWarning: "La carpeta seleccionada no parece ser la carpeta cfg de Dota 2.",
    preparing: "Preparando",
    modes: {
      "most-played": {
        title: "Most Played",
        description: "Top 7 heroes mas elegidos por rol en el patch actual."
      },
      "high-winrate": {
        title: "High Winrate",
        description: "Heroes populares filtrados por mas de 50% de winrate."
      },
      "d2pt-rating": {
        title: "D2PT Rating",
        description: "Ranking por el sistema de rating de Dota2ProTracker."
      }
    }
  }
};

export function detectInitialLanguage(locale = navigator.language): AppLanguage {
  const normalizedLocale = locale.toLowerCase();
  if (normalizedLocale.startsWith("pt")) {
    return "pt-BR";
  }
  if (normalizedLocale.startsWith("es")) {
    return "es";
  }
  return "en";
}

export function getNextLanguage(language: AppLanguage): AppLanguage {
  const currentIndex = LANGUAGE_SEQUENCE.indexOf(language);
  return LANGUAGE_SEQUENCE[(currentIndex + 1) % LANGUAGE_SEQUENCE.length];
}
