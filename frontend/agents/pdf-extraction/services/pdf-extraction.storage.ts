// frontend/agents/pdf-extraction/services/pdf-extraction.storage.ts

export async function downloadPdf(fileUrl: string): Promise<Buffer> {
  if (fileUrl.startsWith('data:')) {
    const base64 = fileUrl.split(',')[1]
    if (!base64) throw new Error('Invalid data URL: missing base64 payload')
    return Buffer.from(base64, 'base64')
  }

  const response = await fetch(fileUrl)

  if (!response.ok) {
    throw new Error(
      `Failed to download PDF: ${response.status} ${response.statusText}`
    )
  }

  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}
