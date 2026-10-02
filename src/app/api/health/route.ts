import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type DeepHealthRow = {
  database_name: string;
  database_user: string;
  neon_project_id: string | null;
  neon_branch_id: string | null;
  neon_endpoint_id: string | null;
};

export async function GET() {
  try {
    const [identity, municipalityCount, submissionCount, populationCount] = await Promise.all([
      prisma.$queryRaw<DeepHealthRow[]>`
        SELECT
          current_database() AS database_name,
          current_user AS database_user,
          current_setting('neon.project_id', true) AS neon_project_id,
          current_setting('neon.branch_id', true) AS neon_branch_id,
          current_setting('neon.endpoint_id', true) AS neon_endpoint_id
      `,
      prisma.municipality.count(),
      prisma.submission.count(),
      prisma.population.count(),
    ]);

    return NextResponse.json({
      ok: true,
      database: "connected",
      schema: "ready",
      identity: identity[0] ?? null,
      counts: {
        municipalities: municipalityCount,
        submissions: submissionCount,
        populationRows: populationCount,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        ok: false,
        database: "connected",
        schema: "error",
        error: error instanceof Error ? error.name : "UnknownError",
      },
      { status: 503 },
    );
  }
}
