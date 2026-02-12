'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

const eventSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  venue: z.string().optional(),
});

type EventFormData = z.infer<typeof eventSchema>;

export default function CreateEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
  });

  async function onSubmit(data: EventFormData) {
    setLoading(true);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const { event } = await res.json();
        router.push(`/dashboard/events/${event._id}`);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Create New Event</h1>

      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="name">Event Name</Label>
            <Input id="name" {...register('name')} placeholder="Tech Conference 2025" />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <Label htmlFor="slug">URL Slug</Label>
            <Input id="slug" {...register('slug')} placeholder="tech-conf-2025" />
            {errors.slug && <p className="text-red-500 text-sm mt-1">{errors.slug.message}</p>}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              {...register('description')}
              className="w-full border rounded p-2 min-h-[100px]"
              placeholder="Describe your event..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input type="datetime-local" id="startDate" {...register('startDate')} />
            </div>

            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input type="datetime-local" id="endDate" {...register('endDate')} />
            </div>
          </div>

          <div>
            <Label htmlFor="venue">Venue</Label>
            <Input id="venue" {...register('venue')} placeholder="Convention Center, City" />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating...' : 'Create Event'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
