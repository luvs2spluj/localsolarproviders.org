// SHA-256 hash utility for deduplication
import crypto from 'crypto'

export function createHash(engine: string, url: string, title: string): string {
  const input = `${engine}:${url}:${title}`
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex')
}

export function createQueryHash(engine: string, query: string): string {
  const input = `${engine}:${query}`
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex')
}
