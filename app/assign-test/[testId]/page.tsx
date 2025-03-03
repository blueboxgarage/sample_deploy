"use client";

import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { Amplify } from "aws-amplify";
import { withAuthenticator } from "@aws-amplify/ui-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";

Amplify.configure(outputs);

const client = generateClient<Schema>();

function AssignTest({ 
  params,
  user, 
  signOut 
}: { 
  params: { testId: string }; 
  user: any; 
  signOut: () => void 
}) {
  const router = useRouter();
  const { testId } = params;
  
  const [test, setTest] = useState<Schema["Test"]["type"] | null>(null);
  const [students, setStudents] = useState<Array<Schema["User"]["type"]>>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        // Get test details
        const testData = await client.models.Test.get({ id: testId });
        setTest(testData);

        // Get all students
        const studentsData = await client.models.User.list({
          filter: {
            role: {
              eq: "STUDENT"
            }
          }
        });
        setStudents(studentsData.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [testId]);

  const toggleStudentSelection = (studentId: string) => {
    if (selectedStudentIds.includes(studentId)) {
      setSelectedStudentIds(selectedStudentIds.filter(id => id !== studentId));
    } else {
      setSelectedStudentIds([...selectedStudentIds, studentId]);
    }
  };

  const handleAssignTest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStudentIds.length) {
      alert("Please select at least one student");
      return;
    }

    setIsSubmitting(true);

    try {
      // Assign the test to each selected student
      for (const studentId of selectedStudentIds) {
        await client.models.Test.update({
          id: testId,
          assignedTo: {
            id: studentId,
          },
        });
      }

      router.push("/tutor-dashboard");
    } catch (error) {
      console.error("Error assigning test:", error);
      alert("Failed to assign test. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="container mx-auto p-6">
        <div className="text-center py-12">Loading...</div>
      </main>
    );
  }

  if (!test) {
    return (
      <main className="container mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-4">Test not found</h2>
          <Link href="/tutor-dashboard" className="text-blue-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto p-6">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Assign Test</h1>
        <Link href="/tutor-dashboard" className="text-blue-600 hover:underline">
          Back to Dashboard
        </Link>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Test Details</h2>
        <p><strong>Title:</strong> {test.title}</p>
        {test.description && <p><strong>Description:</strong> {test.description}</p>}
      </div>

      <form onSubmit={handleAssignTest} className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Select Students</h2>
        
        {students.length === 0 ? (
          <p className="mb-4">No students available to assign.</p>
        ) : (
          <div className="mb-6">
            <div className="mb-2">
              <button
                type="button"
                onClick={() => setSelectedStudentIds(students.map(student => student.id))}
                className="text-sm text-blue-600 hover:underline mr-4"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={() => setSelectedStudentIds([])}
                className="text-sm text-blue-600 hover:underline"
              >
                Deselect All
              </button>
            </div>
            
            <div className="max-h-64 overflow-y-auto border rounded p-4">
              {students.map((student) => (
                <div key={student.id} className="mb-2 flex items-center">
                  <input
                    type="checkbox"
                    id={student.id}
                    checked={selectedStudentIds.includes(student.id)}
                    onChange={() => toggleStudentSelection(student.id)}
                    className="mr-2"
                  />
                  <label htmlFor={student.id} className="cursor-pointer">
                    {student.name} ({student.email})
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between">
          <Link 
            href="/tutor-dashboard"
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || students.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
          >
            {isSubmitting ? "Assigning..." : "Assign Test"}
          </button>
        </div>
      </form>
    </main>
  );
}

export default withAuthenticator(AssignTest);