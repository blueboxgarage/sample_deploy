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

function TutorDashboard({ user, signOut }: { user: any; signOut: () => void }) {
  const [createdTests, setCreatedTests] = useState<Array<Schema["Test"]["type"]>>([]);
  const [students, setStudents] = useState<Array<Schema["User"]["type"]>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTutorData() {
      try {
        // Get the user data from Cognito
        if (!user) return;

        // Get created tests for the tutor
        const userData = await client.models.User.get({
          email: user.attributes.email
        });

        if (userData) {
          // Get created tests
          const testsData = await client.models.Test.list({
            filter: {
              createdBy: {
                email: {
                  eq: user.attributes.email
                }
              }
            }
          });
          setCreatedTests(testsData.data);

          // Get all students (in a real app, you'd limit this to students assigned to this tutor)
          const studentsData = await client.models.User.list({
            filter: {
              role: {
                eq: "STUDENT"
              }
            }
          });
          setStudents(studentsData.data);
        }
      } catch (error) {
        console.error("Error fetching tutor data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTutorData();
  }, [user]);

  return (
    <main className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Tutor Dashboard</h1>
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

      <div className="mb-8">
        <Link 
          href="/create-test"
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Create New Test
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading your data...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Created Tests */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Your Tests</h2>
            {createdTests.length === 0 ? (
              <p>You haven't created any tests yet.</p>
            ) : (
              <ul className="space-y-4">
                {createdTests.map((test) => (
                  <li key={test.id} className="border p-4 rounded">
                    <h3 className="font-medium">{test.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{test.description}</p>
                    <div className="flex gap-2">
                      <Link 
                        href={`/edit-test/${test.id}`}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        Edit Test
                      </Link>
                      <Link 
                        href={`/assign-test/${test.id}`}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        Assign to Student
                      </Link>
                      <Link 
                        href={`/test-results/${test.id}`}
                        className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                      >
                        View Results
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Students */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Your Students</h2>
            {students.length === 0 ? (
              <p>No students found.</p>
            ) : (
              <ul className="space-y-4">
                {students.map((student) => (
                  <li key={student.id} className="border p-4 rounded">
                    <h3 className="font-medium">{student.name}</h3>
                    <p className="text-sm text-gray-600">{student.email}</p>
                    <Link 
                      href={`/student-progress/${student.id}`}
                      className="mt-2 inline-block px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      View Progress
                    </Link>
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

export default withAuthenticator(TutorDashboard);