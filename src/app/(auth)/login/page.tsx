"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { AuthLayout } from "@/components/layouts/AuthLayout"
import { motion } from "framer-motion"

export default function LoginPage() {
  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to continue designing your dream wedding"
    >
      <Card className="border-none shadow-none bg-transparent">
        <CardContent className="space-y-4 p-0">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" placeholder="name@example.com" type="email" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input id="password" type="password" />
          </div>
          <Button className="w-full" size="lg">
            Sign In
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 p-0 mt-6">
          <div className="relative w-full text-center text-sm">
            <span className="bg-background px-2 text-muted-foreground relative z-10">
              Or continue with
            </span>
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full">
            <Button variant="outline">Google</Button>
            <Button variant="outline">Apple</Button>
          </div>
          <div className="text-center text-sm text-muted-foreground mt-4">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
