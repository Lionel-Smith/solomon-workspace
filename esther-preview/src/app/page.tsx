import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Esther</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          AI Design Agent Pipeline Dashboard
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 max-w-lg w-full">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Pipelines</CardTitle>
            <CardDescription>
              View and manage design generation pipelines
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/pipelines">
              <Button className="w-full">View Pipelines</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Design Specs</CardTitle>
            <CardDescription>
              Browse generated design specifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/design-specs">
              <Button variant="outline" className="w-full">
                View Specs
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
