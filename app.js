
  

    document.addEventListener("DOMContentLoaded", () => {
  const { createClient } = supabase;
  const supabaseClient = createClient(
    "https://fzzxcshdetqruxquxrbe.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6enhjc2hkZXRxcnV4cXV4cmJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MjIyMDgsImV4cCI6MjA4OTM5ODIwOH0.5BjEQWW8n7k62Uw7_JhsmZlA9Anl-mKqFiWs2Wwlilc"
  );


  const params = new URLSearchParams(window.location.search);
  const scanCode = params.get("task") || "default";

  // 2️⃣ Ensure bucket exists
  async function ensureBucket(bucketName) {
    const { data: buckets } = await supabaseClient.storage.listBuckets();
    if (!buckets.some(b => b.name === bucketName)) {
      console.log(`Creating missing bucket: ${bucketName}`);
      await supabaseClient.storage.createBucket(bucketName, { public: true });
    }
  }

  await ensureBucket("proofs");

  // 3️⃣ Submit task function
  async function submitTask() {
    try {
      const name = document.getElementById("name").value.trim();
      const email = document.getElementById("email").value.trim();
      const phone = document.getElementById("phone").value.trim();
      const address = document.getElementById("address").value.trim();
      const place = document.getElementById("place").value.trim();
      const knowledge = document.getElementById("knowledge").value.trim();
      const file = document.getElementById("proof").files[0];

      if (!name || !phone || !file) {
        alert("Name, Phone, and Proof image are required!");
        return;
      }

      // 3a️⃣ Get or create user
      let { data: user, error: userError } = await supabaseClient
        .from("users")
        .select("*")
        .eq("phone", phone)
        .maybeSingle();
      if (userError) throw userError;

      if (!user) {
        const { data: newUser, error: newUserError } = await supabaseClient
          .from("users")
          .insert([{ name, email, phone, address, points: 0 }])
          .select()
          .single();
        if (newUserError) throw newUserError;
        user = newUser;
      }

      // 3b️⃣ Upload proof
      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabaseClient
        .storage
        .from("proofs")
        .upload(filePath, file);
      if (uploadError) throw new Error("Upload failed: " + uploadError.message);

      // 3c️⃣ Save submission (10 points per scan)
      const points = 10;
      const { error: submissionError } = await supabaseClient
        .from("submissions")
        .insert([{
          user_id: user.id,
          proof_url: filePath,
          points_awarded: points,
          place_visited: place,
          knowledge: knowledge
        }]);
      if (submissionError) throw submissionError;

      // 3d️⃣ Update user points
      const newPoints = (user.points || 0) + points;
      const { error: updateError } = await supabaseClient
        .from("users")
        .update({ points: newPoints })
        .eq("id", user.id);
      if (updateError) throw updateError;

      alert("🔥 Submission successful! +10 points!");
      loadLeaderboard();

    } catch (err) {
      console.error("ERROR:", err);
      alert(err.message);
    }
  }

  // 4️⃣ Load leaderboard
  async function loadLeaderboard() {
    try {
      const { data: users } = await supabaseClient
        .from("users")
        .select("name, points")
        .order("points", { ascending: false })
        .limit(20);

      const board = document.getElementById("leaderboard");
      board.innerHTML = "";

      users.forEach((user, index) => {
        let medal = "";
        if (index === 0) medal = "🥇";
        else if (index === 1) medal = "🥈";
        else if (index === 2) medal = "🥉";

        board.innerHTML += `
          <div class="card">
            <span>${medal} #${index + 1}</span>
            <strong>${user.name}</strong>
            <span>${user.points || 0} pts</span>
          </div>
        `;
      });
    } catch (err) {
      console.error("Leaderboard error:", err);
    }
  }

  // 5️⃣ Attach event listener
  const submitBtn = document.getElementById("submitBtn");
  if (submitBtn) submitBtn.addEventListener("click", submitTask);

  // 6️⃣ Load leaderboard on page load
  loadLeaderboard();
});
