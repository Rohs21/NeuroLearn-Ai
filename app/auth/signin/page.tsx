import SignInForm from "@/components/auth/signin-form"
import WalletConnectButton from "@/components/auth/WalletConnectButton"

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="space-y-6">
        <SignInForm />
        <WalletConnectButton />
      </div>
    </div>
  )
}