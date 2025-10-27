import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    const { id: insightId } = await params
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!insightId) {
      return NextResponse.json({ error: 'Insight ID is required' }, { status: 400 })
    }

    // Verify the insight belongs to the user (security check)
    const insight = await db.insight.findFirst({
      where: {
        id: insightId,
        userId
      }
    })

    if (!insight) {
      return NextResponse.json({ 
        error: 'Insight not found or you do not have permission to delete it' 
      }, { status: 404 })
    }

    // Delete the insight
    await db.insight.delete({
      where: { id: insightId }
    })

    console.log(`Deleted insight ${insightId} for user ${userId}`)

    return NextResponse.json({
      success: true,
      message: 'Insight deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting insight:', error)
    return NextResponse.json({ 
      error: 'Failed to delete insight' 
    }, { status: 500 })
  }
}
