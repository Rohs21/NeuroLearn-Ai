import SignUpForm from "@/components/auth/signup-form"
import WalletConnectButton from "@/components/auth/WalletConnectButton"

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="space-y-6 w-full max-w-[400px]">
        <SignUpForm />
        <WalletConnectButton />
      </div>
    </div>
  )
}