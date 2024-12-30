
export function getEnv(value?: string, label: string = 'Env var'): string {
  if (!value) {
    throw new Error(`Environment Variable ${label} not found`)
  }
  return value;
}

