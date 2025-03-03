"use client";

import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { Amplify } from "aws-amplify";
import { withAuthenticator } from "@aws-amplify/ui-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import outputs from "@/amplify_outputs.json";
import "./../app/app.css";
import "@aws-amplify/ui-react/styles.css";

Amplify.configure(outputs);

const client = generateClient<Schema>();

function HomePage({ user, signOut }: { user: any; signOut: () => void }) {
  const [userRole, setUserRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check user attributes to determine role
    const role = user?.attributes?.role;
    setUserRole(role);

    // Redirect based on role
    if (role === "STUDENT") {
      router.push("/student-dashboard");
    } else if (role === "TUTOR") {
      router.push("/tutor-dashboard");
    }
  }, [user, router]);

  return (
    <main className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Tutoring Assistant</h1>
        <div className="flex items-center gap-4">
          <p>Welcome, {user?.attributes?.name || user?.username}</p>
          <button 
            onClick={signOut}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Sign Out
          </button>
        </div>
      </div>

      {!userRole && (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-6">Please select your role to continue</h2>
          <div className="flex justify-center gap-8">
            <Link 
              href="/student-dashboard" 
              className="px-8 py-4 bg-blue-600 text-white rounded-lg text-xl hover:bg-blue-700"
            >
              I am a Student
            </Link>
            <Link 
              href="/tutor-dashboard" 
              className="px-8 py-4 bg-green-600 text-white rounded-lg text-xl hover:bg-green-700"
            >
              I am a Tutor
            </Link>
          </div>
        </div>
      )}

      <div className="mt-12 text-center">
        <h2 className="text-2xl font-semibold mb-4">About Our Tutoring Platform</h2>
        <p className="max-w-2xl mx-auto">
          Our tutoring platform connects students with expert tutors. Take tests, get automatically graded, 
          track your progress, and improve your skills with personalized feedback.
        </p>
      </div>
    </main>
  );
}

export default withAuthenticator(HomePage);
