# Audit Examples Reference

Annotated before/after examples of the most common patterns caught in forensic audits.
Use these as calibration when writing findings and refactors.

---

## Pattern 1: Silent Failure Swallowing (Critical)

### Before
```typescript
private async getClient() {
    try {
        const { createClient } = await import('@supabase/supabase-js');
        this.supabase = createClient(url, key);
    } catch {
        // not available — fall through to null
    }
    return this.supabase;
}

async get(userId: string): Promise<Item | null> {
    const client = await this.getClient();
    if (!client) return null; // ← silent null = "not found" OR "DB is down"
}
```

### Why it's Critical
The caller receives `null` regardless of whether the record doesn't exist or the entire database is unreachable. In `scheduleReview`, this causes the service to treat every request as a "first time" encounter, silently resetting the user's SM-2 history to zero on every DB outage.

### After
```typescript
async get(userId: string): Promise<Item | null> {
    const client = await this.getClient(); // throws if unavailable
    const { data, error } = await client.from('...').select('*')...;
    if (error) throw new Error(`get() failed: ${error.message}`);
    return data ?? null; // null now ONLY means "not found"
}
```

---

## Pattern 2: Async Singleton Race Condition (Critical)

### Before
```typescript
private async getClient() {
    if (this.supabase) return this.supabase;    // check
    // ... await import(...)                     // yield — two callers both pass check
    this.supabase = createClient(url, key);     // double-init
}
```

### Why it's Critical
Two concurrent cold-start requests both pass the `if (this.supabase)` guard before either sets it. Both call `createClient`, producing two client instances. The second overwrites the first. With stateful clients (connection pools, auth tokens), this causes erratic behavior.

### After — Promise Lock Pattern
```typescript
private clientPromise: Promise<Client> | null = null;

private getClient(): Promise<Client> {
    // All concurrent callers share ONE promise. Physically impossible to double-init.
    this.clientPromise ??= this._initClient().catch(err => {
        if (!(err instanceof PermanentConfigError)) {
            this.clientPromise = null; // transient error → allow retry
        }
        throw err;
    });
    return this.clientPromise;
}
```

---

## Pattern 3: Permanent Self-Brick on Transient Error (Critical)

### Before
```typescript
private initFailed = false;

private async getClient() {
    if (this.initFailed) throw new Error('init previously failed');
    try {
        // ...
    } catch (e) {
        this.initFailed = true; // ← set on ANY error, including DNS blip
        throw e;
    }
}
```

### Why it's Critical
A 500ms network hiccup during cold start permanently marks the instance as dead. Every subsequent call throws forever, causing a total service outage until process restart. This conflates transient errors (retry-able) with permanent misconfiguration (fail-fast).

### After — Distinguish Transient vs Permanent
```typescript
class PermanentConfigError extends Error { readonly isPermanent = true; }

private async _initClient() {
    if (!url || !key) {
        // Missing env vars = permanent. Stay broken.
        const err = new PermanentConfigError('Missing SUPABASE env vars');
        this.clientPromise = Promise.reject(err);
        throw err;
    }
    // Network errors during import/createClient are transient.
    // The .catch in getClient() clears clientPromise → auto-retry on next call.
    const { createClient } = await import('@supabase/supabase-js');
    return createClient(url, key);
}
```

---

## Pattern 4: `this` Lost in `.map()` Callback (Moderate → live runtime bug)

### Before
```typescript
class Repo {
    private toItem(row: Row): Item { return { id: row.id }; }

    async getAll(): Promise<Item[]> {
        const { data } = await client.from('...').select('*');
        return data.map(this.toItem); // ← `this` is undefined inside map in strict mode
    }
}
```

### After — Arrow Property
```typescript
class Repo {
    // Arrow property: bound to `this` at instantiation, safe in any context
    private toItem = (row: Row): Item => ({ id: row.id });

    async getAll(): Promise<Item[]> {
        const { data } = await client.from('...').select('*');
        return data.map(this.toItem); // ✅ `this` preserved
    }
}
```

---

## Pattern 5: `created_at` Overwritten on Upsert (Critical if audit trails matter)

### Before
```typescript
await client.from('table').upsert({
    user_id: item.userId,
    created_at: now,   // ← sent on EVERY upsert, overwritten on every update
    updated_at: now,
}, { onConflict: 'user_id,concept_id' });
```

### Why it's Critical
`INSERT ... ON CONFLICT DO UPDATE SET` updates ALL columns you send, including `created_at`. Every update silently resets the creation timestamp. All historical analytics, audit trails, and time-series queries are corrupted.

### After — Omit created_at from application, enforce at DB level
```typescript
// Application: never send created_at
await client.from('table').upsert({
    user_id: item.userId,
    updated_at: now,
    // created_at intentionally omitted — DB DEFAULT handles insert, trigger locks updates
}, { onConflict: 'user_id,concept_id' });
```

```sql
-- DB migration: lock created_at via trigger
CREATE OR REPLACE FUNCTION lock_created_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_at = OLD.created_at;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_lock_created_at
  BEFORE UPDATE ON your_table
  FOR EACH ROW EXECUTE FUNCTION lock_created_at();
```

---

## Pattern 6: Global In-Memory Map as Production Storage (F-grade)

### Before
```typescript
const reviewQueue = new Map<string, ReviewItem>(); // module-level global
```

### Why it's F-grade
- **Ephemeral**: all data lost on every restart, deploy, or crash
- **Process-local**: two server instances have different data; load balancer routing determines which "version" of reality a user sees
- **Unbounded**: no eviction policy; grows forever; memory leak
- **Non-concurrent-safe**: fine in Node.js event loop, but one `await` gap = TOCTOU

### After — Repository Pattern
```typescript
export interface ReviewRepository {
    get(userId: string, conceptId: string): Promise<ReviewItem | null>;
    upsert(item: ReviewItem): Promise<void>;
    getDue(userId: string, asOf: Date, skillId?: string): Promise<ReviewItem[]>;
}
// Inject a real implementation (Postgres, Redis, Supabase) at the service layer.
// InMemoryReviewRepository stays around for tests and local dev — never for prod.
```

---

## Big-O Quick Reference

| Structure | get | insert | scan | notes |
|---|---|---|---|---|
| `Map` | O(1) avg | O(1) avg | O(n) | n = all entries across all users if unpartitioned |
| `Map<userId, Map<conceptId, V>>` | O(1) | O(1) | O(m) | m = entries for one user |
| SQL with index on `(user_id, next_review_at)` | O(1) | O(log n) | O(k) | k = results returned |
| Redis `ZRANGEBYSCORE` | O(log n + k) | O(log n) | O(k) | ideal for time-based scheduling |

When auditing getDue-style queries, always ask: **does the scan grow with total users or just one user's data?** A scan over all users' data is O(N) globally — a thundering herd risk at scale.