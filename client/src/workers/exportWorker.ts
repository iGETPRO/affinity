type ExportPayload = string | ArrayBuffer;
type ExportRequest = { id: string; filename: string; mimeType: string; content: ExportPayload };

type ExportResponse = { id: string; filename: string; mimeType: string; content: ExportPayload };

self.onmessage = (event: MessageEvent<ExportRequest>) => {
  const request = event.data;
  if (!request?.id || !request.filename || !request.mimeType || (typeof request.content !== "string" && !(request.content instanceof ArrayBuffer))) return;
  self.postMessage({ type: "progress", id: request.id, progress: 12 });
  const response: ExportResponse = { id: request.id, filename: request.filename, mimeType: request.mimeType, content: request.content };
  const deliver = () => { if (request.content instanceof ArrayBuffer) self.postMessage({ type: "done", ...response }, { transfer: [request.content] }); else self.postMessage({ type: "done", ...response }); };
  setTimeout(deliver, 500);
};

export {};
