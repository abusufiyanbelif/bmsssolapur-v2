
import { LoginForm } from "./login-form";

// The reCAPTCHA container is now part of the LoginForm component itself
// to ensure it is always rendered and cleaned up correctly with the form's lifecycle.
export default function LoginPage() {
    return (
        <LoginForm />
    )
}
