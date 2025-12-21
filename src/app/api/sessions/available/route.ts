import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const slots: Array<{
      date: string;
      time: string;
      available: boolean;
    }> = [];

    const currentDate = new Date();
    const availableTimes = ['9:00 AM', '10:30 AM', '12:00 PM', '2:00 PM', '3:30 PM', '5:00 PM'];

    // Generate slots for next 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date(currentDate);
      date.setDate(currentDate.getDate() + i);

      // Skip Sundays (day 0)
      if (date.getDay() === 0) {
        continue;
      }

      // Format date as YYYY-MM-DD
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;

      // Add all available time slots for this day
      for (const time of availableTimes) {
        slots.push({
          date: dateString,
          time: time,
          available: true,
        });
      }
    }

    return NextResponse.json(slots, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      },
      { status: 500 }
    );
  }
}