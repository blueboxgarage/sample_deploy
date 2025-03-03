"use client";

import { useState } from "react";
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

type Question = {
  content: string;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE";
  options: string[];
  correctAnswer: string;
  points: number;
};

function CreateTest({ user, signOut }: { user: any; signOut: () => void }) {
  const router = useRouter();
  const [testTitle, setTestTitle] = useState("");
  const [testDescription, setTestDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([
    {
      content: "",
      type: "MULTIPLE_CHOICE",
      options: ["", "", "", ""],
      correctAnswer: "",
      points: 1,
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        content: "",
        type: "MULTIPLE_CHOICE",
        options: ["", "", "", ""],
        correctAnswer: "",
        points: 1,
      },
    ]);
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      [field]: value,
    };
    setQuestions(updatedQuestions);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(updatedQuestions);
  };

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!testTitle || questions.some(q => !q.content || !q.correctAnswer)) {
      alert("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // Make sure we have the user in the database
      let userData = await client.models.User.get({
        email: user.attributes.email
      });

      // If user doesn't exist in the database yet, create it
      if (!userData) {
        userData = await client.models.User.create({
          email: user.attributes.email,
          name: user.attributes.name || user.username,
          role: "TUTOR",
        });
      }

      // Create the test
      const newTest = await client.models.Test.create({
        title: testTitle,
        description: testDescription,
        createdBy: {
          email: user.attributes.email,
        },
      });

      // Create all questions for the test
      for (const question of questions) {
        await client.models.Question.create({
          content: question.content,
          type: question.type,
          options: question.options.filter(opt => opt.trim() !== ""),
          correctAnswer: question.correctAnswer,
          points: question.points,
          test: {
            id: newTest.id,
          },
        });
      }

      router.push("/tutor-dashboard");
    } catch (error) {
      console.error("Error creating test:", error);
      alert("Failed to create test. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="container mx-auto p-6">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Create New Test</h1>
        <Link href="/tutor-dashboard" className="text-blue-600 hover:underline">
          Back to Dashboard
        </Link>
      </div>

      <form onSubmit={handleCreateTest} className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
        {/* Test Details */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Details</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Test Title*</label>
            <input
              type="text"
              value={testTitle}
              onChange={(e) => setTestTitle(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={testDescription}
              onChange={(e) => setTestDescription(e.target.value)}
              className="w-full p-2 border rounded"
              rows={3}
            />
          </div>
        </div>

        {/* Questions */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Questions</h2>
          
          {questions.map((question, qIndex) => (
            <div key={qIndex} className="mb-8 p-4 border rounded">
              <h3 className="font-medium mb-2">Question {qIndex + 1}</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Question*</label>
                <textarea
                  value={question.content}
                  onChange={(e) => updateQuestion(qIndex, "content", e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Question Type</label>
                <select
                  value={question.type}
                  onChange={(e) => updateQuestion(qIndex, "type", e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                  <option value="TRUE_FALSE">True/False</option>
                </select>
              </div>

              {question.type === "MULTIPLE_CHOICE" && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Options</label>
                  {question.options.map((option, oIndex) => (
                    <div key={oIndex} className="flex mb-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                        className="w-full p-2 border rounded"
                        placeholder={`Option ${oIndex + 1}`}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Correct Answer*</label>
                {question.type === "MULTIPLE_CHOICE" ? (
                  <select
                    value={question.correctAnswer}
                    onChange={(e) => updateQuestion(qIndex, "correctAnswer", e.target.value)}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="">Select correct answer</option>
                    {question.options.map((option, oIndex) => (
                      <option key={oIndex} value={option} disabled={!option.trim()}>
                        {option || `Option ${oIndex + 1}`}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={question.correctAnswer}
                    onChange={(e) => updateQuestion(qIndex, "correctAnswer", e.target.value)}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="">Select correct answer</option>
                    <option value="True">True</option>
                    <option value="False">False</option>
                  </select>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Points</label>
                <input
                  type="number"
                  min="1"
                  value={question.points}
                  onChange={(e) => updateQuestion(qIndex, "points", parseInt(e.target.value))}
                  className="w-full p-2 border rounded"
                />
              </div>

              {questions.length > 1 && (
                <button
                  type="button"
                  onClick={() => setQuestions(questions.filter((_, i) => i !== qIndex))}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove Question
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addQuestion}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add Question
          </button>
        </div>

        <div className="flex justify-between">
          <Link 
            href="/tutor-dashboard"
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
          >
            {isSubmitting ? "Creating..." : "Create Test"}
          </button>
        </div>
      </form>
    </main>
  );
}

export default withAuthenticator(CreateTest);