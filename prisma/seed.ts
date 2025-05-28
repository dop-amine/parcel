const { PrismaClient, UserType } = require('@prisma/client')
const { hash } = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  // Create admin user if it doesn't exist
  const adminEmail = 'admin@parcel.com'
  const adminPassword = 'password'

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  })

  if (!existingAdmin) {
    const hashedPassword = await hash(adminPassword, 10)
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: hashedPassword,
        name: 'Admin User',
        type: UserType.ADMIN,
        tier: null, // Admins don't have tiers
        isActive: true,
      },
    })
    console.log('Admin user created successfully')
  } else {
    console.log('Admin user already exists')
  }

  // Create sample users with tiers
  const sampleUsers = [
    {
      email: 'artist@example.com',
      name: 'Sample Artist',
      type: UserType.ARTIST,
      tier: 'ARTIST',
    },
    {
      email: 'label@example.com',
      name: 'Label Artist',
      type: UserType.ARTIST,
      tier: 'LABEL',
    },
    {
      email: 'rostered@example.com',
      name: 'Rostered Artist',
      type: UserType.ARTIST,
      tier: 'ROSTERED',
    },
    {
      email: 'creator@example.com',
      name: 'Creator Buyer',
      type: UserType.EXEC,
      tier: 'CREATOR',
    },
    {
      email: 'studio@example.com',
      name: 'Studio Buyer',
      type: UserType.EXEC,
      tier: 'STUDIO',
    },
    {
      email: 'pro@example.com',
      name: 'Pro Buyer',
      type: UserType.EXEC,
      tier: 'PRO',
    },
    {
      email: 'rep@example.com',
      name: 'Sample Rep',
      type: UserType.REP,
      tier: null, // Reps don't have tiers
    },
  ]

  for (const userData of sampleUsers) {
    const existing = await prisma.user.findUnique({
      where: { email: userData.email },
    })

    if (!existing) {
      const hashedPassword = await hash('password', 10)
      await prisma.user.create({
        data: {
          ...userData,
          passwordHash: hashedPassword,
          isActive: true,
        },
      })
      console.log(`Created ${userData.name} (${userData.email})`)
    } else {
      console.log(`${userData.name} already exists`)
    }
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })