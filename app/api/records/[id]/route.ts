import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  await prisma.record.delete({ where: { id: parseInt(id) } })
  return NextResponse.json({ success: true })
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const body = await request.json()
  const record = await prisma.record.update({
    where: { id: parseInt(id) },
    data: { endTime: body.endTime },
  })
  return NextResponse.json(record)
}