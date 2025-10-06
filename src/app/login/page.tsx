
import { LoginForm } from "./login-form";

export default function LoginPage() {
    return (
        <>
            <LoginForm />
            {/* 
              This container MUST be here and not inside the LoginForm.
              The LoginForm is a Client Component that re-renders, which would destroy 
              the reCAPTCHA instance. Placing it here ensures it is stable.
            */}
            <div id="recaptcha-container"></div>
        </>
    )
}
