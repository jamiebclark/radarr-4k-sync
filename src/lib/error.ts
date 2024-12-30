export function hasMessage(error: unknown): error is { message: string } {
  return (typeof error === 'object' && error !== null && 'message' in error && typeof error?.message === 'string')
}

export function getMessage(error: unknown): string {
  return hasMessage(error) ? error.message : ''
}