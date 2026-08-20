async function handleSignup() {
    const name = document.getElementById("fullname").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!name || !email || !password) {
        alert("Please fill all fields");
        return;
    }

    try {
        console.log(`Attempting signup with name: ${name}, email: ${email}`);
        const response = await fetch(`${API_BASE}/auth/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();
        console.log(`Signup response:`, data, `Status: ${response.status}`);

        if (!response.ok) {
            const errorMsg = data.message || data.error || "Signup failed";
            console.error(`Signup error: ${errorMsg}`);
            alert(errorMsg);
            return;
        }

        // Check if token exists
        if (!data.token) {
            alert("Account created but no token received. Please log in.");
            console.error("No token in signup response:", data);
            window.location.href = "login.html";
            return;
        }

        console.log("Signup successful");
        alert("Account created successfully! Redirecting to login...");
        window.location.href = "login.html";

    } catch (err) {
        console.error("Signup error:", err);
        alert(`Something went wrong: ${err.message}`);
    }
}
