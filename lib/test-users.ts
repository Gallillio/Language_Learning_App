export interface TestUser {
  id: number;
  username: string;
  email: string;
  password: string;
}

// Pre-registered test accounts
export const testUsers: TestUser[] = [
  {
    id: 1,
    username: "testuser",
    email: "test@example.com",
    password: "password123"
  },
  {
    id: 2,
    username: "student",
    email: "student@example.com",
    password: "letmein"
  }
]; 