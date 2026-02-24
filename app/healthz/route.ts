export async function GET() {
  return Response.json(
    {
      ok: true,
      service: "lembra",
      timestamp: new Date().toISOString()
    },
    { status: 200 }
  );
}
