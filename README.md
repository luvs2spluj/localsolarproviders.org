# Local Solar Providers - Find Vetted Local Solar Providers Near You

A comprehensive solar provider directory that discovers and catalogs vetted solar installers using free, open-source data sources. Find trusted local solar providers with verified licenses, reviews, and competitive pricing.

## 🌟 Features

### ✅ **Vetted Local Providers**
- **OpenStreetMap Overpass API**: Discovers solar installers from the world's largest open geographic database
- **State License Verification**: C-46 and equivalent license verification from state licensing boards
- **Website Enrichment**: Extracts specialties from installers' own websites (respects robots.txt)
- **External Review Links**: Links to Google, Yelp, BBB, Facebook reviews (no scraping, just smart linking)
- **NABCEP Integration**: Ready for manual import of certified professionals
- **Nominatim Geocoding**: Accurate location data using open-source geocoding

### 🗺️ **Smart Discovery System**
- Search by address, city, or coordinates to find local providers
- 50km maximum radius (respects Overpass API fair use)
- Automatic deduplication and data normalization
- Rate-limited requests (2 seconds between calls)
- Comprehensive logging and error handling
- Vetted provider verification and license checking

### 🔍 **Intelligent Specialty Detection**
Automatically detects installer specialties from their websites:
- Battery Backup & Storage (Tesla Powerwall, Enphase, etc.)
- EV Charger Installation
- Roof Types (Tile, Metal, Shingle)
- System Types (Ground Mount, Off-Grid, Commercial)
- Equipment Brands (Microinverters, Power Optimizers)
- Services (Maintenance, Financing, Permits)

### 🔗 **ToS-Compliant Review Integration**
- **No Review Scraping**: Only generates outbound links
- **Google Maps**: Direct search links to find installer reviews
- **Yelp**: Smart search URLs for business discovery
- **BBB**: Better Business Bureau profile links
- **State Licensing**: Contractor license verification links
- **Industry Associations**: SEIA, state solar associations

### 🛠️ **Admin Interface**
- **Discovery Tool**: Enter location and radius to find installers
- **Bulk Enrichment**: Scan multiple websites for specialties
- **Activity Logs**: Track all operations and errors
- **Manual Management**: Edit, add, or remove installers
- **CSV Import/Export**: Bulk data management

## 🚀 **Quick Start**

### Prerequisites
- Node.js 20+ 
- No API keys required!

### Installation
```bash
# Clone the repository
git clone <your-repo-url>
cd localsolarproviders

# Install dependencies
npm install

# Set up database
npx prisma migrate dev
npx tsx prisma/seed.ts

# Start development server
npm run dev
```

### First Discovery
1. Visit `http://localhost:3000/admin`
2. Enter a location (e.g., "San Francisco, CA")
3. Choose radius (max 50km for fair use)
4. Click "Discover Installers"
5. Select installers and click "Enrich Selected" to scan websites
6. Verify licenses and vetted status for local providers

## 📊 **Database Schema**

### Core Tables
- **Installers**: Company info, coordinates, contact details, license verification
- **Specialties**: Solar service categories (battery, EV, roofing, etc.)
- **External Links**: Review site links (Google, Yelp, BBB, etc.)
- **Scan Logs**: Activity tracking and error logging
- **License Data**: C-46 and equivalent license verification

### Data Sources
- **Primary**: OpenStreetMap (100% free, open data)
- **Enrichment**: Company websites (public information only)
- **Verification**: State licensing boards, industry associations
- **Geocoding**: Nominatim (open-source geocoding service)
- **Reviews**: Outbound links only (no content scraping)

## 🛡️ **Compliance & Ethics**

### Respectful Data Collection
- **Robots.txt Compliance**: Checks and respects robots.txt files
- **Rate Limiting**: 2-second delays between requests
- **Fair Use**: Follows OpenStreetMap and Nominatim usage policies
- **No Scraping**: Only uses public APIs and generates outbound links

### ToS-Safe Review Integration
- **No Review Content**: Never copies or stores review text
- **Attribution Links**: Proper attribution to review platforms
- **Outbound Only**: Links users to original review sources
- **Platform Compliance**: Follows Google, Yelp, BBB guidelines

## 🔧 **API Endpoints**

### Discovery
- `POST /api/discover` - Find installers using Overpass API
- `POST /api/enrich/[id]` - Scan installer website for specialties

### Data Access
- `GET /api/providers` - List installers with filtering
- `GET /api/providers/[id]` - Get installer details
- `GET /api/admin/scan-logs` - View activity logs

### Search
- Address-based search with Nominatim geocoding
- Distance-based filtering
- Specialty-based filtering

## 🌍 **Data Sources Explained**

### OpenStreetMap Overpass API
```javascript
// Example query for solar installers
[out:json][timeout:25];
(
  nwr(around:25000,37.7749,-122.4194)["name"~"(?i)solar"];
  nwr(around:25000,37.7749,-122.4194)["craft"~"(?i)solar"];
);
out center tags;
```

### Website Enrichment Keywords
```javascript
const SPECIALTY_KEYWORDS = {
  battery_backup: ['battery', 'storage', 'powerwall', 'backup power'],
  ev_charger: ['ev charger', 'evse', 'level 2', 'tesla charger'],
  commercial_pv: ['commercial', 'business', 'industrial', 'c&i'],
  // ... 16 total specialty categories
}
```

### External Review Links
```javascript
// Google Maps search
https://www.google.com/maps/search/?api=1&query=Solar+Company+San+Francisco+CA

// Yelp search  
https://www.yelp.com/search?find_desc=Solar+Company&find_loc=San+Francisco%2C+CA

// BBB search
https://www.bbb.org/search?find_text=Solar+Company&find_loc=San+Francisco%2C+CA
```

## 📈 **Scaling & Performance**

### Rate Limiting
- **Overpass API**: 1 request per 2 seconds
- **Website Scanning**: 1 request per 2 seconds
- **Nominatim**: 1 request per second
- **Automatic Retries**: Built-in error handling

### Database Optimization
- **SQLite**: Perfect for local development and small deployments
- **Indexes**: Optimized queries for location and specialty searches
- **Caching**: Last scanned timestamps prevent redundant work

### Fair Use Compliance
- **50km Maximum**: Respects Overpass API guidelines
- **Timeout Limits**: 25-second query timeouts
- **User Agent**: Proper identification in all requests
- **Error Logging**: Comprehensive activity tracking

## 🔄 **Workflow**

1. **Discovery**: Use Overpass API to find solar businesses by location
2. **Normalization**: Clean and deduplicate installer data
3. **Link Generation**: Create review site search URLs
4. **Enrichment**: Scan installer websites for specialties (optional)
5. **Display**: Show installers with outbound review links

## 🎯 **Perfect For**

- **Local Solar Directories**: City/county vetted solar installer listings
- **Lead Generation**: Connect customers with verified local installers
- **Market Research**: Analyze solar installer density and specialties  
- **Consumer Tools**: Help homeowners find qualified, vetted installers
- **Educational Projects**: Demonstrate ethical data collection
- **License Verification**: Verify C-46 and equivalent solar licenses

## 🚨 **Important Notes**

### Legal Compliance
- This tool only uses public data and generates outbound links
- Always verify local regulations and platform terms of service
- Consider adding privacy policy and terms of service to your site
- Respect robots.txt and rate limits

### Data Quality
- OpenStreetMap data quality varies by region
- Website scanning success depends on site structure
- Manual verification recommended for commercial use
- Consider adding user reporting for data corrections

## 🤝 **Contributing**

This is a demonstration of ethical, free data collection for solar directories. Contributions welcome for:

- Additional specialty keywords
- New data source integrations (free only)
- UI/UX improvements
- Documentation updates

## 📄 **License**

Open source - build amazing things responsibly! 

---

**Built with ❤️ and ☀️ - Find vetted local solar providers near you!**