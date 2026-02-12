import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Event from '@/models/Event';
import { z } from 'zod';

const createEventSchema = z.object({
  name: z.string().min(3),
  slug: z.string().min(3),
  description: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  venue: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createEventSchema.parse(body);

    await dbConnect();

    const event = await Event.create({
      ...data,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      organizationId: session.user.organizationId,
      status: 'DRAFT',
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const slug = searchParams.get('slug');

    await dbConnect();

    let query: any = {};
    if (organizationId) query.organizationId = organizationId;
    if (slug) query.slug = slug;

    const events = await Event.find(query)
      .populate('organizationId')
      .sort({ createdAt: -1 });

    return NextResponse.json({ events });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
