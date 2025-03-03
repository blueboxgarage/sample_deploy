import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  User: a
    .model({
      email: a.string().required(),
      name: a.string().required(),
      role: a.enum(["STUDENT", "TUTOR"]).required(),
      // Relationships
      assignedTests: a.hasMany("Test", "assignedTo"),
      createdTests: a.hasMany("Test", "createdBy"),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.publicApiKey().to(["read"]),
    ]),

  Test: a
    .model({
      title: a.string().required(),
      description: a.string(),
      // Relationships
      questions: a.hasMany("Question"),
      assignedTo: a.belongsTo("User", "assignedTests"),
      createdBy: a.belongsTo("User", "createdTests"),
      attempts: a.hasMany("TestAttempt"),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.publicApiKey().to(["read"]),
    ]),

  Question: a
    .model({
      content: a.string().required(),
      type: a.enum(["MULTIPLE_CHOICE", "TRUE_FALSE"]).required(),
      options: a.string().array(),
      correctAnswer: a.string().required(),
      points: a.integer().required(),
      // Relationship
      test: a.belongsTo("Test", "questions"),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.publicApiKey().to(["read"]),
    ]),

  TestAttempt: a
    .model({
      startTime: a.datetime().required(),
      endTime: a.datetime(),
      score: a.float(),
      completed: a.boolean().required(),
      // Relationships
      test: a.belongsTo("Test", "attempts"),
      answers: a.hasMany("Answer"),
      student: a.belongsTo("User"),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.publicApiKey().to(["read"]),
    ]),

  Answer: a
    .model({
      selectedOption: a.string().required(),
      isCorrect: a.boolean().required(),
      // Relationships
      question: a.belongsTo("Question"),
      testAttempt: a.belongsTo("TestAttempt", "answers"),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.publicApiKey().to(["read"]),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>
