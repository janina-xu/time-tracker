import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')

  const records = await prisma.record.findMany({
    where: date ? { date } : {},
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(records)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { category, startTime, endTime, note, date } = body

  const record = await prisma.record.create({
    data: { category, startTime, endTime, note, date },
  })

  return NextResponse.json(record)
}