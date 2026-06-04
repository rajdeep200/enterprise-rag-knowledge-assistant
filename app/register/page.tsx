"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { registerSchema, type RegisterInput } from "@/lib/validations";
import { api, ApiClientError } from "@/lib/api-client";
import type { PublicUser } from "@/lib/types";
import { useToast } from "@/components/ui/use-toast";

export default function RegisterPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterInput) {
    try {
      await api.post<PublicUser>("/api/auth/register", values);
      await queryClient.invalidateQueries({ queryKey: ["current-user"] });
      toast({ title: "Workspace created", description: "Welcome aboard!" });
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: err instanceof ApiClientError ? err.message : "Please try again.",
      });
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2 font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          RAG Knowledge Assistant
        </Link>
        <Card>
          <CardHeader>
            <CardTitle>Create your workspace</CardTitle>
            <CardDescription>
              You&apos;ll be the workspace admin and can invite teammates later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company name</Label>
                <Input id="companyName" placeholder="Acme SaaS Pvt Ltd" {...register("companyName")} />
                {errors.companyName && (
                  <p className="text-sm text-destructive">{errors.companyName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Your name</Label>
                <Input id="name" placeholder="Jane Doe" {...register("name")} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Work email</Label>
                <Input id="email" type="email" placeholder="you@company.com" {...register("email")} />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="At least 8 characters" {...register("password")} />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Creating…" : "Create workspace"}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Log in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
