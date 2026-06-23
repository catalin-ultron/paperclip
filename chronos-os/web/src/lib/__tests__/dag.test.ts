import { canCompleteTask, detectCycle } from "../dag";
import { db } from "../db";

jest.mock("../db", () => ({
  db: {
    select: jest.fn(() => ({ from: jest.fn(() => ({ where: jest.fn() })) })),
  },
}));

jest.mock("../db/schema", () => ({
  tasks: {},
  taskDependencies: {},
}));

const mockedDb = db as unknown as {
  select: jest.Mock;
};

describe("canCompleteTask", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns ok=true when no dependencies exist", async () => {
    const chain = {
      from: jest.fn(() => ({
        where: jest.fn().mockResolvedValueOnce([{ id: "t1", userId: "u1", status: "pending" }]),
      })),
    };
    mockedDb.select.mockReturnValueOnce(chain);
    mockedDb.select.mockReturnValueOnce({
      from: jest.fn(() => ({ where: jest.fn().mockResolvedValueOnce([]) })),
    });

    const result = await canCompleteTask("t1", "u1");
    expect(result.ok).toBe(true);
    expect(result.blockers).toEqual([]);
  });

  it("returns ok=false when prerequisites are pending", async () => {
    const taskChain = {
      from: jest.fn(() => ({
        where: jest.fn().mockResolvedValueOnce([{ id: "t1", userId: "u1", status: "pending" }]),
      })),
    };
    const depChain = {
      from: jest.fn(() => ({
        where: jest.fn().mockResolvedValueOnce([{ prereqId: "t0" }]),
      })),
    };
    const prereqChain = {
      from: jest.fn(() => ({
        where: jest.fn().mockResolvedValueOnce([
          { id: "t0", title: "Blocked Task", status: "pending" },
          { id: "t1", title: "Main Task", status: "pending" },
        ]),
      })),
    };
    mockedDb.select.mockReturnValueOnce(taskChain);
    mockedDb.select.mockReturnValueOnce(depChain);
    mockedDb.select.mockReturnValueOnce(prereqChain);

    const result = await canCompleteTask("t1", "u1");
    expect(result.ok).toBe(false);
    expect(result.blockers).toContain("Blocked Task");
  });
});

describe("detectCycle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns true when adding dependency creates a cycle", async () => {
    // t1 -> t2 exists, trying to add t2 -> t1 should detect cycle
    const chain = {
      from: jest.fn(() => ({
        where: jest.fn().mockResolvedValueOnce([{ prerequisiteTaskId: "t1" }]),
      })),
    };
    mockedDb.select.mockReturnValue(chain);

    const result = await detectCycle("t1", "t2");
    expect(result).toBe(true);
  });

  it("returns false for acyclic addition", async () => {
    const chain = {
      from: jest.fn(() => ({
        where: jest.fn().mockResolvedValueOnce([]),
      })),
    };
    mockedDb.select.mockReturnValue(chain);

    const result = await detectCycle("t1", "t2");
    expect(result).toBe(false);
  });
});
