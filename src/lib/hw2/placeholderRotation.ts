import { searchInput } from './dom';

const defaultSearchPlaceholder = 'Enter gamertag...';
const rotatingGamertags = ['xandy92', 'btc hosticide', 'American SKLz', 'Slashstorm', 'Jolly Sine', 'Powermoes114', 'TheCommander158', 'Nakamura RTS', 'KGB Officer', 'Blackandfan', 'TR AndrUwU', 'PatrossDev', 'TiberiusCN', 'Frcnzied', 'nvxHa', 'Gandalf The Fat', 'OwO senpai4668'];

let placeholderTimeoutId: number | null = null;
let placeholderRunId = 0;
let placeholderTarget = '';
let placeholderRendered = '';
let isDeletingPlaceholder = false;
let scriptedPlaceholderIndex = 0;
const scriptedPlaceholderGamertags = ['xandy92', 'American Sklz', 'btc hosticide'];
let lastPlaceholderGamertag = '';
const isSearchInputIdle = () => searchInput.value.trim() === '' && document.activeElement !== searchInput;

export function stopSearchPlaceholderRotation(reset = false) {
  placeholderRunId += 1;
  if (placeholderTimeoutId !== null) {
    window.clearTimeout(placeholderTimeoutId);
    placeholderTimeoutId = null;
  }
  placeholderTarget = '';
  placeholderRendered = '';
  isDeletingPlaceholder = false;
  if (reset && searchInput.value.trim() === '') {
    searchInput.placeholder = defaultSearchPlaceholder;
  }
}

function getRandomGamertag(): string {
  if (rotatingGamertags.length === 0) return '';
  while (scriptedPlaceholderIndex < scriptedPlaceholderGamertags.length) {
    const scripted = scriptedPlaceholderGamertags[scriptedPlaceholderIndex];
    scriptedPlaceholderIndex += 1;
    if (rotatingGamertags.includes(scripted)) {
      lastPlaceholderGamertag = scripted;
      return scripted;
    }
  }
  if (rotatingGamertags.length === 1) {
    lastPlaceholderGamertag = rotatingGamertags[0];
    return rotatingGamertags[0];
  }

  let next = lastPlaceholderGamertag;
  while (next === lastPlaceholderGamertag) {
    const index = Math.floor(Math.random() * rotatingGamertags.length);
    next = rotatingGamertags[index];
  }
  lastPlaceholderGamertag = next;
  return next;
}

function schedulePlaceholderTick(runId: number, delayMs: number) {
  placeholderTimeoutId = window.setTimeout(() => {
    if (runId !== placeholderRunId) return;
    if (!isSearchInputIdle()) {
      stopSearchPlaceholderRotation(true);
      return;
    }

    if (!placeholderTarget) {
      placeholderTarget = getRandomGamertag();
      placeholderRendered = '';
      isDeletingPlaceholder = false;
      if (!placeholderTarget) {
        searchInput.placeholder = defaultSearchPlaceholder;
        return;
      }
    }

    if (!isDeletingPlaceholder) {
      placeholderRendered = placeholderTarget.slice(0, placeholderRendered.length + 1);
      searchInput.placeholder = placeholderRendered;
      if (placeholderRendered === placeholderTarget) {
        isDeletingPlaceholder = true;
        schedulePlaceholderTick(runId, 2000);
        return;
      }
      schedulePlaceholderTick(runId, 70 + Math.floor(Math.random() * 70));
      return;
    }

    placeholderRendered = placeholderRendered.slice(0, -1);
    if (placeholderRendered.length > 0) {
      searchInput.placeholder = placeholderRendered;
      schedulePlaceholderTick(runId, 35 + Math.floor(Math.random() * 45));
      return;
    }

    searchInput.placeholder = defaultSearchPlaceholder;
    placeholderTarget = '';
    isDeletingPlaceholder = false;
    schedulePlaceholderTick(runId, 2000);
  }, delayMs);
}

export function startSearchPlaceholderRotation() {
  if (!isSearchInputIdle() || rotatingGamertags.length === 0) return;
  stopSearchPlaceholderRotation();
  placeholderRunId += 1;
  const runId = placeholderRunId;
  searchInput.placeholder = defaultSearchPlaceholder;
  schedulePlaceholderTick(runId, 300);
}
