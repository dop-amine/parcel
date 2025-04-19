"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { trpc } from "@/utils/trpc";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { Mic, Target } from "lucide-react";

function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black to-purple-900/20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 space-y-8 bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 shadow-xl"
      >
        <div className="text-center">
          <div className="h-8 w-48 bg-gray-800 rounded animate-pulse mx-auto mb-2" />
          <div className="h-4 w-32 bg-gray-800 rounded animate-pulse mx-auto" />
        </div>
        <div className="space-y-4">
          <div className="h-12 bg-gray-800 rounded animate-pulse" />
          <div className="h-12 bg-gray-800 rounded animate-pulse" />
        </div>
      </motion.div>
    </div>
  );
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"ARTIST" | "EXEC" | null>(null);
  const signup = trpc.user.create.useMutation();

  useEffect(() => {
    const role = searchParams.get("role");
    if (role === "ARTIST" || role === "EXEC") {
      setSelectedRole(role);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const role = selectedRole || (formData.get("role") as "ARTIST" | "EXEC");

    try {
      await signup.mutateAsync({
        name,
        email,
        password,
        role,
      });

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!result?.ok) {
        throw new Error("Failed to sign in");
      }

      router.push(role === "ARTIST" ? "/artist" : "/exec");
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black to-purple-900/20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 space-y-8 bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 shadow-xl"
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-2">Create your account</h2>
          <p className="text-gray-400">
            Or{" "}
            <Link href="/login" className="text-purple-400 hover:text-purple-300 transition-colors">
              sign in to your account
            </Link>
          </p>
        </div>

        {!selectedRole && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-medium text-white text-center">Choose your role</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setSelectedRole("ARTIST")}
                className="p-4 rounded-xl border border-gray-700 hover:border-purple-500 transition-all hover:bg-gray-800/50"
              >
                <div className="text-purple-400 text-2xl mb-2">🎤</div>
                <h4 className="text-white font-medium">Artist</h4>
                <p className="text-sm text-gray-400">Upload and manage your music</p>
              </button>
              <button
                onClick={() => setSelectedRole("EXEC")}
                className="p-4 rounded-xl border border-gray-700 hover:border-purple-500 transition-all hover:bg-gray-800/50"
              >
                <div className="text-purple-400 text-2xl mb-2">🎯</div>
                <h4 className="text-white font-medium">Executive</h4>
                <p className="text-sm text-gray-400">Discover and license music</p>
              </button>
            </div>
          </motion.div>
        )}

        {selectedRole && (
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 space-y-6"
            onSubmit={handleSubmit}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                {selectedRole === "ARTIST" ? (
                  <>
                    <Mic className="w-5 h-5 text-purple-400" />
                    <span className="text-white font-medium">Artist Account</span>
                  </>
                ) : (
                  <>
                    <Target className="w-5 h-5 text-purple-400" />
                    <span className="text-white font-medium">Executive Account</span>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedRole(selectedRole === "ARTIST" ? "EXEC" : "ARTIST")}
                className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                Switch to {selectedRole === "ARTIST" ? "Executive" : "Artist"}
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300">
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-sm text-center">{error}</div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? "Creating account..." : "Create account"}
              </button>
            </div>
          </motion.form>
        )}
      </motion.div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <SignupForm />
    </Suspense>
  );
}