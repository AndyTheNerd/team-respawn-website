/**
 * Minimal in-memory CrudInterface implementation for brackets-manager.
 * Can be hydrated from a plain JSON object and serialized back to one.
 */

type Row = { id: number; [key: string]: unknown };
type Tables = 'tournament' | 'stage' | 'group' | 'round' | 'match' | 'match_game' | 'participant';

export interface BracketData {
  tournament: Row[];
  stage: Row[];
  group: Row[];
  round: Row[];
  match: Row[];
  match_game: Row[];
  participant: Row[];
}

export class InMemoryDatabase {
  private data: BracketData;
  private counters: Record<string, number>;

  constructor(initial?: BracketData) {
    this.data = initial ?? {
      tournament: [],
      stage: [],
      group: [],
      round: [],
      match: [],
      match_game: [],
      participant: [],
    };
    // Initialize auto-increment counters based on existing data
    this.counters = {} as Record<string, number>;
    for (const table of Object.keys(this.data) as Tables[]) {
      const rows = this.data[table];
      this.counters[table] = rows.length > 0 ? Math.max(...rows.map((r: Row) => Number(r.id))) + 1 : 0;
    }
  }

  get content(): BracketData {
    return this.data;
  }

  async insert(table: Tables, value: Omit<Row, 'id'> | Omit<Row, 'id'>[]): Promise<number> {
    if (Array.isArray(value)) {
      for (const item of value) {
        const id = this.counters[table]++;
        (this.data[table] as Row[]).push({ ...item, id } as Row);
      }
      return value.length;
    }
    const id = this.counters[table]++;
    (this.data[table] as Row[]).push({ ...value, id } as Row);
    return id;
  }

  async select(table: Tables, filter?: number | Partial<Row>): Promise<Row[] | Row | null> {
    const rows = this.data[table] as Row[];
    if (filter === undefined) return rows;
    if (typeof filter === 'number') {
      return rows.find(r => r.id === filter) ?? null;
    }
    const keys = Object.keys(filter);
    const results = rows.filter(r => keys.every(k => r[k] === (filter as Partial<Row>)[k]));
    return results.length > 0 ? results : null;
  }

  async update(table: Tables, filter: number | Partial<Row>, value: Partial<Row>): Promise<boolean> {
    const rows = this.data[table] as Row[];
    if (typeof filter === 'number') {
      const idx = rows.findIndex(r => r.id === filter);
      if (idx === -1) return false;
      rows[idx] = { ...rows[idx], ...value };
      return true;
    }
    const keys = Object.keys(filter);
    let updated = false;
    for (let i = 0; i < rows.length; i++) {
      if (keys.every(k => rows[i][k] === (filter as Partial<Row>)[k])) {
        rows[i] = { ...rows[i], ...value };
        updated = true;
      }
    }
    return updated;
  }

  async delete(table: Tables, filter?: Partial<Row>): Promise<boolean> {
    const rows = this.data[table] as Row[];
    if (!filter) {
      this.data[table] = [] as any;
      return true;
    }
    const keys = Object.keys(filter);
    const before = rows.length;
    (this.data[table] as Row[]) = rows.filter(
      r => !keys.every(k => r[k] === (filter as Partial<Row>)[k])
    ) as any;
    return (this.data[table] as Row[]).length < before;
  }
}
