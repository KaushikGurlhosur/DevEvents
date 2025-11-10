import connectDB from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import Event from "@/database/event.model";

/**
 * Handle POST requests to create a new Event from multipart/form-data.
 *
 * Parses the request's form data into an event object, saves it to the database,
 * and returns a JSON response indicating success or the relevant error.
 *
 * @param req - Incoming POST request whose body contains multipart/form-data with event fields
 * @returns On success: a JSON object with `message: "Event Created Successfully"` and the created `event` (HTTP 201).
 *          On invalid form data: a JSON object with `message: "Invalid JSON data format"` and an `error` message (HTTP 400).
 *          On server failure: a JSON object with `message: "Event Creation Failed"` and an `error` message (HTTP 500).
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const formData = await req.formData();

    let event;

    try {
      event = Object.fromEntries(formData.entries()); // Getting all entries like key value pairs from thr formData
    } catch (e) {
      return NextResponse.json(
        {
          message: "Invalid JSON data format",
          error: e instanceof Error ? e.message : "Unknown",
        },
        { status: 400 }
      );
    }

    const createdEvent = await Event.create(event);

    return NextResponse.json(
      { message: "Event Created Successfully", event: createdEvent },
      { status: 201 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      {
        message: "Event Creation Failed",
        error: e instanceof Error ? e.message : "Unknown",
      },
      { status: 500 }
    );
  }
}
