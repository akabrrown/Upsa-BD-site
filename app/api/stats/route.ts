import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();

    const [
      studentRes,
      totalRes,
      todayRes,
      monthRes,
      sentRes,
      openedRes,
      repliedRes,
      failedRes,
      sendingRes,
    ] = await Promise.all([
      supabaseAdmin
        .from("Person")
        .select("*", { count: "exact", head: true })
        .eq("role", "STUDENT"),
      supabaseAdmin.from("Person").select("*", { count: "exact", head: true }),
      supabaseAdmin
        .from("Person")
        .select("*", { count: "exact", head: true })
        .eq("birthMonth", currentMonth)
        .eq("birthDay", currentDay),
      supabaseAdmin
        .from("Person")
        .select("*", { count: "exact", head: true })
        .eq("birthMonth", currentMonth),
      supabaseAdmin
        .from("BirthdayEmail")
        .select("*", { count: "exact", head: true })
        .eq("status", "sent"),
      supabaseAdmin
        .from("BirthdayEmail")
        .select("*", { count: "exact", head: true })
        .eq("status", "opened"),
      supabaseAdmin
        .from("BirthdayEmail")
        .select("*", { count: "exact", head: true })
        .eq("status", "replied"),
      supabaseAdmin
        .from("BirthdayEmail")
        .select("*", { count: "exact", head: true })
        .eq("status", "failed"),
      supabaseAdmin
        .from("BirthdayEmail")
        .select("*", { count: "exact", head: true })
        .eq("status", "sending"),
    ]);

    const totalStudents = studentRes.count ?? 0;
    const totalPeople = totalRes.count ?? 0;
    const sentCount = sentRes.count ?? 0;
    const openedCount = openedRes.count ?? 0;
    const repliedCount = repliedRes.count ?? 0;

    return NextResponse.json({
      totalStaff: totalPeople - totalStudents,
      totalStudents,
      birthdaysToday: todayRes.count ?? 0,
      birthdaysThisMonth: monthRes.count ?? 0,
      totalEmailsSent: sentCount + openedCount + repliedCount,
      totalEmailsOpened: openedCount,
      totalEmailsReplied: repliedCount,
      totalEmailsFailed: failedRes.count ?? 0,
      totalEmailsSending: sendingRes.count ?? 0,
    });
  } catch (error: any) {
    console.error("Stats API Error:", error?.message ?? error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 },
    );
  }
}
