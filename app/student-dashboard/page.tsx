"use client";

import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { Amplify } from "aws-amplify";
import { withAuthenticator } from "@aws-amplify/ui-react";
import Link from "next/link";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";

Amplify.configure(outputs);

const client = generateClient<Schema>();

function StudentDashboard({ user, signOut }: { user: any; signOut: () => void }) {
  const [assignedTests, setAssignedTests] = useState<Array<Schema["Test"]["type"]>>([]);
  const [testAttempts, setTestAttempts] = useState<Array<Schema["TestAttempt"]["type"]>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStudentData() {
      try {
        // Get the user data from Cognito
        if (!user) return;

        // Get assigned tests for the student
        const userData = await client.models.User.get({
          email: user.attributes.email
        });

        if (userData) {
          // Get assigned tests
          const testsData = await client.models.Test.list({
            filter: {
              assignedTo: {
                email: {
                  eq: user.attributes.email
                }
              }
            }
          });
          setAssignedTests(testsData.data);

          // Get test attempts
          const attemptsData = await client.models.TestAttempt.list({
            filter: {
              student: {
                email: {
                  eq: user.attributes.email
                }
              }
            }
          });
          setTestAttempts(attemptsData.data);
        }
      } catch (error) {
        console.error("Error fetching student data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStudentData();
  }, [user]);

  return (
    <main className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Student Dashboard</h1>
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

      {loading ? (
        <div className="text-center py-12">Loading your data...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Assigned Tests */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Assigned Tests</h2>
            {assignedTests.length === 0 ? (
              <p>No tests assigned yet.</p>
            ) : (
              <ul className="space-y-4">
                {assignedTests.map((test) => (
                  <li key={test.id} className="border p-4 rounded">
                    <h3 className="font-medium">{test.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{test.description}</p>
                    <Link 
                      href={`/take-test/${test.id}`}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      Take Test
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Test Attempts */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Recent Test Attempts</h2>
            {testAttempts.length === 0 ? (
              <p>No test attempts yet.</p>
            ) : (
              <ul className="space-y-4">
                {testAttempts.map((attempt) => (
                  <li key={attempt.id} className="border p-4 rounded">
                    <h3 className="font-medium">
                      {attempt.test?.title || "Unknown Test"}
                    </h3>
                    <div className="flex justify-between mt-2 text-sm">
                      <span>
                        Score: {attempt.score !== null ? `${attempt.score}%` : "Not completed"}
                      </span>
                      <span>
                        {attempt.completed ? "Completed" : "In Progress"}
                      </span>
                    </div>
                    {attempt.completed && (
                      <Link 
                        href={`/test-results/${attempt.id}`}
                        className="mt-2 inline-block px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        View Results
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export default withAuthenticator(StudentDashboard);