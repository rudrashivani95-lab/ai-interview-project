async function handleLogin() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
        alert("Please enter both email and password");
        return;
    }

    try {
        console.log(`Attempting login with email: ${email}`);
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        console.log(`Login response:`, data, `Status: ${response.status}`);

        if (!response.ok) {
            const errorMsg = data.message || data.error || "Login failed";
            console.error(`Login error: ${errorMsg}`);
            alert(errorMsg);
            return;
        }

        // Check if token exists
        if (!data.token) {
            alert("Login successful but no token received. Please try again.");
            console.error("No token in response:", data);
            return;
        }

        // Save token to localStorage
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        console.log("Login successful, redirecting to dashboard");

        // Redirect to dashboard
        window.location.href = "dashboard.html";

    } catch (err) {
        console.error("Login error:", err);
        alert(`Something went wrong: ${err.message}`);
    }
}
