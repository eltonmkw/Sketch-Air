// Selected only for explicit local testing or a Vercel Preview testing build.
export async function testApiKey(apiKey: string): Promise<void> {
  if (apiKey !== 'TESTING') {
    throw new Error('TESTING mode accepts only the dummy key: TESTING. Do not enter a real key.');
  }
}

export async function generateImageFromSketch(..._args: unknown[]): Promise<string> {
  throw new Error('Image generation is disabled in TESTING mode. No request was sent to Google.');
}
