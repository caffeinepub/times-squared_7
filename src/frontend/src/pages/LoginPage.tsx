import { Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { navigate } from "../lib/navigate";

export default function LoginPage() {
  const { login, loginStatus, identity } = useInternetIdentity();

  useEffect(() => {
    if (identity) {
      navigate("/");
    }
  }, [identity]);

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error("Login error:", error);
    }
  };

  const isLoggingIn = loginStatus === "logging-in";

  return (
    <motion.main
      data-ocid="login.page"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-black flex flex-col items-center justify-center px-6"
    >
      <div className="text-center max-w-sm w-full">
        <h1 className="font-editorial text-white text-5xl mb-4">TIMES²</h1>
        <p className="section-label mb-12">On-Chain Editorial</p>

        <div className="divider-subtle mb-12" />

        <p className="text-white/50 font-sans text-sm leading-relaxed mb-10">
          Sign in with Internet Identity to access author and admin features. No
          data is collected during the login process.
        </p>

        <button
          type="button"
          data-ocid="login.submit_button"
          onClick={handleLogin}
          disabled={isLoggingIn}
          className="w-full flex items-center justify-center gap-3 bg-white text-black py-4 text-sm font-sans uppercase tracking-widest hover:bg-white/90 transition-colors disabled:opacity-50"
        >
          {isLoggingIn && <Loader2 size={14} className="animate-spin" />}
          {isLoggingIn ? "Connecting..." : "Sign in with Internet Identity"}
        </button>

        <button
          type="button"
          data-ocid="login.back.button"
          onClick={() => navigate("/")}
          className="mt-6 text-white/30 hover:text-white/60 transition-colors text-xs font-sans uppercase tracking-wider"
        >
          Return to publication
        </button>
      </div>
    </motion.main>
  );
}
