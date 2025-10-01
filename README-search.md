# Solar Installer Search & Cache

A Next.js application that searches for solar installers using official APIs and caches results in SQLite for fast, ToS-compliant lookups.

## Features

- **Official API Integration**: Uses Brave Search API (free) and Google Custom Search (100/day free)
- **Smart Caching**: SQLite database with deduplication and cooldown periods
- **ToS Compliant**: No HTML scraping, only official APIs with proper attribution
- **Rate Limited**: Built-in backoff and retry logic for reliable operation
- **Real-time UI**: Search, refresh, and view cached results with timestamps

## Search Providers

### Brave Search API (Recommended)
- **Free Tier**: Generous limits with explicit data storage rights
- **Get API Key**: https://brave.com/search/api/
- **Pricing**: https://brave.com/search/api/#pricing
- **Data Rights**: Brave explicitly permits storing results on Free/Base plans

### Google Programmable Search (Custom Search JSON API)
- **Free Tier**: 100 queries/day, then $5 per 1,000 queries
- **Get API Key**: https://developers.google.com/custom-search/v1/introduction
- **Create Search Engine**: https://programmablesearchengine.google.com/
- **Pricing**: https://developers.google.com/custom-search/v1/overview#pricing
- **Requirements**: Must display "Powered by Google" attribution
- **Branding Rules**: https://developers.google.com/custom-search/docs/ui

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set up Environment
Copy `.env.example` to `.env.local` and configure:

```bash
# Choose one provider (Brave recommended)
BRAVE_API_KEY=your_brave_api_key_here

# OR use Google CSE
GOOGLE_CSE_API_KEY=your_google_api_key
GOOGLE_CSE_CX=your_search_engine_id

# Default location
NEXT_PUBLIC_DEFAULT_LOCATION=San Jose, CA
```

### 3. Set up Database
```bash
npx prisma migrate dev
```

### 4. Start Development Server
```bash
npm run dev
```

### 5. Test the Search
- Visit `http://localhost:3000`
- Enter a location (e.g., "San Jose, CA")
- Select search engine (Brave or Google)
- Click "Search" to get fresh results
- Click "Refresh" to force update cached results

## How It Works

### Data Flow
1. **User Input**: Enter location (e.g., "Austin, TX")
2. **Query Formation**: Creates "solar installers in Austin, TX"
3. **Provider Selection**: Uses Brave API (if configured) or Google CSE
4. **API Call**: Fetches results with rate limiting and retry logic
5. **Caching**: Stores results in SQLite with deduplication
6. **Display**: Shows results with source attribution and timestamps

### Caching Strategy
- **Deduplication**: SHA-256 hash of engine + URL + title
- **Cooldown**: 10-minute cooldown prevents excessive API calls
- **Upsert Logic**: Updates existing results with latest data
- **Force Refresh**: Bypass cooldown with "Refresh" button

### Rate Limiting
- **Brave**: 1 request/second with exponential backoff
- **Google**: 2 seconds between requests to preserve quota
- **Retry Logic**: 3 attempts for Brave, 2 for Google (quota preservation)

## Database Schema

### SearchResult
- `id`: Unique identifier
- `engine`: BRAVE | GOOGLE  
- `query`: Full search query
- `location`: User-provided location
- `title`: Result title
- `url`: Result URL
- `snippet`: Result description
- `sourceRank`: Original ranking from API
- `fetchedAt`: When result was cached
- `hash`: Unique hash for deduplication

### SearchRun
- `id`: Unique identifier
- `engine`: Which API was used
- `query`: Search query
- `location`: Search location
- `createdAt`: When search was initiated
- `status`: OK | ERROR
- `message`: Success/error details

## API Endpoints

### POST /api/search
Search for solar installers and cache results.

**Request:**
```json
{
  "location": "San Jose, CA",
  "engine": "BRAVE",  // Optional: BRAVE | GOOGLE
  "force": false      // Optional: bypass cooldown
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "id": "hash123",
      "title": "Solar Company Name",
      "url": "https://example.com",
      "snippet": "Description...",
      "rank": 1,
      "engine": "BRAVE",
      "cached": false
    }
  ],
  "cached": false,
  "engine": "BRAVE",
  "query": "solar installers in San Jose, CA",
  "location": "San Jose, CA",
  "lastFetched": "2024-01-01T12:00:00Z",
  "message": "Found 20 fresh results"
}
```

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BRAVE_API_KEY` | Optional* | Brave Search API key |
| `GOOGLE_CSE_API_KEY` | Optional* | Google Custom Search API key |
| `GOOGLE_CSE_CX` | Optional* | Google Custom Search Engine ID |
| `NEXT_PUBLIC_DEFAULT_LOCATION` | No | Default search location |

*At least one search provider must be configured.

### Provider Priority
1. If `engine` specified in request, use that
2. If `BRAVE_API_KEY` exists, use Brave
3. If Google CSE configured, use Google
4. Otherwise, return error

## Compliance & Best Practices

### Brave Search API
- ✅ Explicit data storage rights on Free/Base plans
- ✅ Reasonable rate limiting (1 req/sec)
- ✅ No special attribution requirements
- ✅ Commercial use allowed

### Google Custom Search
- ⚠️ Must display "Powered by Google" attribution
- ⚠️ Limited to 100 free queries/day
- ⚠️ Cannot modify or remove Google branding
- ⚠️ Must follow usage guidelines
- 📖 Review: https://developers.google.com/custom-search/docs/ui

### General Compliance
- ✅ No HTML scraping
- ✅ Only official APIs
- ✅ Proper rate limiting
- ✅ Respectful caching with cooldowns
- ✅ Error handling with fallbacks

## Development

### Adding New Providers
1. Create provider in `src/lib/providers/`
2. Implement `NormalizedResult` interface
3. Add rate limiting and retry logic
4. Update search API endpoint
5. Add configuration options

### Testing
```bash
# Run unit tests
npm test

# Test provider normalizers
npm run test:providers
```

### Database Management
```bash
# View database
npx prisma studio

# Reset database
npx prisma migrate reset

# Generate new migration
npx prisma migrate dev --name description
```

## Troubleshooting

### Common Issues

**"No search provider configured"**
- Set either `BRAVE_API_KEY` or both Google CSE variables

**"Rate limit exceeded"**
- Wait for cooldown period or check API quotas
- Brave: Check API dashboard
- Google: Check Cloud Console quotas

**"Invalid API key"**
- Verify API keys are correct
- Check API key permissions and restrictions

**Empty results**
- Try different search terms
- Check if location is specific enough
- Verify API service status

### Debug Mode
Set `NODE_ENV=development` to see detailed logs:
```bash
NODE_ENV=development npm run dev
```

## Next Steps

- [ ] Add more search providers (DuckDuckGo, Bing)
- [ ] Implement search analytics dashboard
- [ ] Add result quality scoring
- [ ] Export results to CSV/JSON
- [ ] Add search history and favorites
- [ ] Implement user accounts for personalization

## License

This project demonstrates ToS-compliant search integration. Review each provider's terms before commercial use.

---

**Built with official APIs only - No scraping, fully compliant! 🔍**
