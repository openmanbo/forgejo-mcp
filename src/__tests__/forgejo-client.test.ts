import { ForgejoClient, ForgejoError } from "../forgejo-client";

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

function mockResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

describe("ForgejoClient", () => {
  let client: ForgejoClient;

  beforeEach(() => {
    mockFetch.mockReset();
    client = new ForgejoClient({
      baseUrl: "https://codeberg.org",
      token: "test-token",
    });
  });

  it("sends GET with correct URL and auth header", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(200, { id: 1 }));
    const result = await client.get<{ id: number }>("/user");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://codeberg.org/api/v1/user");
    expect((options.headers as Record<string, string>)["Authorization"]).toBe(
      "token test-token",
    );
    expect(result).toEqual({ id: 1 });
  });

  it("appends query params to GET requests", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(200, []));
    await client.get("/repos/issues/search", {
      q: "bug",
      state: "open",
      page: 1,
      limit: 10,
      undef: undefined,
    });

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("q=bug");
    expect(url).toContain("state=open");
    expect(url).toContain("page=1");
    expect(url).toContain("limit=10");
    // undefined values should be omitted
    expect(url).not.toContain("undef");
  });

  it("sends POST with JSON body", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(201, { id: 5, title: "new" }));
    const body = { title: "new", body: "desc" };
    await client.post("/repos/owner/repo/issues", body);

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(options.method).toBe("POST");
    expect(options.body).toBe(JSON.stringify(body));
  });

  it("throws ForgejoError on non-2xx response", async () => {
    mockFetch.mockResolvedValue(mockResponse(404, { message: "Not Found" }));

    const err = await client.get("/repos/missing/repo").catch((e) => e) as ForgejoError;
    expect(err).toBeInstanceOf(ForgejoError);
    expect(err.status).toBe(404);
  });

  it("handles 204 No Content response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      statusText: "No Content",
      json: async () => {
        throw new Error("no body");
      },
    } as unknown as Response);

    const result = await client.delete("/repos/owner/repo/issues/1");
    expect(result).toEqual({});
  });

  it("normalises trailing slashes in base URL", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(200, {}));
    const c = new ForgejoClient({
      baseUrl: "https://codeberg.org/",
      token: "t",
    });
    await c.get("/user");
    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://codeberg.org/api/v1/user");
    expect(url).not.toContain("//api");
  });
});
