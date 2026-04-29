export async function transcribeAudio(fileUrl: string) {
  const apiKey = import.meta.env.VITE_ASSEMBLY_API_KEY;

  const res = await fetch("https://api.assemblyai.com/v2/transcript", {
    method: "POST",
    headers: {
      authorization: apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({ audio_url: fileUrl }),
  });

  const data = await res.json();
  return data.id; // transcript ID
}

export async function getTranscriptText(transcriptId: string) {
  const apiKey = import.meta.env.VITE_ASSEMBLY_API_KEY;

  const res = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
    headers: { authorization: apiKey },
  });

  const data = await res.json();
  return data.text;
}

// Higher-level helpers compatible with direct Blob upload and polling
export async function uploadAudioToAssembly(file: Blob | File) {
  const apiKey = import.meta.env.VITE_ASSEMBLY_API_KEY;
  const uploadUrl = import.meta.env.VITE_ASSEMBLY_UPLOAD_URL ?? 'https://api.assemblyai.com/v2/upload';
  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: { authorization: apiKey },
    body: file,
  });
  if (!res.ok) throw new Error(`Assembly upload failed ${res.status}`);
  const data = await res.json();
  return data.upload_url as string;
}

export async function createTranscript(uploadUrl: string, options: Record<string, unknown> = {}) {
  const apiKey = import.meta.env.VITE_ASSEMBLY_API_KEY;
  const transcriptBase = import.meta.env.VITE_ASSEMBLY_TRANSCRIPT_URL ?? 'https://api.assemblyai.com/v2/transcript';
  const res = await fetch(transcriptBase, {
    method: 'POST',
    headers: {
      authorization: apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ audio_url: uploadUrl, ...options }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Assembly create transcript failed: ${t}`);
  }
  return await res.json();
}

export async function pollTranscript(id: string, interval = 1500, timeout = 60000) {
  const apiKey = import.meta.env.VITE_ASSEMBLY_API_KEY;
  const transcriptBase = import.meta.env.VITE_ASSEMBLY_TRANSCRIPT_URL ?? 'https://api.assemblyai.com/v2/transcript';
  const url = `${transcriptBase}/${id}`;
  const start = Date.now();
  while (true) {
    const res = await fetch(url, { headers: { authorization: apiKey } });
    if (!res.ok) throw new Error('Failed to fetch transcript status');
    const data = await res.json();
    if (data.status === 'completed') return data;
    if (data.status === 'failed') throw new Error('Transcript failed');
    if (Date.now() - start > timeout) throw new Error('Polling timed out');
    await new Promise(r => setTimeout(r, interval));
  }
}
