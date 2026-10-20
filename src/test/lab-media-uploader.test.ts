import { describe, expect, it, vi, beforeAll } from "vitest";

/** Falso IndexedDB in memoria: basta per put/getAll/delete usati dallo store ospite. */
const data = new Map<string, unknown>();
class Req<T> {
  result: T;
  error: unknown = null;
  onsuccess: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onupgradeneeded: (() => void) | null = null;
  constructor(result: T) {
    this.result = result;
  }
}
beforeAll(() => {
  (globalThis as unknown as { indexedDB: unknown }).indexedDB = {
    open() {
      const req = new Req<unknown>(null);
      const db = {
        createObjectStore: () => ({}),
        close: () => {},
        transaction: () => ({
          objectStore: () => ({
            put: (rec: { key: string }) => {
              const r = new Req(rec.key);
              queueMicrotask(() => {
                data.set(rec.key, rec);
                r.onsuccess?.();
              });
              return r;
            },
            delete: (key: string) => {
              const r = new Req(undefined);
              queueMicrotask(() => {
                data.delete(key);
                r.onsuccess?.();
              });
              return r;
            },
            getAll: () => {
              const r = new Req([...data.values()]);
              queueMicrotask(() => r.onsuccess?.());
              return r;
            },
          }),
        }),
      };
      queueMicrotask(() => {
        req.result = db;
        req.onupgradeneeded?.();
        req.onsuccess?.();
      });
      return req;
    },
  };
  if (!("createObjectURL" in URL)) {
    (URL as unknown as { createObjectURL: () => string }).createObjectURL = () => "blob:mock";
  }
});

/** Nessun componente montato: la coda viene usata direttamente, come farebbe il Lab smontato. */
async function freshModules() {
  vi.resetModules();
  const uploader = await import("@/models/lab-media-uploader");
  const store = await import("@/models/lab-media-store");
  return { uploader, store };
}

describe("caricamento in background dei file del Lab", () => {
  it("i file caricati come ospite finiscono nell'elenco anche senza pannello montato, per scheda", async () => {
    const { uploader, store } = await freshModules();
    const foto = new File(["foto"], "piazza.jpg", { type: "image/jpeg" });
    const clip = new File(["clip"], "vigneto.mp4", { type: "video/mp4" });

    uploader.enqueueUploads("urban", [foto], null);
    uploader.enqueueUploads("vineyard", [clip], null);

    await vi.waitFor(() => {
      expect(store.getMedia("urban")).toHaveLength(1);
      expect(store.getMedia("vineyard")).toHaveLength(1);
    });
    expect(store.getMedia("urban")[0]!.name).toBe("piazza.jpg");
    expect(store.getMedia("urban")[0]!.kind).toBe("image");
    expect(store.getMedia("vineyard")[0]!.kind).toBe("video");
    // Ospite: il blob resta anche ricaricando la pagina.
    expect(data.size).toBe(2);
  });

  it("i file senza formato riconosciuto sono marcati in errore e non entrano nell'elenco", async () => {
    const { uploader, store } = await freshModules();
    const strano = new File(["x"], "appunto.txt", { type: "text/plain" });

    uploader.enqueueUploads("urban", [strano], null);

    await vi.waitFor(() => {
      expect(store.getMedia("urban")).toHaveLength(0);
      expect(uploader.getUploads("urban")[0]!.status).toBe("error");
    });
  });

  it("la coda si svuota da sola dopo il completamento", async () => {
    const { uploader, store } = await freshModules();
    const foto = new File(["foto"], "piazza.jpg", { type: "image/jpeg" });
    uploader.enqueueUploads("urban", [foto], null);

    await vi.waitFor(() => {
      expect(store.getMedia("urban")).toHaveLength(1);
      expect(uploader.getUploads("urban")[0]!.status).toBe("done");
    });
    await new Promise((r) => setTimeout(r, 1700));
    expect(uploader.getUploads("urban")).toEqual([]);
  });
});
