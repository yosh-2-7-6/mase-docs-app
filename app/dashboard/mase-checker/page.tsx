import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export default function MaseCheckerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mase Checker</h1>
        <p className="text-muted-foreground">
          Check and validate your content for quality and compliance
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search size={20} />
              Content Validation
            </CardTitle>
            <CardDescription>
              Upload content to check for issues and compliance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <p className="text-muted-foreground">
                  Drag and drop your files here or click to upload
                </p>
              </div>
              <Button className="w-full">Start Validation</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Checks</CardTitle>
            <CardDescription>
              Your latest validation results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground py-8">
              <p>No checks performed yet</p>
              <p className="text-sm">Upload content to get started</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Validation Settings</CardTitle>
          <CardDescription>
            Configure how your content is checked
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Grammar Check</h3>
              <p className="text-sm text-muted-foreground">Enable grammar validation</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Plagiarism Check</h3>
              <p className="text-sm text-muted-foreground">Check for duplicate content</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">SEO Analysis</h3>
              <p className="text-sm text-muted-foreground">Optimize for search engines</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}