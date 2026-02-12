import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Event from '@/models/Event';
import TicketType from '@/models/TicketType';
import Registration from '@/models/Registration';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();

    const event = await Event.findById(id)
      .populate('organizationId');

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Get ticket types
    const ticketTypes = await TicketType.find({ eventId: id });

    // Get registrations
    const registrations = await Registration.find({ eventId: id })
      .populate('userId')
      .populate('ticketTypeId');

    return NextResponse.json({ 
      event: {
        ...event.toObject(),
        ticketTypes,
        registrations,
        _count: {
          registrations: registrations.length,
        }
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    await dbConnect();

    const event = await Event.findByIdAndUpdate(
      id,
      body,
      { new: true }
    ).populate('organizationId');

    return NextResponse.json({ event });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
