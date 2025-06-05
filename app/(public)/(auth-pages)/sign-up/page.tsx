import { signUpAction } from "@/app/actions";
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

export default async function Signup(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  
  if ("message" in searchParams) {
    return (
      <div className="flex flex-col gap-6">
        <Card className="w-[400px]">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Account Created</CardTitle>
            <CardDescription>
              Check your email for verification instructions
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <FormMessage message={searchParams} />
            <div className="mt-4">
              <Link href="/sign-in" className="text-sm underline underline-offset-4">
                Back to Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="w-[400px]">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create an account</CardTitle>
          <CardDescription>
            Enter your details to get started with Mase Docs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                  </div>
                  <Input 
                    id="password" 
                    name="password"
                    type="password" 
                    placeholder="Create a password"
                    minLength={6}
                    required 
                  />
                </div>
                <SubmitButton 
                  formAction={signUpAction}
                  pendingText="Creating account..."
                  className="w-full"
                >
                  Create account
                </SubmitButton>
                <FormMessage message={searchParams} />
              <div className="text-center text-sm">
                Already have an account?{" "}
                <Link href="/sign-in" className="underline underline-offset-4">
                  Sign in
                </Link>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="w-[400px] text-center text-xs text-muted-foreground">
        By creating an account, you agree to our Terms of Service and Privacy Policy.
      </div>
    </div>
  );
}
