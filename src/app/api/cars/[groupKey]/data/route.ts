import { NextResponse } from 'next/server';
import { rentprogApiServer } from '@/lib/rentprog-api-server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ groupKey: string }> }
) {
  try {
    const resolvedParams = await params;
    const carId = Number(resolvedParams.groupKey);

    if (!Number.isFinite(carId) || carId <= 0) {
      return NextResponse.json({ error: 'Invalid car id' }, { status: 400 });
    }

    const carData = await rentprogApiServer.getCarDataWithBookings(carId);
    return NextResponse.json({ car: carData });
  } catch (error: any) {
    console.error('GET /api/cars/[groupKey]/data error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch car data' },
      { status: 500 }
    );
  }
}
