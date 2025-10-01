// Solar Provider Embeddings System
// Generates and manages embeddings for semantic search

import { PrismaClient } from '@prisma/client'
import { db } from './db'
import { solarProviders, solarEmbeddings } from '../db/schema'
import { eq } from 'drizzle-orm'

export interface EmbeddingResult {
  success: boolean
  embeddingId: string
  content: string
  contentType: string
  model: string
  errors: string[]
}

export interface SemanticSearchResult {
  providerId: string
  providerName: string
  similarity: number
  content: string
  contentType: string
}

// OpenAI Embeddings Service
export class OpenAIEmbeddingsService {
  private apiKey: string
  private model: string
  private baseUrl: string

  constructor(apiKey: string, model: string = 'text-embedding-3-large') {
    this.apiKey = apiKey
    this.model = model
    this.baseUrl = 'https://api.openai.com/v1'
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch(`${this.baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          input: text,
          encoding_format: 'float'
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data.data[0].embedding
    } catch (error) {
      console.error('OpenAI embedding generation failed:', error)
      throw error
    }
  }

  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const response = await fetch(`${this.baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          input: texts,
          encoding_format: 'float'
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data.data.map((item: any) => item.embedding)
    } catch (error) {
      console.error('OpenAI batch embedding generation failed:', error)
      throw error
    }
  }
}

// Local Embeddings Service (using transformers.js or similar)
export class LocalEmbeddingsService {
  private model: string

  constructor(model: string = 'all-MiniLM-L6-v2') {
    this.model = model
  }

  async generateEmbedding(text: string): Promise<number[]> {
    // This would use a local model like transformers.js
    // For now, return a mock embedding
    console.warn('Local embeddings not implemented, returning mock embedding')
    return Array(384).fill(0).map(() => Math.random() - 0.5)
  }

  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map(text => this.generateEmbedding(text)))
  }
}

// Embeddings Manager
export class EmbeddingsManager {
  private prisma: PrismaClient
  private embeddingsService: OpenAIEmbeddingsService | LocalEmbeddingsService

  constructor(apiKey?: string, useLocal: boolean = false) {
    this.prisma = new PrismaClient()
    
    if (useLocal || !apiKey) {
      this.embeddingsService = new LocalEmbeddingsService()
    } else {
      this.embeddingsService = new OpenAIEmbeddingsService(apiKey)
    }
  }

  async generateProviderEmbedding(providerId: string): Promise<EmbeddingResult> {
    const result: EmbeddingResult = {
      success: false,
      embeddingId: '',
      content: '',
      contentType: '',
      model: '',
      errors: []
    }

    try {
      // Get provider data
      const provider = await this.prisma.installer.findUnique({
        where: { id: providerId },
        include: {
          specialties: {
            include: {
              specialty: true
            }
          },
          externalLinks: true
        }
      })

      if (!provider) {
        result.errors.push('Provider not found')
        return result
      }

      // Generate different types of embeddings
      const embeddingTypes = [
        {
          contentType: 'profile',
          content: this.buildProfileText(provider)
        },
        {
          contentType: 'specialties',
          content: this.buildSpecialtiesText(provider)
        },
        {
          contentType: 'reviews',
          content: this.buildReviewsText(provider)
        }
      ]

      for (const embeddingType of embeddingTypes) {
        if (embeddingType.content.trim()) {
          const embedding = await this.embeddingsService.generateEmbedding(embeddingType.content)
          
          // Save embedding to database
          const savedEmbedding = await db.insert(solarEmbeddings).values({
            providerId,
            embeddingVector: embedding,
            contentType: embeddingType.contentType,
            content: embeddingType.content,
            model: this.embeddingsService instanceof OpenAIEmbeddingsService ? 'text-embedding-3-large' : 'all-MiniLM-L6-v2'
          }).returning()

          if (savedEmbedding[0]) {
            result.embeddingId = savedEmbedding[0].id
            result.content = embeddingType.content
            result.contentType = embeddingType.contentType
            result.model = savedEmbedding[0].model || ''
            result.success = true
          }
        }
      }

    } catch (error) {
      result.errors.push(`Embedding generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return result
  }

  private buildProfileText(provider: any): string {
    const parts: string[] = []
    
    parts.push(`Company: ${provider.name}`)
    
    if (provider.address) {
      parts.push(`Location: ${provider.address}, ${provider.city}, ${provider.state}`)
    }
    
    if (provider.phone) {
      parts.push(`Phone: ${provider.phone}`)
    }
    
    if (provider.website) {
      parts.push(`Website: ${provider.website}`)
    }
    
    // Add specialties
    if (provider.specialties && provider.specialties.length > 0) {
      const specialtyNames = provider.specialties.map((s: any) => s.specialty.label).join(', ')
      parts.push(`Specialties: ${specialtyNames}`)
    }
    
    // Add years in business if available
    if (provider.yearsInBusiness) {
      parts.push(`Years in business: ${provider.yearsInBusiness}`)
    }
    
    return parts.join('. ')
  }

  private buildSpecialtiesText(provider: any): string {
    if (!provider.specialties || provider.specialties.length === 0) {
      return ''
    }
    
    const specialtyNames = provider.specialties.map((s: any) => s.specialty.label)
    return `Solar installation specialties: ${specialtyNames.join(', ')}`
  }

  private buildReviewsText(provider: any): string {
    // This would include review content if available
    // For now, return basic info
    const parts: string[] = []
    
    if (provider.overallRating) {
      parts.push(`Overall rating: ${provider.overallRating}`)
    }
    
    if (provider.totalReviews) {
      parts.push(`Total reviews: ${provider.totalReviews}`)
    }
    
    return parts.join('. ')
  }

  async semanticSearch(
    query: string,
    contentType: string = 'profile',
    limit: number = 10
  ): Promise<SemanticSearchResult[]> {
    try {
      // Generate embedding for the query
      const queryEmbedding = await this.embeddingsService.generateEmbedding(query)
      
      // Get all embeddings of the specified content type
      const embeddings = await db.select()
        .from(solarEmbeddings)
        .where(eq(solarEmbeddings.contentType, contentType))
        .limit(1000) // Limit for performance
      
      // Calculate similarities
      const results: SemanticSearchResult[] = []
      
      for (const embedding of embeddings) {
        const similarity = this.cosineSimilarity(queryEmbedding, embedding.embeddingVector)
        
        if (similarity > 0.3) { // Threshold for relevance
          // Get provider name
          const provider = await this.prisma.installer.findUnique({
            where: { id: embedding.providerId },
            select: { name: true }
          })
          
          if (provider) {
            results.push({
              providerId: embedding.providerId,
              providerName: provider.name,
              similarity,
              content: embedding.content,
              contentType: embedding.contentType
            })
          }
        }
      }
      
      // Sort by similarity and return top results
      return results
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit)
        
    } catch (error) {
      console.error('Semantic search failed:', error)
      return []
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length')
    }
    
    let dotProduct = 0
    let normA = 0
    let normB = 0
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  }

  async generateAllProviderEmbeddings(limit: number = 50): Promise<{
    processed: number
    errors: string[]
  }> {
    const providers = await this.prisma.installer.findMany({
      where: {
        // Only process providers that don't have embeddings yet
        id: {
          notIn: await this.prisma.installer.findMany({
            select: { id: true },
            where: {
              // This would need to be adjusted based on your schema
            }
          }).then(providers => providers.map(p => p.id))
        }
      },
      take: limit
    })

    let processed = 0
    const errors: string[] = []

    for (const provider of providers) {
      try {
        const result = await this.generateProviderEmbedding(provider.id)
        if (result.success) {
          processed++
        } else {
          errors.push(...result.errors)
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (error) {
        errors.push(`Failed to generate embedding for provider ${provider.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return { processed, errors }
  }
}

// Main embeddings function
export async function generateSolarProviderEmbeddings(
  providerId?: string,
  apiKey?: string
): Promise<{
  success: boolean
  processed: number
  errors: string[]
}> {
  const manager = new EmbeddingsManager(apiKey)

  try {
    if (providerId) {
      // Generate embedding for single provider
      const result = await manager.generateProviderEmbedding(providerId)
      return {
        success: result.success,
        processed: result.success ? 1 : 0,
        errors: result.errors
      }
    } else {
      // Generate embeddings for all providers
      const result = await manager.generateAllProviderEmbeddings()
      return {
        success: result.errors.length === 0,
        processed: result.processed,
        errors: result.errors
      }
    }
    
  } catch (error) {
    console.error('Embeddings generation failed:', error)
    return {
      success: false,
      processed: 0,
      errors: [`Embeddings generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
    }
  }
}

// Semantic search function
export async function searchSolarProvidersSemantic(
  query: string,
  contentType: string = 'profile',
  limit: number = 10,
  apiKey?: string
): Promise<SemanticSearchResult[]> {
  const manager = new EmbeddingsManager(apiKey)
  
  try {
    return await manager.semanticSearch(query, contentType, limit)
  } catch (error) {
    console.error('Semantic search failed:', error)
    return []
  }
}
