import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import {User} from "@/lib/models/User";
import { hash } from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "All fields are mandatory." },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return NextResponse.json(
        { message: "Email is already in use." },
        { status: 400 }
      );
    }

    const hashedPassword = await hash(password, 10);

    const newUser = new User({
      name,
      email,
      passwordHash: hashedPassword,
    });

    await newUser.save();

    return NextResponse.json(
      { message: "User registered successfully." },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "An error occurred on the server." },
      { status: 500 }
    );
  }
}