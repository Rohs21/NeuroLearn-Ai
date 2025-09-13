import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { address, signature, message } = await req.json();
    if (!address || !signature || !message) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // Verify signature
    const recoveredAddress = ethers.verifyMessage(message, signature);
    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return NextResponse.json({ error: "Signature verification failed" }, { status: 401 });
    }

    // Find or create user by wallet address
    let user = await prisma.user.findUnique({ where: { walletAddress: address } });
    if (!user) {
      user = await prisma.user.create({ data: { walletAddress: address, email: `${address}@wallet.local` } });
    }

    // TODO: Set session/cookie for login (depends on your auth system)
    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
