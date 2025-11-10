import connectDB from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import Event from "@/database/event.model";
import { v2 as cloudinary } from "cloudinary";

/**
 * Create a new Event from multipart/form-data, upload the provided image to Cloudinary, and persist the event to the database.
 *
 * @param req - NextRequest whose body is multipart/form-data containing event fields; must include an "image" file
 * @returns On success: an object with `message: "Event Created Successfully"` and the created `event`.
 *          On invalid form data: an object with `message: "Invalid JSON data format"` and an `error` message.
 *          On missing image: an object with `message: "Image file is required"`.
 *          On server failure: an object with `message: "Event Creation Failed"` and an `error` message.
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