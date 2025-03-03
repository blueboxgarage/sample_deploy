import { defineAuth } from "@aws-amplify/backend";

/**
 * Define and configure auth resource for tutoring platform
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
    username: false,
    phone: false,
  },
  
  // Add custom attributes to the user profile
  userAttributes: {
    // Role will be used to determine if a user is a student or tutor
    role: {
      required: true,
      mutable: true,
    },
    name: {
      required: true,
      mutable: true,
    },
  },

  // Configure MFA for additional security
  multiFactor: {
    status: "optional",
    sms: {
      enabled: true,
    },
  },

  // Configure password policy
  passwordPolicy: {
    minLength: 8,
    requireLowercase: true,
    requireUppercase: true,
    requireNumbers: true,
    requireSymbols: true,
  },
});
