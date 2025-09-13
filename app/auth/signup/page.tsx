import SignUpForm from "@/components/auth/signup-form"
import WalletConnectButton from "@/components/auth/WalletConnectButton"

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="space-y-6">
        <SignUpForm />
        <WalletConnectButton />
      </div>
    </div>
  )
}