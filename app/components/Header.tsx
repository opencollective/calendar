'use client';

import Link from 'next/link';
import Image from 'next/image';

export function Header() {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-4xl mx-auto px-8 py-4">
        <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 relative">
            <Image
              src="/icon.jpg"
              alt="Community Events Icon"
              width={32}
              height={32}
              className="rounded-full"
            />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Community Curated Events</h1>
        </Link>
      </div>
    </header>
  );
} 