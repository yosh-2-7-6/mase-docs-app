import { ArrowUpRight, InfoIcon } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export function SmtpMessage() {
  return (
    <Card className="border-muted-foreground/20">
      <CardContent className="pt-6">
        <div className="flex gap-4">
          <InfoIcon size={16} className="mt-0.5 text-muted-foreground" />
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Emails are rate limited. Enable Custom SMTP to increase the rate limit.
            </p>
            <Link
              href="https://supabase.com/docs/guides/auth/auth-smtp"
              target="_blank"
              className="text-primary hover:text-primary/80 flex items-center text-sm gap-1 underline underline-offset-4"
            >
              Learn more <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
