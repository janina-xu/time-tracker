import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/app/lib/db'

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  await db.execute({ sql: 'DELETE FROM Record WHERE id = ?', args: [parseInt(id)] })
  return NextResponse.json({ success: true })
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const body = await request.json()
  await db.execute({
    sql: 'UPDATE Record SET endTime = ? WHERE id = ?',
    args: [body.endTime, parseInt(id)],
  })
  const result = await db.execute({
    sql: 'SELECT * FROM Record WHERE id = ?',
    args: [parseInt(id)],
  })
  return NextResponse.json(result.rows[0])
}