import { jest } from "@jest/globals";

// ---------------------------------------------------------------------------
// Mock the database layer so tests never touch a real Postgres connection.
// ---------------------------------------------------------------------------

// `@/db` constructs a live Pool + drizzle instance on import. We stub the
// entire module so the pg Pool is never instantiated.
jest.mock("@/db", () => {
  // Each query builder is a chain: db.select({...}).from(table).where(...).
  // We store the most recent "rows" the test wants returned and resolve the
  // terminal awaitable to them.
  const state = {
    upstreamRows: [] as Array<{ dependsOn: number }>,
    statusRows: [] as Array<{ status: string }>,
    childRows: [] as Array<{ tid: number }>,
  };

  const makeChain = (resolveRows: () => unknown[]) => ({
    select: () => makeChain(resolveRows),
    from: () => makeChain(resolveRows),
    where: () => makeChain(resolveRows),
    orderBy: () => makeChain(resolveRows),
    limit: () => makeChain(resolveRows),
    then: (resolve: (value: unknown[]) => void) => Promise.resolve(resolveRows()).then(resolve),
  });

  const db = {
    select: (fields?: unknown) => {
      // Decide which bucket of rows to return based on the projected fields.
      // canCompleteTask projects { status }, getUpstreamDependencies projects
      // { dependsOn }, validateNoCycle projects { tid }.
      let resolver: () => unknown[];
      if (fields && typeof fields === "object" && "status" in fields) {
        resolver = () => state.statusRows;
      } else if (fields && typeof fields === "object" && "dependsOn" in fields) {
        resolver = () => state.upstreamRows;
      } else if (fields && typeof fields === "object" && "tid" in fields) {
        resolver = () => state.childRows;
      } else {
        resolver = () => [];
      }
      return makeChain(resolver);
    },
  };

  // Expose state so tests can seed rows without re-mocking.
  (db as unknown as { __state: typeof state }).__state = state;

  return { db };
});

// drizzle-orm operators (eq, and, inArray) are pure functions that return
// query fragments; the real implementation isn't exercised under the mock,
// but we still need them to be importable. The genuine module is fine here.
// `drizzle-orm/node-postgres` is pulled in transitively by @/db; since @/db
// is fully mocked, no DB driver code runs.

import { canCompleteTask, validateNoCycle } from "@/lib/dag";
import { db } from "@/db";

type DbState = {
  upstreamRows: Array<{ dependsOn: number }>;
  statusRows: Array<{ status: string }>;
  childRows: Array<{ tid: number }>;
};

function state(): DbState {
  return (db as unknown as { __state: DbState }).__state;
}

function reset(rows: Partial<DbState> = {}) {
  state().upstreamRows = rows.upstreamRows ?? [];
  state().statusRows = rows.statusRows ?? [];
  state().childRows = rows.childRows ?? [];
}

describe("canCompleteTask", () => {
  beforeEach(() => reset());

  it("returns true when the task has no upstream dependencies", async () => {
    // No dependency rows → deps.length === 0 → early return true.
    reset({ upstreamRows: [] });
    const result = await canCompleteTask(1, 100);
    expect(result).toBe(true);
  });

  it("returns true when every upstream task is complete", async () => {
    reset({
      upstreamRows: [{ dependsOn: 2 }, { dependsOn: 3 }],
      statusRows: [{ status: "complete" }, { status: "complete" }],
    });
    const result = await canCompleteTask(1, 100);
    expect(result).toBe(true);
  });

  it("returns false when any upstream task is not complete", async () => {
    reset({
      upstreamRows: [{ dependsOn: 2 }, { dependsOn: 3 }],
      statusRows: [{ status: "complete" }, { status: "todo" }],
    });
    const result = await canCompleteTask(1, 100);
    expect(result).toBe(false);
  });
});

describe("validateNoCycle", () => {
  beforeEach(() => reset());

  it("returns true when adding a dependency creates no cycle", async () => {
    // Task 1 wants to depend on task 2. Walking task 1's dependents, we find
    // none that equal 2, so no cycle is formed.
    reset({ childRows: [] });
    const result = await validateNoCycle(1, 2);
    expect(result).toBe(true);
  });

  it("returns false when a dependency would create a cycle", async () => {
    // A depends on B (taskId=1 dependsOnId=2). If B already depends on A,
    // then walking B's dependents returns task 1, which equals dependsOnId
    // only when we ask the reverse: B(2) depends on A(1) → from A's
    // perspective, A's dependents include 2 which equals dependsOnId=2 → cycle.
    //
    // Concretely: validateNoCycle(taskId=1, dependsOnId=2) means "1 depends
    // on 2". It walks tasks that depend on 1 (children). If 2 depends on 1,
    // child 2 appears in the walk and matches dependsOnId=2 → cycle.
    reset({ childRows: [{ tid: 2 }] });
    const result = await validateNoCycle(1, 2);
    expect(result).toBe(false);
  });
});
