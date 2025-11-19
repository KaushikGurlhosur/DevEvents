import connectDB from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import Event from "@/database/event.model";
import { v2 as cloudinary } from "cloudinary";

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

    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json(
        { message: "Image file is required" },
        { status: 400 }
      );
    }

    // let tags = JSON.parse(formData.get("tags") as string);
    // let agenda = JSON.parse(formData.get("tags") as string);

    const tags = (formData.get("tags") as string)
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const agenda = (formData.get("agenda") as string)
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);

    // Convert to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Convert ArrayBuffer → Node.js Buffer
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { resource_type: "image", folder: "DevEvent" },
          (error, results) => {
            if (error) return reject(error);

            resolve(results);
          }
        )
        .end(buffer);
    });

    event.image = (uploadResult as { secure_url: string }).secure_url;

    const createdEvent = await Event.create({
      ...event,
      tags: tags,
      agenda: agenda,
    });

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

export async function GET() {
  try {
    await connectDB();

    const events = await Event.find().sort({ createdAt: -1 }); // latest events will be at top

    return NextResponse.json(
      { message: "Events fetched successfully.", events },
      { status: 200 }
    );
  } catch (e) {
    return NextResponse.json(
      {
        message: "Failed to fetch events",
        error: e instanceof Error ? e.message : "Unknown",
      },
      { status: 500 }
    );
  }
}
