import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Music2, Users, MessageSquare, DollarSign } from 'lucide-react'

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/')
  }

  // Fetch dashboard statistics
  const [
    totalTracks,
    totalUsers,
    totalDeals,
    totalEarnings
  ] = await Promise.all([
    prisma.track.count(),
    prisma.user.count(),
    prisma.deal.count(),
    prisma.earning.aggregate({
      _sum: {
        amount: true
      }
    })
  ])

  const stats = [
    {
      title: 'Total Tracks',
      value: totalTracks,
      icon: Music2,
    },
    {
      title: 'Total Users',
      value: totalUsers,
      icon: Users,
    },
    {
      title: 'Active Deals',
      value: totalDeals,
      icon: MessageSquare,
    },
    {
      title: 'Total Earnings',
      value: `$${totalEarnings._sum.amount?.toFixed(2) || '0.00'}`,
      icon: DollarSign,
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your platform's performance
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}