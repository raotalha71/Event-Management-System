'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSession, signIn, signOut } from 'next-auth/react';

export default function HomePage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Event Platform</h1>
          <div className="flex gap-4 items-center">
            {session ? (
              <>
                <span className="text-sm text-gray-600">Welcome, {session.user?.name}</span>
                <Link href="/dashboard/events">
                  <Button variant="outline">Dashboard</Button>
                </Link>
                <Button variant="destructive" onClick={() => signOut()}>
                  Sign Out
                </Button>
              </>
            ) : (
              <Button onClick={() => signIn()}>Sign In</Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Manage Your Events Easily</h2>
          <p className="text-xl text-gray-600 mb-8">
            Create, manage, and track your events with our powerful platform.
          </p>
          {session ? (
            <Link href="/dashboard/events/create">
              <Button size="lg">Create an Event</Button>
            </Link>
          ) : (
            <Button size="lg" onClick={() => signIn()}>Get Started</Button>
          )}
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-2">Easy Event Creation</h3>
            <p className="text-gray-600">
              Create events in minutes with our intuitive form and customizable settings.
            </p>
          </Card>
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-2">Ticket Management</h3>
            <p className="text-gray-600">
              Sell tickets, track sales, and manage different ticket types effortlessly.
            </p>
          </Card>
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-2">Attendee Tracking</h3>
            <p className="text-gray-600">
              Track registrations, check-ins, and manage your attendee list with ease.
            </p>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          © 2025 Event Platform. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
