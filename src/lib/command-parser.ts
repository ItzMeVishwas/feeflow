// Rule-based parser for the command palette. Pure functions only:
// no AI calls, no network. The one import is the date formatter from invoice-status.
import { toIsoDate } from '@/lib/invoice-status';

export type ParsedCommand =
  | { kind: 'payment'; studentId: string; amount: number; month?: string } // month 'YYYY-MM'
  | { kind: 'remind'; studentId: string }
  | { kind: 'addStudent'; name: string; fee: number; batch?: string }
  | { kind: 'invoice'; studentId: string; amount: number; dueDate: string } // dueDate 'YYYY-MM-DD'
  | { kind: 'navigate'; href: string }
  | null;

export type CommandState = {
  students: { id: string; name: string; parentName: string; active: boolean }[];
};

type Student = CommandState['students'][number];

const MONTH_SHORT = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const MONTH_FULL = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

const NAV_ROUTES = new Map<string, string>([
  ['dashboard', '/dashboard'],
  ['students', '/students'],
  ['invoices', '/invoices'],
  ['bills', '/bills'],
  ['forecast', '/forecast'],
  ['settings', '/settings'],
]);

const REMIND_WORDS = ['remind', 'chase', 'nudge'];
const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']; // index = Date.getDay()
const WORD_PATTERN = /^[a-z]+$/;
const AMOUNT_PATTERN = /^\d+(\.\d+)?$/;

// Lowercase, trim, collapse whitespace, strip a leading ₹, remove commas inside numbers.
function normalise(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/^₹\s*/, '')
    .replace(/(\d),(?=\d)/g, '$1');
}

// "₹1,800", "1800", "1800.50" -> number. Returns null if not a positive amount.
function parseAmount(token: string): number | null {
  const cleaned = token.replace(/₹/g, '').replace(/,/g, '');
  if (!AMOUNT_PATTERN.test(cleaned)) return null;
  const value = Number(cleaned);
  return value > 0 ? value : null;
}

// 'jan' or 'january' -> 1..12, anything else -> null.
function monthNumber(word: string): number | null {
  const short = MONTH_SHORT.indexOf(word);
  if (short >= 0) return short + 1;
  const full = MONTH_FULL.indexOf(word);
  return full >= 0 ? full + 1 : null;
}

// Uses today's year; if the month is more than 6 months ahead, uses the previous year.
function resolveMonth(month: number, today: Date): string {
  let year = today.getFullYear();
  const currentMonthIndex = today.getFullYear() * 12 + today.getMonth();
  const candidateMonthIndex = year * 12 + (month - 1);
  if (candidateMonthIndex - currentMonthIndex > 6) {
    year -= 1;
  }
  return `${year}-${String(month).padStart(2, '0')}`;
}

// Accepts no tokens (undefined), or "for <month>" / "in <month>" (YYYY-MM string).
// Returns null when the tokens are present but not a valid month phrase.
function parseOptionalMonth(tokens: string[], today: Date): string | undefined | null {
  if (tokens.length === 0) return undefined;
  if (tokens.length !== 2 || (tokens[0] !== 'for' && tokens[0] !== 'in')) return null;
  const month = monthNumber(tokens[1]);
  return month === null ? null : resolveMonth(month, today);
}

function buildPayment(
  nameTokens: string[],
  amount: number,
  monthTokens: string[],
  state: CommandState,
  today: Date,
): ParsedCommand {
  const studentId = matchStudent(nameTokens.join(' '), state.students);
  if (studentId === null) return null;
  const month = parseOptionalMonth(monthTokens, today);
  if (month === null) return null;
  return month === undefined
    ? { kind: 'payment', studentId, amount }
    : { kind: 'payment', studentId, amount, month };
}

function addDays(base: Date, days: number): Date {
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + days);
}

// "today", "tomorrow", a weekday (next occurrence on or after today), or "YYYY-MM-DD" -> ISO date. Null otherwise.
function resolveDueDate(when: string, today: Date): string | null {
  if (when === 'today') return toIsoDate(addDays(today, 0));
  if (when === 'tomorrow') return toIsoDate(addDays(today, 1));

  if (/^\d{4}-\d{2}-\d{2}$/.test(when)) {
    const [year, month, day] = when.split('-').map(Number);
    const check = new Date(year, month - 1, day);
    const valid = check.getFullYear() === year && check.getMonth() === month - 1 && check.getDate() === day;
    return valid ? when : null;
  }

  const dayIndex = WEEKDAYS.findIndex((name) => when === name || when === name.slice(0, 3));
  if (dayIndex === -1) return null;
  const daysAhead = (dayIndex - today.getDay() + 7) % 7;
  return toIsoDate(addDays(today, daysAhead));
}

function titleCase(words: string[]): string {
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// First word of a string, lowercased. Empty string if there is none.
function firstWord(text: string): string {
  return text.trim().toLowerCase().split(/\s+/)[0] ?? '';
}

function levenshtein(a: string, b: string): number {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = curr;
  }
  return prev[b.length];
}

function isCloseTo(query: string, candidate: string): boolean {
  return candidate !== '' && levenshtein(query, candidate) <= 1;
}

// Result of trying to match inside one group of students:
// a student id (one clear match), null (ambiguous), or undefined (no candidates at all).
type PoolResult = string | null | undefined;

function resolveInPool(query: string, pool: Student[]): PoolResult {
  const exact = pool.filter(
    (s) => firstWord(s.name) === query || firstWord(s.parentName) === query,
  );
  if (exact.length > 0) return exact.length === 1 ? exact[0].id : null;

  if (query.length < 4) return undefined;
  const close = pool.filter(
    (s) => isCloseTo(query, firstWord(s.name)) || isCloseTo(query, firstWord(s.parentName)),
  );
  if (close.length === 0) return undefined;
  return close.length === 1 ? close[0].id : null;
}

// Matches a typed name against students by the first word of name or parentName.
// Active students are tried first; all students are tried only if active ones give no candidates.
export function matchStudent(query: string, students: CommandState['students']): string | null {
  const q = firstWord(query);
  if (q === '') return null;

  const fromActive = resolveInPool(q, students.filter((s) => s.active === true));
  if (fromActive !== undefined) return fromActive;

  return resolveInPool(q, students) ?? null;
}

export function parseCommand(text: string, state: CommandState, today: Date = new Date()): ParsedCommand {
  const tokens = normalise(text).split(' ').filter(Boolean);
  if (tokens.length === 0) return null;

  // "<name> paid <amount> [for <month>]"
  const paidIndex = tokens.indexOf('paid');
  if (paidIndex > 0) {
    const amount = parseAmount(tokens[paidIndex + 1] ?? '');
    if (amount !== null) {
      return buildPayment(tokens.slice(0, paidIndex), amount, tokens.slice(paidIndex + 2), state, today);
    }
  }

  // "received <amount> from <name> [for <month>]"
  if (tokens[0] === 'received' && tokens[2] === 'from' && tokens.length >= 4) {
    const amount = parseAmount(tokens[1]);
    if (amount !== null) {
      const stop = tokens.findIndex((t, i) => i >= 3 && (t === 'for' || t === 'in'));
      const nameTokens = stop === -1 ? tokens.slice(3) : tokens.slice(3, stop);
      const monthTokens = stop === -1 ? [] : tokens.slice(stop);
      return buildPayment(nameTokens, amount, monthTokens, state, today);
    }
  }

  // "remind <name>", "chase <name>", "nudge <name>"
  if (REMIND_WORDS.includes(tokens[0]) && tokens.length >= 2) {
    const studentId = matchStudent(tokens.slice(1).join(' '), state.students);
    return studentId === null ? null : { kind: 'remind', studentId };
  }

  // "add <name> <fee> [<batch> batch]" or "add <name> <fee> <batch>"
  if (tokens[0] === 'add') {
    let i = 1;
    while (i < tokens.length && WORD_PATTERN.test(tokens[i])) i++;
    const nameTokens = tokens.slice(1, i);
    if (nameTokens.length < 1 || nameTokens.length > 3 || i >= tokens.length) return null;

    const fee = parseAmount(tokens[i]);
    if (fee === null) return null;

    const rest = tokens.slice(i + 1);
    let batch: string | undefined;
    if (rest.length === 1 && WORD_PATTERN.test(rest[0]) && rest[0] !== 'batch') {
      batch = rest[0];
    } else if (rest.length === 2 && WORD_PATTERN.test(rest[0]) && rest[0] !== 'batch' && rest[1] === 'batch') {
      batch = rest[0];
    } else if (rest.length !== 0) {
      return null;
    }

    // The new student must not already exist.
    const typedName = nameTokens.join(' ');
    const alreadyKnown =
      state.students.some((s) => s.name.trim().toLowerCase() === typedName) ||
      matchStudent(typedName, state.students) !== null;
    if (alreadyKnown) return null;

    const name = titleCase(nameTokens);
    return batch === undefined ? { kind: 'addStudent', name, fee } : { kind: 'addStudent', name, fee, batch };
  }

  // "<name> owes <amount> due <when>", e.g. "rohan owes 1500 due friday"
  const owesIndex = tokens.indexOf('owes');
  if (owesIndex > 0) {
    const studentId = matchStudent(tokens.slice(0, owesIndex).join(' '), state.students);
    const amount = parseAmount(tokens[owesIndex + 1] ?? '');
    if (studentId === null || amount === null) return null;
    if (tokens[owesIndex + 2] !== 'due' || tokens.length !== owesIndex + 4) return null;
    const dueDate = resolveDueDate(tokens[owesIndex + 3], today);
    return dueDate === null ? null : { kind: 'invoice', studentId, amount, dueDate };
  }

  // "<page>" or "go to <page>"
  const navWord =
    tokens.length === 1 ? tokens[0] : tokens.length === 3 && tokens[0] === 'go' && tokens[1] === 'to' ? tokens[2] : null;
  if (navWord !== null) {
    const href = NAV_ROUTES.get(navWord);
    if (href !== undefined) return { kind: 'navigate', href };
  }

  return null;
}
