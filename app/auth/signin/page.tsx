import SignInForm from "@/components/auth/signin-form"

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="space-y-6 w-full max-w-[400px]">
        <SignInForm />
      </div>
    </div>
  )
}