import { SignUp } from "@clerk/nextjs";

export default function RegisterPage() {
  return (
    <div className="flex justify-center items-center">
      <SignUp routing="path" path="/register" signInUrl="/login" fallbackRedirectUrl="/dashboard" />
    </div>
  );
}
