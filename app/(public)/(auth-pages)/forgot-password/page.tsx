import { forgotPasswordAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export default async function ForgotPassword(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  return (
    <div className="flex flex-col gap-6">
      <Card className="w-[400px]">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Reset your password</CardTitle>
          <CardDescription>
            Enter your email address and we'll send you a reset link
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-6">
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="email">Email</Label>
                  </div>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <SubmitButton 
                  formAction={forgotPasswordAction}
                  pendingText="Sending reset link..."
                  className="w-full"
                >
                  Send reset link
                </SubmitButton>
                <FormMessage message={searchParams} />
              <div className="text-center text-sm">
                Remember your password?{" "}
                <Link href="/sign-in" className="underline underline-offset-4">
                  Sign in
                </Link>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="w-[400px] text-center text-xs text-muted-foreground">
        Check your spam folder if you don't receive the email within a few minutes.
      </div>
    </div>
  );
}
