import { POST } from "../[id]/complete/route";
import { canCompleteTask } from "@/lib/dag";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";

jest.mock("@/lib/dag", () => ({
  canCompleteTask: jest.fn(),
}));

jest.mock("@/lib/auth", () => ({
  getCurrentUserId: jest.fn().mockResolvedValue("test-user"),
}));

jest.mock("@/lib/db", () => ({
  db: {
    update: jest.fn(() => ({
      set: jest.fn(() => ({
        where: jest.fn(() => ({
          returning: jest.fn().mockResolvedValue([{ id: "t1", status: "complete" }]),
        })),
      })),
    })),
  },
}));

jest.mock("@/lib/db/schema", () => ({
  tasks: {},
}));

const mockedCanComplete = canCompleteTask as jest.MockedFunction<typeof canCompleteTask>;
const mockedDbUpdate = db.update as jest.Mock;

describe("POST /api/tasks/[id]/complete", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function makeRequest(body?: unknown) {
    return new Request("http://localhost/api/tasks/t1/complete", {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  it("returns 409 when dependencies are incomplete", async () => {
    mockedCanComplete.mockResolvedValue({ ok: false, blockers: ["Setup database"] });

    const req = makeRequest();
    const res = await POST(req, { params: { id: "t1" } });
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toBe("Blocked by incomplete dependencies");
    expect(json.blockers).toEqual(["Setup database"]);
    expect(mockedDbUpdate).not.toHaveBeenCalled();
  });

  it("returns 200 and marks complete when dependencies are satisfied", async () => {
    mockedCanComplete.mockResolvedValue({ ok: true, blockers: [] });

    const req = makeRequest();
    const res = await POST(req, { params: { id: "t1" } });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.status).toBe("complete");
    expect(mockedDbUpdate).toHaveBeenCalled();
  });
});
