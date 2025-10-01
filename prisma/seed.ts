import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const specialties = [
  { slug: 'battery_backup', label: 'Battery Backup & Storage' },
  { slug: 'ev_charger', label: 'EV Charger Installation' },
  { slug: 'tile_roof', label: 'Tile Roof Installation' },
  { slug: 'metal_roof', label: 'Metal Roof Installation' },
  { slug: 'ground_mount', label: 'Ground Mount Systems' },
  { slug: 'off_grid', label: 'Off-Grid Systems' },
  { slug: 'microinverters', label: 'Microinverters' },
  { slug: 'commercial_pv', label: 'Commercial Solar' },
  { slug: 'residential_pv', label: 'Residential Solar' },
  { slug: 'roofing', label: 'Roofing Services' },
  { slug: 'storage_only', label: 'Storage Systems Only' },
  { slug: 'solar_maintenance', label: 'Solar Maintenance & Repair' },
  { slug: 'energy_audit', label: 'Energy Audits' },
  { slug: 'financing', label: 'Solar Financing' },
  { slug: 'permits', label: 'Permit Services' },
  { slug: 'monitoring', label: 'System Monitoring' },
]

async function main() {
  console.log('Seeding specialties...')
  
  for (const specialty of specialties) {
    await prisma.specialty.upsert({
      where: { slug: specialty.slug },
      update: { label: specialty.label },
      create: specialty,
    })
  }
  
  console.log(`Seeded ${specialties.length} specialties`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
