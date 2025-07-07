import { useState } from "react";
import { useRouter } from "next/router";
import { type GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { getAdminSessionFromCookies } from "@/utils/auth";

export default function AdminLoginTest() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      console.log("Attempting login with:", { email, password: password.length + ' chars' });
      
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log("Response status:", response.status);
      console.log("Response data:", data);

      if (!response.ok) {
        console.error("Login failed with status:", response.status, "Data:", data);
        setError(data.error || `Login failed (${response.status})`);
        return;
      }

      console.log("Login successful, redirecting to admin dashboard...");
      // Redirect to admin dashboard
      await router.push("/admin");
    } catch (error) {
      console.error("Login error:", error);
      setError("An error occurred during login: " + String(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Admin Login Test</title>
      </Head>

      <div style={{ minHeight: '100vh', padding: '20px', backgroundColor: '#f5f5f5' }}>
        <div style={{ maxWidth: '400px', margin: '100px auto', backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <h1 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>
            Admin Login Test
          </h1>

          {error && (
            <div style={{ backgroundColor: '#fee', color: '#c33', padding: '10px', marginBottom: '20px', borderRadius: '4px', border: '1px solid #fcc' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Email Address
              </label>
              <input
                type="email"
                required
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px' }}
                placeholder="admin@test.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Password
              </label>
              <input
                type="password"
                required
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px' }}
                placeholder="admin123"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{ 
                width: '100%', 
                padding: '12px', 
                backgroundColor: isLoading ? '#ccc' : '#007bff', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px', 
                fontSize: '16px',
                cursor: isLoading ? 'not-allowed' : 'pointer'
              }}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <p>Test credentials:</p>
            <p>Email: admin@test.com</p>
            <p>Password: admin123</p>
          </div>

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <Link href="/admin/login" style={{ color: '#007bff' }}>
              Back to Styled Login
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

// Redirect to admin dashboard if already logged in as admin
export const getServerSideProps: GetServerSideProps = async (context) => {
  const cookies = context.req.headers.cookie || "";
  const adminSession = getAdminSessionFromCookies(cookies);

  if (adminSession) {
    return {
      redirect: {
        destination: "/admin",
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
}; 