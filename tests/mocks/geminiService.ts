// Selected only by the local TESTING development server. Never by a build.
export async function testApiKey(apiKey: string): Promise<void> {
  if (apiKey !== 'sketch-air-test-key') {
    throw new Error('TESTING mode accepts only the dummy key: sketch-air-test-key. Do not enter a real key.');
  }
}

export async function generateImageFromSketch(..._args: unknown[]): Promise<string> {
  throw new Error('Image generation is disabled in TESTING mode. No request was sent to Google.');
}
