export async function orchestrate(stage, payload) {
  const endpoint = process.env.WUNDERGRAPH_ENDPOINT;
  if (!endpoint) {
    return { status: "mock", stage, payload };
  }

  try {
    const res = await fetch(`${endpoint.replace(/\/$/, "")}/${stage}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    return {
      status: res.ok ? "active" : "error",
      code: res.status,
      body: await res.text(),
    };
  } catch (error) {
    return { status: "error", message: String(error) };
  }
}
