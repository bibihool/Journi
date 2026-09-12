import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// GET /api/trips - List all saved/bookmarked trips
export async function GET() {
  try {
    const trips = await prisma.savedTrip.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(trips);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load saved trips";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/trips - Save a new trip itinerary
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      destination,
      duration,
      summary,
      itinerary,
      conversationId,
    } = body;

    if (!title || !itinerary) {
      return NextResponse.json(
        { error: "Title and itinerary content are required" },
        { status: 400 }
      );
    }

    const saved = await prisma.savedTrip.create({
      data: {
        title: title.trim(),
        destination: destination ? destination.trim() : null,
        duration: duration ? duration.trim() : null,
        summary: summary ? summary.trim() : null,
        itinerary,
        conversationId: conversationId || null,
      },
    });

    return NextResponse.json(saved, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save trip";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
