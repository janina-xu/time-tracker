import { NextRequest, NextResponse } from 'next/server'
import { db, initDB } from '@/app/lib/db'

export async function GET(request: NextRequest) {
  await initDB()
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')

  const result = date
    ? await db.execute({ sql: 'SELECT * FROM Record WHERE date = ? ORDER BY createdAt ASC', args: [date] })
    : await db.execute('SELECT * FROM Record ORDER BY createdAt ASC')

  return NextResponse.json(result.rows)
}

export async function POST(request: NextRequest) {
  await initDB()
  const body = await request.json()
  const { category, startTime, endTime, note, date } = body

  const result = await db.execute({
    sql: 'INSERT INTO Record (category, startTime, endTime, note, date) VALUES (?, ?, ?, ?, ?)',
    args: [category, startTime, endTime ?? null, note ?? null, date],
  })

  const record = await db.execute({
    sql: 'SELECT * FROM Record WHERE id = ?',
    args: [result.lastInsertRowid],
  })

  return NextResponse.json(record.rows[0])
}