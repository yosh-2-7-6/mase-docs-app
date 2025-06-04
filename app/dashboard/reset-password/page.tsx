import { resetPasswordAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function ResetPassword(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard/settings" className="flex items-center gap-2">
            <ArrowLeft className="size-4" />
            Back to Settings
          </Link>
        </Button>

        {/* Reset Password Card */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-6 text-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4 mx-auto">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
            <CardDescription className="text-base">
              Enter your new password below to update your account security
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">New Password</Label>
                <Input
                  type="password"
                  name="password"
                  placeholder="Enter new password"
                  className="h-11"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                <Input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm new password"
                  className="h-11"
                  required
                />
              </div>
              <SubmitButton 
                formAction={resetPasswordAction}
                className="w-full h-11 font-medium"
              >
                Reset Password
              </SubmitButton>
              <FormMessage message={searchParams} />
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}