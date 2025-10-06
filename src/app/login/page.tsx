
import { LoginForm } from "./login-form";

// This dedicated container for the reCAPTCHA must be on the page at all times
// for the verifier to remain valid, especially with client-side navigation.
const RecaptchaContainer = () => (
    <div id="recaptcha-container" style={{
        position: 'fixed',
        bottom: 0,
        right: 0,
        visibility: 'hidden',
    }}></div>
);


export default function LoginPage() {
    return (
        <>
            <LoginForm />
            <RecaptchaContainer />
        </>
    )
}
