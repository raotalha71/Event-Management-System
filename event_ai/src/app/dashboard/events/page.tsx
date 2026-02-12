'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { format } from 'date-fns';

export default function EventsPage() {
  const { data: session } = useSession();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      fetchEvents();
    }
  }, [session]);

  async function fetchEvents() {
    if (!session?.user?.organizationId) return;
    
    const res = await fetch(`/api/events?organizationId=${session.user.organizationId}`);
    const data = await res.json();
    setEvents(data.events);
    setLoading(false);
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Events</h1>
        <Link href="/dashboard/events/create">
          <Button>Create Event</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event: any) => (
          <Card key={event._id} className="p-6">
            <h3 className="font-semibold text-lg mb-2">{event.name}</h3>
            <p className="text-sm text-gray-600 mb-4">
              {format(new Date(event.startDate), 'MMM dd, yyyy')} - {format(new Date(event.endDate), 'MMM dd, yyyy')}
            </p>
            <div className="flex gap-2 text-sm mb-4">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {event._count?.registrations || 0} Attendees
              </span>
              <span className={`px-2 py-1 rounded ${
                event.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {event.status}
              </span>
            </div>
            <Link href={`/dashboard/events/${event._id}`}>
              <Button variant="outline" className="w-full">View Details</Button>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
