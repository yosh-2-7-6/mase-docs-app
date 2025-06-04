import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wand2, FileText, Image, Video } from "lucide-react";

export default function MaseGeneratorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mase Generator</h1>
        <p className="text-muted-foreground">
          Generate high-quality content with AI assistance
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText size={20} />
              Text Content
            </CardTitle>
            <CardDescription>
              Generate articles, blogs, and written content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              <Wand2 size={16} className="mr-2" />
              Generate Text
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image size={20} />
              Images
            </CardTitle>
            <CardDescription>
              Create custom images and graphics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">
              <Wand2 size={16} className="mr-2" />
              Generate Images
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video size={20} />
              Video Scripts
            </CardTitle>
            <CardDescription>
              Generate scripts and video content plans
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">
              <Wand2 size={16} className="mr-2" />
              Generate Scripts
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Generate</CardTitle>
          <CardDescription>
            Enter a prompt to generate content instantly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <textarea
                  placeholder="Describe what you want to generate..."
                  className="w-full min-h-[100px] p-3 border rounded-md resize-none"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button>Generate Content</Button>
              <Button variant="outline">Save Template</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generation History</CardTitle>
          <CardDescription>
            Your recently generated content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <p>No content generated yet</p>
            <p className="text-sm">Start generating to see your history</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}