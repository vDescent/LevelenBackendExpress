export function logStep(step) {
  const now = new Date().toISOString();
  console.log(`[${now}] ${step}`);
}
