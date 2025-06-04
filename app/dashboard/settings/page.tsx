import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Shield } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">Settings</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Manage your account and security preferences
          </p>
        </div>

        {/* Cards Section */}
        <div className="grid gap-8 md:grid-cols-2">
          {/* Profile Settings Card */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="pb-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4 mx-auto">
                <User className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-center text-xl font-semibold">
                Profile Settings
              </CardTitle>
              <CardDescription className="text-center text-base">
                Update your personal information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-0">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                <Input 
                  id="name" 
                  placeholder="Enter your name" 
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="Enter your email" 
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company" className="text-sm font-medium">Company</Label>
                <Input 
                  id="company" 
                  placeholder="Enter your company" 
                  className="h-11"
                />
              </div>
              <Button className="w-full h-11 font-medium">
                Save Changes
              </Button>
            </CardContent>
          </Card>

          {/* Security Card */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="pb-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4 mx-auto">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-center text-xl font-semibold">
                Security
              </CardTitle>
              <CardDescription className="text-center text-base">
                Manage your account security and password
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-0">
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Update your password to keep your account secure
                </p>
                <Button asChild className="w-full h-11 font-medium">
                  <Link href="/dashboard/reset-password">
                    Change Password
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}