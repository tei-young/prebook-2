// src/app/api/kakao/route.ts
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { NextResponse } from 'next/server';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const { phoneNumber, message } = await request.json();
    const scriptPath = path.join(process.cwd(), 'scripts', 'kakao_send.ahk');

    const { stdout, stderr } = await execAsync(
      `"C:\\Program Files\\AutoHotkey\\AutoHotkey.exe" "${scriptPath}" "${phoneNumber}" "${message}"`
    );

    if (stderr) {
      throw new Error(`AutoHotkey 실행 오류: ${stderr}`);
    }

    return NextResponse.json({ success: true, output: stdout });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}